import { useEffect, useState } from "react"
import { createStackNavigator } from "@react-navigation/stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ActivityIndicator, View, Text } from "react-native"
import AccessibilityService from "../services/AccessibilityService"

import SplashScreen from "../screens/SplashScreen"
import IntroSlidesScreen from "../screens/IntroSlidesScreen"
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
  const [showSplash, setShowSplash] = useState(true)
  const [showIntroSlides, setShowIntroSlides] = useState(false)

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

  const handleSplashComplete = () => {
    setShowSplash(false)
    setShowIntroSlides(true)
  }

  const handleIntroSlidesComplete = () => {
    setShowIntroSlides(false)
  }

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  // Show intro slides after splash
  if (showIntroSlides) {
    return <IntroSlidesScreen onComplete={handleIntroSlidesComplete} />
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
        // User is not authenticated - go directly to Register
        <>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}
