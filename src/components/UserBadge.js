import React, { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'
import { DatabaseService } from '../lib/database'

export default function UserBadge({ 
  userId, 
  size = 'small',
  showTitle = false,
  style 
}) {
  const [badge, setBadge] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserBadge = async () => {
      try {
        if (!userId) {
          setLoading(false)
          return
        }

        const missionStats = await DatabaseService.getUserMapMissionStats(userId)
        setBadge(missionStats.missionStats.badge)
      } catch (error) {
        console.error('Error fetching user badge:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserBadge()
  }, [userId])

  // Don't show anything while loading or if no badge/no user
  if (loading || !badge || badge.tier === 'none' || !userId) {
    return null
  }

  const getBadgeGradient = (tier) => {
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
      case 'tiny':
        return { width: 20, height: 20, iconSize: 10, fontSize: 8 }
      case 'small':
        return { width: 24, height: 24, iconSize: 12, fontSize: 10 }
      case 'medium':
        return { width: 32, height: 32, iconSize: 16, fontSize: 12 }
      case 'large':
        return { width: 40, height: 40, iconSize: 20, fontSize: 14 }
      default:
        return { width: 24, height: 24, iconSize: 12, fontSize: 10 }
    }
  }

  const badgeSize = getBadgeSize()
  const gradientColors = getBadgeGradient(badge.tier)

  return (
    <View style={[styles.container, style]}>
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
      
      {showTitle && (
        <Text style={[styles.badgeTitle, { fontSize: badgeSize.fontSize }]}>
          {badge.title}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGradient: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeTitle: {
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 2,
  },
})