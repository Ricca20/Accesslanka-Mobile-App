/**
 * Badge Calculator Utility
 * Calculates user badge tier based on contributions
 */

import { BADGE_TIERS, DEFAULT_BADGE } from '../constants/badgeConfig'

/**
 * Calculate MapMission badge based on total contributions
 * @param {number} totalContributions - Total number of contributions
 * @returns {Object} Badge object with tier, title, color, progress, etc.
 */
export const calculateMapMissionBadge = (totalContributions) => {
  if (totalContributions >= BADGE_TIERS.GOLD.threshold) {
    return {
      ...BADGE_TIERS.GOLD,
      progress: 100,
      nextTier: null,
      contributionsToNext: 0,
    }
  }
  
  if (totalContributions >= BADGE_TIERS.SILVER.threshold) {
    const progress = Math.min(
      100,
      ((totalContributions - BADGE_TIERS.SILVER.threshold) / 
       (BADGE_TIERS.GOLD.threshold - BADGE_TIERS.SILVER.threshold)) * 100
    )
    return {
      ...BADGE_TIERS.SILVER,
      progress,
      nextTier: 'gold',
      contributionsToNext: BADGE_TIERS.GOLD.threshold - totalContributions,
    }
  }
  
  if (totalContributions >= BADGE_TIERS.BRONZE.threshold) {
    const progress = Math.min(
      100,
      ((totalContributions - BADGE_TIERS.BRONZE.threshold) / 
       (BADGE_TIERS.SILVER.threshold - BADGE_TIERS.BRONZE.threshold)) * 100
    )
    return {
      ...BADGE_TIERS.BRONZE,
      progress,
      nextTier: 'silver',
      contributionsToNext: BADGE_TIERS.SILVER.threshold - totalContributions,
    }
  }
  
  const progress = totalContributions >= 1 
    ? (totalContributions / BADGE_TIERS.BRONZE.threshold) * 100 
    : 0
    
  return {
    ...BADGE_TIERS.NONE,
    progress,
    nextTier: 'bronze',
    contributionsToNext: BADGE_TIERS.BRONZE.threshold - totalContributions,
  }
}
