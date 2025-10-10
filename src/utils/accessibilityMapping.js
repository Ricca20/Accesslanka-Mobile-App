/**
 * Utility functions for mapping between business accessibility features 
 * and standardized accessibility categories
 */

// Map business-specific features to accessibility categories
export const FEATURE_TO_CATEGORY_MAP = {
  // Mobility-related features
  'wheelchair_accessible': 'mobility',
  'wheelchair_access': 'mobility',
  'elevator_access': 'mobility',
  'ramp_access': 'mobility',
  'accessible_parking': 'mobility',
  'wide_aisles': 'mobility',
  'accessible_entrance': 'mobility',
  'accessible_restrooms': 'mobility',
  
  // Visual-related features
  'braille_signs': 'visual',
  'large_print': 'visual',
  'high_contrast': 'visual',
  'tactile_indicators': 'visual',
  'guide_dog_friendly': 'visual',
  
  // Hearing-related features
  'hearing_loop': 'hearing',
  'sign_language': 'hearing',
  'visual_alerts': 'hearing',
  'quiet_spaces': 'hearing',
  
  // Cognitive-related features
  'audio_guides': 'cognitive',
  'clear_signage': 'cognitive',
  'quiet_environment': 'cognitive',
  'simple_navigation': 'cognitive',
}

// Reverse mapping: category to common features
export const CATEGORY_TO_FEATURES_MAP = {
  mobility: ['wheelchair_accessible', 'elevator_access', 'ramp_access', 'accessible_parking', 'wide_aisles', 'accessible_restrooms'],
  visual: ['braille_signs', 'large_print', 'high_contrast', 'tactile_indicators', 'guide_dog_friendly'],
  hearing: ['hearing_loop', 'sign_language', 'visual_alerts', 'quiet_spaces'],
  cognitive: ['audio_guides', 'clear_signage', 'quiet_environment', 'simple_navigation'],
}

// Category display information
export const CATEGORY_INFO = {
  mobility: {
    key: 'mobility',
    label: 'Mobility',
    icon: 'wheelchair-accessibility',
  },
  visual: {
    key: 'visual',
    label: 'Visual',
    icon: 'eye',
  },
  hearing: {
    key: 'hearing',
    label: 'Hearing',
    icon: 'ear-hearing',
  },
  cognitive: {
    key: 'cognitive',
    label: 'Cognitive',
    icon: 'brain',
  },
}

/**
 * Convert business feature ratings to standardized category ratings
 * Takes ratings keyed by feature names and returns ratings keyed by categories
 * Uses the highest rating among features in each category
 */
export function featureRatingsToCategoryRatings(featureRatings) {
  if (!featureRatings || typeof featureRatings !== 'object') {
    return { mobility: 0, visual: 0, hearing: 0, cognitive: 0 }
  }

  const categoryRatings = {
    mobility: 0,
    visual: 0,
    hearing: 0,
    cognitive: 0,
  }

  // Check each feature rating
  Object.entries(featureRatings).forEach(([featureKey, rating]) => {
    const category = FEATURE_TO_CATEGORY_MAP[featureKey]
    if (category && rating > 0) {
      // Use the highest rating among features in the same category
      categoryRatings[category] = Math.max(categoryRatings[category], rating)
    } else if (['mobility', 'visual', 'hearing', 'cognitive'].includes(featureKey)) {
      // Already a category key, use it directly
      categoryRatings[featureKey] = rating
    }
  })

  return categoryRatings
}

/**
 * Check if a review's accessibility ratings match a given category filter
 * Handles both feature-based and category-based rating structures
 */
export function reviewMatchesCategory(accessibilityRatings, categoryFilter) {
  if (!accessibilityRatings || typeof accessibilityRatings !== 'object') {
    return false
  }

  // If filtering by 'all', always match
  if (categoryFilter === 'all') {
    return true
  }

  // Check if rating has the category directly
  if (categoryFilter in accessibilityRatings && accessibilityRatings[categoryFilter] > 0) {
    return true
  }

  // Check if rating has any features that map to this category
  const categoryFeatures = CATEGORY_TO_FEATURES_MAP[categoryFilter] || []
  const hasMatchingFeature = categoryFeatures.some(
    feature => feature in accessibilityRatings && accessibilityRatings[feature] > 0
  )

  return hasMatchingFeature
}

/**
 * Get feature icon for display
 */
export function getFeatureIcon(featureKey) {
  const iconMap = {
    'wheelchair_accessible': 'wheelchair-accessibility',
    'accessible_restrooms': 'toilet',
    'elevator_access': 'elevator',
    'braille_signs': 'braille',
    'hearing_loop': 'ear-hearing',
    'accessible_parking': 'car',
    'wide_aisles': 'resize',
    'ramp_access': 'stairs-up',
    'audio_guides': 'headphones',
    'large_print': 'format-size',
    'high_contrast': 'contrast-circle',
    'sign_language': 'sign-language',
    'guide_dog_friendly': 'dog',
    'visual_alerts': 'bell-ring',
    'clear_signage': 'sign-direction',
    // Legacy category icons
    'mobility': 'wheelchair-accessibility',
    'visual': 'eye',
    'hearing': 'ear-hearing',
    'cognitive': 'brain',
  }
  
  return iconMap[featureKey] || 'check-circle'
}

/**
 * Format feature key to display label
 */
export function formatFeatureLabel(featureKey) {
  return featureKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}
