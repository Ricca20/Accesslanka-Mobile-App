import { supabase } from '../lib/supabase'

/**
 * Community Service
 * Handles all community post operations including CRUD, likes, comments, and filtering
 */
export class CommunityService {
  
  // =============================================
  // POST OPERATIONS
  // =============================================

  /**
   * Get all community posts with optional filtering
   * @param {Object} options - Filter options
   * @param {string} options.category - Filter by category ('all', 'questions', 'reviews', 'tips', 'events', 'discussion')
   * @param {string} options.sortBy - Sort by field ('created_at', 'upvotes_count', 'comments_count', 'views_count')
   * @param {string} options.sortOrder - Sort order ('asc', 'desc')
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @param {Array<string>} options.tags - Filter by tags
   * @param {string} options.userId - Filter by user ID
   * @returns {Promise<Array>} Array of posts
   */
  static async getPosts(options = {}) {
    try {
      const {
        category = 'all',
        sortBy = 'created_at',
        sortOrder = 'desc',
        limit = 20,
        offset = 0,
        tags = [],
        userId = null,
      } = options

      let query = supabase
        .from('community_posts')
        .select('*')
        .eq('status', 'active')
        .is('deleted_at', null)

      // Apply category filter
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      // Apply user filter
      if (userId) {
        query = query.eq('user_id', userId)
      }

      // Apply tags filter
      if (tags && tags.length > 0) {
        query = query.contains('tags', tags)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) throw error

      // Fetch user details and real-time counts for each post
      const postsWithAuthors = await Promise.all(
        data.map(async (post) => {
          const userInfo = await this.getUserInfo(post.user_id)
          
          // Get real-time counts
          const [likesCount, commentsCount, viewsCount] = await Promise.all([
            this.getPostLikesCount(post.id),
            this.getPostCommentsCount(post.id),
            this.getPostViewsCount(post.id),
          ])
          
          return {
            ...post,
            author: userInfo.name,
            authorAvatar: userInfo.avatar,
            authorInitials: userInfo.initials,
            upvotes_count: likesCount,
            comments_count: commentsCount,
            views_count: viewsCount,
          }
        })
      )

      return postsWithAuthors
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw error
    }
  }

  /**
   * Get user information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User info
   */
  static async getUserInfo(userId) {
    try {
      // Query the users table directly
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('full_name, email, avatar_url')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows found
      
      if (!profileError && userProfile) {
        const name = userProfile.full_name || 
                    userProfile.email?.split('@')[0] || 
                    'Anonymous User'
        
        return {
          name,
          avatar: userProfile.avatar_url || null,
          initials: this.getInitials(name),
        }
      }

      // Fallback: try to get current user if it's the same
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser && currentUser.id === userId) {
        const name = currentUser.user_metadata?.full_name || 
                    currentUser.user_metadata?.name || 
                    currentUser.email?.split('@')[0] || 
                    'Anonymous User'
        return {
          name,
          avatar: currentUser.user_metadata?.avatar_url || null,
          initials: this.getInitials(name),
        }
      }
      
      // Final fallback
      return {
        name: 'Anonymous User',
        avatar: null,
        initials: 'AU',
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      return {
        name: 'Anonymous User',
        avatar: null,
        initials: 'AU',
      }
    }
  }

