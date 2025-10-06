import { MD3LightTheme, MD3DarkTheme } from "react-native-paper"

// Base theme configurations
const baseLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: "#2E7D32", // Keep the existing green
    primaryContainer: "#C8E6C9",
    onPrimary: "#FFFFFF",
    onPrimaryContainer: "#1B5E20",
    
    // Secondary colors
    secondary: "#1976D2", // Keep the existing blue
    secondaryContainer: "#BBDEFB",
    onSecondary: "#FFFFFF",
    onSecondaryContainer: "#0D47A1",
    
    // Tertiary colors
    tertiary: "#F57C00", // Keep the existing orange
    tertiaryContainer: "#FFE0B2",
    onTertiary: "#FFFFFF",
    onTertiaryContainer: "#E65100",
    
    // Surface colors
    surface: "#FFFFFF",
    surfaceVariant: "#F5F5F5",
    surfaceContainer: "#FAFAFA",
    surfaceContainerHigh: "#F0F0F0",
    surfaceContainerHighest: "#EEEEEE",
    onSurface: "#1C1B1F",
    onSurfaceVariant: "#49454F",
    
    // Background colors
    background: "#FAFAFA", // Slightly warmer than pure white
    onBackground: "#1C1B1F",
    
    // Other colors
    error: "#D32F2F",
    errorContainer: "#FFEBEE",
    onError: "#FFFFFF",
    onErrorContainer: "#B71C1C",
    
    // Outline and dividers
    outline: "#E0E0E0",
    outlineVariant: "#F0F0F0",
    
    // Inverse colors
    inverseSurface: "#313033",
    inverseOnSurface: "#F4EFF4",
    inversePrimary: "#66BB6A",
    
    // Additional semantic colors
    shadow: "#000000",
    scrim: "#000000",
    surfaceTint: "#2E7D32",
  },
}

const baseDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors with better accessibility
    primary: "#66BB6A", // Softer, more pleasant green
    primaryContainer: "#2E7D32",
    onPrimary: "#000000",
    onPrimaryContainer: "#FFFFFF",
    
    // Secondary colors
    secondary: "#64B5F6", // Warmer blue
    secondaryContainer: "#1565C0",
    onSecondary: "#000000",
    onSecondaryContainer: "#FFFFFF",
    
    // Tertiary colors
    tertiary: "#FFD54F", // Warmer amber
    tertiaryContainer: "#FF8F00",
    onTertiary: "#000000",
    onTertiaryContainer: "#000000",
    
    // Surface colors with better contrast
    surface: "#1E1E1E", // Slightly lighter than pure black
    surfaceVariant: "#2C2C2C",
    surfaceContainer: "#242424",
    surfaceContainerHigh: "#2A2A2A",
    surfaceContainerHighest: "#303030",
    onSurface: "#E8E8E8", // Softer white
    onSurfaceVariant: "#CCCCCC",
    
    // Background colors - OLED friendly
    background: "#000000", // True black for OLED
    onBackground: "#F0F0F0",
    
    // Other colors
    error: "#FF5252", // Softer red
    errorContainer: "#B71C1C",
    onError: "#000000",
    onErrorContainer: "#FFFFFF",
    
    // Outline and dividers
    outline: "#444444",
    outlineVariant: "#333333",
    
    // Inverse colors
    inverseSurface: "#F0F0F0",
    inverseOnSurface: "#1A1A1A",
    inversePrimary: "#2E7D32",
    
    // Additional semantic colors
    shadow: "#000000",
    scrim: "#000000",
    
    // Custom colors for better UX
    surfaceTint: "#66BB6A",
    elevation: {
      level0: "transparent",
      level1: "#1A1A1A",
      level2: "#222222",
      level3: "#2A2A2A",
      level4: "#2E2E2E",
      level5: "#333333",
    },
  },
}

// Function to create themed variant with accessibility settings
const createAccessibleTheme = (baseTheme, options = {}) => {
  const { largeText = false, textSizeLevel = 0, highContrast = false } = options
  
  let theme = { ...baseTheme }
  
  // Apply large text scaling
  if (largeText) {
    theme.fonts = {
      ...theme.fonts,
      displayLarge: { ...theme.fonts.displayLarge, fontSize: theme.fonts.displayLarge.fontSize * 1.3 },
      displayMedium: { ...theme.fonts.displayMedium, fontSize: theme.fonts.displayMedium.fontSize * 1.3 },
      displaySmall: { ...theme.fonts.displaySmall, fontSize: theme.fonts.displaySmall.fontSize * 1.3 },
      headlineLarge: { ...theme.fonts.headlineLarge, fontSize: theme.fonts.headlineLarge.fontSize * 1.3 },
      headlineMedium: { ...theme.fonts.headlineMedium, fontSize: theme.fonts.headlineMedium.fontSize * 1.3 },
      headlineSmall: { ...theme.fonts.headlineSmall, fontSize: theme.fonts.headlineSmall.fontSize * 1.3 },
      titleLarge: { ...theme.fonts.titleLarge, fontSize: theme.fonts.titleLarge.fontSize * 1.2 },
      titleMedium: { ...theme.fonts.titleMedium, fontSize: theme.fonts.titleMedium.fontSize * 1.2 },
      titleSmall: { ...theme.fonts.titleSmall, fontSize: theme.fonts.titleSmall.fontSize * 1.2 },
      bodyLarge: { ...theme.fonts.bodyLarge, fontSize: theme.fonts.bodyLarge.fontSize * 1.2 },
      bodyMedium: { ...theme.fonts.bodyMedium, fontSize: theme.fonts.bodyMedium.fontSize * 1.2 },
      bodySmall: { ...theme.fonts.bodySmall, fontSize: theme.fonts.bodySmall.fontSize * 1.2 },
      labelLarge: { ...theme.fonts.labelLarge, fontSize: theme.fonts.labelLarge.fontSize * 1.2 },
      labelMedium: { ...theme.fonts.labelMedium, fontSize: theme.fonts.labelMedium.fontSize * 1.2 },
      labelSmall: { ...theme.fonts.labelSmall, fontSize: theme.fonts.labelSmall.fontSize * 1.2 },
    }
  }
  
  // Apply high contrast settings
  if (highContrast) {
    const isDark = theme.dark
    
    if (isDark) {
      theme.colors = {
        ...theme.colors,
        primary: "#00FF00", // Bright green
        secondary: "#00BFFF", // Bright blue
        onSurface: "#FFFFFF", // Pure white text
        onBackground: "#FFFFFF",
        outline: "#FFFFFF",
        onSurfaceVariant: "#FFFFFF",
      }
    } else {
      theme.colors = {
        ...theme.colors,
        primary: "#000000", // Pure black
        secondary: "#000080", // Navy blue
        onSurface: "#000000", // Pure black text
        onBackground: "#000000",
        outline: "#000000",
        onSurfaceVariant: "#000000",
        surface: "#FFFFFF", // Pure white background
        background: "#FFFFFF",
      }
    }
  }
  
  return theme
}

export const createTheme = (isDark = false, options = {}) => {
  const baseTheme = isDark ? baseDarkTheme : baseLightTheme
  return createAccessibleTheme(baseTheme, options)
}

// Export default themes for backward compatibility
export const lightTheme = createTheme(false)
export const darkTheme = createTheme(true)

export const theme = lightTheme // Default theme
