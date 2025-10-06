import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, Switch, Card, Button, Divider, List } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

export default function NotificationsScreen({ navigation }) {
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    reviews: true,
    newPlaces: true,
    nearby: false,
    updates: true,
    marketing: false,
  })

  const notificationSettings = [
    {
      key: 'reviews',
      title: 'Review Updates',
      description: 'When someone finds your review helpful or replies',
      icon: 'star-outline'
    },
    {
      key: 'newPlaces',
      title: 'New Places',
      description: 'When new accessible places are added near you',
      icon: 'map-marker-plus'
    },
    {
      key: 'nearby',
      title: 'Nearby Recommendations',
      description: 'Get suggestions based on your location',
      icon: 'near-me'
    },
    {
      key: 'updates',
      title: 'App Updates',
      description: 'Important updates and accessibility improvements',
      icon: 'update'
    },
    {
      key: 'marketing',
      title: 'Tips & Features',
      description: 'Tips for using AccessLanka and new features',
      icon: 'lightbulb-outline'
    }
  ]

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Here you would typically save to user preferences in the database
      // For now, we'll just show a success message
      
      Alert.alert(
        'Success',
        'Notification preferences saved!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      Alert.alert('Error', 'Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const enableAll = () => {
    const allEnabled = Object.keys(notifications).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setNotifications(allEnabled)
  }

  const disableAll = () => {
    const allDisabled = Object.keys(notifications).reduce((acc, key) => {
      acc[key] = false
      return acc
    }, {})
    setNotifications(allDisabled)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Notification Settings
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Choose what notifications you'd like to receive
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.quickActions}>
              <Button
                mode="outlined"
                onPress={enableAll}
                style={styles.quickButton}
                compact
              >
                Enable All
              </Button>
              <Button
                mode="outlined"
                onPress={disableAll}
                style={styles.quickButton}
                compact
              >
                Disable All
              </Button>
            </View>

            <Divider style={styles.divider} />

            {notificationSettings.map((setting) => (
              <View key={setting.key} style={styles.settingItem}>
                <List.Item
                  title={setting.title}
                  description={setting.description}
                  left={() => (
                    <View style={styles.iconContainer}>
                      <Icon name={setting.icon} size={24} color="#2E7D32" />
                    </View>
                  )}
                  right={() => (
                    <Switch
                      value={notifications[setting.key]}
                      onValueChange={() => toggleNotification(setting.key)}
                      color="#2E7D32"
                    />
                  )}
                  style={styles.listItem}
                />
              </View>
            ))}

            <Divider style={styles.divider} />

            <View style={styles.infoBox}>
              <Icon name="information" size={20} color="#2196F3" />
              <Text variant="bodySmall" style={styles.infoText}>
                You can also manage notification permissions in your device settings. 
                Some notifications may require location access to work properly.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                style={styles.saveButton}
                disabled={loading}
              >
                Save Settings
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  quickButton: {
    flex: 1,
  },
  settingItem: {
    marginVertical: 4,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    color: '#1976d2',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
})