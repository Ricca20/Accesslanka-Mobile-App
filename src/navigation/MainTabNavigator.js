import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import AccessibilityService from "../services/AccessibilityService"

import ExploreScreen from "../screens/main/ExploreScreen"
import MapMissionScreen from "../screens/main/MapMissionScreen"
import CommunityScreen from "../screens/main/CommunityScreen"
import ChatbotScreen from "../screens/ChatbotScreen"
import PlaceDetailsScreen from "../screens/PlaceDetailsScreen"
import AddReviewScreen from "../screens/AddReviewScreen"
import ProfileScreen from "../screens/ProfileScreen"
import SettingsScreen from "../screens/SettingsScreen"
import EditProfileScreen from "../screens/EditProfileScreen"
import AccessibilityPreferencesScreen from "../screens/AccessibilityPreferencesScreen"
import NotificationsScreen from "../screens/NotificationsScreen"
import MyReviewsScreen from "../screens/MyReviewsScreen"
import MyFavoritesScreen from "../screens/MyFavoritesScreen"
import AddMyBusinessScreen from "../screens/AddMyBusinessScreen"
import MyBusinessSubmissionsScreen from "../screens/MyBusinessSubmissionsScreen"
import CreateMapMissionScreen from "../screens/CreateMapMissionScreen"
import AccessibilityContributionScreen from "../screens/AccessibilityContributionScreen"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function ExploreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} options={{ title: "Explore" }} />
      <Stack.Screen 
        name="Chatbot" 
        component={ChatbotScreen} 
        options={{ 
          title: "AI Assistant",
          presentation: 'modal'
        }} 
      />
      <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} options={{ title: "Place Details" }} />
      <Stack.Screen name="AddReview" component={AddReviewScreen} options={{ title: "Write a Review" }} />
    </Stack.Navigator>
  )
}

function MapMissionStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MapMissionMain" component={MapMissionScreen} options={{ title: "MapMission" }} />
      <Stack.Screen name="CreateMapMission" component={CreateMapMissionScreen} options={{ title: "Create MapMission" }} />
      <Stack.Screen name="AccessibilityContribution" component={AccessibilityContributionScreen} options={{ title: "Contribute to Mission" }} />
      <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} options={{ title: "Place Details" }} />
    </Stack.Navigator>
  )
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="AccessibilityPreferences" component={AccessibilityPreferencesScreen} options={{ title: "Accessibility" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: "My Reviews" }} />
      <Stack.Screen name="MyFavorites" component={MyFavoritesScreen} options={{ title: "My Favorites" }} />
      <Stack.Screen name="AddMyBusiness" component={AddMyBusinessScreen} options={{ title: "Add My Business" }} />
      <Stack.Screen name="MyBusinessSubmissions" component={MyBusinessSubmissionsScreen} options={{ title: "My Business Submissions" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />

    </Stack.Navigator>
  )
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          switch (route.name) {
            case "Explore":
              iconName = focused ? "map-search" : "map-search-outline"
              break
            case "MapMission":
              iconName = focused ? "map-marker" : "map-marker-outline"
              break
            case "Community":
              iconName = focused ? "forum" : "forum-outline"
              break
            case "Profile":
              iconName = focused ? "account" : "account-outline"
              break
          }

          return (
            <Icon 
              name={iconName} 
              size={size} 
              color={color}
              accessible={false}
              importantForAccessibility="no"
            />
          )
        },
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarAccessibilityLabel: route.name,
      })}
      screenListeners={{
        state: (e) => {
          // Announce navigation changes for screen readers
          const currentRoute = e.data?.state?.routes[e.data?.state?.index]
          if (currentRoute) {
            AccessibilityService.announceNavigation(currentRoute.name)
          }
        }
      }}
    >
      <Tab.Screen 
        name="Explore" 
        component={ExploreStack}
        options={{
          tabBarAccessibilityLabel: AccessibilityService.navItemLabel("Explore"),
          tabBarAccessibilityHint: AccessibilityService.buttonHint("view explore screen and search for accessible places"),
        }}
      />
      <Tab.Screen 
        name="MapMission" 
        component={MapMissionStack}
        options={{
          tabBarAccessibilityLabel: AccessibilityService.navItemLabel("Map Mission"),
          tabBarAccessibilityHint: AccessibilityService.buttonHint("view map missions and contribute accessibility information"),
        }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{
          tabBarAccessibilityLabel: AccessibilityService.navItemLabel("Community"),
          tabBarAccessibilityHint: AccessibilityService.buttonHint("view community posts and discussions"),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarAccessibilityLabel: AccessibilityService.navItemLabel("Profile"),
          tabBarAccessibilityHint: AccessibilityService.buttonHint("view your profile and settings"),
        }}
      />
    </Tab.Navigator>
  )
}
