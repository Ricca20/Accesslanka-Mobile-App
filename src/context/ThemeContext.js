import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance, Animated } from 'react-native'
import { createTheme } from '../theme/theme'

const ThemeContext = createContext()

export { ThemeContext }

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system') // 'light', 'dark', 'system'
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme())
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    largeText: false,
    highContrast: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionOpacity = useState(new Animated.Value(1))[0]

  // Calculate effective dark mode based on mode and system theme
  const isDarkMode = themeMode === 'system' 
    ? systemTheme === 'dark'
    : themeMode === 'dark'

  // Load theme preference from storage on app start
  useEffect(() => {
    loadThemePreference()
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        animateThemeTransition(() => setSystemTheme(colorScheme))
      } else {
        setSystemTheme(colorScheme)
      }
    })

    return () => subscription?.remove()
  }, [])

  const animateThemeTransition = (callback) => {
    setIsTransitioning(true)
    
    Animated.sequence([
      Animated.timing(transitionOpacity, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(transitionOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsTransitioning(false)
    })
    
    // Execute the theme change in the middle of the animation
    setTimeout(callback, 150)
  }

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('theme_mode')
      const savedAccessibility = await AsyncStorage.getItem('accessibility_settings')
      
      if (savedMode !== null) {
        setThemeMode(savedMode)
      }
      
      if (savedAccessibility !== null) {
        setAccessibilitySettings(JSON.parse(savedAccessibility))
      }
    } catch (error) {
      console.error('Error loading theme preference:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem('theme_mode', mode)
    } catch (error) {
      console.error('Error saving theme preference:', error)
    }
  }

  const saveAccessibilitySettings = async (settings) => {
    try {
      await AsyncStorage.setItem('accessibility_settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving accessibility settings:', error)
    }
  }

  const setTheme = (mode) => {
    if (mode !== themeMode) {
      animateThemeTransition(() => {
        setThemeMode(mode)
        saveThemePreference(mode)
      })
    }
  }

  const updateAccessibilitySettings = (newSettings) => {
    animateThemeTransition(() => {
      setAccessibilitySettings(newSettings)
      saveAccessibilitySettings(newSettings)
    })
  }

  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark'
    setTheme(newMode)
  }

  const currentTheme = createTheme(isDarkMode, accessibilitySettings)

  const value = {
    themeMode,
    systemTheme,
    isDarkMode,
    currentTheme,
    theme: currentTheme, // Add alias for consistency
    accessibilitySettings,
    toggleTheme,
    setTheme,
    updateAccessibilitySettings,
    isLoading,
    isTransitioning,
    transitionOpacity,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
