import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import * as Location from 'expo-location'
import Constants from 'expo-constants'
import { Alert, Platform } from 'react-native'

// Conditional import for notifications (only import if not in Expo Go)
let Notifications = null
const isExpoGo = Constants.appOwnership === 'expo'

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications')
  } catch (error) {
    console.log('Notifications not available in this environment')
  }
}

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// Configure notifications only if available
if (Notifications && !isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  })
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    hapticFeedback: true,
    largeText: false,
    highContrast: false,
    twoFactorAuth: false,
    locationServices: true,
    language: 'en',
  })

  const [isLoading, setIsLoading] = useState(true)

  // Load settings from storage on app start
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings')
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsedSettings }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    await saveSettings(newSettings)

    // Handle specific setting changes
    switch (key) {
      case 'pushNotifications':
        await handlePushNotificationChange(value)
        break
      case 'hapticFeedback':
        if (value) {
          // Test haptic feedback when enabled
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        break
      case 'locationServices':
        await handleLocationServiceChange(value)
        break
      case 'twoFactorAuth':
        await handleTwoFactorAuthChange(value)
        break
      case 'emailNotifications':
        handleEmailNotificationChange(value)
        break
      case 'largeText':
      case 'highContrast':
        // These will be handled by the component using both contexts
        break
      default:
        break
    }
  }

  const handlePushNotificationChange = async (enable) => {
    try {
      if (enable) {
        // Check if we're in Expo Go
        if (isExpoGo) {
          Alert.alert(
            'Development Build Required',
            'Push notifications require a development build and won\'t work in Expo Go. Your preference has been saved and will work when you create a development build.\n\nLearn more: https://docs.expo.dev/develop/development-builds/introduction/',
            [
              { text: 'OK' },
              { 
                text: 'Learn More', 
                onPress: () => {
                  // In a real app, you'd open the URL
                  Alert.alert('Info', 'Visit the Expo documentation to learn about development builds.')
                }
              }
            ]
          )
          return true // Don't revert the setting, just inform the user
        }

        // If not in Expo Go and notifications are available
        if (Notifications) {
          const { status } = await Notifications.requestPermissionsAsync()
          if (status !== 'granted') {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in your device settings to receive push notifications.',
              [{ text: 'OK' }]
            )
            // Revert the setting if permission denied
            setSettings(prev => ({ ...prev, pushNotifications: false }))
            return false
          }

          // Get push token
          const token = (await Notifications.getExpoPushTokenAsync()).data
          console.log('Push token:', token)
          
          Alert.alert(
            'Notifications Enabled',
            'You will now receive push notifications for important updates.',
            [{ text: 'OK' }]
          )
        } else {
          // Fallback for when notifications aren't available
          Alert.alert(
            'Notifications Not Available',
            'Push notifications are not available in this environment. Your preference has been saved.',
            [{ text: 'OK' }]
          )
        }
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You will no longer receive push notifications. You can re-enable them anytime.',
          [{ text: 'OK' }]
        )
      }
      return true
    } catch (error) {
      console.error('Error handling push notifications:', error)
      
      // Provide user-friendly error message
      if (isExpoGo) {
        Alert.alert(
          'Development Build Required',
          'Push notifications require a development build. Your preference has been saved for when you use a development build.'
        )
      } else {
        Alert.alert('Error', 'Failed to update notification settings.')
      }
      return false
    }
  }

  const handleLocationServiceChange = async (enable) => {
    try {
      if (enable) {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable location services in your device settings for better place recommendations.',
            [{ text: 'OK' }]
          )
          // Revert the setting if permission denied
          setSettings(prev => ({ ...prev, locationServices: false }))
          return false
        }
        
        Alert.alert(
          'Location Services Enabled',
          'The app can now access your location for better recommendations.',
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert(
          'Location Services Disabled',
          'Location-based features will be limited.',
          [{ text: 'OK' }]
        )
      }
      return true
    } catch (error) {
      console.error('Error handling location services:', error)
      Alert.alert('Error', 'Failed to update location settings.')
      return false
    }
  }

  const handleTwoFactorAuthChange = async (enable) => {
    if (enable) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'Two-factor authentication adds an extra layer of security to your account. This feature will be available in a future update.',
        [
          { text: 'Cancel', onPress: () => setSettings(prev => ({ ...prev, twoFactorAuth: false })) },
          { text: 'Notify Me', onPress: () => Alert.alert('Thank You', 'We\'ll notify you when 2FA is available!') }
        ]
      )
    } else {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable this security feature?',
        [
          { text: 'Cancel', onPress: () => setSettings(prev => ({ ...prev, twoFactorAuth: true })) },
          { text: 'Disable', style: 'destructive' }
        ]
      )
    }
  }

  const handleEmailNotificationChange = (enable) => {
    if (enable) {
      Alert.alert(
        'Email Notifications Enabled',
        'You will receive email updates about accessibility reviews and important announcements.',
        [{ text: 'OK' }]
      )
    } else {
      Alert.alert(
        'Email Notifications Disabled',
        'You will no longer receive email updates.',
        [{ text: 'OK' }]
      )
    }
  }

  const resetToDefaults = async () => {
    const defaultSettings = {
      pushNotifications: true,
      emailNotifications: false,
      hapticFeedback: true,
      largeText: false,
      highContrast: false,
      twoFactorAuth: false,
      locationServices: true,
      language: 'en',
    }

    setSettings(defaultSettings)
    await saveSettings(defaultSettings)
    
    Alert.alert(
      'Settings Reset',
      'All settings have been reset to their default values.',
      [{ text: 'OK' }]
    )
  }

  const clearAppData = async () => {
    Alert.alert(
      'Clear App Data',
      'This will remove all cached data, saved places, and preferences. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear()
              Alert.alert('Success', 'App data has been cleared.')
            } catch (error) {
              Alert.alert('Error', 'Failed to clear app data.')
            }
          }
        }
      ]
    )
  }

  const triggerHapticFeedback = (type = 'light') => {
    if (!settings.hapticFeedback) return

    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        break
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        break
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        break
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        break
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        break
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        break
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const value = {
    settings,
    updateSetting,
    resetToDefaults,
    clearAppData,
    triggerHapticFeedback,
    isLoading,
    // Environment info
    isExpoGo,
    notificationsAvailable: !isExpoGo && !!Notifications,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}