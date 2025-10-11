import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, Switch, Button, Surface, Divider, Chip } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'
import { LinearGradient } from 'expo-linear-gradient'
import AccessibilityService from '../services/AccessibilityService'

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

  useEffect(() => {
    // Announce screen when loaded
    AccessibilityService.announce("Accessibility Preferences screen. Customize your accessibility needs and preferences.", 500)
  }, [])

  const accessibilityTypes = [
    {
      key: 'mobility',
      title: 'Mobility',
      description: 'Wheelchair access, ramps, elevators',
      icon: 'wheelchair-accessibility',
      color: '#2E7D32',
      features: ['Wheelchair Access', 'Ramps', 'Elevators', 'Wide Doorways', 'Accessible Parking']
    },
    {
      key: 'visual',
      title: 'Visual',
      description: 'Braille, audio guides, high contrast',
      icon: 'eye',
      color: '#2196F3',
      features: ['Braille Signage', 'Audio Guides', 'High Contrast', 'Large Print', 'Guide Dog Friendly']
    },
    {
      key: 'hearing',
      title: 'Hearing',
      description: 'Sign language, hearing loops, visual alerts',
      icon: 'ear-hearing',
      color: '#FF9800',
      features: ['Sign Language', 'Hearing Loops', 'Visual Alerts', 'Captions', 'Quiet Spaces']
    },
    {
      key: 'cognitive',
      title: 'Cognitive',
      description: 'Clear signage, simple navigation, quiet spaces',
      icon: 'brain',
      color: '#9C27B0',
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
    AccessibilityService.announce(`${key} accessibility ${!preferences[key] ? 'enabled' : 'disabled'}`)
  }

  const togglePriorityFeature = (feature) => {
    setPriorityFeatures(prev => {
      if (prev.includes(feature)) {
        AccessibilityService.announce(`Removed ${feature} from priority features`)
        return prev.filter(f => f !== feature)
      } else {
        AccessibilityService.announce(`Added ${feature} to priority features`)
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

  const getActivePreferencesCount = () => {
    return Object.values(preferences).filter(Boolean).length
  }

  return (
    <View style={styles.container}>
      

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Accessibility Types Section */}
        <Surface style={styles.surface} elevation={3}>
          <View style={styles.sectionHeader}>
            <Icon name="account-cog" size={24} color="#2E7D32" />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Accessibility Needs
            </Text>
          </View>

          <View style={styles.preferencesGrid}>
            {accessibilityTypes.map((type) => (
              <Surface key={type.key} style={styles.preferenceCard} elevation={2}>
                <View style={styles.preferenceHeader}>
                  <View style={[styles.preferenceIcon, { backgroundColor: type.color }]}>
                    <Icon name={type.icon} size={20} color="#FFFFFF" />
                  </View>
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
                    color={type.color}
                  />
                </View>

                {preferences[type.key] && (
                  <View style={styles.featuresContainer}>
                    <Text variant="labelSmall" style={styles.featuresLabel}>
                      Priority features for {type.title}:
                    </Text>
                    <View style={styles.featuresChips}>
                      {type.features.map((feature) => (
                        <Chip
                          key={feature}
                          mode={priorityFeatures.includes(feature) ? 'flat' : 'outlined'}
                          selected={priorityFeatures.includes(feature)}
                          onPress={() => togglePriorityFeature(feature)}
                          style={[
                            styles.featureChip,
                            priorityFeatures.includes(feature) && { backgroundColor: type.color }
                          ]}
                          compact
                          textStyle={styles.chipText}
                        >
                          {feature}
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}
              </Surface>
            ))}
          </View>
        </Surface>

        {/* Information Section */}
        <Surface style={styles.surface} elevation={2}>
          <View style={styles.infoContainer}>
            <View style={styles.infoIcon}>
              <Icon name="information" size={24} color="#2196F3" />
            </View>
            <View style={styles.infoContent}>
              <Text variant="titleSmall" style={styles.infoTitle}>
                How This Helps
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                These preferences help us filter and prioritize accessible places for you. 
                You can always change them later in your profile settings.
              </Text>
            </View>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={loading}
            contentStyle={styles.buttonContent}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
            disabled={loading}
            contentStyle={styles.buttonContent}
            buttonColor="#2E7D32"
          >
            Save Preferences
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  // Header Styles
  headerGradient: {
    paddingBottom: 20,
  },
  headerSafeArea: {
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerPlaceholder: {
    width: 40,
  },
  // Scroll View
  scrollView: {
    flex: 1,
    marginTop: -10,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  // Main Surface
  mainSurface: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  sectionDescription: {
    color: '#6B7280',
    marginTop: 4,
  },
  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#6B7280',
    textAlign: 'center',
  },
  // Surface Styles
  surface: {
    marginHorizontal: 16,
    marginTop: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
  },
  // Preferences Grid
  preferencesGrid: {
    gap: 12,
  },
  preferenceCard: {
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    padding: 16,
    gap: 12,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 2,
  },
  preferenceDescription: {
    color: '#6B7280',
    lineHeight: 16,
  },
  // Features Container
  featuresContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  featuresLabel: {
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  featuresChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    marginRight: 0,
  },
  chipText: {
    fontSize: 12,
  },
  // Info Container
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    color: '#6B7280',
    lineHeight: 20,
  },
  // Button Container
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#6B7280',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})