import { NavigationContainer } from "@react-navigation/native"
import { Provider as PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Animated } from "react-native"

import AppNavigator from "./src/navigation/AppNavigator"
import { AuthProvider } from "./src/context/AuthContext"
import { ThemeProvider, useTheme } from "./src/context/ThemeContext"
import { SettingsProvider } from "./src/context/SettingsContext"

function AppContent() {
  const { currentTheme, isDarkMode, transitionOpacity } = useTheme()

  return (
    <Animated.View style={{ flex: 1, opacity: transitionOpacity }}>
      <PaperProvider theme={currentTheme}>
        <SettingsProvider>
          <AuthProvider>
            <NavigationContainer>
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
