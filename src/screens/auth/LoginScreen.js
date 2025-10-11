import { useState, useEffect } from "react"
import { View, StyleSheet, Alert, Dimensions, Image } from "react-native"
import { Text, TextInput, Button, Surface, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../../context/AuthContext"
import AccessibilityService from "../../services/AccessibilityService"

const { height } = Dimensions.get('window')

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Announce screen name when component mounts
    AccessibilityService.announce("Login screen. Enter your email and password to sign in.", 500)
  }, [])

  const handleLogin = async () => {
    try {
      setLoading(true)
      AccessibilityService.announce("Signing in, please wait")

      // Validation
      if (!email || !password) {
        const errorMsg = "Please fill in all fields"
        Alert.alert("Error", errorMsg)
        AccessibilityService.announceFormError("Form", errorMsg)
        return
      }

      // Sign in user - AuthContext will handle navigation
      await signIn(email, password)
      AccessibilityService.announceSuccess("Login successful")
    } catch (error) {
      console.error("Login error:", error)
      
      let errorMsg = error.message || "Failed to sign in"
      
      // Check for specific error types
      if (error.message && error.message.includes("Email not confirmed")) {
        errorMsg = "Please verify your email address before logging in. Check your inbox for the verification link."
      } else if (error.message && error.message.includes("Invalid login credentials")) {
        errorMsg = "Invalid email or password. Please try again."
      } else if (error.message && error.message.includes("Network request failed")) {
        errorMsg = "Network error. Please check your internet connection."
      }
      
      Alert.alert("Login Error", errorMsg)
      AccessibilityService.announceFormError("Login", errorMsg)
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
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/AccessLanka Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text variant="headlineMedium" style={styles.title}>
              Welcome Back
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sign in to continue exploring accessible spaces
            </Text>
          </View>

          {/* Login Form Card */}
          <Surface style={styles.formCard} elevation={3}>
            <Text variant="titleMedium" style={styles.formTitle}>
              Sign In to Your Account
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email-outline" />}
              dense
              accessibilityLabel={AccessibilityService.inputLabel("Email", true, email)}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => {
                    setShowPassword(!showPassword)
                    AccessibilityService.announce(showPassword ? "Password hidden" : "Password visible")
                  }}
                  size={20}
                />
              }
              dense
              accessibilityLabel={AccessibilityService.inputLabel("Password", true)}
            />

            <Button
              mode="text"
              onPress={() => {
                navigation.navigate("ForgotPassword")
                AccessibilityService.announceNavigation("Forgot Password")
              }}
              style={styles.forgotPassword}
              textColor="#2E7D32"
              compact
            >
              Forgot Password?
            </Button>

            <Button 
              mode="contained" 
              onPress={handleLogin} 
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <Divider style={styles.divider} />

            {/* Footer */}
            <View style={styles.footer}>
              <Text variant="bodyMedium" style={styles.footerText}>
                Don't have an account?
              </Text>
              <Button 
                mode="text" 
                onPress={() => {
                  navigation.navigate("Register")
                  AccessibilityService.announceNavigation("Register")
                }}
                compact
                textColor="#2E7D32"
              >
                Sign Up
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
    paddingTop: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    color: "#1F2937",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  formTitle: {
    color: "#1F2937",
    fontWeight: "600",
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
    marginTop: -8,
  },
  loginButton: {
    borderRadius: 25,
    backgroundColor: '#2E7D32',
    marginBottom: 20,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginBottom: 20,
  },
  socialSection: {
    marginBottom: 20,
  },
  socialText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#E5E7EB',
  },
  socialButtonContent: {
    paddingVertical: 4,
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
