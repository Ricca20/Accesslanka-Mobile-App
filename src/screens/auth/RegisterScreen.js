import { useState, useEffect } from "react"
import { View, StyleSheet, Alert, Dimensions } from "react-native"
import { Text, TextInput, Button, Surface, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../../context/AuthContext"
import AccessibilityService from "../../services/AccessibilityService"

const { height } = Dimensions.get('window')

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [disabilities, setDisabilities] = useState({
    mobility: false,
    visual: false,
    hearing: false,
    cognitive: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Accessibility options with icons and colors
  const accessibilityOptions = [
    { 
      key: 'mobility', 
      label: 'Mobility', 
      icon: 'wheelchair-accessibility', 
      color: '#2E7D32',
      description: 'Wheelchair access',
    },
    { 
      key: 'visual', 
      label: 'Visual', 
      icon: 'eye', 
      color: '#1976D2',
      description: 'Vision assistance'
    },
    { 
      key: 'hearing', 
      label: 'Hearing', 
      icon: 'ear-hearing', 
      color: '#7B1FA2',
      description: 'Hearing assistance'
    },
    { 
      key: 'cognitive', 
      label: 'Cognitive', 
      icon: 'brain', 
      color: '#F57C00',
      description: 'Cognitive support'
    },
  ]

  useEffect(() => {
    // Announce screen name when component mounts
    AccessibilityService.announce("Register screen. Create a new account to help build a more accessible Sri Lanka.", 500)
  }, [])

  const handleRegister = async () => {
    try {
      setLoading(true)
      AccessibilityService.announce("Creating account, please wait")

      // Validation
      if (!formData.name || !formData.email || !formData.password) {
        const errorMsg = "Please fill in all required fields"
        Alert.alert("Error", errorMsg)
        AccessibilityService.announceFormError("Form", errorMsg)
        setLoading(false)
        return
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        const errorMsg = "Please enter a valid email address"
        Alert.alert("Error", errorMsg)
        AccessibilityService.announceFormError("Email", errorMsg)
        setLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        const errorMsg = "Passwords do not match"
        Alert.alert("Error", errorMsg)
        AccessibilityService.announceFormError("Password", errorMsg)
        setLoading(false)
        return
      }

      // Enhanced password validation
      if (formData.password.length < 8) {
        const errorMsg = "Password must be at least 8 characters"
        Alert.alert("Error", errorMsg)
        AccessibilityService.announceFormError("Password", errorMsg)
        setLoading(false)
        return
      }

      const hasUpperCase = /[A-Z]/.test(formData.password)
      const hasLowerCase = /[a-z]/.test(formData.password)
      const hasNumber = /[0-9]/.test(formData.password)
      
      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        const errorMsg = "Password must contain uppercase, lowercase, and numbers"
        Alert.alert("Error", errorMsg)
        AccessibilityService.announceFormError("Password", errorMsg)
        setLoading(false)
        return
      }

      // Prepare accessibility preferences
      const selectedAccessibilityNeeds = Object.keys(disabilities)
        .filter(key => disabilities[key])
        .join(', ')

      // Sign up user with accessibility preferences
      const result = await signUp(formData.email, formData.password, formData.name, selectedAccessibilityNeeds)

      // Check if email confirmation is required
      const needsConfirmation = result?.user && !result?.session
      
      const successMsg = needsConfirmation 
        ? "Account created successfully! Please check your email to verify your account before logging in."
        : "Account created successfully! You can now login."
      
      AccessibilityService.announceSuccess(successMsg)
      Alert.alert(
        "Success",
        successMsg,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]
      )
    } catch (error) {
      console.error("Registration error:", error)
      
      let errorMsg = "Failed to create account"
      let showLoginButton = false
      
      // Check for specific error types
      if (error.message && error.message.includes("Network request failed")) {
        errorMsg = "Network error. Please check your internet connection and try again."
      } else if (error.message && error.message.includes("needs cleanup")) {
        errorMsg = "Previous account deletion detected. Please wait 1-2 minutes and try again, or use a different email address."
      } else if (error.message && (error.message.includes("User already registered") || error.message.includes("already been registered") || error.message.includes("already exists"))) {
        errorMsg = "An account with this email already exists."
        showLoginButton = true
      } else if (error.message && error.message.includes("Invalid email")) {
        errorMsg = "Invalid email address format."
      } else if (error.message && error.message.includes("Password")) {
        errorMsg = error.message
      } else if (error.message) {
        errorMsg = error.message
      }
      
      // Show alert with option to navigate to login if user already exists
      if (showLoginButton) {
        Alert.alert(
          "Account Exists", 
          errorMsg,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Go to Login",
              onPress: () => {
                navigation.navigate("Login")
                AccessibilityService.announceNavigation("Login")
              }
            }
          ]
        )
      } else {
        Alert.alert("Registration Error", errorMsg, [
          {
            text: "OK",
            style: "default"
          }
        ])
      }
      
      AccessibilityService.announceFormError("Registration", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateDisabilities = (field) => {
    const newState = !disabilities[field]
    setDisabilities((prev) => ({ ...prev, [field]: newState }))
    AccessibilityService.announce(`${field} accessibility ${newState ? 'selected' : 'unselected'}`)
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
            <Text variant="headlineMedium" style={styles.title1}>
              Join Access<Text variant="headlineMedium" style={styles.title2}>Lanka</Text>
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Help build a more accessible Sri Lanka
            </Text>
          </View>

          {/* Form Card */}
          <Surface style={styles.formCard} elevation={3}>
            {/* Basic Info Row */}
            <View style={styles.inputRow}>
              <TextInput
                label="Full Name"
                value={formData.name}
                onChangeText={(value) => updateFormData("name", value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                dense
                accessibilityLabel={AccessibilityService.inputLabel("Full name", true, formData.name)}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateFormData("email", value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, styles.halfInput]}
                dense
                accessibilityLabel={AccessibilityService.inputLabel("Email", true, formData.email)}
              />
            </View>

            {/* Password Row */}
            <View style={styles.inputRow}>
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateFormData("password", value)}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={[styles.input, styles.halfInput]}
                dense
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    size={20}
                  />
                }
                accessibilityLabel={AccessibilityService.inputLabel("Password", true)}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData("confirmPassword", value)}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={[styles.input, styles.halfInput]}
                dense
                accessibilityLabel={AccessibilityService.inputLabel("Confirm password", true)}
              />
            </View>

            {/* Accessibility Preferences */}
            <View style={styles.accessibilitySection}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Accessibility Preferences (Optional)
              </Text>
              <View style={styles.chipGrid}>
                <View style={styles.chipRow}>
                  {accessibilityOptions.slice(0, 2).map((option) => (
                    <Chip
                      key={option.key}
                      icon={({ size }) => (
                        <Icon 
                          name={option.icon} 
                          size={24} 
                          color={disabilities[option.key] ? option.color : '#6B7280'} 
                        />
                      )}
                      selected={disabilities[option.key]}
                      onPress={() => updateDisabilities(option.key)}
                      style={[
                        styles.accessibilityChip,
                        disabilities[option.key] && { 
                          backgroundColor: option.color + '20',
                          borderColor: option.color 
                        }
                      ]}
                      textStyle={[
                        styles.chipText,
                        disabilities[option.key] && { color: option.color }
                      ]}
                      showSelectedOverlay
                    >
                      {option.label}
                    </Chip>
                  ))}
                </View>
                <View style={styles.chipRow}>
                  {accessibilityOptions.slice(2, 4).map((option) => (
                    <Chip
                      key={option.key}
                      icon={({ size }) => (
                        <Icon 
                          name={option.icon} 
                          size={24} 
                          color={disabilities[option.key] ? option.color : '#6B7280'} 
                        />
                      )}
                      selected={disabilities[option.key]}
                      onPress={() => updateDisabilities(option.key)}
                      style={[
                        styles.accessibilityChip,
                        disabilities[option.key] && { 
                          backgroundColor: option.color + '20',
                          borderColor: option.color 
                        }
                      ]}
                      textStyle={[
                        styles.chipText,
                        disabilities[option.key] && { color: option.color }
                      ]}
                      showSelectedOverlay
                    >
                      {option.label}
                    </Chip>
                  ))}
                </View>
              </View>
            </View>

            {/* Register Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            {/* Footer */}
            <View style={styles.footer}>
              <Text variant="bodyMedium" style={styles.footerText}>
                Already have an account?
              </Text>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate("Login")}
                compact
                textColor="#2E7D32"
              >
                Login
              </Button>
            </View>
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
    paddingTop: 10,
    justifyContent: 'center',
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title1: {
    color: "#1F2937",
    fontWeight: "bold",
    marginBottom: 4,
  },
    title2: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#6B7280",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  halfInput: {
    flex: 1,
  },
  accessibilitySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#1F2937",
    fontWeight: "600",
    marginBottom: 16,
    textAlign: 'flex-start',
    marginTop: 8,
  },
  chipGrid: {
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  accessibilityChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 25,
    backgroundColor: '#2E7D32',
    marginBottom: 16,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "#6B7280",
  },
})
