/**
 * Unified Database Service
 * Maintains backward compatibility by re-exporting all service methods
 * 
 * This file delegates to specialized services while maintaining the original API
 */

import { supabase } from '../config/supabase'
import { AuthService } from '../backend/services/AuthService'
import { UserService } from '../backend/services/UserService'
import { BusinessService } from '../backend/services/BusinessService'
import { PlaceService } from '../backend/services/PlaceService'
import { ReviewService } from '../backend/services/ReviewService'

/**
 * Backward-compatible DatabaseService
 * Delegates to specialized service modules
 */
export class DatabaseService {
  // Expose supabase instance for auth listeners
  static supabase = supabase

  // ==================== User Management ====================
  static async createUserProfile(userData) {
    return UserService.createUserProfile(userData)
  }

  static async getUserProfile(userId) {
    return UserService.getUserProfile(userId)
  }

  static async ensureUserProfile(userId, userData = {}) {
    return UserService.ensureUserProfile(userId, userData)
  }

  static async updateUserProfile(userId, updates) {
    return UserService.updateUserProfile(userId, updates)
  }

  static async getUserStats(userId) {
    return UserService.getUserStats(userId)
  }

  static async getUserMapMissionStats(userId) {
    return UserService.getUserMapMissionStats(userId)
  }

  static calculateMapMissionBadge(totalContributions) {
    const { calculateMapMissionBadge } = require('../backend/utils/badgeCalculator')
    return calculateMapMissionBadge(totalContributions)
  }

  // Event listeners
  static contributionUpdatedCallbacks = new Set()
  
  static addContributionUpdateListener(callback) {
    return UserService.addContributionUpdateListener(callback)
  }
  
  static removeContributionUpdateListener(callback) {
    return UserService.removeContributionUpdateListener(callback)
  }
  
  static notifyContributionUpdate(userId) {
    return UserService.notifyContributionUpdate(userId)
  }

  static helpfulVoteUpdatedCallbacks = new Set()
  
  static addHelpfulVoteUpdateListener(callback) {
    return UserService.addHelpfulVoteUpdateListener(callback)
  }
  
  static removeHelpfulVoteUpdateListener(callback) {
    return UserService.removeHelpfulVoteUpdateListener(callback)
  }
  
  static notifyHelpfulVoteUpdate(reviewAuthorUserId) {
    return UserService.notifyHelpfulVoteUpdate(reviewAuthorUserId)
  }

  // ==================== Authentication ====================
  static async signUp(email, password, fullName, accessibilityNeeds = '') {
    return AuthService.signUp(email, password, fullName, accessibilityNeeds)
  }

  static async signIn(email, password) {
    return AuthService.signIn(email, password)
  }

  static async signOut() {
    return AuthService.signOut()
  }

  static async resetPassword(email) {
    return AuthService.resetPassword(email)
  }

  static async updatePassword(newPassword) {
    return AuthService.updatePassword(newPassword)
  }

  static async getCurrentUser() {
    return AuthService.getCurrentUser()
  }

  static async getCurrentSession() {
    return AuthService.getCurrentSession()
  }

  // ==================== Business Management ====================
  static async createBusiness(businessData) {
    return BusinessService.createBusiness(businessData)
  }

  static async getAllBusinesses() {
    return BusinessService.getAllBusinesses()
  }

  static async getBusinesses(options = {}) {
    return BusinessService.getBusinesses(options)
  }

  static async getBusiness(id) {
    return BusinessService.getBusiness(id)
  }

  static async updateBusiness(id, updates) {
    return BusinessService.updateBusiness(id, updates)
  }

  static async verifyBusinessFromMapMission(businessId, missionId) {
    return BusinessService.verifyBusinessFromMapMission(businessId, missionId)
  }

  static async syncBusinessVerificationStatus() {
    return BusinessService.syncBusinessVerificationStatus()
  }

  static async syncBusinessStatusWithMapMissions() {
    return BusinessService.syncBusinessStatusWithMapMissions()
  }

  static async deleteBusiness(id) {
    return BusinessService.deleteBusiness(id)
  }

  static async searchBusinesses(searchTerm, options = {}) {
    return BusinessService.searchBusinesses(searchTerm, options)
  }

  static async createBusinessSubmission(userId, businessData) {
    return BusinessService.createBusinessSubmission(userId, businessData)
  }

  static async getUserBusinessSubmissions(userId) {
    return BusinessService.getUserBusinessSubmissions(userId)
  }

  static async updateBusinessSubmissionStatus(businessId, status) {
    return BusinessService.updateBusinessSubmissionStatus(businessId, status)
  }

  // ==================== Places Management ====================
  static async createPlace(placeData) {
    return PlaceService.createPlace(placeData)
  }

  static async getPlaces(options = {}) {
    return PlaceService.getPlaces(options)
  }

  static async getPlace(id) {
    return PlaceService.getPlace(id)
  }

  static async searchPlaces(searchTerm, options = {}) {
    return PlaceService.searchPlaces(searchTerm, options)
  }

  // ==================== Review Management ====================
  static async createReview(reviewData) {
    return ReviewService.createReview(reviewData)
  }

  static async getReviews(options = {}) {
    return ReviewService.getReviews(options)
  }

  static async getUserReviews(userId) {
    return ReviewService.getUserReviews(userId)
  }

  static async updateReview(id, updates) {
    return ReviewService.updateReview(id, updates)
  }

  static async deleteReview(id) {
    return ReviewService.deleteReview(id)
  }

