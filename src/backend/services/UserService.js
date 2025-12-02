/**
 * User Service
 * Handles all user-related database operations
 */

import { supabase } from '../../config/supabase'
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errorCodes'
import { calculateMapMissionBadge } from '../utils/badgeCalculator'
import { databaseEvents, EVENT_NAMES } from '../utils/eventEmitter'

export class UserService {
  /**
   * Create a new user profile
   * @param {Object} userData - User profile data
   * @returns {Promise<Object>} Created user profile
   */
  static async createUserProfile(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User profile or null if not found
   */
  static async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === ERROR_CODES.NOT_FOUND) {
        console.log(`Profile not found for user ${userId}, may need to be created`)
        return null
      }
      throw error
    }
    return data
  }

  /**
   * Ensure user profile exists, create if not
   * @param {string} userId - User ID
   * @param {Object} userData - Optional user data for creation
   * @returns {Promise<Object>} User profile
   */
  static async ensureUserProfile(userId, userData = {}) {
    const existingProfile = await this.getUserProfile(userId)
    
    if (existingProfile) {
      return existingProfile
    }

    console.log(`Creating profile for user ${userId}`)
    const { data: authUser } = await supabase.auth.getUser()
    
    const profileData = {
      id: userId,
      email: userData.email || authUser?.user?.email || '',
      full_name: userData.full_name || authUser?.user?.user_metadata?.full_name || '',
      avatar_url: userData.avatar_url || '',
      accessibility_needs: userData.accessibility_needs || '',
      location: userData.location || '',
      verified: false,
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating user profile:', error)
      // If insert fails (e.g., race condition), try fetching again
      return await this.getUserProfile(userId)
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  static async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async getUserStats(userId) {
    try {
      const [reviewsResult, favoritesResult, missionStatsResult] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, helpful_count')
          .eq('user_id', userId),
        supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', userId),
        this.getUserMapMissionStats(userId)
      ])

      if (reviewsResult.error) throw reviewsResult.error
      if (favoritesResult.error) throw favoritesResult.error

      const reviews = reviewsResult.data || []
      const favorites = favoritesResult.data || []
      const helpfulVotes = reviews.reduce((sum, review) => sum + (review.helpful_count || 0), 0)

      return {
        reviewsCount: reviews.length,
        favoritesCount: favorites.length,
        helpfulVotes,
        ...missionStatsResult
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return {
        reviewsCount: 0,
        favoritesCount: 0,
        helpfulVotes: 0,
        missionStats: {
          completedMissions: 0,
          activeMissions: 0,
          createdMissions: 0,
          totalContributions: 0,
          badge: { tier: 'none', title: 'New Explorer', color: '#9CA3AF', progress: 0 }
        }
      }
    }
  }

  /**
   * Get user MapMission statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} MapMission statistics
   */
  static async getUserMapMissionStats(userId) {
    try {
      const [participationsResult, createdMissionsResult, contributionsResults] = await Promise.all([
        supabase
          .from('mapmission_participants')
          .select(`
            id,
            mission_id,
            completed_at,
            progress,
            mapmissions!inner(id, status, created_by)
          `)
          .eq('user_id', userId),
        supabase
          .from('mapmissions')
          .select('id, status')
          .eq('created_by', userId),
        Promise.all([
          supabase.from('accessibility_photos').select('id').eq('user_id', userId),
          supabase.from('accessibility_reviews').select('id').eq('user_id', userId),
          supabase.from('accessibility_ratings').select('id').eq('user_id', userId)
        ])
      ])

      if (participationsResult.error) throw participationsResult.error
      if (createdMissionsResult.error) throw createdMissionsResult.error

      const participations = participationsResult.data || []
      const createdMissions = createdMissionsResult.data || []
      const [photosResult, reviewsResult, ratingsResult] = contributionsResults

      const completedMissions = participations.filter(p => p.completed_at).length
      const activeMissions = participations.filter(
        p => !p.completed_at && p.mapmissions?.status === 'active'
      ).length
      
      const totalContributions = 
        (photosResult.data?.length || 0) + 
        (reviewsResult.data?.length || 0) + 
        (ratingsResult.data?.length || 0)

      const badge = calculateMapMissionBadge(totalContributions)

      return {
        missionStats: {
          completedMissions,
          activeMissions,
          createdMissions: createdMissions.length,
          totalContributions,
          badge
        }
      }
    } catch (error) {
      console.error('Error getting user MapMission stats:', error)
      return {
        missionStats: {
          completedMissions: 0,
          activeMissions: 0,
          createdMissions: 0,
          totalContributions: 0,
          badge: { tier: 'none', title: 'New Explorer', color: '#9CA3AF', progress: 0 }
        }
      }
    }
  }

  /**
   * Add listener for contribution updates
   * @param {Function} callback - Callback function
   */
  static addContributionUpdateListener(callback) {
    databaseEvents.on(EVENT_NAMES.CONTRIBUTION_UPDATED, callback)
  }

  /**
   * Remove listener for contribution updates
   * @param {Function} callback - Callback function
   */
  static removeContributionUpdateListener(callback) {
    databaseEvents.off(EVENT_NAMES.CONTRIBUTION_UPDATED, callback)
  }

  /**
   * Notify listeners about contribution update
   * @param {string} userId - User ID
   */
  static notifyContributionUpdate(userId) {
    databaseEvents.emit(EVENT_NAMES.CONTRIBUTION_UPDATED, userId)
  }

  /**
   * Add listener for helpful vote updates
   * @param {Function} callback - Callback function
   */
  static addHelpfulVoteUpdateListener(callback) {
    databaseEvents.on(EVENT_NAMES.HELPFUL_VOTE_UPDATED, callback)
  }

  /**
   * Remove listener for helpful vote updates
   * @param {Function} callback - Callback function
   */
  static removeHelpfulVoteUpdateListener(callback) {
    databaseEvents.off(EVENT_NAMES.HELPFUL_VOTE_UPDATED, callback)
  }

  /**
   * Notify listeners about helpful vote update
   * @param {string} reviewAuthorUserId - Review author's user ID
   */
  static notifyHelpfulVoteUpdate(reviewAuthorUserId) {
    databaseEvents.emit(EVENT_NAMES.HELPFUL_VOTE_UPDATED, reviewAuthorUserId)
  }
}

export default UserService
