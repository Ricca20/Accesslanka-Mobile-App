/**
 * Backend Services Index
 * Central export point for all backend services
 */

// Services
export { AuthService } from './services/AuthService'
export { UserService } from './services/UserService'
export { BusinessService } from './services/BusinessService'
export { PlaceService } from './services/PlaceService'
export { ReviewService } from './services/ReviewService'
export { StorageService } from './services/StorageService'
export { CommunityService } from './services/CommunityService'
export { ChatbotService } from './services/ChatbotService'
export { DatabasePlacesService } from './services/DatabasePlacesService'
export { default as MapMissionService } from './services/MapMissionService'
export { default as AccessibilityContributionService } from './services/AccessibilityContributionService'

// Constants
export { ERROR_CODES, ERROR_MESSAGES } from './constants/errorCodes'
export { BADGE_TIERS, DEFAULT_BADGE } from './constants/badgeConfig'

// Utils
export { calculateMapMissionBadge } from './utils/badgeCalculator'
export { databaseEvents, EVENT_NAMES } from './utils/eventEmitter'

// Re-export for convenience
export * as Backend from './index'
