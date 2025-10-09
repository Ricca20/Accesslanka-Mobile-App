import { useEffect, useState } from "react"
import { createStackNavigator } from "@react-navigation/stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ActivityIndicator, View, Text } from "react-native"
import AccessibilityService from "../services/AccessibilityService"

import OnboardingScreen from "../screens/OnboardingScreen"
import LandingScreen from "../screens/LandingScreen"
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen"
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen"
import MainTabNavigator from "./MainTabNavigator"
import { useAuth } from "../context/AuthContext"

const Stack = createStackNavigator()

export default function AppNavigator() {
  const { user, loading } = useAuth()
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('onboarding_complete')
      setHasSeenOnboarding(onboardingComplete === 'true')
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setHasSeenOnboarding(false)
    }
  }

  // Show loading screen while checking auth status and onboarding
  if (loading || hasSeenOnboarding === null) {
    return (
      <View 
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        {...AccessibilityService.loadingProps('application')}
      >
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text 
          style={{ marginTop: 16 }}
          accessible={true}
          accessibilityLabel="Loading application, please wait"
        >
          Loading...
        </Text>
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is authenticated
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        // User is not authenticated
        <>
          {!hasSeenOnboarding && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}
