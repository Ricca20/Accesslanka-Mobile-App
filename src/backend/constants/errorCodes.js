/**
 * Error Codes Constants
 * Centralized error codes used across the application
 */

export const ERROR_CODES = {
  // Supabase error codes
  NOT_FOUND: 'PGRST116',
  DUPLICATE_KEY: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  
  // Custom error codes
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
}

export const ERROR_MESSAGES = {
  USER_ALREADY_REGISTERED: 'User already registered',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  PROFILE_NOT_FOUND: 'Profile not found',
  MISSION_NOT_FOUND: 'Mission not found',
  BUSINESS_NOT_FOUND: 'Business not found',
  PLACE_NOT_FOUND: 'Place not found',
  REVIEW_NOT_FOUND: 'Review not found',
  UNAUTHORIZED_ACTION: 'Unauthorized action',
  MISSION_NOT_READY: 'Mission not ready to start',
  ALREADY_PARTICIPATING: 'Already participating in mission',
}
