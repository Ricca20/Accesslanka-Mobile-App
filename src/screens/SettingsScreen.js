import { useState } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Text, Card, Switch, List, Divider, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    darkMode: false,
    pushNotifications: true,
    emailNotifications: false,
    hapticFeedback: true,
    largeText: false,
    highContrast: false,
    twoFactorAuth: false,
    locationServices: true,
  })

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const accessibilitySettings = [
    {
      title: "Dark Mode",
      description: "Use dark theme for better visibility",
      key: "darkMode",
      icon: "theme-light-dark",
    },
    {
      title: "Large Text",
      description: "Increase text size for better readability",
      key: "largeText",
      icon: "format-size",
    },
    {
      title: "High Contrast",
      description: "Enhance contrast for better visibility",
      key: "highContrast",
      icon: "contrast-circle",
    },
    {
      title: "Haptic Feedback",
      description: "Vibration feedback for interactions",
      key: "hapticFeedback",
      icon: "vibrate",
    },
  ]

  const notificationSettings = [
    {
      title: "Push Notifications",
      description: "Receive notifications on your device",
      key: "pushNotifications",
      icon: "bell",
    },
    {
      title: "Email Notifications",
      description: "Receive updates via email",
      key: "emailNotifications",
      icon: "email",
    },
  ]

  const privacySettings = [
    {
      title: "Two-Factor Authentication",
      description: "Add extra security to your account",
      key: "twoFactorAuth",
      icon: "shield-check",
    },
    {
      title: "Location Services",
      description: "Allow app to access your location",
      key: "locationServices",
      icon: "map-marker",
    },
  ]

  const renderSettingItem = (item) => (
    <List.Item
      key={item.key}
      title={item.title}
      description={item.description}
      left={(props) => <List.Icon {...props} icon={item.icon} />}
      right={() => (
        <Switch
          value={settings[item.key]}
          onValueChange={(value) => updateSetting(item.key, value)}
          accessibilityLabel={`Toggle ${item.title}`}
        />
      )}
      style={styles.settingItem}
    />
  )

  const otherOptions = [
    {
      title: "Language",
      description: "English",
      icon: "translate",
      onPress: () => {},
    },
    {
      title: "Data & Storage",
      description: "Manage app data and cache",
      icon: "database",
      onPress: () => {},
    },
    {
      title: "Help & Support",
      description: "Get help and contact support",
      icon: "help-circle",
      onPress: () => {},
    },
    {
      title: "About",
      description: "App version and information",
      icon: "information",
      onPress: () => {},
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Accessibility Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accessibility
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Customize the app for your accessibility needs
            </Text>
            {accessibilitySettings.map((item, index) => (
              <View key={item.key}>
                {renderSettingItem(item)}
                {index < accessibilitySettings.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Notifications
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Manage how you receive notifications
            </Text>
            {notificationSettings.map((item, index) => (
              <View key={item.key}>
                {renderSettingItem(item)}
                {index < notificationSettings.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Privacy & Security */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Privacy & Security
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Control your privacy and security settings
            </Text>
            {privacySettings.map((item, index) => (
              <View key={item.key}>
                {renderSettingItem(item)}
                {index < privacySettings.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Other Options */}
        <Card style={styles.settingsCard}>
          <Card.Content style={styles.menuContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Other
            </Text>
            {otherOptions.map((item, index) => (
              <View key={index}>
                <List.Item
                  title={item.title}
                  description={item.description}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={item.onPress}
                  style={styles.settingItem}
                  accessibilityLabel={`${item.title}: ${item.description}`}
                />
                {index < otherOptions.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Reset Settings */}
        <View style={styles.resetContainer}>
          <Button
            mode="outlined"
            icon="restore"
            onPress={() => {}}
            style={styles.resetButton}
            accessibilityLabel="Reset all settings to default"
          >
            Reset to Defaults
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  settingsCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionDescription: {
    color: "#666",
    marginBottom: 16,
  },
  settingItem: {
    paddingVertical: 8,
  },
  menuContent: {
    padding: 0,
  },
  resetContainer: {
    padding: 16,
    alignItems: "center",
  },
  resetButton: {
    borderColor: "#FF9800",
  },
})
