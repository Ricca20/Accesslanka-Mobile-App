import { View, StyleSheet, ScrollView } from "react-native"
import { Text, Card, Button, Avatar, List, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

export default function ProfileScreen({ navigation }) {
  const userData = {
    name: "Priya Silva",
    email: "priya.silva@email.com",
    avatar: "PS",
    joinDate: "January 2024",
    reviewsCount: 15,
    favoritesCount: 8,
    badges: [
      { name: "Accessibility Champion", icon: "trophy", color: "#FFD700" },
      { name: "Community Helper", icon: "account-group", color: "#4CAF50" },
      { name: "Review Master", icon: "star", color: "#FF9800" },
    ],
    stats: {
      placesReviewed: 15,
      helpfulVotes: 42,
      communityPosts: 8,
      mapMissionsCompleted: 3,
    },
  }

  const menuItems = [
    {
      title: "My Reviews",
      description: `${userData.reviewsCount} reviews written`,
      icon: "star-outline",
      onPress: () => {},
    },
    {
      title: "My Favorites",
      description: `${userData.favoritesCount} places saved`,
      icon: "heart-outline",
      onPress: () => {},
    },
    {
      title: "Accessibility Preferences",
      description: "Customize your experience",
      icon: "cog-outline",
      onPress: () => {},
    },
    {
      title: "Notifications",
      description: "Manage notification settings",
      icon: "bell-outline",
      onPress: () => {},
    },
    {
      title: "Settings",
      description: "Account and app settings",
      icon: "settings-outline",
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <Avatar.Text size={80} label={userData.avatar} />
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

            <Button mode="outlined" style={styles.editButton} onPress={() => {}} accessibilityLabel="Edit profile">
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Badges Section */}
        <Card style={styles.badgesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Badges Earned
            </Text>
            <View style={styles.badgesContainer}>
              {userData.badges.map((badge, index) => renderBadge(badge, index))}
            </View>
          </Card.Content>
        </Card>

        {/* Stats Section */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Impact
            </Text>
            <View style={styles.statsContainer}>
              {renderStat("Places\nReviewed", userData.stats.placesReviewed)}
              {renderStat("Helpful\nVotes", userData.stats.helpfulVotes)}
              {renderStat("Community\nPosts", userData.stats.communityPosts)}
              {renderStat("MapMissions\nCompleted", userData.stats.mapMissionsCompleted)}
            </View>
          </Card.Content>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <Card.Content style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <View key={index}>
                <List.Item
                  title={item.title}
                  description={item.description}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={item.onPress}
                  style={styles.menuItem}
                  accessibilityLabel={`${item.title}: ${item.description}`}
                />
                {index < menuItems.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={() => {}}
            style={styles.signOutButton}
            accessibilityLabel="Sign out of account"
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
