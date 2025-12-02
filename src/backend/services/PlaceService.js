/**
 * Place Service
 * Handles all place-related database operations
 */

import { supabase } from '../../config/supabase'

export class PlaceService {
  /**
   * Create a new place
   * @param {Object} placeData - Place data
   * @returns {Promise<Object>} Created place
   */
  static async createPlace(placeData) {
    const { data, error } = await supabase
      .from('places')
      .insert([placeData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get places with options
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Filtered places
   */
  static async getPlaces(options = {}) {
    let query = supabase
      .from('places')
      .select(`
        *,
        created_by_user:users!places_created_by_fkey(full_name, verified)
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
   * Get place by ID
   * @param {string} id - Place ID
   * @returns {Promise<Object>} Place details
   */
  static async getPlace(id) {
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        created_by_user:users!places_created_by_fkey(full_name, verified),
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
   * Search places
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching places
   */
  static async searchPlaces(searchTerm, options = {}) {
    let query = supabase
      .from('places')
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
}

export default PlaceService
