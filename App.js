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
import { supabase } from "./src/config/supabase"

function AppContent() {
  const { currentTheme, isDarkMode, transitionOpacity } = useTheme()

  useEffect(() => {
    // Handle deep links for email confirmation and password reset
    const handleDeepLink = async (event) => {
      const url = event.url
      console.log('=== Deep link received ===')
      console.log('Full URL:', url)
      
      if (url) {
        let params = null
        let accessToken = null
        let refreshToken = null
        let type = null
        
        // Try to extract parameters from URL fragment (after #)
        const fragment = url.split('#')[1]
        if (fragment) {
          console.log('URL Fragment:', fragment)
          params = new URLSearchParams(fragment)
          accessToken = params.get('access_token')
          refreshToken = params.get('refresh_token')
          type = params.get('type')
        }
        
        // If not found in fragment, try query string (after ?)
        if (!accessToken) {
          const queryString = url.split('?')[1]
          if (queryString) {
            console.log('Query String:', queryString)
            // Remove fragment if it exists in query string
            const cleanQuery = queryString.split('#')[0]
            params = new URLSearchParams(cleanQuery)
            accessToken = params.get('access_token')
            refreshToken = params.get('refresh_token')
            type = params.get('type')
          }
        }
        
        console.log('Parsed - Type:', type, 'Access Token exists:', !!accessToken, 'Refresh Token exists:', !!refreshToken)
        
        // Handle email confirmation
        if (type === 'signup' && accessToken) {
          console.log('✅ Email confirmation detected - confirming email...')
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || accessToken,
            })
            
            if (error) {
              console.error('❌ Error confirming email:', error)
            } else {
              console.log('✅ Email confirmed successfully!')
              console.log('Session user:', data.user?.email)
              console.log('User email_confirmed_at:', data.user?.email_confirmed_at)
              // The AuthContext will automatically detect the session and log the user in
            }
          } catch (err) {
            console.error('❌ Exception confirming email:', err)
          }
        }
        
        // Handle password reset
        if (type === 'recovery' && accessToken) {
          console.log('✅ Password reset detected')
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || accessToken,
            })
            
            if (error) {
              console.error('❌ Error setting session:', error)
            } else {
              console.log('✅ Session set successfully for password reset')
            }
          } catch (err) {
            console.error('❌ Exception setting session:', err)
          }
        }
        
        // If no type found, log all parameters for debugging
        if (!type && params) {
          console.log('⚠️ No type parameter found. All params:')
          for (const [key, value] of params.entries()) {
            console.log(`  ${key}: ${value.substring(0, 20)}...`)
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
        ConfirmEmail: 'confirm-email',
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
