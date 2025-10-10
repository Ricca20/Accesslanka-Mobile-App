import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, Platform, Dimensions, Pressable, Modal } from 'react-native'
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
  IconButton,
  Surface,
  Checkbox
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'
import { LinearGradient } from 'expo-linear-gradient'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

const BUSINESS_CATEGORIES = [
  { label: 'Restaurant', value: 'restaurants', icon: 'silverware-fork-knife' },
  { label: 'Hotel', value: 'hotels', icon: 'bed' },
  { label: 'Shopping', value: 'shopping', icon: 'shopping' },
  { label: 'Education', value: 'education', icon: 'school' },
  { label: 'Entertainment', value: 'entertainment', icon: 'movie' },
  { label: 'Transport', value: 'transport', icon: 'bus' },
  { label: 'Government', value: 'government', icon: 'office-building' },
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
  const [activeSection, setActiveSection] = useState('basic')
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false)
  
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
      
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your business location.')
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      
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

      // Check if photos need to be uploaded
      const hasPhotosToUpload = formData.photos.some(uri => uri.startsWith('file://'))
      
      if (hasPhotosToUpload) {
        console.log('[AddMyBusinessScreen] Uploading photos to cloud storage...')
      }

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
        photos: formData.photos // Photos will be uploaded to Supabase Storage automatically
      }

      await DatabaseService.createBusinessSubmission(user.id, businessData)

      Alert.alert(
        'Success!',
        hasPhotosToUpload
          ? 'Your business and photos have been submitted for review. We\'ll notify you once it\'s approved and listed.'
          : 'Your business has been submitted for review. We\'ll notify you once it\'s approved and listed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )

    } catch (error) {
      console.error('Error submitting business:', error)
      Alert.alert(
        'Error', 
        error.message?.includes('upload') 
          ? 'Failed to upload photos. Please check your internet connection and try again.'
          : 'Failed to submit business. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const SectionHeader = ({ title, section, icon }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <IconButton icon={icon} size={20} iconColor="#2E7D32" />
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
      </View>
      <IconButton
        icon={activeSection === section ? 'chevron-up' : 'chevron-down'}
        size={20}
        onPress={() => setActiveSection(activeSection === section ? '' : section)}
      />
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Indicator */}
        <Surface style={styles.progressCard} elevation={2}>
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, activeSection === 'basic' && styles.progressActive]} />
              <Text style={[styles.progressText, activeSection === 'basic' && styles.progressTextActive]}>
                Basic Info
              </Text>
            </View>
            <View style={[styles.progressLine, activeSection !== 'basic' && styles.progressLineActive]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, activeSection === 'location' && styles.progressActive]} />
              <Text style={[styles.progressText, activeSection === 'location' && styles.progressTextActive]}>
                Location
              </Text>
            </View>
            <View style={[styles.progressLine, (activeSection === 'accessibility' || activeSection === 'photos') && styles.progressLineActive]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, (activeSection === 'accessibility' || activeSection === 'photos') && styles.progressActive]} />
              <Text style={[styles.progressText, (activeSection === 'accessibility' || activeSection === 'photos') && styles.progressTextActive]}>
                Features
              </Text>
            </View>
          </View>
        </Surface>

        {/* Basic Information Section */}
        <Surface style={styles.section} elevation={3}>
          <SectionHeader 
            title="Basic Information" 
            section="basic" 
            icon="store"
          />
          
          {activeSection === 'basic' && (
            <View style={styles.sectionContent}>
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
                  left={<TextInput.Icon icon="store" />}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#4CAF50"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={styles.label}>
                  Business Category *
                </Text>
                <Pressable onPress={() => setCategoryMenuVisible(true)}>
                  <TextInput
                    mode="outlined"
                    value={formData.category ? BUSINESS_CATEGORIES.find(cat => cat.value === formData.category)?.label : ''}
                    placeholder="Select business category"
                    editable={false}
                    pointerEvents="none"
                    right={<TextInput.Icon icon="chevron-down" />}
                    left={<TextInput.Icon icon="store-outline" />}
                    style={styles.input}
                    error={!!errors.category}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#4CAF50"
                  />
                </Pressable>
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
                  placeholder="Describe your business and accessibility features..."
                  multiline
                  numberOfLines={4}
                  error={!!errors.description}
                  style={[styles.input, styles.textArea]}
                  left={<TextInput.Icon icon="text" />}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#4CAF50"
                />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
              </View>
            </View>
          )}
        </Surface>

        {/* Location Information Section */}
        <Surface style={styles.section} elevation={3}>
          <SectionHeader 
            title="Location Information" 
            section="location" 
            icon="map-marker"
          />
          
          {activeSection === 'location' && (
            <View style={styles.sectionContent}>
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
                    left={<TextInput.Icon icon="map-marker" />}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#4CAF50"
                  />
                  <Button
                    mode="contained-tonal"
                    icon="crosshairs-gps"
                    loading={loadingLocation}
                    onPress={getCurrentLocation}
                    style={styles.locationButton}
                    compact
                  >
                    Current
                  </Button>
                </View>
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>
            </View>
          )}
        </Surface>

        {/* Contact Information Section */}
        <Surface style={styles.section} elevation={3}>
          <SectionHeader 
            title="Contact Information" 
            section="contact" 
            icon="phone"
          />
          
          {activeSection === 'contact' && (
            <View style={styles.sectionContent}>
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
                  left={<TextInput.Icon icon="phone" />}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#4CAF50"
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
                  left={<TextInput.Icon icon="web" />}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#4CAF50"
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
                  left={<TextInput.Icon icon="email" />}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#4CAF50"
                />
              </View>
            </View>
          )}
        </Surface>

        {/* Opening Hours Section */}
        <Surface style={styles.section} elevation={3}>
          <SectionHeader 
            title="Opening Hours" 
            section="hours" 
            icon="clock-outline"
          />
          
          {activeSection === 'hours' && (
            <View style={styles.sectionContent}>
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
            </View>
          )}
        </Surface>

        {/* Accessibility Features Section */}
        <Surface style={styles.section} elevation={3}>
          <SectionHeader 
            title="Accessibility Features" 
            section="accessibility" 
            icon="accessibility"
          />
          
          {activeSection === 'accessibility' && (
            <View style={styles.sectionContent}>
              <Text variant="bodyMedium" style={styles.featureDescription}>
                Select all accessibility features available at your location
              </Text>
              <View style={styles.accessibilityList}>
                {ACCESSIBILITY_FEATURES.map((feature) => (
                  <List.Item
                    key={feature.id}
                    title={feature.label}
                    left={() => <List.Icon icon={feature.icon} color="#4CAF50" />}
                    right={() => (
                      <Checkbox
                        status={formData.accessibility_features.includes(feature.id) ? 'checked' : 'unchecked'}
                        onPress={() => toggleAccessibilityFeature(feature.id)}
                      />
                    )}
                    onPress={() => toggleAccessibilityFeature(feature.id)}
                    style={styles.accessibilityItem}
                  />
                ))}
              </View>
            </View>
          )}
        </Surface>

        {/* Photos Section */}
        <Surface style={styles.section} elevation={3}>
          <SectionHeader 
            title="Photos" 
            section="photos" 
            icon="camera"
          />
          
          {activeSection === 'photos' && (
            <View style={styles.sectionContent}>
              <Button
                mode="contained-tonal"
                icon="camera-plus"
                onPress={pickImage}
                style={styles.photoButton}
              >
                Add Business Photos
              </Button>

              {formData.photos.length > 0 && (
                <View style={styles.photosContainer}>
                  <Text variant="bodyMedium" style={styles.photosLabel}>
                    Added Photos ({formData.photos.length})
                  </Text>
                  {formData.photos.map((photo, index) => (
                    <View key={index} style={styles.photoItem}>
                      <View style={styles.photoInfo}>
                        <IconButton icon="image" size={20} />
                        <Text variant="bodySmall" numberOfLines={1} style={styles.photoText}>
                          Photo {index + 1}
                        </Text>
                      </View>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removePhoto(index)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </Surface>

        {/* Submit Section */}
        <Surface style={styles.submitSection} elevation={3}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
            disabled={loading}
            icon="check-circle"
          >
            Submit for Review
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
        </Surface>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCategoryMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setCategoryMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Select Business Category
            </Text>
            <ScrollView style={styles.categoryList}>
              {BUSINESS_CATEGORIES.map((category) => (
                <Pressable
                  key={category.value}
                  style={[
                    styles.categoryOption,
                    formData.category === category.value && styles.selectedCategory
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, category: category.value }))
                    setCategoryMenuVisible(false)
                  }}
                >
                  <Icon name={category.icon} size={24} color="#4CAF50" />
                  <Text 
                    variant="bodyLarge" 
                    style={[
                      styles.categoryOptionText,
                      formData.category === category.value && styles.selectedCategoryText
                    ]}
                  >
                    {category.label}
                  </Text>
                  {formData.category === category.value && (
                    <Icon name="check" size={20} color="#4CAF50" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  backButton: {
    margin: 0,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  headerSpacer: {
    width: 48,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  progressCard: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#E8F5E8',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  progressActive: {
    backgroundColor: '#4CAF50',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#E0E0E0',
    flex: 1,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 20,
    backgroundColor: '#E8F5E8',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#2E7D32',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: '#D32F2F',
    marginTop: 4,
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedCategory: {
    backgroundColor: '#E8F5E8',
  },
  categoryOptionText: {
    marginLeft: 12,
    flex: 1,
    color: '#37474F',
  },
  selectedCategoryText: {
    color: '#2E7D32',
    fontWeight: '600',
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
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    fontWeight: '500',
  },
  featureDescription: {
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  accessibilityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  accessibilityItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
  },
  photoButton: {
    marginBottom: 16,
  },
  photosContainer: {
    marginBottom: 16,
  },
  photosLabel: {
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  photoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photoText: {
    marginLeft: 8,
    color: '#37474F',
  },
  submitSection: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  submitButton: {
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
  },
  cancelButton: {
    marginBottom: 16,
    borderColor: '#4CAF50',
    borderWidth: 2,
    borderRadius: 25,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    color: '#2E7D32',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
})