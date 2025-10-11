import { useState } from "react"
import { View, StyleSheet, Alert, Dimensions } from "react-native"
import { Text, TextInput, Button, Surface } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../../context/AuthContext"

const { height } = Dimensions.get('window')

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
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: emailSent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
            ]}>
              <Icon 
                name={emailSent ? "check-circle" : "lock-reset"} 
                size={64} 
                color={emailSent ? "#10B981" : "#EF4444"} 
              />
            </View>
            <Text variant="headlineMedium" style={styles.title}>
              {emailSent ? "Check Your Email" : "Forgot Password?"}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {emailSent 
                ? "We've sent a password reset link to your email"
                : "Enter your email and we'll send you a reset link"
              }
            </Text>
          </View>

          {/* Form Card */}
          <Surface style={styles.formCard} elevation={4}>
            {!emailSent ? (
              <>
                <View style={styles.formHeader}>
                  <Text variant="titleLarge" style={styles.formTitle}>
                    Reset Your Password
                  </Text>
                  <Text variant="bodySmall" style={styles.formSubtitle}>
                    We'll send you a secure link to reset your password
                  </Text>
                </View>

                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  left={<TextInput.Icon icon="email-outline" />}
                  dense
                  disabled={loading}
                />

                <Button 
                  mode="contained" 
                  onPress={handleResetPassword} 
                  style={styles.resetButton}
                  contentStyle={styles.resetButtonContent}
                  loading={loading}
                  disabled={loading}
                  icon="send"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button
                  mode="text"
                  onPress={() => navigation.navigate("Login")}
                  style={styles.backButton}
                  textColor="#6B7280"
                  disabled={loading}
                  icon="arrow-left"
                >
                  Back to Login
                </Button>
              </>
            ) : (
              <>
                <View style={styles.successContent}>
                  <Text variant="titleLarge" style={styles.successTitle}>
                    Email Sent Successfully!
                  </Text>
                  <Text variant="bodyLarge" style={styles.successText}>
                    If an account exists with <Text style={styles.emailText}>{email}</Text>, you will receive a password reset link shortly.
                  </Text>
                  <View style={styles.instructionBox}>
                    <Icon name="information-outline" size={20} color="#6B7280" />
                    <Text variant="bodyMedium" style={styles.instructionText}>
                      Please check your inbox and spam folder
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate("Login")}
                    style={styles.resetButton}
                    contentStyle={styles.resetButtonContent}
                    icon="login"
                  >
                    Return to Login
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={() => {
                      setEmailSent(false)
                      setEmail("")
                    }}
                    style={styles.tryAgainButton}
                    textColor="#2E7D32"
                    icon="email-edit"
                  >
                    Try Another Email
                  </Button>
                </View>
              </>
            )}
          </Surface>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 60,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    color: "#1F2937",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  formTitle: {
    color: "#1F2937",
    fontWeight: "bold",
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    color: "#6B7280",
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  resetButton: {
    borderRadius: 25,
    backgroundColor: '#2E7D32',
    marginBottom: 16,
  },
  resetButtonContent: {
    paddingVertical: 8,
  },
  backButton: {
    alignSelf: "center",
  },
  successContent: {
    alignItems: "center",
    marginBottom: 32,
  },
  successTitle: {
    color: "#1F2937",
    fontWeight: "bold",
    textAlign: 'center',
    marginBottom: 16,
  },
  successText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#1F2937",
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: "#2E7D32",
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  instructionText: {
    color: "#6B7280",
    flex: 1,
  },
  actionButtons: {
    gap: 12,
  },
  tryAgainButton: {
    borderRadius: 12,
    borderColor: '#2E7D32',
  },
})
