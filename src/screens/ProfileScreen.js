import { View, StyleSheet, ScrollView, Alert, Image } from "react-native"
import { Text, Card, Button, Avatar, List, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { DatabaseService } from "../lib/database"
import AccessibilityService from "../services/AccessibilityService"

export default function ProfileScreen({ navigation }) {
  const { user, signOut, loading } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [userStats, setUserStats] = useState({
    reviewsCount: 0,
    favoritesCount: 0,
    helpfulVotes: 0,
  })

  useEffect(() => {
    // Announce screen when loaded
    AccessibilityService.announce("Profile screen. View your profile and account settings.", 500)
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadUserProfile()
      loadUserStats()
    }
  }, [user])

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

  const handleSyncBusinessVerification = async () => {
    try {
      Alert.alert(
        'Sync Business Status',
        'This will update business statuses based on their MapMission status (upcoming→pending, active/completed→verified). Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sync Now',
            onPress: async () => {
              try {
                const result = await DatabaseService.syncBusinessStatusWithMapMissions()
                Alert.alert(
                  'Sync Complete',
                  result.message,
                  [{ text: 'OK' }]
                )
              } catch (error) {
                console.error('Sync error:', error)
                Alert.alert(
                  'Sync Failed',
                  'Failed to sync business status with MapMissions. Please try again.',
                  [{ text: 'OK' }]
                )
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error in sync function:', error)
    }
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
      title: "Add My Business",
      description: "Submit your business for listing",
      icon: "store-plus-outline",
      onPress: () => navigation.navigate("AddMyBusiness"),
    },
    {
      title: "My Business Submissions",
      description: "View your submitted businesses",
      icon: "clipboard-list-outline",
      onPress: () => navigation.navigate("MyBusinessSubmissions"),
    },
    {
      title: "Sync Business Status",
      description: "Update business status based on MapMission status",
      icon: "shield-sync-outline",
      onPress: handleSyncBusinessVerification,
    },
    {
      title: "Accessibility Preferences",
      description: "Customize your experience",
      icon: "cog-outline",
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
      icon: "settings-outline",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      title: "Database Test",
      description: "Insert sample review data",
      icon: "database-outline",
      onPress: () => navigation.navigate("DatabaseTest"),
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileHeader}>
              {userData.avatar_url ? (
                <Image source={{ uri: userData.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Avatar.Text size={80} label={userData.avatar} />
              )}
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.userName}>
                  {userData.name}
                </Text>
                <Text variant="bodyMedium" style={styles.userEmail}>
                  {userData.email}
                </Text>
                <Text variant="bodySmall" style={styles.joinDate}>
                  Member since {userData.joinDate}
                </Text>
              </View>
            </View>

            <Button mode="outlined" style={styles.editButton} onPress={() => navigation.navigate("EditProfile")} accessibilityLabel="Edit profile">
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Badges Section - Future Feature */}
        {/* 
        <Card style={styles.badgesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Badges Earned
            </Text>
            <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#666' }}>
              Badges coming soon! Keep writing reviews and helping the community.
            </Text>
          </Card.Content>
        </Card>
        */}

        {/* Stats Section */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Impact
            </Text>
            <View style={styles.statsContainer}>
              {renderStat("Reviews\nWritten", userStats.reviewsCount)}
              {renderStat("Helpful\nVotes", userStats.helpfulVotes)}
              {renderStat("Favorite\nPlaces", userStats.favoritesCount)}
              {renderStat("Member\nSince", userData.joinDate.split(' ')[1] || 'Recently')}
            </View>
          </Card.Content>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard} accessible={false}>
          <Card.Content style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <View key={index}>
                <List.Item
                  title={item.title}
                  description={item.description}
                  left={(props) => <List.Icon {...props} icon={item.icon} {...AccessibilityService.ignoreProps()} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" {...AccessibilityService.ignoreProps()} />}
                  onPress={() => {
                    item.onPress()
                    AccessibilityService.announce(`Opening ${item.title}`)
                  }}
                  style={styles.menuItem}
                  accessible={true}
                  accessibilityLabel={AccessibilityService.listItemLabel(`${item.title}. ${item.description}`, index, menuItems.length)}
                  accessibilityHint={AccessibilityService.buttonHint(`open ${item.title}`)}
                  accessibilityRole="button"
                />
                {index < menuItems.length - 1 && <Divider {...AccessibilityService.ignoreProps()} />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={handleSignOut}
            style={styles.signOutButton}
            accessibilityLabel="Sign out"
            accessibilityHint={AccessibilityService.buttonHint("sign out of your account")}
            accessibilityRole="button"
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    color: "#666",
    marginBottom: 4,
  },
  joinDate: {
    color: "#666",
  },
  editButton: {
    alignSelf: "flex-start",
  },
  badgesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  badgeItem: {
    alignItems: "center",
    minWidth: 80,
  },
  badgeText: {
    marginTop: 8,
    textAlign: "center",
    color: "#666",
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  statLabel: {
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    paddingVertical: 8,
  },
  signOutContainer: {
    padding: 16,
    alignItems: "center",
  },
  signOutButton: {
    borderColor: "#D32F2F",
  },
})
