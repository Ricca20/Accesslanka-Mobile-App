import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, Switch, Card, Button, Divider, Chip } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'

export default function AccessibilityPreferencesScreen({ navigation }) {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    mobility: false,
    visual: false,
    hearing: false,
    cognitive: false,
  })
  const [priorityFeatures, setPriorityFeatures] = useState([])

  const accessibilityTypes = [
    {
      key: 'mobility',
      title: 'Mobility',
      description: 'Wheelchair access, ramps, elevators',
      icon: 'wheelchair-accessibility',
      features: ['Wheelchair Access', 'Ramps', 'Elevators', 'Wide Doorways', 'Accessible Parking']
    },
    {
      key: 'visual',
      title: 'Visual',
      description: 'Braille, audio guides, high contrast',
      icon: 'eye',
      features: ['Braille Signage', 'Audio Guides', 'High Contrast', 'Large Print', 'Guide Dog Friendly']
    },
    {
      key: 'hearing',
      title: 'Hearing',
      description: 'Sign language, hearing loops, visual alerts',
      icon: 'ear-hearing',
      features: ['Sign Language', 'Hearing Loops', 'Visual Alerts', 'Captions', 'Quiet Spaces']
    },
    {
      key: 'cognitive',
      title: 'Cognitive',
      description: 'Clear signage, simple navigation, quiet spaces',
      icon: 'brain',
      features: ['Clear Signage', 'Simple Navigation', 'Quiet Environment', 'Staff Assistance', 'Calm Spaces']
    }
  ]

  useEffect(() => {
    if (user?.profile?.accessibility_needs) {
      // Parse existing accessibility needs
      const needs = user.profile.accessibility_needs.toLowerCase()
      setPreferences({
        mobility: needs.includes('mobility') || needs.includes('wheelchair'),
        visual: needs.includes('visual') || needs.includes('braille'),
        hearing: needs.includes('hearing') || needs.includes('deaf'),
        cognitive: needs.includes('cognitive') || needs.includes('autism'),
      })
    }
  }, [user])

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const togglePriorityFeature = (feature) => {
    setPriorityFeatures(prev => {
      if (prev.includes(feature)) {
        return prev.filter(f => f !== feature)
      } else {
        return [...prev, feature]
      }
    })
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      // Build accessibility needs string
      const activePreferences = Object.entries(preferences)
        .filter(([_, active]) => active)
        .map(([key, _]) => key)

      const accessibilityText = [
        ...activePreferences,
        ...priorityFeatures
      ].join(', ')

      await updateProfile({
        accessibility_needs: accessibilityText
      })

      Alert.alert(
        'Success',
        'Accessibility preferences saved!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (error) {
      console.error('Error saving preferences:', error)
      Alert.alert('Error', 'Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Accessibility Preferences
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Help us show you the most relevant accessible places
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Accessibility Needs
            </Text>

            {accessibilityTypes.map((type) => (
              <View key={type.key} style={styles.preferenceItem}>
                <View style={styles.preferenceHeader}>
                  <Icon name={type.icon} size={24} color="#2E7D32" />
                  <View style={styles.preferenceInfo}>
                    <Text variant="titleSmall" style={styles.preferenceTitle}>
                      {type.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.preferenceDescription}>
                      {type.description}
                    </Text>
                  </View>
                  <Switch
                    value={preferences[type.key]}
                    onValueChange={() => togglePreference(type.key)}
                    color="#2E7D32"
                  />
                </View>

                {preferences[type.key] && (
                  <View style={styles.featuresContainer}>
                    <Text variant="labelSmall" style={styles.featuresLabel}>
                      Priority features:
                    </Text>
                    <View style={styles.featuresChips}>
                      {type.features.map((feature) => (
                        <Chip
                          key={feature}
                          mode={priorityFeatures.includes(feature) ? 'flat' : 'outlined'}
                          selected={priorityFeatures.includes(feature)}
                          onPress={() => togglePriorityFeature(feature)}
                          style={styles.featureChip}
                          compact
                        >
                          {feature}
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}

            <Divider style={styles.divider} />

            <View style={styles.infoBox}>
              <Icon name="information" size={20} color="#2196F3" />
              <Text variant="bodySmall" style={styles.infoText}>
                These preferences help us filter and prioritize accessible places for you. 
                You can always change them later.
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
                Save Preferences
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
  sectionTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  preferenceItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  preferenceDescription: {
    color: '#666',
    marginTop: 2,
  },
  featuresContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  featuresLabel: {
    color: '#666',
    marginBottom: 8,
  },
  featuresChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    marginRight: 0,
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