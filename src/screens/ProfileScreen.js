import { View, StyleSheet, ScrollView, Alert, Image, Dimensions } from "react-native"
import { Text, Card, Button, Avatar, List, Divider, Surface } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import React from "react"
import { useFocusEffect } from "@react-navigation/native"
import { DatabaseService } from "../lib/database"
import AccessibilityService from "../services/AccessibilityService"
import MapMissionBadge from "../components/MapMissionBadge"

const { width } = Dimensions.get('window')

export default function ProfileScreen({ navigation }) {
  const { user, signOut, loading } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [userStats, setUserStats] = useState({
    reviewsCount: 0,
    favoritesCount: 0,
    helpfulVotes: 0,
    missionStats: {
      completedMissions: 0,
      activeMissions: 0,
      createdMissions: 0,
      totalContributions: 0,
      badge: { tier: 'none', title: 'New Explorer', color: '#2E7D32', progress: 0 }
    }
  })

  useEffect(() => {
    // Announce screen when loaded
    AccessibilityService.announce("Profile screen. View your profile and account settings.", 500)
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadUserProfile()
      loadUserStats()
      
      // Listen for contribution updates
      const handleContributionUpdate = (contributorUserId) => {
        if (contributorUserId === user.id) {
          loadUserStats() // Refresh stats immediately when this user makes a contribution
        }
      }
      
      // Listen for helpful vote updates (when someone marks this user's reviews as helpful)
      const handleHelpfulVoteUpdate = (reviewAuthorUserId) => {
        if (reviewAuthorUserId === user.id) {
          loadUserStats() // Refresh stats immediately when someone marks this user's review as helpful
        }
      }
      
      DatabaseService.addContributionUpdateListener(handleContributionUpdate)
      DatabaseService.addHelpfulVoteUpdateListener(handleHelpfulVoteUpdate)
      
      // Cleanup listeners on unmount
      return () => {
        DatabaseService.removeContributionUpdateListener(handleContributionUpdate)
        DatabaseService.removeHelpfulVoteUpdateListener(handleHelpfulVoteUpdate)
      }
    }
  }, [user])

  // Refresh stats when screen comes into focus (after user makes MapMission contributions)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadUserStats()
      }
    }, [user?.id])
  )

  const loadUserProfile = async () => {
    try {
      const profile = await DatabaseService.getUserProfile(user.id)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadUserStats = async () => {
    try {
      const stats = await DatabaseService.getUserStats(user.id)
      setUserStats(stats)
    } catch (error) {
      console.error('Error loading user stats:', error)
      // Keep default stats if error
    }
  }

  const handleSignOut = async () => {
    try {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: async () => {
              await signOut()
              // Navigation will be handled by the AppNavigator
            }
          }
        ]
      )
    } catch (error) {
      Alert.alert("Error", "Failed to sign out. Please try again.")
      console.error('Sign out error:', error)
    }
  }

  // Show loading or not authenticated state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>Please sign in to view your profile.</Text>
          <Button mode="contained" onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
            Sign In
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  // Get user data (from auth user and profile)
  const userData = {
    name: userProfile?.full_name || user.user_metadata?.full_name || user.email || "User",
    email: user.email || "No email",
    avatar: (userProfile?.full_name || user.email || "U").substring(0, 2).toUpperCase(),
    avatar_url: userProfile?.avatar_url || null,
    joinDate: userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently",
    reviewsCount: userStats.reviewsCount,
    favoritesCount: userStats.favoritesCount,
  }

  const menuItems = [
    {
      title: "My Reviews",
      description: `${userData.reviewsCount} reviews written`,
      icon: "star-outline",
      onPress: () => navigation.navigate("MyReviews"),
    },
    {
      title: "My Favorites",
      description: `${userData.favoritesCount} places saved`,
      icon: "heart-outline",
      onPress: () => navigation.navigate("MyFavorites"),
    },
    {
      title: "My Business",
      description: "Add or manage your business submissions",
      icon: "store-outline",
      onPress: () => navigation.navigate("MyBusinessSubmissions"),
    },
    {
      title: "Accessibility Preferences",
      description: "Customize your experience",
      icon: "wheelchair-accessibility",
      onPress: () => navigation.navigate("AccessibilityPreferences"),
    },
    {
      title: "Notifications",
      description: "Manage notification settings",
      icon: "bell-outline",
      onPress: () => navigation.navigate("Notifications"),
    },
    {
      title: "Settings",
      description: "Account and app settings",
      icon: "cog-outline",
      onPress: () => navigation.navigate("Settings"),
    },
  ]

  const renderBadge = (badge, index) => (
    <View key={index} style={styles.badgeItem}>
      <Icon name={badge.icon} size={24} color={badge.color} />
      <Text variant="bodySmall" style={styles.badgeText}>
        {badge.name}
      </Text>
    </View>
  )

  const renderStat = (label, value) => (
    <View style={styles.statItem}>
      <Text variant="headlineSmall" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="bodySmall" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  )

  const getMenuIconColor = (iconName) => {
    const colorMap = {
      'star-outline': '#FF9800',
      'heart-outline': '#E91E63',
      'store-outline': '#2196F3',
      'cog-outline': '#9C27B0',
      'bell-outline': '#FF5722',
      'settings-outline': '#607D8B'
    }
    return colorMap[iconName] || '#6B7280'
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient Background */}
      

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card with Floating Effect */}
        <Surface style={styles.profileSurface} elevation={4}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              {userData.avatar_url ? (
                <Image source={{ uri: userData.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Avatar.Text size={100} label={userData.avatar} style={styles.avatar} />
              )}
              <View style={styles.onlineIndicator} />
            </View>
            
            <View style={styles.userInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {userData.name}
              </Text>
              <Text variant="bodyLarge" style={styles.userEmail}>
                {userData.email}
              </Text>
              <View style={styles.membershipContainer}>
                <Icon name="calendar-clock" size={16} color="#6B7280" />
                <Text variant="bodySmall" style={styles.membershipText}>
                  Member since {userData.joinDate}
                </Text>
              </View>
            </View>

            <Button 
              mode="contained" 
              style={styles.editButton} 
              onPress={() => navigation.navigate("EditProfile")}
              contentStyle={styles.editButtonContent}
            >
              Edit Profile
            </Button>
          </View>
        </Surface>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Surface style={styles.statCard} elevation={2}>
            <Icon name="star" size={24} color="#FF9800" />
            <Text variant="titleLarge" style={styles.statNumber}>
              {userStats.reviewsCount}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Reviews
            </Text>
          </Surface>
          
          <Surface style={styles.statCard} elevation={2}>
            <Icon name="heart" size={24} color="#E91E63" />
            <Text variant="titleLarge" style={styles.statNumber}>
              {userStats.favoritesCount}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Favorites
            </Text>
          </Surface>
          
          <Surface style={styles.statCard} elevation={2}>
            <Icon name="thumb-up" size={24} color="#4CAF50" />
            <Text variant="titleLarge" style={styles.statNumber}>
              {userStats.helpfulVotes}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Helpful
            </Text>
          </Surface>
        </View>

        {/* MapMission Badge Section */}
        <Surface style={styles.badgeSection} elevation={3}>
          <View style={styles.badgeHeader}>
            <Icon name="medal" size={24} color="#4CAF50" />
            <Text variant="titleMedium" style={styles.badgeTitle}>
              Explorer Achievement
            </Text>
          </View>
          
          <View style={styles.badgeContent}>
            <MapMissionBadge 
              badge={userStats.missionStats.badge}
              showProgress={true}
              size="large"
              progressColor="#4CAF50"
              badgeColors={{
                gold: '#FFD700',
                silver: '#C0C0C0',
                bronze: '#CD7F32'
              }}
            />
          </View>

          {/* Mission Activity Summary */}
          <View style={styles.activitySummary}>
            <Text variant="titleSmall" style={styles.activityTitle}>
              Mission Activity
            </Text>
            <View style={styles.activityGrid}>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#E8F5E8' }]}>
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                </View>
                <Text variant="labelMedium" style={styles.activityLabel}>Completed</Text>
                <Text variant="titleMedium" style={styles.activityValue}>
                  {userStats.missionStats.completedMissions}
                </Text>
              </View>
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Icon name="play-circle" size={20} color="#FF9800" />
                </View>
                <Text variant="labelMedium" style={styles.activityLabel}>Active</Text>
                <Text variant="titleMedium" style={styles.activityValue}>
                  {userStats.missionStats.activeMissions}
                </Text>
              </View>
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Icon name="plus-circle" size={20} color="#2196F3" />
                </View>
                <Text variant="labelMedium" style={styles.activityLabel}>Created</Text>
                <Text variant="titleMedium" style={styles.activityValue}>
                  {userStats.missionStats.createdMissions}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Menu Options */}
        <Surface style={styles.menuSection} elevation={2}>
          <Text variant="titleMedium" style={styles.menuTitle}>
            Quick Actions
          </Text>
          
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <Surface
                key={index}
                style={styles.menuItem}
                elevation={1}
              >
                <Button
                  mode="text"
                  onPress={() => {
                    item.onPress()
                    AccessibilityService.announce(`Opening ${item.title}`)
                  }}
                  style={styles.menuButton}
                  contentStyle={styles.menuButtonContent}
                >
                  <View style={styles.menuItemContent}>
                    <View style={[styles.menuIconContainer, { backgroundColor: getMenuIconColor(item.icon) }]}>
                      <Icon name={item.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text variant="titleSmall" style={styles.menuItemTitle}>
                        {item.title}
                      </Text>
                      <Text variant="bodySmall" style={styles.menuItemDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9CA3AF" />
                  </View>
                </Button>
              </Surface>
            ))}
          </View>
        </Surface>

        {/* Sign Out Section */}
        <View style={styles.signOutSection}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={handleSignOut}
            style={styles.signOutButton}
            contentStyle={styles.signOutButtonContent}
            buttonColor="#D32F2F"
            textColor="#FFEBEE"
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  
  // Header Styles
  headerGradient: {
    paddingBottom: 40,
  },
  headerSafeArea: {
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  settingsButton: {
    borderRadius: 20,
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
    marginTop: -30,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Profile Section
  profileSurface: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    marginTop:  60,
  },
  profileContent: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatar: {
    backgroundColor: '#2E7D32',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    color: "#1F2937",
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    color: "#6B7280",
    marginBottom: 8,
    textAlign: 'center',
  },
  membershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membershipText: {
    color: "#6B7280",
  },
  editButton: {
    borderRadius: 25,
    backgroundColor: '#2E7D32',
    minWidth: 140,
  },
  editButtonContent: {
    paddingVertical: 4,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    cols: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Badge Section
  badgeSection: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  badgeTitle: {
    color: '#1f3725ff',
    fontWeight: 'bold',
  },
  badgeContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  // Activity Summary
  activitySummary: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  activityTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    alignItems: 'center',
    gap: 6,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  activityValue: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  
  // Menu Section
  menuSection: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
  },
  menuTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuGrid: {
    gap: 8,
  },
  menuItem: {
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  menuButton: {
    margin: 0,
    borderRadius: 12,
  },
  menuButtonContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemDescription: {
    color: '#6B7280',
    lineHeight: 16,
  },
  
  // Sign Out
  signOutSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  signOutButton: {
    borderRadius: 12,
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  signOutButtonContent: {
    paddingVertical: 8,
  },
  
  // Legacy styles for compatibility
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
})
