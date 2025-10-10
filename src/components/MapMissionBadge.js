import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, ProgressBar } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'

export default function MapMissionBadge({ 
  badge, 
  showProgress = false, 
  showDescription = false, 
  size = 'medium',
  style,
  progressColor,
  badgeColors
}) {
  if (!badge) return null

  const getBadgeGradient = (tier) => {
    // Use custom badge colors if provided
    if (badgeColors) {
      switch (tier) {
        case 'gold':
          return [badgeColors.gold, '#D97706', '#B45309']
        case 'silver':
          return [badgeColors.silver, '#9CA3AF', '#6B7280']
        case 'bronze':
          return [badgeColors.bronze, '#EA580C', '#C2410C']
        default:
          return ['#F3F4F6', '#E5E7EB', '#D1D5DB']
      }
    }
    
    // Default badge colors
    switch (tier) {
      case 'gold':
        return ['#F59E0B', '#D97706', '#B45309']
      case 'silver':
        return ['#E5E7EB', '#9CA3AF', '#6B7280']
      case 'bronze':
        return ['#F97316', '#EA580C', '#C2410C']
      default:
        return ['#F3F4F6', '#E5E7EB', '#D1D5DB']
    }
  }

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, iconSize: 16, fontSize: 10 }
      case 'large':
        return { width: 60, height: 60, iconSize: 28, fontSize: 14 }
      default:
        return { width: 44, height: 44, iconSize: 20, fontSize: 12 }
    }
  }

  const badgeSize = getBadgeSize()
  const gradientColors = getBadgeGradient(badge.tier)

  return (
    <View style={[styles.container, style]}>
      {/* Badge Icon */}
      <View style={styles.badgeContainer}>
        <LinearGradient
          colors={gradientColors}
          style={[styles.badgeGradient, { 
            width: badgeSize.width, 
            height: badgeSize.height 
          }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon 
            name={badge.icon || 'medal'} 
            size={badgeSize.iconSize} 
            color="white" 
          />
        </LinearGradient>
        
        {/* Badge Title */}
        <Text style={[styles.badgeTitle, { fontSize: badgeSize.fontSize }]}>
          {badge.title}
        </Text>
      </View>

      {/* Badge Description */}
      {showDescription && (
        <Text style={styles.description}>
          {badge.description}
        </Text>
      )}

      {/* Progress Section */}
      {showProgress && badge.nextTier && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Progress to {badge.nextTier.charAt(0).toUpperCase() + badge.nextTier.slice(1)}
            </Text>
            <Text style={styles.progressCount}>
              {badge.contributionsToNext} contributions to go
            </Text>
          </View>
          
          <ProgressBar 
            progress={badge.progress / 100} 
            color={progressColor || badge.color}
            style={styles.progressBar}
          />
          
          <Text style={styles.progressText}>
            {Math.round(badge.progress)}% Complete
          </Text>
        </View>
      )}

      {/* Max Level Indicator */}
      {showProgress && badge.tier === 'gold' && (
        <View style={styles.maxLevelContainer}>
          <Icon name="crown" size={16} color="#F59E0B" />
          <Text style={styles.maxLevelText}>
            Maximum level achieved!
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeGradient: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginBottom: 4,
  },
  badgeTitle: {
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 200,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  progressCount: {
    fontSize: 10,
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  maxLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  maxLevelText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
})