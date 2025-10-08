export default {
  expo: {
    name: "AccessLanka",
    slug: "accesslanka",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    scheme: "accesslanka",
    splash: {
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
    ]
  }
}
