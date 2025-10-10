import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, Image, Dimensions } from 'react-native'
import { Text, TextInput, Button, Card, Divider, Avatar, IconButton, Surface } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'

const { width } = Dimensions.get('window')

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
    accessibility_needs: '',
    avatar_url: '',
  })

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        full_name: user.profile.full_name || user.user_metadata?.full_name || '',
        location: user.profile.location || '',
        accessibility_needs: user.profile.accessibility_needs || '',
        avatar_url: user.profile.avatar_url || '',
      })
    }
  }, [user])

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
        aspect: [1, 1], // Square aspect ratio for profile photos
        quality: 0.8,
        allowsMultipleSelection: false,
      })

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, avatar_url: result.assets[0].uri })
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile photos
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, avatar_url: result.assets[0].uri })
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo. Please try again.')
    }
  }

  const removePhoto = () => {
    setFormData({ ...formData, avatar_url: '' })
  }

  const showPhotoOptions = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add your profile photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Validate required fields
      if (!formData.full_name.trim()) {
        Alert.alert('Error', 'Full name is required')
        return
      }

      // Check if avatar is being uploaded
      const isUploadingAvatar = formData.avatar_url && formData.avatar_url.startsWith('file://')
      
      if (isUploadingAvatar) {
        console.log('[EditProfileScreen] Uploading new avatar to cloud storage...')
      }

      await updateProfile(formData)
      
      Alert.alert(
        'Success',
        isUploadingAvatar 
          ? 'Profile and photo updated successfully!'
          : 'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert(
        'Error', 
        error.message?.includes('upload') 
          ? 'Failed to upload photo. Please check your internet connection and try again.'
          : 'Failed to update profile. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Photo Section */}
        <Surface style={styles.photoSection} elevation={3}>
          <View style={styles.photoContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Profile Photo
            </Text>
            
            <View style={styles.avatarContainer}>
              {formData.avatar_url ? (
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: formData.avatar_url }} style={styles.avatarImage} />
                  <IconButton
                    icon="close-circle"
                    size={28}
                    iconColor="#FF5722"
                    style={styles.removePhotoButton}
                    onPress={removePhoto}
                  />
                </View>
              ) : (
                <View style={styles.avatarWrapper}>
                  <Avatar.Text 
                    size={120} 
                    label={(formData.full_name || user?.email || "U").substring(0, 2).toUpperCase()}
                    style={styles.avatarPlaceholder}
                  />
                </View>
              )}
            </View>
            
            <Button
              mode="contained"
              icon="camera-plus"
              onPress={showPhotoOptions}
              style={styles.photoButton}
              contentStyle={styles.photoButtonContent}
            >
              {formData.avatar_url ? 'Change Photo' : 'Add Photo'}
            </Button>
          </View>
        </Surface>

        {/* Personal Information Section */}
        <Surface style={styles.formSection} elevation={3}>
          <View style={styles.sectionHeader}>
            <Icon name="account-edit" size={24} color="#4CAF50" />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Personal Information
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text variant="labelLarge" style={styles.label}>
              Full Name *
            </Text>
            <TextInput
              mode="outlined"
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholder="Enter your full name"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
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
              value={user?.email || ''}
              editable={false}
              placeholder="Email cannot be changed"
              style={[styles.input, styles.disabledInput]}
              left={<TextInput.Icon icon="email" />}
              outlineColor="#E0E0E0"
            />
            <View style={styles.helperContainer}>
              <Icon name="information" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.helperText}>
                Email cannot be changed. Contact support if needed.
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text variant="labelLarge" style={styles.label}>
              Location
            </Text>
            <TextInput
              mode="outlined"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="e.g., Colombo, Sri Lanka"
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" />}
              outlineColor="#E0E0E0"
              activeOutlineColor="#4CAF50"
            />
          </View>
        </Surface>

        {/* Accessibility Section */}
        <Surface style={styles.formSection} elevation={3}>
          <View style={styles.sectionHeader}>
            <Icon name="wheelchair-accessibility" size={24} color="#4CAF50" />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accessibility Preferences
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text variant="labelLarge" style={styles.label}>
              Accessibility Needs
            </Text>
            <TextInput
              mode="outlined"
              value={formData.accessibility_needs}
              onChangeText={(text) => setFormData({ ...formData, accessibility_needs: text })}
              placeholder="Describe any accessibility requirements"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textAreaInput]}
              left={<TextInput.Icon icon="heart-pulse" />}
              outlineColor="#E0E0E0"
              activeOutlineColor="#4CAF50"
            />
            <View style={styles.helperContainer}>
              <Icon name="lightbulb-on" size={16} color="#4CAF50" />
              <Text variant="bodySmall" style={styles.helperText}>
                This helps us provide better recommendations for accessible places.
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
            contentStyle={styles.buttonContent}
            disabled={loading}
            icon="cancel"
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
            contentStyle={styles.buttonContent}
            disabled={loading}
            icon="content-save"
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
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
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48, // Same width as back button for centering
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  photoSection: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  formSection: {
    margin: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  photoContainer: {
    padding: 24,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    borderWidth: 4,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  avatarPlaceholder: {
    backgroundColor: '#4CAF50',
    borderWidth: 4,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    elevation: 2,
  },
  photoButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    minWidth: 150,
  },
  photoButtonContent: {
    paddingVertical: 8,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  label: {
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 100,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  helperText: {
    color: '#666',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#4CAF50',
    borderWidth: 2,
    borderRadius: 25,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})