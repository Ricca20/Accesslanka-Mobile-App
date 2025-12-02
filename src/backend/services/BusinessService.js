/**
 * Business Service
 * Handles all business-related database operations
 */

import { supabase } from '../../config/supabase'
import { ERROR_CODES } from '../constants/errorCodes'

export class BusinessService {
  /**
   * Create a new business
   * @param {Object} businessData - Business data
   * @returns {Promise<Object>} Created business
   */
  static async createBusiness(businessData) {
    const { data, error } = await supabase
      .from('businesses')
      .insert([businessData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get all businesses
   * @returns {Promise<Array>} List of businesses
   */
  static async getAllBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        created_by_user:users!businesses_created_by_fkey(full_name, verified)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get businesses with options
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Filtered businesses
   */
  static async getBusinesses(options = {}) {
    let query = supabase
      .from('businesses')
      .select(`
        *,
        created_by_user:users!businesses_created_by_fkey(full_name, verified)
      `)

    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.verified !== undefined) {
      query = query.eq('verified', options.verified)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      const endRange = (options.offset + (options.limit || 10)) - 1
      query = query.range(options.offset, endRange)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get business by ID
   * @param {string} id - Business ID
   * @returns {Promise<Object>} Business details
   */
  static async getBusiness(id) {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        created_by_user:users!businesses_created_by_fkey(full_name, verified),
        reviews(
          *,
          user:users(full_name, verified)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update business
   * @param {string} id - Business ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated business
   */
  static async updateBusiness(id, updates) {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete business
   * @param {string} id - Business ID
   * @returns {Promise<void>}
   */
  static async deleteBusiness(id) {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Verify business from MapMission
   * @param {string} businessId - Business ID
   * @param {string} missionId - Mission ID
   * @returns {Promise<Object>} Verified business
   */
  static async verifyBusinessFromMapMission(businessId, missionId) {
    try {
      console.log(`Verifying business ${businessId} from MapMission ${missionId}`)
      
      const { data, error } = await supabase
        .from('businesses')
        .update({
          verified: true,
          status: 'verified',
          verification_method: 'mapmission',
          verification_source: missionId,
          verified_at: new Date().toISOString()
        })
        .eq('id', businessId)
        .select()
        .single()

      if (error) throw error
      
      console.log('Business verified successfully:', data)
      return data
    } catch (error) {
      console.error('Error verifying business:', error)
      throw error
    }
  }

  /**
   * Sync business verification status with MapMissions
   * @returns {Promise<Object>} Sync result
   */
  static async syncBusinessVerificationStatus() {
    try {
      console.log('Starting business verification status sync...')
      
      const { data: unverifiedBusinesses, error: businessError } = await supabase
        .from('businesses')
        .select(`
          id, 
          name, 
          status,
          verified,
          mapmissions(id, status, created_at)
        `)
        .not('status', 'eq', 'verified')
        .filter('mapmissions.status', 'in', '("active","completed")')

      if (businessError) throw businessError

      console.log(`Found ${unverifiedBusinesses?.length || 0} businesses to potentially verify`)

      if (!unverifiedBusinesses?.length) {
        return { updated: 0, message: 'No businesses to verify' }
      }

      let updateCount = 0
      const updatePromises = unverifiedBusinesses.map(async (business) => {
        if (business.mapmissions && business.mapmissions.length > 0) {
          const latestMission = business.mapmissions.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )[0]
          
          await this.verifyBusinessFromMapMission(business.id, latestMission.id)
          updateCount++
        }
      })

      await Promise.all(updatePromises)

      console.log(`Business verification sync completed. Updated ${updateCount} businesses.`)
      return { 
        updated: updateCount, 
        message: `Successfully verified ${updateCount} businesses with active MapMissions` 
      }
    } catch (error) {
      console.error('Error syncing business verification status:', error)
      throw error
    }
  }

  /**
   * Sync business status with MapMissions
   * @returns {Promise<Object>} Sync result
   */
  static async syncBusinessStatusWithMapMissions() {
    try {
      console.log('Starting comprehensive business status sync with MapMissions...')
      
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select(`
          id, 
          name, 
          status,
          mapmissions(id, status, created_at)
        `)

      if (businessError) throw businessError

      console.log(`Found ${businesses?.length || 0} businesses to check`)

      if (!businesses?.length) {
        return { updated: 0, message: 'No businesses found' }
      }

      let updateCount = 0
      const updatePromises = businesses.map(async (business) => {
        if (!business.mapmissions || business.mapmissions.length === 0) {
          if (business.status !== 'pending') {
            await this.updateBusiness(business.id, { status: 'pending' })
            updateCount++
          }
        } else {
          const activeMissions = business.mapmissions.filter(m => m.status === 'active')
          const completedMissions = business.mapmissions.filter(m => m.status === 'completed')
          
          let newStatus = business.status
          if (completedMissions.length > 0) {
            newStatus = 'verified'
          } else if (activeMissions.length > 0) {
            newStatus = 'in_progress'
          } else {
            newStatus = 'pending'
          }
          
          if (newStatus !== business.status) {
            await this.updateBusiness(business.id, { status: newStatus })
            updateCount++
          }
        }
      })

      await Promise.all(updatePromises)

      console.log(`Business status sync completed. Updated ${updateCount} businesses.`)
      return { 
        updated: updateCount, 
        message: `Successfully synced ${updateCount} business statuses with MapMissions` 
      }
    } catch (error) {
      console.error('Error syncing business status with MapMissions:', error)
      throw error
    }
  }

  /**
   * Search businesses
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching businesses
   */
  static async searchBusinesses(searchTerm, options = {}) {
    let query = supabase
      .from('businesses')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)

    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query.order('verified', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Create business submission
   * @param {string} userId - User ID
   * @param {Object} businessData - Business data
   * @returns {Promise<Object>} Created business
   */
  static async createBusinessSubmission(userId, businessData) {
    try {
      const { photos, ...restData } = businessData
      
      const businessRecord = {
        ...restData,
        images: photos || [],
        created_by: userId,
        status: 'pending',
        verified: false,
      }

      const { data, error } = await supabase
        .from('businesses')
        .insert([businessRecord])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating business submission:', error)
      throw error
    }
  }

  /**
   * Get user business submissions
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's business submissions
   */
  static async getUserBusinessSubmissions(userId) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting user business submissions:', error)
      return []
    }
  }

  /**
   * Update business submission status
   * @param {string} businessId - Business ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated business
   */
  static async updateBusinessSubmissionStatus(businessId, status) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({ 
          status: status,
          verified: status === 'approved'
        })
        .eq('id', businessId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating business submission status:', error)
      throw error
    }
  }
}

export default BusinessService
