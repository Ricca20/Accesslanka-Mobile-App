import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { DatabaseService } from '../lib/database'

const AuthContext = createContext({})

export { AuthContext }

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  // Helper function to fetch and merge user profile
  const fetchAndMergeProfile = useCallback(async (authUser, retryCount = 0) => {
    if (!authUser) return authUser

    try {
      // Use ensureUserProfile to get or create profile
      const profile = await DatabaseService.ensureUserProfile(authUser.id, {
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name,
      })
      
      return {
        ...authUser,
        profile: profile || {},
        // Merge profile data at top level for easier access
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
        avatar_url: profile?.avatar_url || '',
        accessibility_needs: profile?.accessibility_needs || '',
        verified: profile?.verified || false,
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error)
      
      // Retry logic for transient errors
      if (retryCount < 2) {
        console.log(`Retrying profile fetch (attempt ${retryCount + 1})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return fetchAndMergeProfile(authUser, retryCount + 1)
      }
      
      // If all retries fail, return user with basic data from auth
      console.warn('Failed to fetch/create profile after retries, using auth data only')
      return {
        ...authUser,
        profile: {},
        full_name: authUser.user_metadata?.full_name || '',
        avatar_url: '',
        accessibility_needs: '',
        verified: false,
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const result = await DatabaseService.getCurrentUser()
        if (mounted && result?.session?.user) {
          // Fetch profile immediately for initial session
          const userWithProfile = await fetchAndMergeProfile(result.user)
          setUser(userWithProfile)
          setSession(result.session)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    let subscription = null
    try {
      const { data } = DatabaseService.supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
          if (mounted) {
            setSession(session)
            
            if (session?.user) {
              // Fetch profile for authenticated user
              const userWithProfile = await fetchAndMergeProfile(session.user)
              if (mounted) {
                setUser(userWithProfile)
              }
            } else {
              setUser(null)
            }
          }
        }
      )
      subscription = data.subscription
    } catch (error) {
      console.error('Error setting up auth listener:', error)
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [fetchAndMergeProfile])

  const signIn = async (email, password) => {
    const result = await DatabaseService.signIn(email, password)
    return result
  }

  const signUp = async (email, password, fullName) => {
    const result = await DatabaseService.signUp(email, password, fullName)
    return result
  }

  const signOut = async () => {
    await DatabaseService.signOut()
    setUser(null)
    setSession(null)
  }

  const resetPassword = async (email) => {
    const result = await DatabaseService.resetPassword(email)
    return result
  }

  const updatePassword = async (newPassword) => {
    const result = await DatabaseService.updatePassword(newPassword)
    return result
  }

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const updatedProfile = await DatabaseService.updateUserProfile(user.id, updates)
      // Merge updated profile with existing user data
      const refreshedUser = await fetchAndMergeProfile({ ...user, id: user.id })
      setUser(refreshedUser)
      return updatedProfile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const refreshUserProfile = async () => {
    if (!user) return
    
    try {
      const refreshedUser = await fetchAndMergeProfile({ ...user, id: user.id })
      setUser(refreshedUser)
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUserProfile,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
