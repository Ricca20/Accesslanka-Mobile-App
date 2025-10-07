export default {
  expo: {
    name: "AccessLanka",
    slug: "accesslanka",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#2E7D32"
    },
    icon: "./assets/icon.png",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.accesslanka.app",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      package: "com.accesslanka.app",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },
    web: {},
    plugins: [
      "expo-location",
      "expo-asset",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow AccessLanka to use your location to show nearby accessible places."
        }
      ]
    ],
    extra: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    }
  }
}
