import { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Portal, Dialog, TextInput, Button, Text, HelperText } from 'react-native-paper'
import { useTheme } from '../context/ThemeContext'
import { DatabaseService } from '../lib/database'
import { supabase } from '../config/supabase'
import AccessibilityService from '../services/AccessibilityService'

export default function ChangePasswordModal({ visible, onDismiss, onSuccess }) {
  const { currentTheme } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const styles = createStyles(currentTheme)

  useEffect(() => {
    if (visible) {
      AccessibilityService.announce("Change password dialog opened. Enter your current password and choose a new password.", 500)
    }
  }, [visible])

  const validateForm = () => {
    const newErrors = {}

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    } else if (currentPassword && newPassword === currentPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChangePassword = async () => {
    if (!validateForm()) {
      AccessibilityService.announce("Form has errors. Please check your input.")
      return
    }

    AccessibilityService.announce("Changing password, please wait")
    setLoading(true)
    try {
      // Get current user
      const { user } = await DatabaseService.getCurrentUser()
      if (!user?.email) {
        throw new Error('No authenticated user found')
      }

      // Step 1: Reauthenticate with current password to verify identity
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (reauthError) {
        console.error('Reauthentication error:', reauthError)
        setErrors({ currentPassword: 'Current password is incorrect' })
        setLoading(false)
        return
      }

      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw updateError
      }

      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})

      // Close modal first
      onDismiss()

      // Call success callback after modal is dismissed (small delay to ensure modal closes first)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 300)
    } catch (error) {
      console.error('Error changing password:', error)
      
      // Handle specific error cases
      let errorMessage = 'Failed to change password. Please try again.'
      
      if (error.message?.includes('session') || error.message?.includes('authenticated')) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.message?.includes('same')) {
        errorMessage = 'New password must be different from current password.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setErrors({ 
        general: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setErrors({})
    onDismiss()
  }

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={handleCancel}
        style={styles.dialog}
        accessible={true}
        accessibilityLabel="Change password dialog"
        accessibilityViewIsModal={true}
      >
        <Dialog.Title 
          accessible={true}
          accessibilityRole="header"
        >
          Change Password
        </Dialog.Title>
        <Dialog.Content>
          <Text 
            variant="bodyMedium" 
            style={styles.description}
            accessible={true}
            accessibilityLabel="Enter your current password and choose a new password"
          >
            Enter your current password and choose a new password.
          </Text>

          {errors.general && (
            <HelperText 
              type="error" 
              visible={true} 
              style={styles.errorText}
              {...AccessibilityService.errorProps(errors.general)}
            >
              {errors.general}
            </HelperText>
          )}

          <TextInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            error={!!errors.currentPassword}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showCurrentPassword ? "eye-off" : "eye"}
                onPress={() => {
                  setShowCurrentPassword(!showCurrentPassword)
                  AccessibilityService.announce(showCurrentPassword ? "Current password hidden" : "Current password visible")
                }}
                accessibilityLabel={showCurrentPassword ? "Hide current password" : "Show current password"}
                accessibilityRole="button"
              />
            }
            autoCapitalize="none"
            autoComplete="password"
            accessibilityLabel={AccessibilityService.inputLabel("Current password", true)}
            accessibilityHint="Enter your current password"
          />
          <HelperText 
            type="error" 
            visible={!!errors.currentPassword}
            accessible={!!errors.currentPassword}
            accessibilityLiveRegion={errors.currentPassword ? "assertive" : "none"}
          >
            {errors.currentPassword || ' '}
          </HelperText>

          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            error={!!errors.newPassword}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showNewPassword ? "eye-off" : "eye"}
                onPress={() => {
                  setShowNewPassword(!showNewPassword)
                  AccessibilityService.announce(showNewPassword ? "New password hidden" : "New password visible")
                }}
                accessibilityLabel={showNewPassword ? "Hide new password" : "Show new password"}
                accessibilityRole="button"
              />
            }
            autoCapitalize="none"
            autoComplete="password-new"
            accessibilityLabel={AccessibilityService.inputLabel("New password", true)}
            accessibilityHint="Enter a new password, at least 6 characters"
          />
          <HelperText 
            type="error" 
            visible={!!errors.newPassword}
            accessible={!!errors.newPassword}
            accessibilityLiveRegion={errors.newPassword ? "assertive" : "none"}
          >
            {errors.newPassword || ' '}
          </HelperText>

          <TextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            error={!!errors.confirmPassword}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => {
                  setShowConfirmPassword(!showConfirmPassword)
                  AccessibilityService.announce(showConfirmPassword ? "Confirm password hidden" : "Confirm password visible")
                }}
                accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                accessibilityRole="button"
              />
            }
            autoCapitalize="none"
            autoComplete="password-new"
            accessibilityLabel={AccessibilityService.inputLabel("Confirm new password", true)}
            accessibilityHint="Re-enter your new password"
          />
          <HelperText 
            type="error" 
            visible={!!errors.confirmPassword}
            accessible={!!errors.confirmPassword}
            accessibilityLiveRegion={errors.confirmPassword ? "assertive" : "none"}
          >
            {errors.confirmPassword || ' '}
          </HelperText>

          <View 
            style={styles.passwordRequirements}
            accessible={true}
            accessibilityLabel="Password Requirements: At least 6 characters long and different from current password"
          >
            <Text variant="bodySmall" style={styles.requirementText}>
              Password Requirements:
            </Text>
            <Text variant="bodySmall" style={styles.requirementItem}>
              • At least 6 characters long
            </Text>
            <Text variant="bodySmall" style={styles.requirementItem}>
              • Different from current password
            </Text>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button 
            onPress={handleCancel} 
            disabled={loading}
            accessibilityLabel="Cancel"
            accessibilityHint={AccessibilityService.buttonHint("close dialog without changing password")}
            accessibilityRole="button"
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleChangePassword} 
            loading={loading}
            disabled={loading}
            accessibilityLabel={loading ? "Changing password, please wait" : "Change password"}
            accessibilityHint={loading ? "" : AccessibilityService.buttonHint("save new password")}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            Change Password
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const createStyles = (theme) => StyleSheet.create({
  dialog: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '90%',
  },
  description: {
    marginBottom: 16,
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    marginTop: 8,
  },
  errorText: {
    marginTop: 8,
  },
  passwordRequirements: {
    marginTop: 8,
    padding: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  requirementText: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.onSurfaceVariant,
  },
  requirementItem: {
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
})
