import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, TextInput, Button, Card, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"

export default function ResetPasswordScreen({ navigation, route }) {
  const { updatePassword } = useAuth()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)

  useEffect(() => {
    checkRecoverySession()
  }, [])

  const checkRecoverySession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session:', session ? 'exists' : 'none')
      
      if (session) {
        setHasValidSession(true)
      } else {
        Alert.alert(
          "Session Expired",
          "Your password reset link has expired or is invalid. Please request a new one.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("ForgotPassword")
            }
          ]
        )
      }
    } catch (error) {
      console.error('Error checking session:', error)
      Alert.alert(
        "Error",
        "Unable to verify your password reset session. Please try again.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("ForgotPassword")
          }
        ]
      )
    } finally {
      setCheckingSession(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      setLoading(true)

      // Validation
      if (!newPassword || !confirmPassword) {
        Alert.alert("Error", "Please fill in all fields")
        return
      }

      if (newPassword.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters long")
        return
      }

      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match")
        return
      }

      // Update password
      await updatePassword(newPassword)
      
      Alert.alert(
        "Success", 
        "Your password has been reset successfully. Please login with your new password.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]
      )
    } catch (error) {
      console.error("Reset password error:", error)
      Alert.alert("Error", error.message || "Failed to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Verifying your reset link...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!hasValidSession) {
    return null // Will redirect via Alert
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Icon name="lock-reset" size={64} color="#2E7D32" style={styles.icon} />
          <Text variant="headlineLarge" style={styles.title}>
            Reset Password
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Enter your new password below
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                />
              }
              accessibilityLabel="New password input field"
              disabled={loading}
            />

            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                />
              }
              accessibilityLabel="Confirm password input field"
              disabled={loading}
            />

            <View style={styles.requirementsContainer}>
              <Text variant="bodySmall" style={styles.requirementsTitle}>
                Password Requirements:
              </Text>
              <Text variant="bodySmall" style={styles.requirement}>
                • At least 6 characters long
              </Text>
              <Text variant="bodySmall" style={styles.requirement}>
                • Both passwords must match
              </Text>
            </View>

            <Button 
              mode="contained" 
              onPress={handleResetPassword} 
              style={styles.resetButton} 
              accessibilityLabel="Reset password button"
              loading={loading}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate("Login")}
              style={styles.backButton}
              accessibilityLabel="Cancel and return to login"
              disabled={loading}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    textAlign: "center",
  },
  card: {
    elevation: 4,
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  requirementsContainer: {
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  requirement: {
    color: "#666",
    marginTop: 2,
  },
  resetButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButton: {
    alignSelf: "center",
  },
})
