import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, TextInput, Button, Card, Checkbox } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAuth } from "../../context/AuthContext"
import AccessibilityService from "../../services/AccessibilityService"

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
    <SafeAreaView 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Register screen"
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        accessible={false}
      >
        <View 
          style={styles.header}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Join AccessLanka. Help build a more accessible Sri Lanka"
        >
          <Text variant="headlineLarge" style={styles.title}>
            Join AccessLanka
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Help build a more accessible Sri Lanka
          </Text>
        </View>

        <Card style={styles.card} accessible={false}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => updateFormData("name", value)}
              mode="outlined"
              style={styles.input}
              accessibilityLabel={AccessibilityService.inputLabel("Full name", true, formData.name)}
              accessibilityHint="Enter your full name"
              accessibilityRole="none"
            />

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateFormData("email", value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel={AccessibilityService.inputLabel("Email", true, formData.email)}
              accessibilityHint="Enter your email address"
              accessibilityRole="none"
            />

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => updateFormData("password", value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => {
                    setShowPassword(!showPassword)
                    AccessibilityService.announce(showPassword ? "Password hidden" : "Password visible")
                  }}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityHint={AccessibilityService.buttonHint(showPassword ? "hide password" : "show password")}
                  accessibilityRole="button"
                />
              }
              accessibilityLabel={AccessibilityService.inputLabel("Password", true)}
              accessibilityHint="Enter a password, at least 6 characters"
              accessibilityRole="none"
            />

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData("confirmPassword", value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              accessibilityLabel={AccessibilityService.inputLabel("Confirm password", true)}
              accessibilityHint="Re-enter your password"
              accessibilityRole="none"
            />

            <View
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Accessibility Preferences section. Optional. Help us personalize your experience"
            >
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Accessibility Preferences (Optional)
              </Text>
              <Text variant="bodySmall" style={styles.sectionSubtitle}>
                Help us personalize your experience
              </Text>
            </View>

            <View style={styles.checkboxContainer} accessible={false}>
              <Checkbox.Item
                label="Mobility accessibility"
                status={disabilities.mobility ? "checked" : "unchecked"}
                onPress={() => updateDisabilities("mobility")}
                accessibilityLabel={`Mobility accessibility preference, ${disabilities.mobility ? 'checked' : 'unchecked'}`}
                accessibilityHint={AccessibilityService.buttonHint(disabilities.mobility ? 'unselect mobility accessibility' : 'select mobility accessibility')}
                accessibilityRole="checkbox"
              />
              <Checkbox.Item
                label="Visual accessibility"
                status={disabilities.visual ? "checked" : "unchecked"}
                onPress={() => updateDisabilities("visual")}
                accessibilityLabel={`Visual accessibility preference, ${disabilities.visual ? 'checked' : 'unchecked'}`}
                accessibilityHint={AccessibilityService.buttonHint(disabilities.visual ? 'unselect visual accessibility' : 'select visual accessibility')}
                accessibilityRole="checkbox"
              />
              <Checkbox.Item
                label="Hearing accessibility"
                status={disabilities.hearing ? "checked" : "unchecked"}
                onPress={() => updateDisabilities("hearing")}
                accessibilityLabel={`Hearing accessibility preference, ${disabilities.hearing ? 'checked' : 'unchecked'}`}
                accessibilityHint={AccessibilityService.buttonHint(disabilities.hearing ? 'unselect hearing accessibility' : 'select hearing accessibility')}
                accessibilityRole="checkbox"
              />
              <Checkbox.Item
                label="Cognitive accessibility"
                status={disabilities.cognitive ? "checked" : "unchecked"}
                onPress={() => updateDisabilities("cognitive")}
                accessibilityLabel={`Cognitive accessibility preference, ${disabilities.cognitive ? 'checked' : 'unchecked'}`}
                accessibilityHint={AccessibilityService.buttonHint(disabilities.cognitive ? 'unselect cognitive accessibility' : 'select cognitive accessibility')}
                accessibilityRole="checkbox"
              />
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              accessibilityLabel={loading ? "Creating account, please wait" : "Create account"}
              accessibilityHint={loading ? "" : AccessibilityService.buttonHint("create your new account")}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </Card.Content>
        </Card>

        <View 
          style={styles.footer}
          accessible={true}
          accessibilityLabel="Already have an account? Login"
          accessibilityRole="none"
        >
          <Text variant="bodyMedium">Already have an account? </Text>
          <Button 
            mode="text" 
            onPress={() => {
              navigation.navigate("Login")
              AccessibilityService.announceNavigation("Login")
            }}
            accessibilityLabel="Login"
            accessibilityHint={AccessibilityService.buttonHint("go to login screen")}
            accessibilityRole="button"
          >
            Login
          </Button>
        </View>
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
    marginTop: 16,
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
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    color: "#2E7D32",
  },
  sectionSubtitle: {
    marginBottom: 16,
    color: "#666",
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  registerButton: {
    paddingVertical: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
})
