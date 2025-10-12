export default {
  expo: {
    name: "AccessLanka",
    slug: "accesslanka",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    scheme: "accesslanka",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#2E7D32"
    },
    icon: "./assets/icon.png",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.accesslanka.app"
    },
    android: {
      package: "com.accesslanka.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#2E7D32"
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "accesslanka",
              host: "*"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-asset",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow AccessLanka to use your location to show nearby accessible places."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share accessibility photos during MapMissions.",
          cameraPermission: "The app accesses your camera to let you take photos of accessibility features during MapMissions."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "c1adebcb-8e79-4718-b524-7f4d7afd50f5"
      }
    }
  }
}
