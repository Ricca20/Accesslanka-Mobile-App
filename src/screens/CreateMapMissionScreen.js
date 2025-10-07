import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native'
import { 
  Text, 
  Card, 
  Button, 
  TextInput, 
  SegmentedButtons,
  Surface,
  Chip,
  ActivityIndicator 
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'

// Conditionally import DateTimePicker for native platforms
let DateTimePicker
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default
}

export default function CreateMapMissionScreen({ route, navigation }) {
  const { user } = useAuth()
  const { business } = route.params || {}
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: `${business?.name || 'Business'} Accessibility Mission`,
    description: `Help map accessibility features for ${business?.name || 'this business'} to make it more accessible for everyone.`,
    maxParticipants: '5',
    duration: 'week',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    difficultyLevel: 'beginner',
    rewards: 'accessibility_mapper',
  })
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)

  const durationOptions = [
    { value: 'day', label: '1 Day' },
    { value: 'week', label: '1 Week' },
    { value: 'month', label: '1 Month' },
  ]

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ]

  const rewardOptions = [
    { key: 'accessibility_mapper', label: 'Accessibility Mapper', icon: 'wheelchair-accessibility' },
    { key: 'community_champion', label: 'Community Champion', icon: 'account-group' },
    { key: 'detail_specialist', label: 'Detail Specialist', icon: 'magnify' },
    { key: 'trail_blazer', label: 'Trail Blazer', icon: 'compass' },
  ]

  const participantOptions = [
    { value: '3', label: '3' },
    { value: '5', label: '5' },
    { value: '10', label: '10' },
    { value: '15', label: '15' },
  ]

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDurationChange = (duration) => {
    updateFormData('duration', duration)
    
    // Auto-update end date based on duration
    const start = formData.startDate
    let end
    switch (duration) {
      case 'day':
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'week':
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      default:
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
    updateFormData('endDate', end)
  }

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false)
    if (selectedDate) {
      updateFormData('startDate', selectedDate)
      
      // Update end date to maintain duration
      const duration = formData.duration
      let end
      switch (duration) {
        case 'day':
          end = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
          break
        case 'week':
          end = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          end = new Date(selectedDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          break
        default:
          end = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
      updateFormData('endDate', end)
    }
  }

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false)
    if (selectedDate && selectedDate > formData.startDate) {
      updateFormData('endDate', selectedDate)
    } else if (selectedDate) {
      Alert.alert('Invalid Date', 'End date must be after start date.')
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a mission title.')
      return false
    }
    
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a mission description.')
      return false
    }
    
    if (formData.startDate >= formData.endDate) {
      Alert.alert('Validation Error', 'End date must be after start date.')
      return false
    }
    
    if (formData.startDate < new Date()) {
      Alert.alert('Validation Error', 'Start date cannot be in the past.')
      return false
    }
    
    return true
  }

  const handleCreateMission = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const missionData = {
        business_id: business?.id,
        business_name: business?.name,
        title: formData.title.trim(),
        description: formData.description.trim(),
        max_participants: parseInt(formData.maxParticipants),
        start_date: formData.startDate.toISOString(),
        end_date: formData.endDate.toISOString(),
        difficulty_level: formData.difficultyLevel,
        reward_badge: formData.rewards,
        status: 'upcoming',
        created_by: user.id,
      }

      const result = await DatabaseService.createMapMission(missionData)
      
      if (result) {
        Alert.alert(
          'Mission Created!',
          `Your MapMission "${formData.title}" has been created successfully. Other users can now join and help map accessibility features.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        )
      }
    } catch (error) {
      console.error('Error creating mission:', error)
      Alert.alert('Error', 'Failed to create mission. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color="#F44336" />
          <Text variant="titleMedium" style={styles.errorTitle}>
            No Business Selected
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            Please select a business to create a MapMission.
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Business Info */}
        <Card style={styles.businessCard}>
          <Card.Content>
            <View style={styles.businessHeader}>
              <Icon name="store" size={24} color="#2E7D32" />
              <Text variant="titleMedium" style={styles.businessName}>
                {business.name}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.businessAddress}>
              {business.address}
            </Text>
            <Chip 
              icon="tag" 
              style={styles.categoryChip}
              textStyle={{ color: '#2E7D32' }}
            >
              {business.category}
            </Chip>
          </Card.Content>
        </Card>

        {/* Mission Details Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Mission Details
            </Text>
            
            <TextInput
              label="Mission Title"
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              style={styles.input}
              maxLength={100}
            />
            
            <TextInput
              label="Mission Description"
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              style={styles.input}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </Card.Content>
        </Card>

        {/* Participants & Duration */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Mission Settings
            </Text>
            
            <Text variant="bodyMedium" style={styles.fieldLabel}>
              Maximum Participants
            </Text>
            <SegmentedButtons
              value={formData.maxParticipants}
              onValueChange={(value) => updateFormData('maxParticipants', value)}
              buttons={participantOptions}
              style={styles.segmentedButtons}
            />
            
            <Text variant="bodyMedium" style={styles.fieldLabel}>
              Mission Duration
            </Text>
            <SegmentedButtons
              value={formData.duration}
              onValueChange={handleDurationChange}
              buttons={durationOptions}
              style={styles.segmentedButtons}
            />
            
            <Text variant="bodyMedium" style={styles.fieldLabel}>
              Difficulty Level
            </Text>
            <SegmentedButtons
              value={formData.difficultyLevel}
              onValueChange={(value) => updateFormData('difficultyLevel', value)}
              buttons={difficultyOptions}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Date Selection */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Mission Timeline
            </Text>
            
            <Surface style={styles.dateContainer}>
              <View style={styles.dateRow}>
                <Icon name="calendar-start" size={20} color="#2E7D32" />
                <Text variant="bodyMedium" style={styles.dateLabel}>Start Date</Text>
                <Button 
                  mode="outlined" 
                  onPress={() => Platform.OS !== 'web' ? setShowStartDatePicker(true) : Alert.alert('Date Picker', 'Date picker not available on web')}
                  compact
                >
                  {formData.startDate.toLocaleDateString()}
                </Button>
              </View>
              
              <View style={styles.dateRow}>
                <Icon name="calendar-end" size={20} color="#2E7D32" />
                <Text variant="bodyMedium" style={styles.dateLabel}>End Date</Text>
                <Button 
                  mode="outlined" 
                  onPress={() => Platform.OS !== 'web' ? setShowEndDatePicker(true) : Alert.alert('Date Picker', 'Date picker not available on web')}
                  compact
                >
                  {formData.endDate.toLocaleDateString()}
                </Button>
              </View>
            </Surface>
          </Card.Content>
        </Card>

        {/* Reward Selection */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Mission Reward
            </Text>
            
            <View style={styles.rewardContainer}>
              {rewardOptions.map((reward) => (
                <Chip
                  key={reward.key}
                  selected={formData.rewards === reward.key}
                  onPress={() => updateFormData('rewards', reward.key)}
                  icon={reward.icon}
                  style={styles.rewardChip}
                >
                  {reward.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Create Button */}
        <Button
          mode="contained"
          onPress={handleCreateMission}
          loading={loading}
          disabled={loading}
          style={styles.createButton}
          icon="rocket-launch"
        >
          {loading ? 'Creating Mission...' : 'Create MapMission'}
        </Button>
      </ScrollView>

      {/* Date Pickers */}
      {Platform.OS !== 'web' && DateTimePicker && showStartDatePicker && (
        <DateTimePicker
          value={formData.startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {Platform.OS !== 'web' && DateTimePicker && showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={formData.startDate}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#F44336',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  businessCard: {
    marginBottom: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessName: {
    marginLeft: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
    flex: 1,
  },
  businessAddress: {
    color: '#666',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
  },
  formCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  dateContainer: {
    padding: 16,
    borderRadius: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    flex: 1,
    marginLeft: 12,
    color: '#333',
  },
  rewardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardChip: {
    marginBottom: 8,
  },
  createButton: {
    marginTop: 16,
    marginBottom: 32,
    paddingVertical: 8,
  },
})
