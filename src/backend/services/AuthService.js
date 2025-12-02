/**
 * Authentication Service
 * Handles all authentication-related operations
 */

import { supabase } from '../../config/supabase'
import { ERROR_MESSAGES } from '../constants/errorCodes'
import { UserService } from './UserService'

export class AuthService {
  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} fullName - User's full name
   * @param {string} accessibilityNeeds - User's accessibility needs
   * @returns {Promise<Object>} Signup result
   */
  static async signUp(email, password, fullName, accessibilityNeeds = '') {
    try {
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
        
        if (error.message.includes(ERROR_MESSAGES.USER_ALREADY_REGISTERED)) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single()

          if (existingUser) {
            throw new Error('This email is already registered. Please sign in instead.')
          }
          throw new Error('Email already registered but profile creation pending. Please try signing in.')
        }
        throw error
      }

      if (!data.user) {
        throw new Error('Signup failed. Please try again.')
      }

      console.log('User created successfully:', data.user.email)

      if (data.user) {
        try {
          await UserService.ensureUserProfile(data.user.id, {
            email: data.user.email,
            full_name: fullName,
            accessibility_needs: accessibilityNeeds,
          })
        } catch (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      }

      return data
    } catch (error) {
      console.error('SignUp error:', error)
      throw error
    }
  }

  /**
   * Sign in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Signin result
   */
  static async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  /**
   * Reset user password
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset result
   */
  static async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'accesslanka://reset-password',
    })

    if (error) throw error
    return data
  }

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Update result
   */
  static async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return data
  }

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User and session
   */
  static async getCurrentUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return { user: null, session: null }
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

  /**
   * Get current session
   * @returns {Promise<Object|null>} Current session
   */
  static async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}

export default AuthService
