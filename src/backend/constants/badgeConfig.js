/**
 * Badge Configuration
 * Defines badge tiers and contribution thresholds for MapMission badges
 */

export const BADGE_TIERS = {
  GOLD: {
    threshold: 50,
    tier: 'gold',
    title: 'Gold Explorer',
    color: '#F59E0B',
    icon: 'medal',
    description: 'Legendary MapMission Explorer!',
  },
  SILVER: {
    threshold: 25,
    tier: 'silver',
    title: 'Silver Explorer',
    color: '#6B7280',
    icon: 'medal-outline',
    description: 'Experienced MapMission Explorer',
  },
  BRONZE: {
    threshold: 10,
    tier: 'bronze',
    title: 'Bronze Explorer',
    color: '#D97706',
    icon: 'star-circle',
    description: 'Rising MapMission Explorer',
  },
  NONE: {
    threshold: 0,
    tier: 'none',
    title: 'New Explorer',
    color: '#9CA3AF',
    icon: 'map-marker-outline',
    description: 'Ready to start your MapMission journey!',
  },
}

export const DEFAULT_BADGE = {
  tier: 'none',
  title: 'New Explorer',
  color: '#9CA3AF',
  progress: 0,
}
