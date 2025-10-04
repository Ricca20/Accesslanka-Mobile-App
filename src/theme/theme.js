import { MD3LightTheme, MD3DarkTheme } from "react-native-paper"

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2E7D32",
    secondary: "#1976D2",
    tertiary: "#F57C00",
    surface: "#FFFFFF",
    background: "#F5F5F5",
    error: "#D32F2F",
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onSurface: "#1C1B1F",
    onBackground: "#1C1B1F",
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#4CAF50",
    secondary: "#42A5F5",
    tertiary: "#FFB74D",
    surface: "#1E1E1E",
    background: "#121212",
    error: "#F44336",
    onPrimary: "#000000",
    onSecondary: "#000000",
    onSurface: "#E1E1E1",
    onBackground: "#E1E1E1",
  },
}

export const theme = lightTheme // Default theme
