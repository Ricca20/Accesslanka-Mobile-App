import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Alert, RefreshControl } from "react-native"
import { Text, Card, Button, Chip, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { DatabaseService } from "../../lib/database"
import { useAuth } from "../../context/AuthContext"

export default function MapMissionScreen({ navigation }) {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [businesses, setBusinesses] = useState([])
  const [businessMissions, setBusinessMissions] = useState({}) // Store mission data for each business
  const [userParticipation, setUserParticipation] = useState({}) // Store user participation status
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [joiningMissions, setJoiningMissions] = useState(new Set()) // Track which missions are being joined

  const categoryFilters = [
    { key: "all", label: "All", icon: "view-grid" },
    { key: "restaurants", label: "Restaurants", icon: "silverware-fork-knife" },
    { key: "hotels", label: "Hotels", icon: "bed" },
    { key: "museums", label: "Museums", icon: "bank" },
    { key: "shopping", label: "Shopping", icon: "shopping" },
    { key: "transport", label: "Transport", icon: "bus" },
  ]

  useEffect(() => {
    loadBusinesses()
  }, [])

  const loadBusinesses = async () => {
    try {
      setLoading(true)
      const businessData = await DatabaseService.getBusinesses()
      setBusinesses(businessData || [])
      
      // Load mission data for each business
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
          const mission = await DatabaseService.getActiveMissionForBusiness(business.id)
          return { businessId: business.id, mission }
        } catch (error) {
          console.error(`Error loading mission for business ${business.id}:`, error)
          return { businessId: business.id, mission: null }
        }
      })

      const missionResults = await Promise.all(missionPromises)
      const missionsMap = {}
      const participationMap = {}

      for (const { businessId, mission } of missionResults) {
        missionsMap[businessId] = mission
        
        // Check user participation if mission exists and user is logged in
        if (mission && user) {
          try {
            const isParticipant = await DatabaseService.isUserInMission(mission.id, user.id)
            participationMap[mission.id] = isParticipant
          } catch (error) {
            console.error(`Error checking participation for mission ${mission.id}:`, error)
            participationMap[mission.id] = false
          }
        }
      }

      setBusinessMissions(missionsMap)
      setUserParticipation(participationMap)
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

    // Check if mission is full
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
      
      // Update local state
      setUserParticipation(prev => ({
        ...prev,
        [mission.id]: true
      }))

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

  const handleCreateMapMission = (business) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to create a MapMission.')
      return
    }
    
    // Navigate to Create MapMission screen
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
      restaurants: "#FF5722",
      hotels: "#2196F3",
      museums: "#9C27B0",
      parks: "#4CAF50",
      shopping: "#FF9800",
      transport: "#607D8B",
      healthcare: "#F44336",
      education: "#3F51B5",
      entertainment: "#E91E63",
      government: "#795548",
    }
    return colorMap[category] || "#666"
  }

  const renderBusiness = ({ item }) => {
    const mission = businessMissions[item.id]
    const isUserInMission = mission ? userParticipation[mission.id] : false
    const isJoining = mission ? joiningMissions.has(mission.id) : false

    const renderMissionButton = () => {
      if (!mission) {
        // No active mission - show create button
        return (
          <Button 
            mode="contained" 
            style={styles.createMissionButton}
            icon="plus-circle"
            onPress={() => handleCreateMapMission(item)}
          >
            Create MapMission
          </Button>
        )
      }

      if (isUserInMission) {
        // User already joined - show status
        return (
          <Button 
            mode="contained" 
            style={[styles.joinedMissionButton, { backgroundColor: '#4CAF50' }]}
            icon="check-circle"
            disabled
          >
            Mission Joined
          </Button>
        )
      }

      // Active mission exists, user not joined - show join button
      return (
        <Button 
          mode="contained" 
          style={styles.joinMissionButton}
          icon="account-plus"
          onPress={() => handleJoinMapMission(mission)}
          loading={isJoining}
          disabled={isJoining}
        >
          {isJoining ? 'Joining...' : 'Join MapMission'}
        </Button>
      )
    }

    return (
      <Card style={styles.businessCard}>
        <Card.Content>
          <View style={styles.businessHeader}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.businessTitle}>
                {item.name}
              </Text>
              <Chip
                icon={getCategoryIcon(item.category)}
                style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) + "20" }]}
                textStyle={{ color: getCategoryColor(item.category) }}
              >
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Chip>
            </View>
          </View>

          {/* Mission Status Info */}
          {mission && (
            <View style={styles.missionInfo}>
              <View style={styles.missionHeader}>
                <Icon name="target" size={16} color="#2E7D32" />
                <Text variant="bodyMedium" style={styles.missionTitle}>
                  {mission.title}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.missionDescription}>
                {mission.description}
              </Text>
              <View style={styles.missionDetails}>
                <Chip 
                  icon="account-group" 
                  style={styles.participantChip}
                  textStyle={{ fontSize: 12 }}
                >
                  Max {mission.max_participants} participants
                </Chip>
                <Chip 
                  icon="star" 
                  style={styles.difficultyChip}
                  textStyle={{ fontSize: 12 }}
                >
                  {mission.difficulty_level}
                </Chip>
              </View>
            </View>
          )}

          {item.description && (
            <Text variant="bodyMedium" style={styles.description}>
              {item.description}
            </Text>
          )}

          <View style={styles.businessDetails}>
            <View style={styles.detailItem}>
              <Icon name="map-marker" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.detailText}>
                {item.address}
              </Text>
            </View>
            
            {item.phone && (
              <View style={styles.detailItem}>
                <Icon name="phone" size={16} color="#666" />
                <Text variant="bodySmall" style={styles.detailText}>
                  {item.phone}
                </Text>
              </View>
            )}

            {item.accessibility_features && item.accessibility_features.length > 0 && (
              <View style={styles.detailItem}>
                <Icon name="wheelchair-accessibility" size={16} color="#2E7D32" />
                <Text variant="bodySmall" style={styles.accessibilityText}>
                  {item.accessibility_features.length} accessibility features
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionContainer}>
            {renderMissionButton()}
            
            <Button 
              mode="outlined" 
              style={styles.viewDetailsButton}
              icon="eye"
              onPress={() => navigation.navigate('PlaceDetails', { place: item })}
            >
              View Details
            </Button>
          </View>
        </Card.Content>
      </Card>
    )
  }

  const filteredBusinesses = selectedCategory === "all" 
    ? businesses 
    : businesses.filter((business) => business.category === selectedCategory)

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          MapMission
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Create collaborative accessibility mapping missions
        </Text>

        <View style={styles.filterContainer}>
          {categoryFilters.map((filter) => (
            <Chip
              key={filter.key}
              selected={selectedCategory === filter.key}
              onPress={() => setSelectedCategory(filter.key)}
              style={styles.filterChip}
              icon={filter.icon}
              accessibilityLabel={`Filter by ${filter.label} businesses`}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredBusinesses}
        renderItem={renderBusiness}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="store-search" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No businesses found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {selectedCategory === "all" 
                ? "No businesses are available for MapMissions yet."
                : `No ${selectedCategory} businesses found.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  title: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  businessCard: {
    marginBottom: 16,
    elevation: 2,
  },
  businessHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
  businessTitle: {
    flex: 1,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  categoryChip: {
    alignSelf: "flex-start",
  },
  missionInfo: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  missionTitle: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#2E7D32',
    flex: 1,
  },
  missionDescription: {
    color: '#4A4A4A',
    marginBottom: 8,
    lineHeight: 16,
  },
  missionDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  participantChip: {
    backgroundColor: '#C8E6C9',
    height: 28,
  },
  difficultyChip: {
    backgroundColor: '#FFF3E0',
    height: 28,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
    color: "#666",
  },
  businessDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    color: "#666",
    flex: 1,
  },
  accessibilityText: {
    color: "#2E7D32",
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  createMissionButton: {
    flex: 1,
    minWidth: 140,
  },
  joinMissionButton: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#2E7D32',
  },
  joinedMissionButton: {
    flex: 1,
    minWidth: 140,
  },
  viewDetailsButton: {
    flex: 1,
    minWidth: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
})
