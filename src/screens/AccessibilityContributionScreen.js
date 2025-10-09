import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import {
  Text,
  Card,
  Button,
  TextInput,
  RadioButton,
  Chip,
  ActivityIndicator,
  ProgressBar,
  Divider
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { DatabaseService } from '../lib/database'
import { useAuth } from '../context/AuthContext'

// ImagePicker options - compatible with both old and new versions
const imagePickerOptions = {
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
  base64: false,
}

const DIFFICULTY_LEVELS = [
  { key: 'easy', label: 'Easy Access', color: '#4CAF50' },
  { key: 'moderate', label: 'Moderate', color: '#FF9800' },
  { key: 'difficult', label: 'Difficult', color: '#FF5722' },
  { key: 'impossible', label: 'Impossible', color: '#F44336' }
]

export default function AccessibilityContributionScreen({ route, navigation }) {
  const { mission, business } = route.params
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('photos') // photos, reviews, ratings
  const [loading, setLoading] = useState(false)
  const [userContributions, setUserContributions] = useState(null)
  
  // Photo state
  const [photoDescription, setPhotoDescription] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [isHelpful, setIsHelpful] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  
  // Review state
  const [reviewText, setReviewText] = useState('')
  const [difficultyLevel, setDifficultyLevel] = useState('easy')
  const [helpfulnessRating, setHelpfulnessRating] = useState(5)
  
  // Rating state - now stores ratings for each feature
  const [featureRatings, setFeatureRatings] = useState({})
  const [ratingNotes, setRatingNotes] = useState('')

  // Get available features directly from business accessibility features
  const getAvailableFeatures = () => {
    const businessFeatures = business?.accessibility_features || []
    
    // If no features declared by business, return empty array
    if (businessFeatures.length === 0) {
      return []
    }
    
    // Map business accessibility features to display format
    return businessFeatures.map(feature => {
      // Convert snake_case to display format
      const label = feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      
      // Map to appropriate icons
      const iconMap = {
        'wheelchair_accessible': 'wheelchair-accessibility',
        'accessible_restrooms': 'toilet',
        'elevator_access': 'elevator',
        'braille_signs': 'braille',
        'hearing_loop': 'ear-hearing',
        'accessible_parking': 'car',
        'wide_aisles': 'resize',
        'ramp_access': 'stairs-up',
        'audio_guides': 'headphones',
        'large_print': 'format-size',
      }
      
      return {
        key: feature, // Use the original business feature key
        label: label,
        icon: iconMap[feature] || 'check-circle'
      }
    })
  }

  const availableFeatures = getAvailableFeatures()

  useEffect(() => {
    loadUserContributions()
    requestPermissions()
    
    // Initialize feature ratings with default values
    if (availableFeatures.length > 0) {
      const initialRatings = {}
      availableFeatures.forEach(feature => {
        initialRatings[feature.key] = 5 // Default rating of 5
      })
      setFeatureRatings(initialRatings)
    }
    
    // Debug business features  
    console.log('Business accessibility features:', business?.accessibility_features)
    console.log('Available features for rating:', availableFeatures.map(f => ({ key: f.key, label: f.label })))
  }, [business])

  const requestPermissions = async () => {
    try {
      // Request media library permissions
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (mediaLibraryPermission.status !== 'granted') {
        Alert.alert('Permission Required', 'We need photo library access to choose images.')
        return false
      }

      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera access to take photos.')
        return false
      }

      return true
    } catch (error) {
      console.error('Error requesting permissions:', error)
      Alert.alert('Permission Error', 'Unable to request permissions. Please check your device settings.')
      return false
    }
  }

  const loadUserContributions = async () => {
    try {
      if (user && mission) {
        const contributions = await DatabaseService.getUserMissionContributions(mission.id, user.id)
        setUserContributions(contributions)
      }
    } catch (error) {
      console.error('Error loading user contributions:', error)
    }
  }

  const pickImage = async () => {
    try {
      // Check permissions first
      const hasPermissions = await requestPermissions()
      if (!hasPermissions) return

      const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions)

      console.log('Image picker result:', result)

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0])
        console.log('Selected image:', result.assets[0])
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const takePhoto = async () => {
    try {
      // Check permissions first
      const hasPermissions = await requestPermissions()
      if (!hasPermissions) return

      // Check if camera is available
      const cameraAvailable = await ImagePicker.getCameraPermissionsAsync()
      if (cameraAvailable.status !== 'granted') {
        Alert.alert('Camera Permission', 'Camera permission is required to take photos.')
        return
      }

      const result = await ImagePicker.launchCameraAsync(imagePickerOptions)

      console.log('Camera result:', result)

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0])
        console.log('Captured image:', result.assets[0])
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Camera Error', 'Failed to take photo. Please try again.')
    }
  }

  const handleSubmitPhoto = async () => {
    if (availableFeatures.length === 0) {
      Alert.alert('No Features Available', 'This business has not declared any accessibility features to rate.')
      return
    }

    if (!selectedImage) {
      Alert.alert('Error', 'Please select a photo first')
      return
    }

    if (!selectedImage.uri) {
      Alert.alert('Error', 'Invalid image selected. Please try again.')
      return
    }

    if (!photoDescription.trim()) {
      Alert.alert('Error', 'Please add a description for the photo')
      return
    }

    setLoading(true)
    try {
      console.log('Starting photo upload...')
      console.log('Selected image details:', selectedImage)

      // Upload photo and get URL
      const { photoPath, photoUrl } = await DatabaseService.uploadAccessibilityPhoto(
        selectedImage,
        mission.id,
        business.id,
        user.id
      )

      console.log('Photo uploaded successfully:', { photoPath, photoUrl })

      // Save photo record to database - use general accessibility feature
      const photoData = {
        mission_id: mission.id,
        business_id: business.id,
        user_id: user.id,
        photo_url: photoUrl,
        photo_path: photoPath,
        feature_type: 'general_accessibility', // Generic feature type for photos
        feature_description: photoDescription.trim(),
        location_description: locationDescription.trim() || null,
        is_helpful: isHelpful
      }

      console.log('Saving photo data to database:', photoData)
      await DatabaseService.addAccessibilityPhoto(photoData)

      // Reset form
      setSelectedImage(null)
      setPhotoDescription('')
      setLocationDescription('')
      setIsHelpful(true)

      // Refresh contributions
      await loadUserContributions()

      Alert.alert('Success', 'Photo added successfully!')
    } catch (error) {
      console.error('Error adding photo:', error)
      Alert.alert('Error', 'Failed to add photo. Please try again.\n\nError: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (availableFeatures.length === 0) {
      Alert.alert('No Features Available', 'This business has not declared any accessibility features to rate.')
      return
    }

    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write a review')
      return
    }

    setLoading(true)
    try {
      const reviewData = {
        mission_id: mission.id,
        business_id: business.id,
        user_id: user.id,
        feature_type: 'general_accessibility', // Generic feature type for reviews
        review_text: reviewText.trim(),
        difficulty_level: difficultyLevel,
        helpfulness_rating: helpfulnessRating
      }

      await DatabaseService.addAccessibilityReview(reviewData)

      // Reset form
      setReviewText('')
      setDifficultyLevel('easy')
      setHelpfulnessRating(5)

      // Refresh contributions
      await loadUserContributions()

      Alert.alert('Success', 'Review added successfully!')
    } catch (error) {
      console.error('Error adding review:', error)
      Alert.alert('Error', 'Failed to add review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRating = async () => {
    if (availableFeatures.length === 0) {
      Alert.alert('No Features Available', 'This business has not declared any accessibility features to rate.')
      return
    }

    // Check if all features have been rated
    const unratedFeatures = availableFeatures.filter(feature => !featureRatings[feature.key])
    if (unratedFeatures.length > 0) {
      Alert.alert('Error', 'Please rate all accessibility features before submitting.')
      return
    }

    setLoading(true)
    try {
      // Submit ratings for each feature
      const ratingPromises = availableFeatures.map(async (feature) => {
        const ratingData = {
          mission_id: mission.id,
          business_id: business.id,
          user_id: user.id,
          feature_type: feature.key,
          accessibility_rating: featureRatings[feature.key],
          availability_rating: featureRatings[feature.key], // Using same rating for all aspects
          condition_rating: featureRatings[feature.key], // You can modify this if you want separate ratings
          notes: ratingNotes.trim() || null
        }

        return DatabaseService.addAccessibilityRating(ratingData)
      })

      await Promise.all(ratingPromises)

      // Reset form
      const resetRatings = {}
      availableFeatures.forEach(feature => {
        resetRatings[feature.key] = 5
      })
      setFeatureRatings(resetRatings)
      setRatingNotes('')

      // Refresh contributions
      await loadUserContributions()

      Alert.alert('Success', `Ratings for ${availableFeatures.length} features saved successfully!`)
    } catch (error) {
      console.error('Error adding ratings:', error)
      Alert.alert('Error', 'Failed to save ratings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderProgressBar = () => {
    if (!userContributions) return null

    const totalContributions = userContributions.total_contributions || 0
    const targetContributions = 30 // Example target
    const progress = Math.min(totalContributions / targetContributions, 1)

    return (
      <Card style={styles.progressCard}>
        <Card.Content>
          <View style={styles.progressHeader}>
            <Icon name="target" size={24} color="#2E7D32" />
            <Text variant="titleMedium" style={styles.progressTitle}>
              Your Mission Progress
            </Text>
          </View>
          
          <ProgressBar 
            progress={progress} 
            color="#4CAF50" 
            style={styles.progressBar}
          />
          
          <View style={styles.contributionStats}>
            <View style={styles.statItem}>
              <Icon name="camera" size={16} color="#FF5722" />
              <Text variant="bodySmall">{userContributions.photos_count || 0} Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="comment-text" size={16} color="#2196F3" />
              <Text variant="bodySmall">{userContributions.reviews_count || 0} Reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="star" size={16} color="#FF9800" />
              <Text variant="bodySmall">{userContributions.ratings_count || 0} Ratings</Text>
            </View>
          </View>
          
          <Text variant="bodySmall" style={styles.progressText}>
            {totalContributions}  contributions completed
          </Text>
        </Card.Content>
      </Card>
    )
  }

  const renderPhotoTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Add Accessibility Photo
          </Text>

          {selectedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Icon name="close-circle" size={24} color="#FF5722" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.imageButtons}>
            <Button
              mode="outlined"
              onPress={takePhoto}
              icon="camera"
              style={styles.imageButton}
            >
              Take Photo
            </Button>
            <Button
              mode="outlined"
              onPress={pickImage}
              icon="image"
              style={styles.imageButton}
            >
              Choose Image
            </Button>
          </View>

          <TextInput
            label="Photo Description"
            value={photoDescription}
            onChangeText={setPhotoDescription}
            multiline
            numberOfLines={3}
            style={styles.textInput}
            placeholder="Describe what this photo shows about accessibility..."
          />

          <TextInput
            label="Location Description (Optional)"
            value={locationDescription}
            onChangeText={setLocationDescription}
            style={styles.textInput}
            placeholder="e.g., Main entrance, Second floor restroom..."
          />

          <View style={styles.radioGroup}>
            <Text variant="bodyMedium" style={styles.radioLabel}>
              This photo shows:
            </Text>
            <View style={styles.radioOptions}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setIsHelpful(true)}
              >
                <RadioButton
                  value="helpful"
                  status={isHelpful ? 'checked' : 'unchecked'}
                  onPress={() => setIsHelpful(true)}
                />
                <Text>Helpful accessibility feature</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setIsHelpful(false)}
              >
                <RadioButton
                  value="barrier"
                  status={!isHelpful ? 'checked' : 'unchecked'}
                  onPress={() => setIsHelpful(false)}
                />
                <Text>Accessibility barrier or issue</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmitPhoto}
            loading={loading}
            disabled={loading || !selectedImage || availableFeatures.length === 0}
            style={styles.submitButton}
          >
            Add Photo
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )

  const renderReviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Add Accessibility Review
          </Text>

          <TextInput
            label="Your Review"
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={4}
            style={styles.textInput}
            placeholder="Share your experience with this accessibility feature..."
          />

          <Button
            mode="contained"
            onPress={handleSubmitReview}
            loading={loading}
            disabled={loading || !reviewText.trim() || availableFeatures.length === 0}
            style={styles.submitButton}
          >
            Add Review
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )

  const renderRatingTab = () => (
    <ScrollView style={styles.tabContent}>
      {availableFeatures.length === 0 ? (
        <View style={styles.featureSelector}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            No Accessibility Features Available
          </Text>
          <Card style={styles.noFeaturesCard}>
            <Card.Content>
              <Icon name="information-outline" size={24} color="#666" style={styles.noFeaturesIcon} />
              <Text variant="bodyMedium" style={styles.noFeaturesText}>
                This business has not declared any specific accessibility features to rate.
                Please contact the business owner to add accessibility features.
              </Text>
            </Card.Content>
          </Card>
        </View>
      ) : (
        <View>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Rate Accessibility Features
          </Text>
          <Text variant="bodySmall" style={styles.featureSelectorSubtitle}>
            Rate each feature this business offers ({availableFeatures.length} features)
          </Text>

          {availableFeatures.map((feature) => (
            <Card key={feature.key} style={styles.featureRatingCard}>
              <Card.Content>
                <View style={styles.featureRatingHeader}>
                  <Icon name={feature.icon} size={24} color="#4CAF50" />
                  <Text variant="titleMedium" style={styles.featureRatingTitle}>
                    {feature.label}
                  </Text>
                </View>
                
                <View style={styles.ratingGroup}>
                  <Text variant="bodyMedium" style={styles.ratingLabel}>
                    Rating: {featureRatings[feature.key] || 5}/5
                  </Text>
                  <Text variant="bodySmall" style={styles.ratingDescription}>
                    How would you rate this accessibility feature?
                  </Text>
                  <View style={styles.starRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setFeatureRatings(prev => ({
                          ...prev,
                          [feature.key]: star
                        }))}
                      >
                        <Icon
                          name={star <= (featureRatings[feature.key] || 5) ? 'star' : 'star-outline'}
                          size={28}
                          color="#4CAF50"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}

          <Card style={styles.formCard}>
            <Card.Content>
              <TextInput
                label="Additional Notes (Optional)"
                value={ratingNotes}
                onChangeText={setRatingNotes}
                multiline
                numberOfLines={3}
                style={styles.textInput}
                placeholder="Any additional notes about these accessibility features..."
              />

              <Button
                mode="contained"
                onPress={handleSubmitRating}
                loading={loading}
                disabled={loading || availableFeatures.length === 0}
                style={styles.submitButton}
              >
                Submit All Ratings
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}
    </ScrollView>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'photos':
        return renderPhotoTab()
      case 'reviews':
        return renderReviewTab()
      case 'ratings':
        return renderRatingTab()
      default:
        return renderPhotoTab()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text variant="titleMedium" style={styles.headerTitle}>
              Contribute to Mission
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {business?.name || 'Unknown Business'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
        >
          <Icon name="camera" size={20} color={activeTab === 'photos' ? '#4CAF50' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
            Photos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Icon name="comment-text" size={20} color={activeTab === 'reviews' ? '#4CAF50' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Reviews
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ratings' && styles.activeTab]}
          onPress={() => setActiveTab('ratings')}
        >
          <Icon name="star" size={20} color={activeTab === 'ratings' ? '#4CAF50' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'ratings' && styles.activeTabText]}>
            Ratings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderTabContent()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressCard: {
    margin: 16,
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  contributionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    textAlign: 'center',
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  featureRatingCard: {
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureRatingTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    flex: 1,
  },
  formCard: {
    marginBottom: 16,
  },
  cardTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
  },
  textInput: {
    marginBottom: 16,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioLabel: {
    fontWeight: '500',
    marginBottom: 8,
  },
  radioOptions: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultySelector: {
    marginBottom: 16,
  },
  difficultyOptions: {
    gap: 8,
  },
  difficultyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
  },
  ratingSelector: {
    marginBottom: 16,
  },
  starRating: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  ratingGroup: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontWeight: '500',
    marginBottom: 4,
  },
  ratingDescription: {
    color: '#666',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 8,
  },
})