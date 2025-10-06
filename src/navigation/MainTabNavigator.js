import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

import ExploreScreen from "../screens/main/ExploreScreen"
import ReviewsScreen from "../screens/main/ReviewsScreen"
import MapMissionScreen from "../screens/main/MapMissionScreen"
import BusinessesScreen from "../screens/main/BusinessesScreen"
import CommunityScreen from "../screens/main/CommunityScreen"
import PlaceDetailsScreen from "../screens/PlaceDetailsScreen"
import ProfileScreen from "../screens/ProfileScreen"
import SettingsScreen from "../screens/SettingsScreen"
import EditProfileScreen from "../screens/EditProfileScreen"
import AccessibilityPreferencesScreen from "../screens/AccessibilityPreferencesScreen"
import NotificationsScreen from "../screens/NotificationsScreen"
import MyReviewsScreen from "../screens/MyReviewsScreen"
import MyFavoritesScreen from "../screens/MyFavoritesScreen"
import DatabaseTestScreen from "../screens/DatabaseTestScreen"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function ExploreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} options={{ title: "Explore" }} />
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
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="DatabaseTest" component={DatabaseTestScreen} options={{ title: "Database Test" }} />
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
            case "Reviews":
              iconName = focused ? "star" : "star-outline"
              break
            case "MapMission":
              iconName = focused ? "map-marker" : "map-marker-outline"
              break
            case "Businesses":
              iconName = focused ? "store" : "store-outline"
              break
            case "Community":
              iconName = focused ? "forum" : "forum-outline"
              break
            case "Profile":
              iconName = focused ? "account" : "account-outline"
              break
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen name="MapMission" component={MapMissionScreen} />
      <Tab.Screen name="Businesses" component={BusinessesScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  )
}
