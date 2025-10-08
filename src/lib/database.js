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

      // Calculate helpful votes (sum of all helpful_count from user's reviews)
      const helpfulVotes = reviews?.reduce((sum, review) => sum + (review.helpful_count || 0), 0) || 0

      return {
        reviewsCount: reviews?.length || 0,
        favoritesCount: favorites?.length || 0,
        helpfulVotes: helpfulVotes,
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return {
        reviewsCount: 0,
        favoritesCount: 0,
        helpfulVotes: 0,
      }
    }
  }

  // Authentication
  static async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    // Profile will be created automatically by database trigger
    return data
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
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    
    return {
      user: session?.user || null,
      session: session
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
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getReviews(options = {}) {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:users(full_name, verified),
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

    if (error) throw error
    
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
}

export default DatabaseService
