/**
 * Review Service  
 * Handles all review-related database operations
 */

import { supabase } from '../../config/supabase'
import { ERROR_CODES } from '../constants/errorCodes'
import { UserService } from './UserService'

export class ReviewService {
  /**
   * Create a review
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Created review
   */
  static async createReview(reviewData) {
    console.log('ReviewService.createReview called with:', reviewData)
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single()

    if (error) {
      console.error('Database error creating review:', error)
      throw error
    }
    console.log('Review created successfully:', data)
    return data
  }

  /**
   * Get reviews with options
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Filtered reviews
   */
  static async getReviews(options = {}) {
    console.log('getReviews called with options:', options)
    
    let query = supabase
      .from('reviews')
      .select(`
        *,
        users(id, full_name, verified),
        business:businesses(name),
        place:places(name)
      `)

    if (options.businessId) {
      query = query.eq('business_id', options.businessId)
    }

    if (options.placeId) {
      query = query.eq('place_id', options.placeId)
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      const endRange = (options.offset + (options.limit || 10)) - 1
      query = query.range(options.offset, endRange)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      throw error
    }
    
    console.log('Reviews fetched:', data?.length || 0, 'reviews')
    
    // Add helpful status for current user if provided
    if (options.currentUserId && data) {
      const reviewIds = data.map(review => review.id)
      const { data: helpfulData } = await supabase
        .from('review_helpful')
        .select('review_id')
        .eq('user_id', options.currentUserId)
        .in('review_id', reviewIds)

      const helpfulSet = new Set(helpfulData?.map(h => h.review_id) || [])
      
      return data.map(review => ({
        ...review,
        isHelpful: helpfulSet.has(review.id),
        business_name: review.business?.name,
        place_name: review.place?.name
      }))
    }

    return data?.map(review => ({
      ...review,
      business_name: review.business?.name,
      place_name: review.place?.name
    })) || []
  }

  /**
   * Get user reviews
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's reviews
   */
  static async getUserReviews(userId) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        business:businesses(name),
        place:places(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return data?.map(review => ({
      ...review,
      business_name: review.business?.name,
      place_name: review.place?.name
    })) || []
  }

  /**
   * Update a review
   * @param {string} id - Review ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated review
   */
  static async updateReview(id, updates) {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a review
   * @param {string} id - Review ID
   * @returns {Promise<void>}
   */
  static async deleteReview(id) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Mark review as helpful
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  static async markReviewHelpful(reviewId, userId) {
    try {
      // Get the review author's user ID
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single()

      if (reviewError) throw reviewError

      const { data, error } = await supabase
        .from('review_helpful')
        .insert([{ review_id: reviewId, user_id: userId }])

      if (error) throw error

      // Notify listeners about helpful vote update
      if (reviewData?.user_id) {
        UserService.notifyHelpfulVoteUpdate(reviewData.user_id)
      }

      return data
    } catch (error) {
      console.error('Error marking review helpful:', error)
      throw error
    }
  }

  /**
   * Unmark review as helpful
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  static async unmarkReviewHelpful(reviewId, userId) {
    try {
      // Get the review author's user ID
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single()

      if (reviewError) throw reviewError

      const { data, error } = await supabase
        .from('review_helpful')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId)

      if (error) throw error

      // Notify listeners about helpful vote update
      if (reviewData?.user_id) {
        UserService.notifyHelpfulVoteUpdate(reviewData.user_id)
      }

      return data
    } catch (error) {
      console.error('Error unmarking review helpful:', error)
      throw error
    }
  }

  /**
   * Check if review is marked as helpful
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if helpful
   */
  static async isReviewHelpful(reviewId, userId) {
    const { data, error } = await supabase
      .from('review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== ERROR_CODES.NOT_FOUND) throw error
    return !!data
  }

  /**
   * Create review reply
   * @param {Object} replyData - Reply data
   * @returns {Promise<Object>} Created reply
   */
  static async createReviewReply(replyData) {
    try {
      const { data, error } = await supabase
        .from('review_replies')
        .insert([replyData])
        .select(`
          *,
          user:users(full_name, verified)
        `)
        .single()

      if (error) {
        console.error('Error creating review reply:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error creating review reply:', error)
      throw error
    }
  }

  /**
   * Get review replies
   * @param {string} reviewId - Review ID
   * @returns {Promise<Array>} Review replies
   */
  static async getReviewReplies(reviewId) {
    try {
      const { data, error } = await supabase
        .from('review_replies')
        .select(`
          *,
          user:users(full_name, verified)
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting review replies:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error getting review replies:', error)
      return []
    }
  }

  /**
   * Update review reply
   * @param {string} id - Reply ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated reply
   */
  static async updateReviewReply(id, updates) {
    const { data, error } = await supabase
      .from('review_replies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete review reply
   * @param {string} id - Reply ID
   * @returns {Promise<void>}
   */
  static async deleteReviewReply(id) {
    const { error } = await supabase
      .from('review_replies')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export default ReviewService
