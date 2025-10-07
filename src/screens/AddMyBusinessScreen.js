import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native'
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Divider, 
  Chip,
  SegmentedButtons,
  Switch,
  List,
  IconButton
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'

const BUSINESS_CATEGORIES = [
  { label: 'Restaurant', value: 'restaurants' },
  { label: 'Hotel', value: 'hotels' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Museum', value: 'museums' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Transport', value: 'transport' },
  { label: 'Government', value: 'government' },
]

const ACCESSIBILITY_FEATURES = [
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: 'wheelchair-accessibility' },
  { id: 'accessible_restrooms', label: 'Accessible Restrooms', icon: 'toilet' },
  { id: 'elevator_access', label: 'Elevator Access', icon: 'elevator' },
  { id: 'braille_signs', label: 'Braille Signs', icon: 'braille' },
  { id: 'hearing_loop', label: 'Hearing Loop', icon: 'ear-hearing' },
  { id: 'accessible_parking', label: 'Accessible Parking', icon: 'car' },
  { id: 'wide_aisles', label: 'Wide Aisles', icon: 'resize' },
  { id: 'ramp_access', label: 'Ramp Access', icon: 'stairs-up' },
  { id: 'audio_guides', label: 'Audio Guides', icon: 'headphones' },
  { id: 'large_print', label: 'Large Print Menus', icon: 'format-size' },
]

