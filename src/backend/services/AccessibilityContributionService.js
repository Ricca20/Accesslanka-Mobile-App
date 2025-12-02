/**
 * AccessibilityContributionService
 * Handles accessibility photos, reviews, and ratings
 * 
 * NOTE: This is a stub implementation. Full implementation to be extracted from original database.js
 */

import { supabase } from '../../config/supabase'
import { ERROR_CODES } from '../constants/errorCodes'

class AccessibilityContributionService {
  /**
   * Add accessibility photo
   */
  static async addAccessibilityPhoto(photoData, onContributionAdded) {
    const { data, error } = await supabase
      .from('accessibility_photos')
      .insert([photoData])
      .select()
      .single()

    if (error) throw error

    if (onContributionAdded) {
      onContributionAdded()
    }

    return data
  }

  /**
   * Add accessibility review
   */
  static async addAccessibilityReview(reviewData, onContributionAdded) {
    const { data, error } = await supabase
      .from('accessibility_reviews')
      .insert([reviewData])
      .select()
      .single()

    if (error) throw error

    if (onContributionAdded) {
      onContributionAdded()
    }

    return data
  }

  /**
   * Add accessibility rating
   */
  static async addAccessibilityRating(ratingData, onContributionAdded) {
    const { data, error } = await supabase
      .from('accessibility_ratings')
      .insert([ratingData])
      .select()
      .single()

    if (error) throw error

    if (onContributionAdded) {
      onContributionAdded()
    }

    return data
  }

  /**
   * Update accessibility rating
   */
  static async updateAccessibilityRating(ratingId, updates) {
    const { data, error } = await supabase
      .from('accessibility_ratings')
      .update(updates)
      .eq('id', ratingId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get accessibility photos
   */
  static async getAccessibilityPhotos(options = {}) {
    let query = supabase
      .from('accessibility_photos')
      .select(`
        *,
        user:users(id, full_name, verified)
      `)

    if (options.businessId) {
      query = query.eq('business_id', options.businessId)
    }

    if (options.missionId) {
      query = query.eq('mission_id', options.missionId)
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get accessibility reviews
   */
  static async getAccessibilityReviews(options = {}) {
    let query = supabase
      .from('accessibility_reviews')
      .select(`
        *,
        user:users(id, full_name, verified)
      `)

    if (options.businessId) {
      query = query.eq('business_id', options.businessId)
    }

    if (options.missionId) {
      query = query.eq('mission_id', options.missionId)
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get accessibility ratings
   */
  static async getAccessibilityRatings(options = {}) {
    let query = supabase
      .from('accessibility_ratings')
      .select(`
        *,
        user:users(id, full_name, verified)
      `)

    if (options.businessId) {
      query = query.eq('business_id', options.businessId)
    }

    if (options.missionId) {
      query = query.eq('mission_id', options.missionId)
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get user's mission contributions
   */
  static async getUserMissionContributions(missionId, userId) {
    const [photos, reviews, ratings] = await Promise.all([
      this.getAccessibilityPhotos({ missionId, userId }),
      this.getAccessibilityReviews({ missionId, userId }),
      this.getAccessibilityRatings({ missionId, userId }),
    ])

    return {
      photos,
      reviews,
      ratings,
      totalContributions: photos.length + reviews.length + ratings.length,
    }
  }

  /**
   * Get mission contributions summary
   */
  static async getMissionContributionsSummary(missionId) {
    const [photos, reviews, ratings] = await Promise.all([
      this.getAccessibilityPhotos({ missionId }),
      this.getAccessibilityReviews({ missionId }),
      this.getAccessibilityRatings({ missionId }),
    ])

    return {
      photoCount: photos.length,
      reviewCount: reviews.length,
      ratingCount: ratings.length,
      totalContributions: photos.length + reviews.length + ratings.length,
    }
  }

  /**
   * Get business accessibility contributions
   */
  static async getBusinessAccessibilityContributions(businessId) {
    const [photos, reviews, ratings] = await Promise.all([
      this.getAccessibilityPhotos({ businessId }),
      this.getAccessibilityReviews({ businessId }),
      this.getAccessibilityRatings({ businessId }),
    ])

    return {
      photos,
      reviews,
      ratings,
    }
  }

  /**
   * Get business accessibility summary
   */
  static async getBusinessAccessibilitySummary(businessId, missionId = null) {
    const options = { businessId }
    if (missionId) {
      options.missionId = missionId
    }

    const [photos, reviews, ratings] = await Promise.all([
      this.getAccessibilityPhotos(options),
      this.getAccessibilityReviews(options),
      this.getAccessibilityRatings(options),
    ])

    return {
      photoCount: photos.length,
      reviewCount: reviews.length,
      ratingCount: ratings.length,
      totalContributions: photos.length + reviews.length + ratings.length,
    }
  }

  /**
   * Upload accessibility photo
   */
  static async uploadAccessibilityPhoto(imageAsset, missionId, businessId, userId, onContributionAdded) {
    // Implementation needed - requires StorageService integration
    throw new Error('uploadAccessibilityPhoto: Not yet implemented')
  }

  /**
   * Delete accessibility photo
   */
  static async deleteAccessibilityPhoto(photoId, userId) {
    const { error } = await supabase
      .from('accessibility_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId)

    if (error) throw error
  }
}

export default AccessibilityContributionService
