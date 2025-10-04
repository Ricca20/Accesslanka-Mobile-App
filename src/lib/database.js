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

    if (error) throw error
    return data
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
    return data
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
}