export default function AddMyBusinessScreen({ navigation }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    phone: '',
    website: '',
    email: '',
    opening_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true },
    },
    accessibility_features: [],
    photos: [],
  })

  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Business name is required'
    if (!formData.category) newErrors.category = 'Business category is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true)
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your business location.')
        return
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({})
      
      // Get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      if (addressResult) {
        const addressStr = `${addressResult.street || ''} ${addressResult.city || ''} ${addressResult.region || ''}`.trim()
        setFormData(prev => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: addressStr || formData.address,
        }))
      }
    } catch (error) {
      console.error('Error getting location:', error)
      Alert.alert('Error', 'Failed to get location. Please enter address manually.')
    } finally {
      setLoadingLocation(false)
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required to add photos.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false,
      })

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, result.assets[0].uri]
        }))
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const toggleAccessibilityFeature = (featureId) => {
    setFormData(prev => ({
      ...prev,
      accessibility_features: prev.accessibility_features.includes(featureId)
        ? prev.accessibility_features.filter(id => id !== featureId)
        : [...prev.accessibility_features, featureId]
    }))
  }

  const updateOpeningHours = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value
        }
      }
    }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.')
      return
    }

    try {
      setLoading(true)

      // Prepare business data
      const businessData = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        phone: formData.phone.trim(),
        website: formData.website.trim() || null,
        email: formData.email.trim() || null,
        opening_hours: formData.opening_hours,
        accessibility_features: formData.accessibility_features,
        photos: formData.photos // This will be mapped to 'images' in the database
      }

      await DatabaseService.createBusinessSubmission(user.id, businessData)

      Alert.alert(
        'Success!',
        'Your business has been submitted for review. We\'ll notify you once it\'s approved and listed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )

    } catch (error) {
      console.error('Error submitting business:', error)
      Alert.alert('Error', 'Failed to submit business. Please try again.')
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
              Add My Business
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Submit your business to be listed on AccessLanka
            </Text>

            <Divider style={styles.divider} />

            {/* Basic Information */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Basic Information
            </Text>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>
                Business Name *
              </Text>
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your business name"
                error={!!errors.name}
                style={styles.input}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>
                Business Category *
              </Text>
              <SegmentedButtons
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                buttons={BUSINESS_CATEGORIES.slice(0, 4).map(cat => ({
                  value: cat.value,
                  label: cat.label,
                }))}
                style={styles.segmentedButtons}
              />
              {BUSINESS_CATEGORIES.length > 4 && (
                <SegmentedButtons
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  buttons={BUSINESS_CATEGORIES.slice(4).map(cat => ({
                    value: cat.value,
                    label: cat.label,
                  }))}
                  style={styles.segmentedButtons}
                />
              )}
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>
                Description *
              </Text>
              <TextInput
                mode="outlined"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe your business and what makes it special"
                multiline
                numberOfLines={3}
                error={!!errors.description}
                style={styles.input}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            {/* Location Information */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location Information
            </Text>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>
                Address *
              </Text>
              <View style={styles.addressContainer}>
                <TextInput
                  mode="outlined"
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  placeholder="Enter your business address"
                  error={!!errors.address}
                  style={[styles.input, styles.addressInput]}
                />
                <Button
                  mode="outlined"
                  icon="crosshairs-gps"
                  loading={loadingLocation}
                  onPress={getCurrentLocation}
                  style={styles.locationButton}
                >
                  Get Location
                </Button>
              </View>
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* Contact Information */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Contact Information
            </Text>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>
                Phone Number *
              </Text>
              <TextInput
                mode="outlined"
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="+94 71 234 5678"
                keyboardType="phone-pad"
                error={!!errors.phone}
                style={styles.input}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>
                Website
              </Text>
              <TextInput
                mode="outlined"
                value={formData.website}
                onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
                placeholder="https://yourwebsite.com"
                keyboardType="url"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>
                Email
              </Text>
              <TextInput
                mode="outlined"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="business@example.com"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            {/* Opening Hours */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Opening Hours
            </Text>
            
            {Object.entries(formData.opening_hours).map(([day, hours]) => (
              <View key={day} style={styles.dayContainer}>
                <View style={styles.dayHeader}>
                  <Text variant="labelLarge" style={styles.dayLabel}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Text>
                  <View style={styles.closedContainer}>
                    <Text variant="bodySmall">Closed</Text>
                    <Switch
                      value={!hours.closed}
                      onValueChange={(value) => updateOpeningHours(day, 'closed', !value)}
                    />
                  </View>
                </View>
                
                {!hours.closed && (
                  <View style={styles.timeContainer}>
                    <TextInput
                      mode="outlined"
                      label="Open"
                      value={hours.open}
                      onChangeText={(text) => updateOpeningHours(day, 'open', text)}
                      placeholder="09:00"
                      style={styles.timeInput}
                    />
                    <Text style={styles.timeSeparator}>to</Text>
                    <TextInput
                      mode="outlined"
                      label="Close"
                      value={hours.close}
                      onChangeText={(text) => updateOpeningHours(day, 'close', text)}
                      placeholder="18:00"
                      style={styles.timeInput}
                    />
                  </View>
                )}
              </View>
            ))}

            {/* Accessibility Features */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accessibility Features
            </Text>
            
            <View style={styles.accessibilityContainer}>
              {ACCESSIBILITY_FEATURES.map((feature) => (
                <Chip
                  key={feature.id}
                  mode={formData.accessibility_features.includes(feature.id) ? 'flat' : 'outlined'}
                  selected={formData.accessibility_features.includes(feature.id)}
                  onPress={() => toggleAccessibilityFeature(feature.id)}
                  icon={feature.icon}
                  style={styles.accessibilityChip}
                >
                  {feature.label}
                </Chip>
              ))}
            </View>

            {/* Photos */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Photos
            </Text>
            
            <Button
              mode="outlined"
              icon="camera-plus"
              onPress={pickImage}
              style={styles.photoButton}
            >
              Add Photos
            </Button>

            {formData.photos.length > 0 && (
              <View style={styles.photosContainer}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Text variant="bodySmall" numberOfLines={1}>
                      Photo {index + 1}
                    </Text>
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => removePhoto(index)}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Submit Buttons */}
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
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
                disabled={loading}
              >
                Submit for Review
              </Button>
            </View>

            <Text variant="bodySmall" style={styles.noteText}>
              Note: Your business will be reviewed by our team before being listed. This usually takes 1-3 business days.
            </Text>
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
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#2E7D32',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#D32F2F',
    marginTop: 4,
    fontSize: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
  },
  locationButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  dayContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLabel: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  closedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  timeSeparator: {
    color: '#666',
  },
  accessibilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  accessibilityChip: {
    marginBottom: 4,
  },
  photoButton: {
    marginBottom: 16,
  },
  photosContainer: {
    marginBottom: 16,
  },
  photoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  noteText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})