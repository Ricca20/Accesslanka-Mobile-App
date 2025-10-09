import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native'
import { Text, TextInput, Button, Card, Divider, Avatar, IconButton } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'

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

      await updateProfile(formData)
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', 'Failed to update profile. Please try again.')
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
              Edit Profile
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Update your personal information
            </Text>

            <Divider style={styles.divider} />

            {/* Profile Photo */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Profile Photo
            </Text>
            
            <View style={styles.photoContainer}>
              <View style={styles.avatarContainer}>
                {formData.avatar_url ? (
                  <Image source={{ uri: formData.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Avatar.Text 
                    size={100} 
                    label={(formData.full_name || user?.email || "U").substring(0, 2).toUpperCase()}
                    style={styles.avatarPlaceholder}
                  />
                )}
                {formData.avatar_url && (
                  <IconButton
                    icon="close-circle"
                    size={24}
                    mode="contained"
                    style={styles.removePhotoButton}
                    onPress={removePhoto}
                  />
                )}
              </View>
              <View style={styles.photoButtons}>
                <Button
                  mode="outlined"
                  icon="camera-plus"
                  onPress={showPhotoOptions}
                  style={styles.photoButton}
                >
                  {formData.avatar_url ? 'Change Photo' : 'Add Photo'}
                </Button>
              </View>
            </View>

            <Divider style={styles.divider} />

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
              />
              <Text variant="bodySmall" style={styles.helperText}>
                Email cannot be changed. Contact support if needed.
              </Text>
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
              />
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
                numberOfLines={3}
                style={styles.input}
              />
              <Text variant="bodySmall" style={styles.helperText}>
                This helps us provide better recommendations for accessible places.
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
                Save Changes
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
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    backgroundColor: '#2E7D32',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    minWidth: 120,
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
  disabledInput: {
    backgroundColor: '#f5f5f5',
  },
  helperText: {
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
})