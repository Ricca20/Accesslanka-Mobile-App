import React, { createContext, useContext, useEffect, useState } from 'react'
import { DatabaseService } from '../lib/database'

const AuthContext = createContext({})

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

  useEffect(() => {
    let mounted = true
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const result = await DatabaseService.getCurrentUser()
        if (mounted && result) {
          setUser(result.user)
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
              setUser(session.user)
              // Optionally fetch user profile later
              try {
                const profile = await DatabaseService.getUserProfile(session.user.id)
                if (mounted) {
                  setUser(prev => ({ ...prev, profile }))
                }
              } catch (error) {
                console.error('Error fetching user profile:', error)
                // Continue without profile - user is still authenticated
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
  }, [])

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

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in')
    
    const updatedProfile = await DatabaseService.updateUserProfile(user.id, updates)
    setUser({ ...user, profile: updatedProfile })
    return updatedProfile
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
