import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, TextInput, Button, Card } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../../context/AuthContext"

export default function ForgotPasswordScreen({ navigation }) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetPassword = async () => {
    try {
      setLoading(true)

      // Validation
      if (!email) {
        Alert.alert("Error", "Please enter your email address")
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        Alert.alert("Error", "Please enter a valid email address")
        return
      }

      // Send reset password email
      await resetPassword(email)
      
      setEmailSent(true)
      Alert.alert(
        "Success", 
        "Password reset link has been sent to your email. Please check your inbox.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]
      )
    } catch (error) {
      console.error("Reset password error:", error)
      Alert.alert("Error", error.message || "Failed to send reset password email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Icon name="lock-reset" size={64} color="#2E7D32" style={styles.icon} />
          <Text variant="headlineLarge" style={styles.title}>
            Forgot Password?
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {emailSent 
              ? "Check your email for a reset link"
              : "Enter your email address and we'll send you a link to reset your password"
            }
          </Text>
        </View>

        {!emailSent && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                accessibilityLabel="Email input field"
                disabled={loading}
              />

              <Button 
                mode="contained" 
                onPress={handleResetPassword} 
                style={styles.resetButton} 
                accessibilityLabel="Send reset link button"
                loading={loading}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate("Login")}
                style={styles.backButton}
                accessibilityLabel="Back to login"
                disabled={loading}
              >
                Back to Login
              </Button>
            </Card.Content>
          </Card>
        )}

        {emailSent && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.successContainer}>
                <Icon name="check-circle" size={64} color="#2E7D32" />
                <Text variant="bodyLarge" style={styles.successText}>
                  If an account exists with the email {email}, you will receive a password reset link shortly.
                </Text>
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Please check your inbox and spam folder.
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={() => navigation.navigate("Login")}
                style={styles.resetButton}
                accessibilityLabel="Return to login"
              >
                Return to Login
              </Button>

              <Button
                mode="text"
                onPress={() => {
                  setEmailSent(false)
                  setEmail("")
                }}
                style={styles.backButton}
                accessibilityLabel="Try another email"
              >
                Try Another Email
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
    paddingHorizontal: 16,
  },
  card: {
    elevation: 4,
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 24,
  },
  resetButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButton: {
    alignSelf: "center",
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  successText: {
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  instructionText: {
    textAlign: "center",
    color: "#666",
  },
})
