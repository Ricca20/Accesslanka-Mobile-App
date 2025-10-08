import { NavigationContainer } from "@react-navigation/native"
import { Provider as PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Animated, Linking } from "react-native"
import { useEffect } from "react"

import AppNavigator from "./src/navigation/AppNavigator"
import { AuthProvider } from "./src/context/AuthContext"
import { ThemeProvider, useTheme } from "./src/context/ThemeContext"
import { SettingsProvider } from "./src/context/SettingsContext"
import { supabase } from "./src/lib/supabase"

function AppContent() {
  const { currentTheme, isDarkMode, transitionOpacity } = useTheme()

  useEffect(() => {
    // Handle deep links for password reset
    const handleDeepLink = async (event) => {
      const url = event.url
      console.log('Deep link received:', url)
      
      if (url) {
        // Extract the URL fragment (everything after #)
        const fragment = url.split('#')[1]
        if (fragment) {
          const params = new URLSearchParams(fragment)
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const type = params.get('type')
          
          console.log('Type:', type, 'Access Token exists:', !!accessToken)
          
          // If this is a recovery (password reset) link
          if (type === 'recovery' && accessToken) {
            // Set the session with the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || accessToken,
            })
            
            if (error) {
              console.error('Error setting session:', error)
            } else {
              console.log('Session set successfully for password reset')
            }
          }
        }
      }
    }

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink)

    // Handle initial URL when app is opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const linking = {
    prefixes: ['accesslanka://', 'https://accesslanka.com'],
    config: {
      screens: {
        ResetPassword: 'reset-password',
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot-password',
        Landing: 'landing',
        Onboarding: 'onboarding',
        Main: 'main',
      },
    },
  }

  return (
    <Animated.View style={{ flex: 1, opacity: transitionOpacity }}>
      <PaperProvider theme={currentTheme}>
        <SettingsProvider>
          <AuthProvider>
            <NavigationContainer linking={linking}>
              <StatusBar style={isDarkMode ? "light" : "dark"} />
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SettingsProvider>
      </PaperProvider>
    </Animated.View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