  static async markReviewHelpful(reviewId, userId) {
    return ReviewService.markReviewHelpful(reviewId, userId)
  }

  static async unmarkReviewHelpful(reviewId, userId) {
    return ReviewService.unmarkReviewHelpful(reviewId, userId)
  }

  static async isReviewHelpful(reviewId, userId) {
    return ReviewService.isReviewHelpful(reviewId, userId)
  }

  static async createReviewReply(replyData) {
    return ReviewService.createReviewReply(replyData)
  }

  static async getReviewReplies(reviewId) {
    return ReviewService.getReviewReplies(reviewId)
  }

  static async updateReviewReply(id, updates) {
    return ReviewService.updateReviewReply(id, updates)
  }

  static async deleteReviewReply(id) {
    return ReviewService.deleteReviewReply(id)
  }

  // ==================== Favorites ====================
  static async addToFavorites(userId, businessId, placeId) {
    const { data, error } = await supabase
      .from('user_favorites')
      .insert([{ user_id: userId, business_id: businessId, place_id: placeId }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async removeFromFavorites(userId, businessId, placeId) {
    let query = supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)

    if (businessId) query = query.eq('business_id', businessId)
    if (placeId) query = query.eq('place_id', placeId)

    const { error } = await query
    if (error) throw error
  }

  static async getUserFavorites(userId) {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        *,
        business:businesses(*),
        place:places(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async isFavorite(userId, businessId, placeId) {
    let query = supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)

    if (businessId) query = query.eq('business_id', businessId)
    if (placeId) query = query.eq('place_id', placeId)

    const { data, error } = await query.single()
    const ERROR_CODES = require('../backend/constants/errorCodes').ERROR_CODES

    if (error && error.code !== ERROR_CODES.NOT_FOUND) throw error
    return !!data
  }

  static async removeFavoriteBusiness(userId, businessId) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('business_id', businessId)

    if (error) throw error
  }

  static async removeFavoritePlace(userId, placeId) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('place_id', placeId)

    if (error) throw error
  }

  // ==================== Utility Methods ====================
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  }

  static async getStats() {
    const [businesses, places, reviews, users] = await Promise.all([
      supabase.from('businesses').select('id', { count: 'exact', head: true }),
      supabase.from('places').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ])

    return {
      businessCount: businesses.count || 0,
      placeCount: places.count || 0,
      reviewCount: reviews.count || 0,
      userCount: users.count || 0,
    }
  }

  // Note: Additional methods (MapMission, Accessibility, Sample Data) would continue here
  // For brevity, they follow the same delegation pattern to their respective services
  // Import them lazily as needed to keep the file manageable
  
  // Lazy load remaining services
  static get MapMissionService() {
    return require('../backend/services/MapMissionService').default
  }
  
  static get AccessibilityService() {
    return require('../backend/services/AccessibilityContributionService').default
  }

  // MapMission methods - delegate to MapMissionService when implemented
  static async createMapMission(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.createMapMission(...args)
  }

  static async getMapMissions(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.getMapMissions(...args)
  }

  static async joinMapMission(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.joinMapMission(...args)
  }

  static async getMissionParticipants(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.getMissionParticipants(...args)
  }

  static async updateMissionStatus(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.updateMissionStatus(...args)
  }

  static async getActiveMissionForBusiness(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.getActiveMissionForBusiness(...args)
  }

  static async getLatestMissionForBusiness(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.getLatestMissionForBusiness(...args)
  }

  static async isUserInMission(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.isUserInMission(...args)
  }

  static async getMissionStats(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.getMissionStats(...args)
  }

  static async startMapMission(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.startMapMission(...args)
  }

  static async endMapMission(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.endMapMission(...args)
  }

  static async isMissionReadyToStart(...args) {
    const MapMissionService = require('../backend/services/MapMissionService').default
    return MapMissionService.isMissionReadyToStart(...args)
  }

  // Accessibility methods - delegate when implemented
  static async addAccessibilityPhoto(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.addAccessibilityPhoto(...args)
  }

  static async addAccessibilityReview(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.addAccessibilityReview(...args)
  }

  static async addAccessibilityRating(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.addAccessibilityRating(...args)
  }

  static async getAccessibilityPhotos(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.getAccessibilityPhotos(...args)
  }

  static async getAccessibilityReviews(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.getAccessibilityReviews(...args)
  }

  static async getAccessibilityRatings(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.getAccessibilityRatings(...args)
  }

  static async getUserMissionContributions(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.getUserMissionContributions(...args)
  }

  static async getMissionContributionsSummary(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.getMissionContributionsSummary(...args)
  }

  static async getBusinessAccessibilityContributions(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.getBusinessAccessibilityContributions(...args)
  }

  static async getBusinessAccessibilitySummary(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.getBusinessAccessibilitySummary(...args)
  }

  static async updateAccessibilityRating(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.updateAccessibilityRating(...args)
  }

  static async uploadAccessibilityPhoto(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.uploadAccessibilityPhoto(...args)
  }

  static async deleteAccessibilityPhoto(...args) {
    const AccessibilityContributionService = require('../backend/services/AccessibilityContributionService').default
    return AccessibilityContributionService.deleteAccessibilityPhoto(...args)
  }

  // Sample data insertion
  static async insertSampleData(userId) {
    const { insertSampleData } = require('../backend/utils/sampleDataInserter')
    return insertSampleData(userId)
  }
}

export default DatabaseService