  /**
   * Get a single post by ID
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Post object
   */
  static async getPostById(postId) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error) throw error

      // Fetch user details and real-time counts
      const userInfo = await this.getUserInfo(data.user_id)
      
      const [likesCount, commentsCount, viewsCount] = await Promise.all([
        this.getPostLikesCount(data.id),
        this.getPostCommentsCount(data.id),
        this.getPostViewsCount(data.id),
      ])
      
      return {
        ...data,
        author: userInfo.name,
        authorAvatar: userInfo.avatar,
        authorInitials: userInfo.initials,
        upvotes_count: likesCount,
        comments_count: commentsCount,
        views_count: viewsCount,
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      throw error
    }
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @param {string} postData.category - Post category
   * @param {string} postData.title - Post title
   * @param {string} postData.content - Post content
   * @param {Array<string>} postData.tags - Post tags
   * @param {Array<string>} postData.image_urls - Image URLs
   * @returns {Promise<Object>} Created post
   */
  static async createPost(postData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated to create a post')
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert([
          {
            user_id: user.id,
            category: postData.category,
            title: postData.title,
            content: postData.content,
            tags: postData.tags || [],
            image_urls: postData.image_urls || [],
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Fetch user details
      const userInfo = await this.getUserInfo(data.user_id)
      
      return {
        ...data,
        author: userInfo.name,
        authorAvatar: userInfo.avatar,
        authorInitials: userInfo.initials,
      }
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  /**
   * Update a post
   * @param {string} postId - Post ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated post
   */
  static async updatePost(postId, updates) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error updating post:', error)
      throw error
    }
  }

  /**
   * Delete a post (soft delete)
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} Success status
   */
  static async deletePost(postId) {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
        })
        .eq('id', postId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error deleting post:', error)
      throw error
    }
  }

  // =============================================
  // LIKE OPERATIONS
  // =============================================

  /**
   * Like a post
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} Success status
   */
  static async likePost(postId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated to like a post')
      }

      // Insert like
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
          },
        ])

      if (likeError) {
        // Check if already liked
        if (likeError.code === '23505') {
          return false // Already liked
        }
        throw likeError
      }

      return true
    } catch (error) {
      console.error('Error liking post:', error)
      throw error
    }
  }

  /**
   * Unlike a post
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} Success status
   */
  static async unlikePost(postId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated to unlike a post')
      }

      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error unliking post:', error)
      throw error
    }
  }

  /**
   * Check if user has liked a post
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} Like status
   */
  static async hasUserLikedPost(postId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      return !!data
    } catch (error) {
      console.error('Error checking like status:', error)
      return false
    }
  }

  /**
   * Get posts liked by current user
   * @returns {Promise<Array>} Array of liked post IDs
   */
  static async getUserLikedPosts() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []

      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)

      if (error) throw error

      return data.map(like => like.post_id)
    } catch (error) {
      console.error('Error fetching user liked posts:', error)
      return []
    }
  }

  /**
   * Toggle post like (like if not liked, unlike if liked)
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Result with liked status
   */
  static async togglePostLike(postId) {
    try {
      const isLiked = await this.hasUserLikedPost(postId)
      
      if (isLiked) {
        await this.unlikePost(postId)
        return { liked: false }
      } else {
        await this.likePost(postId)
        return { liked: true }
      }
    } catch (error) {
      console.error('Error toggling post like:', error)
      throw error
    }
  }

  // =============================================
  // COMMENT OPERATIONS
  // =============================================

  /**
   * Get comments for a post
   * @param {string} postId - Post ID
   * @returns {Promise<Array>} Array of comments
   */
  static async getComments(postId) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Fetch user details for each comment
      const commentsWithAuthors = await Promise.all(
        data.map(async (comment) => {
          const userInfo = await this.getUserInfo(comment.user_id)
          return {
            ...comment,
            author: userInfo.name,
            authorAvatar: userInfo.avatar,
            authorInitials: userInfo.initials,
          }
        })
      )

      return commentsWithAuthors
    } catch (error) {
      console.error('Error fetching comments:', error)
      throw error
    }
  }

  /**
   * Add a comment to a post
   * @param {string} postId - Post ID
   * @param {string} content - Comment content
   * @param {string} parentId - Parent comment ID (for replies)
   * @returns {Promise<Object>} Created comment
   */
  static async addComment(postId, content, parentId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated to comment')
      }

      const { data, error } = await supabase
        .from('post_comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content,
            parent_id: parentId,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Fetch user details
      const userInfo = await this.getUserInfo(data.user_id)
      
      return {
        ...data,
        author: userInfo.name,
        authorAvatar: userInfo.avatar,
        authorInitials: userInfo.initials,
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  }

  /**
   * Delete a comment (soft delete)
   * @param {string} commentId - Comment ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteComment(commentId) {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', commentId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  }

  /**
   * Check if current user has liked a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} Like status object
   */
  static async checkCommentLikeStatus(commentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { liked: false }
      }

      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      return { liked: !!data }
    } catch (error) {
      console.error('Error checking comment like status:', error)
      return { liked: false }
    }
  }

  /**
   * Toggle like status for a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} Result object with liked status
   */
  static async toggleCommentLike(commentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated to like comments')
      }

      // Check current like status
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id)

        if (error) throw error
        return { liked: false }
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert([
            {
              comment_id: commentId,
              user_id: user.id,
            },
          ])

        if (error) throw error
        return { liked: true }
      }
    } catch (error) {
      console.error('Error toggling comment like:', error)
      throw error
    }
  }

  // =============================================
  // VIEW OPERATIONS
  // =============================================

  /**
   * Track a post view
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} Success status
   */
  static async trackView(postId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('post_views')
        .insert([
          {
            post_id: postId,
            user_id: user?.id || null,
          },
        ])

      if (error && error.code !== '23505') {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error tracking view:', error)
      return false
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  /**
   * Get initials from a name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  static getInitials(name) {
    if (!name || name === 'Anonymous User') return 'AU'
    
    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  /**
   * Format time ago (alias for backward compatibility)
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted time ago string
   */
  static getTimeAgo(dateString) {
    return this.formatTimeAgo(dateString)
  }

  /**
   * Format time ago
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted time ago string
   */
  static formatTimeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    }

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit)
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`
      }
    }

    return 'Just now'
  }

  /**
   * Get popular tags
   * @param {number} limit - Number of tags to return
   * @returns {Promise<Array>} Array of popular tags
   */
  static async getPopularTags(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('tags')
        .eq('status', 'active')
        .not('tags', 'is', null)

      if (error) throw error

      // Flatten and count tags
      const tagCounts = {}
      data.forEach(post => {
        if (post.tags) {
          post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      })

      // Sort by count and return top tags
      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag)
    } catch (error) {
      console.error('Error fetching popular tags:', error)
      return []
    }
  }

  /**
   * Get real-time count of likes for a post
   * @param {string} postId - Post ID
   * @returns {Promise<number>} Number of likes
   */
  static async getPostLikesCount(postId) {
    try {
      const { count, error } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching likes count:', error)
      return 0
    }
  }

  /**
   * Get real-time count of comments for a post
   * @param {string} postId - Post ID
   * @returns {Promise<number>} Number of comments
   */
  static async getPostCommentsCount(postId) {
    try {
      const { count, error } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .is('deleted_at', null)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching comments count:', error)
      return 0
    }
  }

  /**
   * Get real-time count of views for a post
   * @param {string} postId - Post ID
   * @returns {Promise<number>} Number of views
   */
  static async getPostViewsCount(postId) {
    try {
      const { count, error } = await supabase
        .from('post_views')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching views count:', error)
      return 0
    }
  }
}

export default CommunityService
