/**
 * MapMissionService
 * Handles all MapMission-related operations
 * 
 * NOTE: This is a stub implementation. Full implementation to be extracted from original database.js
 */

import { supabase } from '../../config/supabase'
import { ERROR_CODES } from '../constants/errorCodes'

class MapMissionService {
  /**
   * Create a new MapMission
   */
  static async createMapMission(missionData) {
    const { data, error } = await supabase
      .from('mapmissions')
      .insert([missionData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get MapMissions with optional filtering
   */
  static async getMapMissions(options = {}) {
    let query = supabase
      .from('mapmissions')
      .select(`
        *,
        business:businesses(id, name, address),
        created_by_user:users!mapmissions_created_by_fkey(full_name, verified)
      `)

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.businessId) {
      query = query.eq('business_id', options.businessId)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Join a MapMission
   */
  static async joinMapMission(missionId, userId) {
    const { data, error } = await supabase
      .from('mapmission_participants')
      .insert([{ mission_id: missionId, user_id: userId }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get participants of a mission
   */
  static async getMissionParticipants(missionId) {
    const { data, error } = await supabase
      .from('mapmission_participants')
      .select(`
        *,
        user:users(id, full_name, avatar_url, verified)
      `)
      .eq('mission_id', missionId)

    if (error) throw error
    return data
  }

  /**
   * Update mission status
   */
  static async updateMissionStatus(missionId, status) {
    const { data, error } = await supabase
      .from('mapmissions')
      .update({ status })
      .eq('id', missionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get active mission for a business
   */
  static async getActiveMissionForBusiness(businessId) {
    const { data, error } = await supabase
      .from('mapmissions')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== ERROR_CODES.NOT_FOUND) throw error
    return data
  }

  /**
   * Get latest mission for a business
   */
  static async getLatestMissionForBusiness(businessId) {
    const { data, error } = await supabase
      .from('mapmissions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== ERROR_CODES.NOT_FOUND) throw error
    return data
  }

  /**
   * Check if user is in a mission
   */
  static async isUserInMission(missionId, userId) {
    const { data, error } = await supabase
      .from('mapmission_participants')
      .select('id')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== ERROR_CODES.NOT_FOUND) throw error
    return !!data
  }

  /**
   * Get mission statistics
   */
  static async getMissionStats(missionId) {
    const { data, error } = await supabase
      .from('mapmission_participants')
      .select('*')
      .eq('mission_id', missionId)

    if (error) throw error

    return {
      totalParticipants: data.length,
      activeParticipants: data.filter(p => !p.completed_at).length,
      completedParticipants: data.filter(p => p.completed_at).length,
      averageProgress: data.reduce((sum, p) => sum + (p.progress || 0), 0) / (data.length || 1),
    }
  }

  /**
   * Start a MapMission
   */
  static async startMapMission(missionId, userId) {
    // Implementation needed
    throw new Error('startMapMission: Not yet implemented')
  }

  /**
   * End a MapMission
   */
  static async endMapMission(missionId, userId) {
    // Implementation needed
    throw new Error('endMapMission: Not yet implemented')
  }

  /**
   * Check if mission is ready to start
   */
  static async isMissionReadyToStart(missionId) {
    // Implementation needed
    throw new Error('isMissionReadyToStart: Not yet implemented')
  }
}

export default MapMissionService
