import { supabase } from './supabase'

export class DatabaseService {
  // Expose supabase instance for auth listeners
  static supabase = supabase

  // User management
  static async createUserProfile(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    // If profile doesn't exist (PGRST116 error), return null instead of throwing
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Profile not found for user ${userId}, may need to be created`)
        return null
      }
      throw error
    }
    return data
  }

  static async ensureUserProfile(userId, userData = {}) {
    // Try to get existing profile
    const existingProfile = await this.getUserProfile(userId)
    
    if (existingProfile) {
      return existingProfile
    }

    // Profile doesn't exist, create it
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

  static async getUserStats(userId) {
    try {
      // Get reviews count
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, helpful_count')
        .eq('user_id', userId)

      if (reviewsError) throw reviewsError

      // Get favorites count
      const { data: favorites, error: favoritesError } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)

      if (favoritesError) throw favoritesError

      // Get MapMission statistics
      const missionStats = await this.getUserMapMissionStats(userId)

      // Calculate helpful votes (sum of all helpful_count from user's reviews)
      const helpfulVotes = reviews?.reduce((sum, review) => sum + (review.helpful_count || 0), 0) || 0

      return {
        reviewsCount: reviews?.length || 0,
        favoritesCount: favorites?.length || 0,
        helpfulVotes: helpfulVotes,
        ...missionStats
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

  static async getUserMapMissionStats(userId) {
    try {
      // Get user's participation in missions
      const { data: participations, error: participationError } = await supabase
        .from('mapmission_participants')
        .select(`
          id,
          mission_id,
          completed_at,
          progress,
          mapmissions!inner(id, status, created_by)
        `)
        .eq('user_id', userId)

      if (participationError) throw participationError

      // Get missions created by user
      const { data: createdMissions, error: createdError } = await supabase
        .from('mapmissions')
        .select('id, status')
        .eq('created_by', userId)

      if (createdError) throw createdError

      // Get user's accessibility contributions (photos, reviews, ratings)
      const { data: contributions, error: contributionsError } = await supabase
        .from('accessibility_photos')
        .select('id')
        .eq('user_id', userId)

      const { data: reviewContributions, error: reviewError } = await supabase
        .from('accessibility_reviews')
        .select('id')
        .eq('user_id', userId)

      const { data: ratingContributions, error: ratingError } = await supabase
        .from('accessibility_ratings')
        .select('id')
        .eq('user_id', userId)

      // Calculate statistics
      const completedMissions = participations?.filter(p => p.completed_at).length || 0
      const activeMissions = participations?.filter(p => !p.completed_at && p.mapmissions?.status === 'active').length || 0
      const createdMissionsCount = createdMissions?.length || 0
      const totalContributions = (contributions?.length || 0) + 
                                (reviewContributions?.length || 0) + 
                                (ratingContributions?.length || 0)

      // Calculate badge based on total contributions
      const badge = this.calculateMapMissionBadge(totalContributions)

      return {
        missionStats: {
          completedMissions,
          activeMissions,
          createdMissions: createdMissionsCount,
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

  static calculateMapMissionBadge(totalContributions) {
    if (totalContributions >= 50) {
      return {
        tier: 'gold',
        title: 'Gold Explorer',
        color: '#F59E0B',
        icon: 'medal',
        progress: 100,
        description: 'Legendary MapMission Explorer!',
        nextTier: null,
        contributionsToNext: 0
      }
    } else if (totalContributions >= 25) {
      return {
        tier: 'silver',
        title: 'Silver Explorer',
        color: '#6B7280',
        icon: 'medal-outline',
        progress: Math.min(100, ((totalContributions - 25) / 25) * 100),
        description: 'Experienced MapMission Explorer',
        nextTier: 'gold',
        contributionsToNext: 50 - totalContributions
      }
    } else if (totalContributions >= 10) {
      return {
        tier: 'bronze',
        title: 'Bronze Explorer',
        color: '#D97706',
        icon: 'star-circle',
        progress: Math.min(100, ((totalContributions - 10) / 15) * 100),
        description: 'Rising MapMission Explorer',
        nextTier: 'silver',
        contributionsToNext: 25 - totalContributions
      }
    } else {
      return {
        tier: 'none',
        title: 'New Explorer',
        color: '#9CA3AF',
        icon: 'map-marker-outline',
        progress: totalContributions >= 1 ? ((totalContributions / 10) * 100) : 0,
        description: 'Ready to start your MapMission journey!',
        nextTier: 'bronze',
        contributionsToNext: 10 - totalContributions
      }
    }
  }

  // Authentication
  static async signUp(email, password, fullName, accessibilityNeeds = '') {
    try {
      // For Expo Go, use undefined to let Supabase use the default redirect
      // For production builds, use the custom scheme
      // Expo Go will handle the redirect automatically
      const emailRedirectTo = undefined // Let Supabase handle it for Expo Go compatibility
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            accessibility_needs: accessibilityNeeds,
          },
          emailRedirectTo,
        },
      })

      if (error) {
        console.error('Supabase signup error:', error)
        
        // Provide more helpful error messages
        if (error.message.includes('User already registered')) {
          // Check if user actually exists in database
          const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single()
          
          if (!existingUser) {
            // User exists in auth but not in database - this is the edge case
            throw new Error(
              'Account exists but needs cleanup. Please try again in a minute or contact support.'
            )
          }
          
          throw new Error('An account with this email already exists. Please login instead.')
        }
        
        throw error
      }

      // Check if user was created (Supabase might return success even if email confirmation is needed)
      if (!data.user) {
        throw new Error('Failed to create account. Please try again.')
      }

      console.log('User created successfully:', data.user.email)

      // Ensure profile exists and update with accessibility needs if provided
      if (data.user) {
        try {
          // Wait a moment for the database trigger to potentially create the profile
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Use ensureUserProfile to create or get the profile
          const profile = await this.ensureUserProfile(data.user.id, {
            email: data.user.email,
            full_name: fullName,
            accessibility_needs: accessibilityNeeds,
          })
          
          // If profile was just created by ensureUserProfile and needs accessibility_needs, update it
          if (profile && accessibilityNeeds && !profile.accessibility_needs) {
            await this.updateUserProfile(data.user.id, {
              accessibility_needs: accessibilityNeeds
            })
          }
          
          console.log('User profile created/updated successfully with accessibility preferences')
        } catch (profileError) {
          console.error('Error creating/updating user profile:', profileError)
          // Don't throw error here - user auth is still created successfully
          // Profile will be created later by AuthContext's ensureUserProfile
        }
      }

      return data
    } catch (error) {
      console.error('SignUp error:', error)
      throw error
    }
  }

  static async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'accesslanka://reset-password',
    })

    if (error) throw error
    return data
  }

  static async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return data
  }

  static async getCurrentUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        // Handle specific refresh token errors
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.log('Invalid refresh token detected, clearing session...')
          await this.signOut()
          return { user: null, session: null }
        }
        throw error
      }
      
      return {
        user: session?.user || null,
        session: session
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      throw error
    }
  }

  static async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  // Business management
  static async createBusiness(businessData) {
    const { data, error } = await supabase
      .from('businesses')
      .insert([businessData])
      .select()
      .single()

    if (error) throw error
    return data
  }

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
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

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

  static async verifyBusinessFromMapMission(businessId, missionId) {
    try {
      console.log(`Verifying business ${businessId} from MapMission ${missionId}`)
      
      // Mark business as verified and add verification details
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

  static async syncBusinessVerificationStatus() {
    try {
      console.log('Starting business verification status sync...')
      
      // Find all businesses with active or completed MapMissions that aren't verified yet
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
        return { updated: 0, message: 'No businesses need verification updates' }
      }

      let updateCount = 0
      const updatePromises = unverifiedBusinesses.map(async (business) => {
        // Only update if business has active/completed missions
        const activeMissions = business.mapmissions?.filter(m => 
          m.status === 'active' || m.status === 'completed'
        )

        if (activeMissions?.length > 0) {
          try {
            const latestMission = activeMissions.sort((a, b) => 
              new Date(b.created_at) - new Date(a.created_at)
            )[0]

            await this.verifyBusinessFromMapMission(business.id, latestMission.id)
            updateCount++
            console.log(`Verified business: ${business.name}`)
          } catch (error) {
            console.error(`Failed to verify business ${business.name}:`, error)
          }
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

  static async syncBusinessStatusWithMapMissions() {
    try {
      console.log('Starting comprehensive business status sync with MapMissions...')
      
      // Get all businesses with their associated MapMissions
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
        return { updated: 0, message: 'No businesses to sync' }
      }

      let updateCount = 0
      const updatePromises = businesses.map(async (business) => {
        try {
          // Get all missions for this business, sorted by creation date (newest first)
          const missions = business.mapmissions?.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          ) || []

          if (missions.length === 0) {
            // No missions - keep current status or set to default
            return
          }

          // Get the latest mission to determine business status
          const latestMission = missions[0]
          let newBusinessStatus = business.status // Default to current status

          // Determine new business status based on latest MapMission status
          switch (latestMission.status) {
            case 'upcoming':
              newBusinessStatus = 'pending'
              break
            case 'active':
              newBusinessStatus = 'verified'
              break
            case 'completed':
              newBusinessStatus = 'verified' // Remain verified after completion
              break
            default:
              // Unknown status, keep current business status
              return
          }

          // Only update if status has changed
          if (newBusinessStatus !== business.status) {
            const { error: updateError } = await supabase
              .from('businesses')
              .update({ 
                status: newBusinessStatus,
                verified: newBusinessStatus === 'verified',
                updated_at: new Date().toISOString()
              })
              .eq('id', business.id)

            if (updateError) {
              console.error(`Failed to update business ${business.name}:`, updateError)
              return
            }

            updateCount++
            console.log(`Updated business "${business.name}" status: ${business.status} → ${newBusinessStatus}`)
          }
        } catch (error) {
          console.error(`Error processing business ${business.name}:`, error)
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

  static async deleteBusiness(id) {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Places management
  static async createPlace(placeData) {
    const { data, error } = await supabase
      .from('places')
      .insert([placeData])
      .select()
      .single()

    if (error) throw error
    return data
  }

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
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

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

  // Review management
  static async createReview(reviewData) {
    console.log('DatabaseService.createReview called with:', reviewData)
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

  static async getReviews(options = {}) {
    console.log('getReviews called with options:', options)
    
    // First, get reviews without user join to see if they exist
    let baseQuery = supabase
      .from('reviews')
      .select('*')
    
    if (options.businessId) {
      console.log('Filtering by business_id:', options.businessId)
      baseQuery = baseQuery.eq('business_id', options.businessId)
    }
    
    if (options.placeId) {
      console.log('Filtering by place_id:', options.placeId)
      baseQuery = baseQuery.eq('place_id', options.placeId)
    }
    
    if (options.userId) {
      console.log('Filtering by user_id:', options.userId)
      baseQuery = baseQuery.eq('user_id', options.userId)
    }
    
    const { data: baseReviews, error: baseError } = await baseQuery.order('created_at', { ascending: false })
    console.log('Base reviews without joins:', baseReviews?.length || 0, 'reviews found')
    if (baseReviews && baseReviews.length > 0) {
      console.log('Sample base review:', {
        id: baseReviews[0].id,
        business_id: baseReviews[0].business_id,
        place_id: baseReviews[0].place_id,
        title: baseReviews[0].title
      })
    }
    
    // Now get reviews with user join
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
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews with joins:', error)
      throw error
    }
    
    console.log('Reviews fetched with joins:', data?.length || 0, 'reviews')
    console.log('Raw reviews data:', JSON.stringify(data?.slice(0, 2), null, 2))
    
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

  static async deleteReview(id) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Review helpfulness
  static async markReviewHelpful(reviewId, userId) {
    const { data, error } = await supabase
      .from('review_helpful')
      .insert([{ review_id: reviewId, user_id: userId }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async unmarkReviewHelpful(reviewId, userId) {
    const { error } = await supabase
      .from('review_helpful')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId)

    if (error) throw error
  }

  static async isReviewHelpful(reviewId, userId) {
    const { data, error } = await supabase
      .from('review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }

  // Review replies
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
        // Check if the error is due to missing table
        if (error.code === 'PGRST205' && error.message.includes('review_replies')) {
          throw new Error('Reply functionality is not available yet. The review_replies table needs to be created in the database.')
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Error creating review reply:', error)
      throw error
    }
  }

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
        // Check if the error is due to missing table
        if (error.code === 'PGRST205' && error.message.includes('review_replies')) {
          console.warn('Review replies table not found, returning empty array')
          return []
        }
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error getting review replies:', error)
      return []
    }
  }

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

  static async deleteReviewReply(id) {
    const { error } = await supabase
      .from('review_replies')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Favorites
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

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    if (placeId) {
      query = query.eq('place_id', placeId)
    }

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

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    if (placeId) {
      query = query.eq('place_id', placeId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }

  // Search functionality
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

  // Get categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  }

  // Statistics
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

  // User reviews and favorites
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
    
    // Add business_name or place_name for easier access
    return data?.map(review => ({
      ...review,
      business_name: review.business?.name,
      place_name: review.place?.name
    })) || []
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
    return data || []
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

  // Mark review as helpful
  static async markReviewHelpful(reviewId, userId) {
    try {
      const { data, error } = await supabase
        .from('review_helpful')
        .insert([
          {
            review_id: reviewId,
            user_id: userId
          }
        ])

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error marking review helpful:', error)
      throw error
    }
  }

  // Unmark review as helpful
  static async unmarkReviewHelpful(reviewId, userId) {
    try {
      const { data, error } = await supabase
        .from('review_helpful')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error unmarking review helpful:', error)
      throw error
    }
  }

  // Insert sample data using authenticated user context
  static async insertSampleData(userId) {
    try {
      console.log('Inserting sample data with user:', userId)
      
      // Insert sample places with the authenticated user
      const places = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Independence Memorial Hall',
          category: 'museums',
          description: 'National monument commemorating Sri Lankan independence',
          address: 'Independence Avenue, Colombo 07',
          latitude: 6.9034,
          longitude: 79.8606,
          accessibility_features: ['wheelchair_accessible', 'accessible_restrooms', 'elevator_access'],
          verified: true,
          created_by: userId
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'National Museum of Colombo',
          category: 'museums',
          description: 'The largest museum in Sri Lanka with historical artifacts',
          address: 'Sir Marcus Fernando Mawatha, Colombo 07',
          latitude: 6.9107,
          longitude: 79.8611,
          accessibility_features: ['wheelchair_accessible', 'audio_guides', 'tactile_exhibits'],
          verified: true,
          created_by: userId
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Viharamahadevi Park',
          category: 'parks',
          description: 'The oldest and largest park in Colombo located in front of the Town Hall',
          address: 'Ananda Coomaraswamy Mawatha, Colombo 07',
          latitude: 6.9176,
          longitude: 79.8606,
          accessibility_features: ['paved_paths', 'accessible_playground', 'braille_signs'],
          verified: true,
          created_by: userId
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Galle Face Green',
          category: 'parks',
          description: 'Ocean-side urban park in the heart of Colombo',
          address: 'Galle Road, Colombo 03',
          latitude: 6.9271,
          longitude: 79.8412,
          accessibility_features: ['wide_open_spaces', 'accessible_parking'],
          verified: true,
          created_by: userId
        }
      ]

      console.log('Inserting places...')
      const { error: placesError } = await supabase
        .from('places')
        .upsert(places, { onConflict: 'id' })

      if (placesError) {
        console.error('Error inserting places:', placesError)
        throw placesError
      }

      // Insert sample businesses
      const businesses = [
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          name: 'Ministry of Crab',
          category: 'restaurants',
          description: 'Award-winning seafood restaurant in a restored Dutch hospital',
          address: '2nd Floor, Dutch Hospital Shopping Precinct, Colombo 01',
          latitude: 6.9354,
          longitude: 79.8438,
          phone: '+94112342200',
          website: 'https://ministryofcrab.com',
          accessibility_features: ['wheelchair_accessible', 'accessible_restrooms', 'elevator_access'],
          verified: true,
          created_by: userId
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440006',
          name: 'Shangri-La Hotel Colombo',
          category: 'hotels',
          description: 'Luxury hotel with ocean views and premium amenities',
          address: '1 Galle Face Green, Colombo 02',
          latitude: 6.9238,
          longitude: 79.8439,
          phone: '+94112376111',
          website: 'https://shangri-la.com',
          accessibility_features: ['wheelchair_accessible', 'accessible_rooms', 'elevator_access', 'pool_lift'],
          verified: true,
          created_by: userId
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440007',
          name: 'Odel',
          category: 'shopping',
          description: 'Popular department store with multiple floors of fashion and lifestyle products',
          address: '5 Alexandra Place, Colombo 07',
          latitude: 6.9138,
          longitude: 79.8567,
          phone: '+94112682712',
          website: 'https://odel.lk',
          accessibility_features: ['elevator_access', 'wide_aisles', 'accessible_restrooms'],
          verified: true,
          created_by: userId
        }
      ]

      console.log('Inserting businesses...')
      const { error: businessesError } = await supabase
        .from('businesses')
        .upsert(businesses, { onConflict: 'id' })

      if (businessesError) {
        console.error('Error inserting businesses:', businessesError)
        throw businessesError
      }

      // Insert sample reviews
      const reviews = [
        {
          id: '550e8400-e29b-41d4-a716-446655440020',
          place_id: '550e8400-e29b-41d4-a716-446655440001',
          business_id: null,
          user_id: userId,
          overall_rating: 4,
          accessibility_ratings: { mobility: 4, visual: 3, hearing: 5, cognitive: 4 },
          title: 'Great accessibility features',
          content: 'The Independence Memorial Hall has excellent wheelchair access and clear signage. Some exhibits could use better lighting for people with visual impairments, but overall very accessible. The staff is helpful and knowledgeable about accessibility features.',
          helpful_count: 12,
          verified: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          place_id: '550e8400-e29b-41d4-a716-446655440002',
          business_id: null,
          user_id: userId,
          overall_rating: 5,
          accessibility_ratings: { mobility: 5, visual: 4, hearing: 4, cognitive: 5 },
          title: 'Outstanding museum accessibility',
          content: 'The National Museum has fantastic exhibits and is very well designed for accessibility. Audio guides available and wide corridors throughout. Tactile exhibits are a wonderful addition.',
          helpful_count: 8,
          verified: false
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440022',
          place_id: null,
          business_id: '550e8400-e29b-41d4-a716-446655440005',
          user_id: userId,
          overall_rating: 4,
          accessibility_ratings: { mobility: 4, visual: 4, hearing: 3, cognitive: 4 },
          title: 'Excellent food, good accessibility',
          content: 'Amazing seafood and the restaurant is wheelchair accessible. The elevator works well and staff is accommodating. However, it can get quite noisy during peak hours which might be challenging for those with hearing sensitivity.',
          helpful_count: 15,
          verified: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440023',
          place_id: '550e8400-e29b-41d4-a716-446655440003',
          business_id: null,
          user_id: userId,
          overall_rating: 4,
          accessibility_ratings: { mobility: 4, visual: 5, hearing: 4, cognitive: 4 },
          title: 'Beautiful park with great paths',
          content: 'Viharamahadevi Park is lovely for a peaceful walk. Most paths are paved and accessible, and the braille signs are a nice touch. The accessible playground is perfect for families.',
          helpful_count: 6,
          verified: false
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440024',
          place_id: '550e8400-e29b-41d4-a716-446655440004',
          business_id: null,
          user_id: userId,
          overall_rating: 3,
          accessibility_ratings: { mobility: 2, visual: 4, hearing: 4, cognitive: 3 },
          title: 'Beach access needs improvement',
          content: 'Galle Face Green is a great place to watch the sunset, but beach access is challenging for people with mobility issues. The main green area is accessible though.',
          helpful_count: 9,
          verified: false
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440025',
          business_id: '550e8400-e29b-41d4-a716-446655440006',
          place_id: null,
          user_id: userId,
          overall_rating: 5,
          accessibility_ratings: { mobility: 5, visual: 5, hearing: 5, cognitive: 5 },
          title: 'Luxury with accessibility in mind',
          content: 'Shangri-La Hotel Colombo excels in both luxury and accessibility. They have accessible rooms, pool lifts, and very attentive staff. The accessibility features are exceptional.',
          helpful_count: 20,
          verified: true
        }
      ]

      console.log('Inserting reviews...')
      const { error: reviewsError } = await supabase
        .from('reviews')
        .upsert(reviews, { onConflict: 'id' })

      if (reviewsError) {
        console.error('Error inserting reviews:', reviewsError)
        throw reviewsError
      }

      console.log('Sample data inserted successfully!')
      return { success: true, message: 'Sample data inserted successfully!' }

    } catch (error) {
      console.error('Error inserting sample data:', error)
      throw error
    }
  }

  // Business submission methods
  static async createBusinessSubmission(userId, businessData) {
    try {
      // Map photos to images to match database schema
      const { photos, ...restData } = businessData
      
      const businessRecord = {
        ...restData,
        images: photos || [], // Map photos to images
        created_by: userId,
        status: 'pending', // Set default status as pending
        verified: false,   // Business is not verified until approved
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

  // MapMission methods
  static async createMapMission(missionData) {
    try {
      const { data, error } = await supabase
        .from('mapmissions')
        .insert([missionData])
        .select()
        .single()

      if (error) throw error
      
      // Automatically add the creator as a participant
      try {
        await this.joinMapMission(data.id, data.created_by)
      } catch (participantError) {
        // If adding as participant fails, don't fail the entire mission creation
        console.warn('Failed to add creator as participant:', participantError)
      }
      
      return data
    } catch (error) {
      console.error('Error creating MapMission:', error)
      throw error
    }
  }

  static async getMapMissions(options = {}) {
    try {
      let query = supabase
        .from('mapmissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (options.status) {
        query = query.eq('status', options.status)
      }

      if (options.business_id) {
        query = query.eq('business_id', options.business_id)
      }

      if (options.created_by) {
        query = query.eq('created_by', options.created_by)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching MapMissions:', error)
      throw error
    }
  }

  static async joinMapMission(missionId, userId) {
    try {
      // First check if user is already a participant
      const { data: existing, error: checkError } = await supabase
        .from('mapmission_participants')
        .select('id')
        .eq('mission_id', missionId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        throw new Error('User is already participating in this mission')
      }

      // Add user as participant
      const { data, error } = await supabase
        .from('mapmission_participants')
        .insert([{
          mission_id: missionId,
          user_id: userId,
          joined_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error joining MapMission:', error)
      throw error
    }
  }

  static async getMissionParticipants(missionId) {
    try {
      const { data, error } = await supabase
        .from('mapmission_participants')
        .select(`
          *,
          users (
            id,
            full_name,
            email
          )
        `)
        .eq('mission_id', missionId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching mission participants:', error)
      throw error
    }
  }

  static async updateMissionStatus(missionId, status) {
    try {
      const { data, error } = await supabase
        .from('mapmissions')
        .update({ status })
        .eq('id', missionId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating mission status:', error)
      throw error
    }
  }

  static async getActiveMissionForBusiness(businessId) {
    try {
      const { data, error } = await supabase
        .from('mapmissions')
        .select('*')
        .eq('business_id', businessId)
        .in('status', ['upcoming', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no results found, which is expected sometimes
        throw error
      }

      return data || null
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null // No active mission found
      }
      console.error('Error fetching active mission for business:', error)
      throw error
    }
  }

  static async getLatestMissionForBusiness(businessId) {
    try {
      const { data, error } = await supabase
        .from('mapmissions')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no results found, which is expected sometimes
        throw error
      }

      return data || null
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null // No mission found
      }
      console.error('Error fetching latest mission for business:', error)
      throw error
    }
  }

  static async isUserInMission(missionId, userId) {
    try {
      const { data, error } = await supabase
        .from('mapmission_participants')
        .select('id')
        .eq('mission_id', missionId)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return !!data
    } catch (error) {
      if (error.code === 'PGRST116') {
        return false // User not in mission
      }
      console.error('Error checking user mission participation:', error)
      throw error
    }
  }

  static async getMissionStats(missionId) {
    try {
      const { data, error } = await supabase
        .from('mapmission_participants')
        .select('id, progress, completed_at')
        .eq('mission_id', missionId)

      if (error) throw error

      const participants = data || []
      return {
        totalParticipants: participants.length,
        activeParticipants: participants.filter(p => !p.completed_at).length,
        completedParticipants: participants.filter(p => p.completed_at).length,
        averageProgress: participants.length > 0 
          ? participants.reduce((sum, p) => sum + (p.progress || 0), 0) / participants.length 
          : 0
      }
    } catch (error) {
      console.error('Error fetching mission stats:', error)
      throw error
    }
  }

  static async startMapMission(missionId, userId) {
    try {
      // First verify the user is the creator of the mission
      const { data: mission, error: missionError } = await supabase
        .from('mapmissions')
        .select('created_by, status, max_participants, business_id')
        .eq('id', missionId)
        .single()

      if (missionError) throw missionError

      if (mission.created_by !== userId) {
        throw new Error('Only the mission creator can start the mission')
      }

      if (mission.status !== 'upcoming') {
        throw new Error('Mission can only be started from upcoming status')
      }

      // Check if mission has enough participants
      const stats = await this.getMissionStats(missionId)
      if (stats.totalParticipants < mission.max_participants) {
        throw new Error(`Mission needs ${mission.max_participants} participants but only has ${stats.totalParticipants}`)
      }

      // Update mission status to active
      const { data, error } = await supabase
        .from('mapmissions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', missionId)
        .select()
        .single()

      if (error) throw error

      // Sync business status when mission starts
      try {
        await this.syncBusinessStatusWithMapMissions()
        console.log(`Business status synced after MapMission ${missionId} started`)
      } catch (syncError) {
        console.warn('Warning: Failed to sync business status:', syncError)
        // Don't fail the mission start if business sync fails
      }

      return data
    } catch (error) {
      console.error('Error starting MapMission:', error)
      throw error
    }
  }

  static async endMapMission(missionId, userId) {
    try {
      // First verify the user is the creator of the mission
      const { data: mission, error: missionError } = await supabase
        .from('mapmissions')
        .select('created_by, status, business_id')
        .eq('id', missionId)
        .single()

      if (missionError) {
        return { success: false, error: `Failed to fetch mission: ${missionError.message}` }
      }

      if (mission.created_by !== userId) {
        return { success: false, error: 'Only the mission creator can end the mission' }
      }

      if (mission.status !== 'active') {
        return { success: false, error: 'Mission can only be ended from active status' }
      }

      // Update mission status to completed
      const { data, error } = await supabase
        .from('mapmissions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', missionId)
        .select()
        .single()

      if (error) {
        return { success: false, error: `Failed to update mission: ${error.message}` }
      }

      // Sync business status after mission completion
      try {
        await this.syncBusinessStatusWithMapMissions()
        console.log('Business status synced after mission completion')
      } catch (syncError) {
        console.warn('Warning: Failed to sync business status:', syncError)
        // Don't fail the mission end if sync fails
      }

      console.log(`MapMission ${missionId} ended successfully`)
      return { success: true, data: data, message: 'MapMission ended successfully' }
    } catch (error) {
      console.error('Error ending MapMission:', error)
      return { success: false, error: error.message || 'Failed to end MapMission' }
    }
  }

  static async isMissionReadyToStart(missionId) {
    try {
      const { data: mission, error: missionError } = await supabase
        .from('mapmissions')
        .select('status, max_participants')
        .eq('id', missionId)
        .single()

      if (missionError) throw missionError

      if (mission.status !== 'upcoming') {
        return { ready: false, reason: 'Mission is not in upcoming status' }
      }

      const stats = await this.getMissionStats(missionId)
      const isFullyBooked = stats.totalParticipants >= mission.max_participants

      return {
        ready: isFullyBooked,
        reason: isFullyBooked ? 'Ready to start' : `Needs ${mission.max_participants - stats.totalParticipants} more participants`,
        currentParticipants: stats.totalParticipants,
        requiredParticipants: mission.max_participants
      }
    } catch (error) {
      console.error('Error checking mission readiness:', error)
      throw error
    }
  }

  // Accessibility Contribution methods
  static async addAccessibilityPhoto(photoData) {
    try {
      const { data, error } = await supabase
        .from('accessibility_photos')
        .insert([photoData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding accessibility photo:', error)
      throw error
    }
  }

  static async addAccessibilityReview(reviewData) {
    try {
      const { data, error } = await supabase
        .from('accessibility_reviews')
        .insert([reviewData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding accessibility review:', error)
      throw error
    }
  }

  static async addAccessibilityRating(ratingData) {
    try {
      // Use UPSERT (INSERT ON CONFLICT UPDATE) to handle duplicate constraint
      const { data, error } = await supabase
        .from('accessibility_ratings')
        .upsert([{
          ...ratingData,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'mission_id,user_id,feature_type',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding/updating accessibility rating:', error)
      throw error
    }
  }

  static async updateAccessibilityRating(ratingId, updates) {
    try {
      const { data, error } = await supabase
        .from('accessibility_ratings')
        .update(updates)
        .eq('id', ratingId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating accessibility rating:', error)
      throw error
    }
  }

  static async getAccessibilityPhotos(options = {}) {
    try {
      let query = supabase
        .from('accessibility_photos')
        .select(`
          *,
          user:users(full_name, verified)
        `)
        .order('created_at', { ascending: false })

      if (options.missionId) {
        query = query.eq('mission_id', options.missionId)
      }

      if (options.businessId) {
        query = query.eq('business_id', options.businessId)
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }

      if (options.featureType) {
        query = query.eq('feature_type', options.featureType)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching accessibility photos:', error)
      throw error
    }
  }

  static async getAccessibilityReviews(options = {}) {
    try {
      let query = supabase
        .from('accessibility_reviews')
        .select(`
          *,
          user:users(full_name, verified)
        `)
        .order('created_at', { ascending: false })

      if (options.missionId) {
        query = query.eq('mission_id', options.missionId)
      }

      if (options.businessId) {
        query = query.eq('business_id', options.businessId)
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }

      if (options.featureType) {
        query = query.eq('feature_type', options.featureType)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching accessibility reviews:', error)
      throw error
    }
  }

  static async getAccessibilityRatings(options = {}) {
    try {
      let query = supabase
        .from('accessibility_ratings')
        .select(`
          *,
          user:users(full_name, verified)
        `)
        .order('created_at', { ascending: false })

      if (options.missionId) {
        query = query.eq('mission_id', options.missionId)
      }

      if (options.businessId) {
        query = query.eq('business_id', options.businessId)
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }

      if (options.featureType) {
        query = query.eq('feature_type', options.featureType)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching accessibility ratings:', error)
      throw error
    }
  }

  static async getUserMissionContributions(missionId, userId) {
    try {
      // Since mission_contributions table doesn't exist yet, calculate from individual tables
      const [photosResult, reviewsResult, ratingsResult] = await Promise.all([
        supabase.from('accessibility_photos').select('id').eq('mission_id', missionId).eq('user_id', userId),
        supabase.from('accessibility_reviews').select('id').eq('mission_id', missionId).eq('user_id', userId),
        supabase.from('accessibility_ratings').select('id').eq('mission_id', missionId).eq('user_id', userId)
      ])

      const photosCount = photosResult.data?.length || 0
      const reviewsCount = reviewsResult.data?.length || 0
      const ratingsCount = ratingsResult.data?.length || 0

      return {
        photos_count: photosCount,
        reviews_count: reviewsCount,
        ratings_count: ratingsCount,
        total_contributions: photosCount + reviewsCount + ratingsCount,
        last_contribution_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching user mission contributions:', error)
      return {
        photos_count: 0,
        reviews_count: 0,
        ratings_count: 0,
        total_contributions: 0,
        last_contribution_at: null
      }
    }
  }

  static async getMissionContributionsSummary(missionId) {
    try {
      // Since mission_contributions table doesn't exist, aggregate from individual tables
      const [photosResult, reviewsResult, ratingsResult] = await Promise.all([
        supabase.from('accessibility_photos').select('user_id').eq('mission_id', missionId),
        supabase.from('accessibility_reviews').select('user_id').eq('mission_id', missionId),
        supabase.from('accessibility_ratings').select('user_id').eq('mission_id', missionId)
      ])

      // Group by user and count contributions
      const userContributions = {}
      
      // Count photos
      photosResult.data?.forEach(photo => {
        if (!userContributions[photo.user_id]) {
          userContributions[photo.user_id] = { photos_count: 0, reviews_count: 0, ratings_count: 0 }
        }
        userContributions[photo.user_id].photos_count++
      })

      // Count reviews
      reviewsResult.data?.forEach(review => {
        if (!userContributions[review.user_id]) {
          userContributions[review.user_id] = { photos_count: 0, reviews_count: 0, ratings_count: 0 }
        }
        userContributions[review.user_id].reviews_count++
      })

      // Count ratings
      ratingsResult.data?.forEach(rating => {
        if (!userContributions[rating.user_id]) {
          userContributions[rating.user_id] = { photos_count: 0, reviews_count: 0, ratings_count: 0 }
        }
        userContributions[rating.user_id].ratings_count++
      })

      // Convert to array format
      const summary = Object.entries(userContributions).map(([userId, contributions]) => ({
        mission_id: missionId,
        user_id: userId,
        photos_count: contributions.photos_count,
        reviews_count: contributions.reviews_count,
        ratings_count: contributions.ratings_count,
        total_contributions: contributions.photos_count + contributions.reviews_count + contributions.ratings_count
      }))

      return summary
    } catch (error) {
      console.error('Error fetching mission contributions summary:', error)
      return []
    }
  }

  static async getBusinessAccessibilityContributions(businessId) {
    try {
      console.log(`Fetching all accessibility contributions for business ${businessId}`)
      
      // Get all accessibility photos, reviews, and ratings for this business
      const [photosResult, reviewsResult, ratingsResult] = await Promise.all([
        supabase
          .from('accessibility_photos')
          .select(`
            *,
            users(id, full_name, email),
            mapmissions(id, title)
          `)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false }),
          
        supabase
          .from('accessibility_reviews')
          .select(`
            *,
            users(id, full_name, email),
            mapmissions(id, title)
          `)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false }),
          
        supabase
          .from('accessibility_ratings')
          .select(`
            *,
            users(id, full_name, email),
            mapmissions(id, title)
          `)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
      ])

      const photos = photosResult.data || []
      const reviews = reviewsResult.data || []
      const ratings = ratingsResult.data || []

      console.log(`Found ${photos.length} photos, ${reviews.length} reviews, ${ratings.length} ratings`)

      return {
        photos: photos.map(photo => ({
          ...photo,
          user_name: photo.users?.full_name || photo.users?.email || 'Anonymous User',
          mission_title: photo.mapmissions?.title || 'General Accessibility'
        })),
        reviews: reviews.map(review => ({
          ...review,
          user_name: review.users?.full_name || review.users?.email || 'Anonymous User',
          mission_title: review.mapmissions?.title || 'General Accessibility'
        })),
        ratings: ratings.map(rating => ({
          ...rating,
          user_name: rating.users?.full_name || rating.users?.email || 'Anonymous User',
          mission_title: rating.mapmissions?.title || 'General Accessibility'
        })),
        totalContributions: photos.length + reviews.length + ratings.length
      }
    } catch (error) {
      console.error('Error fetching business accessibility contributions:', error)
      return {
        photos: [],
        reviews: [],
        ratings: [],
        totalContributions: 0
      }
    }
  }

  static async getBusinessAccessibilitySummary(businessId, missionId = null) {
    try {
      // Get accessibility features summary for a business
      const accessibilityFeatures = [
        'entrance',
        'parking',
        'restroom',
        'elevator',
        'ramp',
        'pathway',
        'seating',
        'lighting',
        'signage',
        'service_counter'
      ]

      const summary = {}

      for (const feature of accessibilityFeatures) {
        // Get photos count
        let photosQuery = supabase
          .from('accessibility_photos')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('feature_type', feature)

        if (missionId) {
          photosQuery = photosQuery.eq('mission_id', missionId)
        }

        // Get reviews count
        let reviewsQuery = supabase
          .from('accessibility_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('feature_type', feature)

        if (missionId) {
          reviewsQuery = reviewsQuery.eq('mission_id', missionId)
        }

        // Get ratings data
        let ratingsQuery = supabase
          .from('accessibility_ratings')
          .select('accessibility_rating, availability_rating, condition_rating, overall_rating')
          .eq('business_id', businessId)
          .eq('feature_type', feature)

        if (missionId) {
          ratingsQuery = ratingsQuery.eq('mission_id', missionId)
        }

        const [photosResult, reviewsResult, ratingsResult] = await Promise.all([
          photosQuery,
          reviewsQuery,
          ratingsQuery
        ])

        const ratings = ratingsResult.data || []
        const avgRatings = ratings.length > 0 ? {
          accessibility: ratings.reduce((sum, r) => sum + r.accessibility_rating, 0) / ratings.length,
          availability: ratings.reduce((sum, r) => sum + r.availability_rating, 0) / ratings.length,
          condition: ratings.reduce((sum, r) => sum + r.condition_rating, 0) / ratings.length,
          overall: ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length
        } : {
          accessibility: 0,
          availability: 0,
          condition: 0,
          overall: 0
        }

        summary[feature] = {
          photosCount: photosResult.count || 0,
          reviewsCount: reviewsResult.count || 0,
          ratingsCount: ratings.length,
          averageRatings: avgRatings
        }
      }

      return summary
    } catch (error) {
      console.error('Error fetching business accessibility summary:', error)
      throw error
    }
  }

  static async uploadAccessibilityPhoto(imageAsset, missionId, businessId, userId) {
    try {
      console.log('Storing accessibility photo locally (like AddMyBusiness)...')
      
      // Validate input
      if (!imageAsset || !imageAsset.uri) {
        throw new Error('Invalid image asset provided')
      }
      
      if (!missionId || !businessId || !userId) {
        throw new Error('Missing required IDs for photo upload')
      }

      console.log('Image asset details:', {
        uri: imageAsset.uri,
        type: imageAsset.type,
        width: imageAsset.width,
        height: imageAsset.height
      })

      // Instead of uploading to storage, just return the local URI
      // This matches the approach used in AddMyBusinessScreen
      const photoPath = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const photoUrl = imageAsset.uri // Use the local URI directly

      console.log('Photo stored locally:', {
        photoPath: photoPath,
        photoUrl: photoUrl
      })

      return {
        photoPath: photoPath,
        photoUrl: photoUrl
      }
    } catch (error) {
      console.error('Error storing accessibility photo:', error)
      throw error
    }
  }

  static async deleteAccessibilityPhoto(photoId, userId) {
    try {
      // Since we're using local storage (like AddMyBusiness), we only need to delete from database
      // No need to delete from Supabase storage since photos are stored locally
      
      // First get the photo to ensure user owns it
      const { data: photo, error: fetchError } = await supabase
        .from('accessibility_photos')
        .select('user_id')
        .eq('id', photoId)
        .single()

      if (fetchError) throw fetchError

      if (photo.user_id !== userId) {
        throw new Error('You can only delete your own photos')
      }

      // Delete from database only (no storage deletion needed for local photos)
      const { error: dbError } = await supabase
        .from('accessibility_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      return true
    } catch (error) {
      console.error('Error deleting accessibility photo:', error)
      throw error
    }
  }
}

export default DatabaseService
