import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, FlatList, Alert, RefreshControl, Animated, Dimensions, ScrollView, TouchableOpacity } from "react-native"
import { Text, Card, Button, Chip, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { LinearGradient } from 'expo-linear-gradient'
import { DatabaseService } from "../../lib/database"
import { useAuth } from "../../context/AuthContext"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function MapMissionScreen({ navigation }) {
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [businesses, setBusinesses] = useState([])
  const [businessMissions, setBusinessMissions] = useState({})
  const [userParticipation, setUserParticipation] = useState({})
  const [missionStats, setMissionStats] = useState({})
  const [missionReadiness, setMissionReadiness] = useState({})
  const [readyToLaunchMissions, setReadyToLaunchMissions] = useState([])
  const [ongoingMissions, setOngoingMissions] = useState([])
  const [completedMissions, setCompletedMissions] = useState([])
  const [missionContributions, setMissionContributions] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [joiningMissions, setJoiningMissions] = useState(new Set())
  const [startingMissions, setStartingMissions] = useState(new Set())
  const [endingMissions, setEndingMissions] = useState(new Set())

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const statusFilters = [
    { key: "all", label: "All", icon: "view-grid", color: "#6366F1" },
    { key: "upcoming", label: "Upcoming", icon: "clock-outline", color: "#F59E0B" },
    { key: "active", label: "Active", icon: "play-circle", color: "#10B981" },
    { key: "completed", label: "Completed", icon: "check-circle", color: "#22C55E" },
  ]

  useEffect(() => {
    loadBusinesses()
    startAnimations()
  }, [])

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start()
  }

  const loadBusinesses = async () => {
    try {
      setLoading(true)
      const businessData = await DatabaseService.getBusinesses()
      setBusinesses(businessData || [])
      await loadMissionData(businessData || [])
    } catch (error) {
      console.error('Error loading businesses:', error)
      Alert.alert('Error', 'Failed to load businesses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadMissionData = async (businessList) => {
    if (!businessList.length) return

    try {
      const missionPromises = businessList.map(async (business) => {
        try {
          const mission = await DatabaseService.getLatestMissionForBusiness(business.id)
          return { businessId: business.id, mission }
        } catch (error) {
          console.error(`Error loading mission for business ${business.id}:`, error)
          return { businessId: business.id, mission: null }
        }
      })

      const missionResults = await Promise.all(missionPromises)
      const missionsMap = {}
      const participationMap = {}
      const statsMap = {}
      const readinessMap = {}

      for (const { businessId, mission } of missionResults) {
        missionsMap[businessId] = mission
        
        if (mission) {
          try {
            const stats = await DatabaseService.getMissionStats(mission.id)
            statsMap[mission.id] = stats
          } catch (error) {
            console.error(`Error loading stats for mission ${mission.id}:`, error)
            statsMap[mission.id] = { totalParticipants: 0, activeParticipants: 0, completedParticipants: 0, averageProgress: 0 }
          }

          try {
            const readiness = await DatabaseService.isMissionReadyToStart(mission.id)
            readinessMap[mission.id] = readiness
          } catch (error) {
            console.error(`Error checking readiness for mission ${mission.id}:`, error)
            readinessMap[mission.id] = { ready: false, reason: 'Error checking status' }
          }

          if (user) {
            try {
              const isParticipant = await DatabaseService.isUserInMission(mission.id, user.id)
              participationMap[mission.id] = isParticipant
            } catch (error) {
              console.error(`Error checking participation for mission ${mission.id}:`, error)
              participationMap[mission.id] = false
            }
          }
        }
      }

      setBusinessMissions(missionsMap)
      setUserParticipation(participationMap)
      setMissionStats(statsMap)
      setMissionReadiness(readinessMap)

      if (user) {
        const readyMissions = Object.values(missionsMap)
          .filter(mission => 
            mission && 
            mission.status === 'upcoming'
          )
          .map(mission => ({
            ...mission,
            business: businessList.find(b => b.id === mission.business_id),
            stats: statsMap[mission.id],
            readiness: readinessMap[mission.id]
          }))
        
        setReadyToLaunchMissions(readyMissions)

        const userOngoingMissions = Object.values(missionsMap)
          .filter(mission => 
            mission && 
            mission.status === 'active' &&
            participationMap[mission.id] === true
          )
          .map(mission => ({
            ...mission,
            business: businessList.find(b => b.id === mission.business_id),
            stats: statsMap[mission.id],
            isCreator: mission.created_by === user.id
          }))
        
        setOngoingMissions(userOngoingMissions)

        const userCompletedMissions = Object.values(missionsMap)
          .filter(mission => 
            mission && 
            mission.status === 'completed' &&
            (participationMap[mission.id] === true || mission.created_by === user.id)
          )
          .map(mission => ({
            ...mission,
            business: businessList.find(b => b.id === mission.business_id),
            stats: statsMap[mission.id],
            isCreator: mission.created_by === user.id
          }))
        
        setCompletedMissions(userCompletedMissions)

        if (userOngoingMissions.length > 0) {
          const contributionPromises = userOngoingMissions.map(async (mission) => {
            try {
              const contributions = await DatabaseService.getUserMissionContributions(mission.id, user.id)
              return { missionId: mission.id, contributions }
            } catch (error) {
              console.error(`Error loading contributions for mission ${mission.id}:`, error)
              return { 
                missionId: mission.id, 
                contributions: {
                  photos_count: 0,
                  reviews_count: 0,
                  ratings_count: 0,
                  total_contributions: 0,
                  last_contribution_at: null
                }
              }
            }
          })
          
          const contributionResults = await Promise.all(contributionPromises)
          const contributionsMap = {}
          contributionResults.forEach(({ missionId, contributions }) => {
            contributionsMap[missionId] = contributions
          })
          setMissionContributions(contributionsMap)
        }
      } else {
        setReadyToLaunchMissions([])
        setOngoingMissions([])
        setCompletedMissions([])
        setMissionContributions({})
      }
    } catch (error) {
      console.error('Error loading mission data:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadBusinesses()
    setRefreshing(false)
  }

  const handleJoinMapMission = async (mission) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to join a MapMission.')
      return
    }

    if (userParticipation[mission.id]) {
      Alert.alert('Already Joined', 'You are already participating in this MapMission.')
      return
    }

    try {
      const stats = await DatabaseService.getMissionStats(mission.id)
      if (stats.totalParticipants >= mission.max_participants) {
        Alert.alert('Mission Full', 'This MapMission has reached its maximum number of participants.')
        return
      }
    } catch (error) {
      console.error('Error checking mission capacity:', error)
    }

    setJoiningMissions(prev => new Set([...prev, mission.id]))

    try {
      await DatabaseService.joinMapMission(mission.id, user.id)
      await loadMissionData(businesses)

      Alert.alert(
        'Mission Joined!',
        `You have successfully joined the MapMission "${mission.title}". Help map accessibility features and earn rewards!`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      console.error('Error joining mission:', error)
      const errorMessage = error.message === 'User is already participating in this mission'
        ? 'You are already participating in this mission.'
        : 'Failed to join mission. Please try again.'
      Alert.alert('Error', errorMessage)
    } finally {
      setJoiningMissions(prev => {
        const newSet = new Set(prev)
        newSet.delete(mission.id)
        return newSet
      })
    }
  }

  const handleStartMapMission = async (mission) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to start a MapMission.')
      return
    }

    if (mission.created_by !== user.id) {
      Alert.alert('Permission Denied', 'Only the mission creator can start the mission.')
      return
    }

    const readiness = missionReadiness[mission.id]
    if (!readiness?.ready) {
      Alert.alert('Mission Not Ready', readiness?.reason || 'Mission is not ready to start.')
      return
    }

    Alert.alert(
      'Start MapMission',
      `Are you sure you want to start "${mission.title}"? Once started, no new participants can join.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Mission',
          style: 'default',
          onPress: async () => {
            setStartingMissions(prev => new Set([...prev, mission.id]))

            try {
              await DatabaseService.startMapMission(mission.id, user.id)
              await loadMissionData(businesses)

              Alert.alert(
                'Mission Started!',
                `MapMission "${mission.title}" has been started successfully. Participants can now begin mapping accessibility features!`,
                [{ text: 'OK' }]
              )
            } catch (error) {
              console.error('Error starting mission:', error)
              Alert.alert('Error', error.message || 'Failed to start mission. Please try again.')
            } finally {
              setStartingMissions(prev => {
                const newSet = new Set(prev)
                newSet.delete(mission.id)
                return newSet
              })
            }
          }
        }
      ]
    )
  }

  const handleEndMapMission = async (mission) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to end a MapMission.')
      return
    }

    if (mission.created_by !== user.id) {
      Alert.alert('Permission Denied', 'Only the mission creator can end the mission.')
      return
    }

    if (mission.status !== 'active') {
      Alert.alert('Invalid Status', 'Only active missions can be ended.')
      return
    }

    Alert.alert(
      'End MapMission',
      `Are you sure you want to end "${mission.title}"? This action cannot be undone and will mark the mission as completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Mission',
          style: 'destructive',
          onPress: async () => {
            setEndingMissions(prev => new Set([...prev, mission.id]))

            try {
              const result = await DatabaseService.endMapMission(mission.id, user.id)
              
              if (result.success) {
                await loadMissionData(businesses)
                Alert.alert(
                  'Mission Ended!',
                  `MapMission "${mission.title}" has been successfully completed. Thank you for contributing to accessibility mapping!`,
                  [{ text: 'OK' }]
                )
              } else {
                Alert.alert('Error', result.error || 'Failed to end MapMission')
              }
            } catch (error) {
              console.error('Error ending mission:', error)
              Alert.alert('Error', error.message || 'Failed to end mission. Please try again.')
            } finally {
              setEndingMissions(prev => {
                const newSet = new Set(prev)
                newSet.delete(mission.id)
                return newSet
              })
            }
          }
        }
      ]
    )
  }

  const handleCreateMapMission = (business) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to create a MapMission.')
      return
    }
    
    navigation.navigate('CreateMapMission', { business })
  }

  const getCategoryIcon = (category) => {
    const categoryMap = {
      restaurants: "silverware-fork-knife",
      hotels: "bed",
      museums: "bank",
      parks: "tree",
      shopping: "shopping",
      transport: "bus",
      healthcare: "hospital-box",
      education: "school",
      entertainment: "movie",
      government: "city",
    }
    return categoryMap[category] || "store"
  }

  const getCategoryColor = (category) => {
    const colorMap = {
      restaurants: "#EF4444",
      hotels: "#3B82F6",
      museums: "#8B5CF6",
      parks: "#10B981",
      shopping: "#F59E0B",
      transport: "#6366F1",
      healthcare: "#EC4899",
      education: "#06B6D4",
      entertainment: "#84CC16",
      government: "#78716C",
    }
    return colorMap[category] || "#6B7280"
  }

  const renderActiveMissions = () => {
    if (!user) return null

    // Prioritize active missions, then upcoming missions that have enough participants
    const priorityMissions = [
      ...ongoingMissions, // Active missions user is participating in
      ...readyToLaunchMissions.filter(m => {
        const stats = m.stats || { totalParticipants: 0 }
        const hasRequiredMembers = stats.totalParticipants >= m.max_participants
        const isCreator = m.created_by === user.id
        const isUpcoming = m.status === 'upcoming'
        
        // Debug logging
        if (isCreator && isUpcoming) {
          console.log(`Mission ${m.title}: participants=${stats.totalParticipants}, required=${m.max_participants}, hasRequired=${hasRequiredMembers}`)
        }
        
        return isCreator && isUpcoming && hasRequiredMembers
      }) // Creator's upcoming missions with enough participants (ready to start)
    ]

    if (!priorityMissions.length) return null

    return priorityMissions.map((mission) => {
      const contributions = missionContributions[mission.id] || {
        photos_count: 0,
        reviews_count: 0,
        ratings_count: 0,
        total_contributions: 0
      }

      return (
        <Animated.View 
          key={mission.id}
          style={[
            styles.activeMissionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={mission.status === 'completed' ? ['#10B981', '#059669'] : ['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeMissionGradient}
          >
            {/* Header */}
            <View style={styles.activeMissionHeader}>
              <View style={styles.missionTitleSection}>
                <Icon name="target" size={24} color="white" />
                <Text style={styles.activeMissionTitle}>
                  {ongoingMissions.length > 0 
                    ? 'Active Missions' 
                    : 'Ready to Launch'}
                </Text>
              </View>
              <View style={styles.missionCountBadge}>
                <Text style={styles.missionCountText}>
                  {ongoingMissions.length > 0 
                    ? `${ongoingMissions.length} mission${ongoingMissions.length > 1 ? 's' : ''} in progress`
                    : (() => {
                        const readyWithMembers = readyToLaunchMissions.filter(m => {
                          const stats = m.stats || { totalParticipants: 0 }
                          const hasRequiredMembers = stats.totalParticipants >= m.max_participants
                          const isCreator = m.created_by === user.id
                          const isUpcoming = m.status === 'upcoming'
                          return isCreator && isUpcoming && hasRequiredMembers
                        }).length
                        return `${readyWithMembers} mission${readyWithMembers !== 1 ? 's' : ''} ready to start`
                      })()}
                </Text>
              </View>
            </View>

            {/* Mission Details */}
            <View style={styles.missionDetails}>
              <View style={styles.businessHeader}>
                <Text style={styles.businessName}>{mission.business?.name || 'Business'}</Text>
                <View style={styles.badgeContainer}>
                  
                  <View style={
                    mission.status === 'upcoming' ? styles.upcomingBadge :
                    mission.status === 'completed' ? styles.completedBadge : 
                    styles.activeBadge
                  }>
                    <Icon 
                      name={
                        mission.status === 'upcoming' ? "clock-outline" :
                        mission.status === 'completed' ? "check-circle" : 
                        "play-circle"
                      } 
                      size={12} 
                      color="#FFFFFF"
                    />
                    <Text style={styles.badgeText}>
                      {mission.status === 'upcoming' ? 'Ready to Start' :
                       mission.status === 'completed' ? 'Completed' : 
                       'Active'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.participantInfo}>
                <Icon name="account-group" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.participantText}>
                  {mission.stats?.totalParticipants || 0}/{mission.max_participants} participants
                  {mission.stats?.totalParticipants >= mission.max_participants ? ' ✓' : ''}
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={() => navigation.navigate('AccessibilityContribution', { 
                  mission: mission,
                  business: mission.business
                })}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F0F0F0']}
                  style={styles.continueButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="map-marker" size={20} color="#10B981" />
                  <Text style={styles.continueButtonText}>Continue Mapping</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      )
    })
  }

  const renderMapMissionCard = ({ item, index }) => {
    const mission = businessMissions[item.id]
    const isUserInMission = mission ? userParticipation[mission.id] : false
    const isJoining = mission ? joiningMissions.has(mission.id) : false
    const stats = mission ? missionStats[mission.id] : null
    const isCreator = mission && user && mission.created_by === user.id

    const cardAnimation = {
      opacity: fadeAnim,
      transform: [
        { translateY: slideAnim }
      ]
    }

    const getButtonConfig = () => {
      if (!mission) {
        return {
          label: 'Create Mission',
          color: '#6366F1',
          icon: 'plus-circle',
          onPress: () => handleCreateMapMission(item),
          disabled: false
        }
      }

      if (mission.status === 'upcoming') {
        if (isCreator) {
          // Mission creator sees "Start Mission" button if mission has enough participants
          const hasEnoughParticipants = stats && stats.totalParticipants >= mission.max_participants
          
          // Debug logging
          console.log(`Button config for mission ${mission.title}: participants=${stats?.totalParticipants}, required=${mission.max_participants}, hasEnough=${hasEnoughParticipants}`)
          
          return {
            label: hasEnoughParticipants ? 'Start Mission' : 'Waiting for Participants',
            color: hasEnoughParticipants ? '#10B981' : '#6B7280',
            icon: hasEnoughParticipants ? 'play' : 'clock-outline',
            onPress: hasEnoughParticipants ? () => handleStartMapMission(mission) : null,
            disabled: !hasEnoughParticipants || startingMissions.has(mission.id)
          }
        } else if (isUserInMission) {
          // Participants see "Joined" status
          return {
            label: 'Joined',
            color: '#10B981',
            icon: 'check',
            onPress: null,
            disabled: true
          }
        } else {
          // Non-participants can join if there's space
          if (stats && stats.totalParticipants >= mission.max_participants) {
            return {
              label: 'Full',
              color: '#EF4444',
              icon: 'account-group',
              onPress: null,
              disabled: true
            }
          }
          return {
            label: 'Join',
            color: '#6366F1',
            icon: 'account-plus',
            onPress: () => handleJoinMapMission(mission),
            disabled: joiningMissions.has(mission.id)
          }
        }
      }

      if (mission.status === 'active') {
        if (isCreator) {
          // Mission creator sees "End Mission" button
          return {
            label: 'End Mission',
            color: '#EF4444',
            icon: 'stop-circle',
            onPress: () => handleEndMapMission(mission),
            disabled: endingMissions.has(mission.id)
          }
        } else if (isUserInMission) {
          // Participants see "Continue" button
          return {
            label: 'Continue',
            color: '#10B981',
            icon: 'play-circle',
            onPress: () => navigation.navigate('AccessibilityContribution', { 
              mission: mission,
              business: item
            }),
            disabled: false
          }
        } else {
          // Non-participants see "Started" (disabled)
          return {
            label: 'Started',
            color: '#6B7280',
            icon: 'lock',
            onPress: null,
            disabled: true
          }
        }
      }

      if (mission.status === 'completed') {
        return {
          label: 'Completed',
          color: '#6B7280',
          icon: 'check-circle',
          onPress: null,
          disabled: true
        }
      }

      // Fallback for unknown status
      return {
        label: 'Unknown',
        color: '#6B7280',
        icon: 'help-circle',
        onPress: null,
        disabled: true
      }
    }

    const buttonConfig = getButtonConfig()

    return (
      <Animated.View style={[styles.missionCardContainer, cardAnimation]}>
        <View style={styles.missionCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.cardGradient}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.businessInfo}>
                <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                  <Icon 
                    name={getCategoryIcon(item.category)} 
                    size={20} 
                    color={getCategoryColor(item.category)} 
                  />
                </View>
                <View style={styles.businessDetails}>
                  <Text style={styles.businessNameCard}>{item.name}</Text>
                  <Text style={styles.businessCategory}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: buttonConfig.color }]}
                onPress={buttonConfig.onPress}
                disabled={buttonConfig.disabled}
              >
                <Icon name={buttonConfig.icon} size={16} color="white" />
                <Text style={styles.actionButtonText}>
                  {isJoining ? '...' : buttonConfig.label}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mission Info */}
            {mission && (
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDescription} numberOfLines={2}>
                  {mission.description}
                </Text>
                
                <View style={styles.missionStats}>
                  <View style={styles.statItem}>
                    <Icon name="account-group" size={14} color="#6B7280" />
                    <Text style={styles.statText}>
                      {stats?.totalParticipants || 0}/{mission.max_participants} participants
                    </Text>
                  </View>
                  {isCreator && (
                    <View style={[styles.statItem, styles.creatorItem]}>
                      <Icon name="crown" size={14} color="#F59E0B" />
                      <Text style={styles.creatorText}>Creator</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Business Details */}
            <View style={styles.businessCardDetails}>
              <View style={styles.detailRow}>
                <Icon name="map-marker" size={14} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
              </View>
              
              {item.accessibility_features && item.accessibility_features.length > 0 && (
                <View style={styles.detailRow}>
                  <Icon name="wheelchair-accessibility" size={14} color="#10B981" />
                  <Text style={styles.accessibilityText}>
                    {item.accessibility_features.length} accessibility features
                  </Text>
                </View>
              )}
            </View>

            {/* View Details Button */}
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('PlaceDetails', { place: item })}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Icon name="chevron-right" size={16} color="#6366F1" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    )
  }

  // Get all missions from different states with their statuses
  const allMissions = [
    ...readyToLaunchMissions.map(m => ({ ...m, displayStatus: 'upcoming' })),
    ...ongoingMissions.map(m => ({ ...m, displayStatus: 'active' })),
    ...completedMissions.map(m => ({ ...m, displayStatus: 'completed' }))
  ]

  // Create a missions map for easier lookup
  const missionsMap = {}
  allMissions.forEach(mission => {
    missionsMap[mission.business_id] = mission
  })

  // Filter businesses based on selected status
  const filteredBusinesses = selectedStatus === "all" 
    ? businesses 
    : businesses.filter((business) => {
        const mission = missionsMap[business.id]
        return mission && mission.displayStatus === selectedStatus
      })

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading Missions...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        {/* Active Missions Section - Top of Screen */}
        {renderActiveMissions()}

        {/* Map Missions Header */}
        <Animated.View 
          style={[
            styles.mapMissionsHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.mainTitle}>Map Missions</Text>
            <Text style={styles.subtitle}>Create collaborative accessibility mapping missions</Text>
          </View>

          {/* Status Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.categoryChip,
                  selectedStatus === filter.key && {
                    backgroundColor: filter.color,
                    borderColor: filter.color
                  }
                ]}
                onPress={() => setSelectedStatus(filter.key)}
              >
                <Icon 
                  name={filter.icon} 
                  size={16} 
                  color={selectedStatus === filter.key ? 'white' : filter.color} 
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedStatus === filter.key && { color: 'white' }
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Available Missions */}
        <View style={styles.missionsList}>
          {filteredBusinesses.map((item, index) => (
            <View key={item.id}>
              {renderMapMissionCard({ item, index })}
            </View>
          ))}
        </View>

        {filteredBusinesses.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="map-search" size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No missions found</Text>
            <Text style={styles.emptyText}>
              {selectedStatus === "all" 
                ? "No missions are available yet."
                : `No ${selectedStatus} missions found.`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  // Active Missions Styles
  activeMissionContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  activeMissionGradient: {
    padding: 20,
    borderRadius: 20,
  },
  activeMissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  missionTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeMissionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  missionCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  missionCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  missionDetails: {
    gap: 12,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  missionName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  progressSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  progressTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 12,
  },
  contributionIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contributionItem: {
    alignItems: 'center',
    gap: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    backgroundColor: '#10B981',
  },
  pendingIcon: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  contributionCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  continueButton: {
    marginTop: 8,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  continueButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  // Map Missions Header
  mapMissionsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Mission Cards
  missionsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  missionCardContainer: {
    marginBottom: 8,
  },
  missionCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessDetails: {
    flex: 1,
  },
  businessNameCard: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  businessCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  missionInfo: {
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  missionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  missionStats: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  creatorItem: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  creatorText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  businessCardDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  accessibilityText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 14,
  },
})