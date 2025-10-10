import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, TextInput, Button, Card, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../../context/AuthContext"
import AccessibilityService from "../../services/AccessibilityService"

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
    <SafeAreaView 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Login screen"
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        accessible={false}
      >
        <View 
          style={styles.header}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Welcome Back. Sign in to continue exploring accessible spaces"
        >
          <Text variant="headlineLarge" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign in to continue exploring accessible spaces
          </Text>
        </View>

        <Card style={styles.card} accessible={false}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel={AccessibilityService.inputLabel("Email", true, email)}
              accessibilityHint="Enter your email address"
              accessibilityRole="none"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
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
              accessibilityHint="Enter your password"
              accessibilityRole="none"
            />

            <Button
              mode="text"
              onPress={() => {
                navigation.navigate("ForgotPassword")
                AccessibilityService.announceNavigation("Forgot Password")
              }}
              style={styles.forgotPassword}
              accessibilityLabel="Forgot password"
              accessibilityHint={AccessibilityService.buttonHint("go to password recovery")}
              accessibilityRole="button"
            >
              Forgot Password?
            </Button>

            <Button 
              mode="contained" 
              onPress={handleLogin} 
              style={styles.loginButton} 
              accessibilityLabel={loading ? "Signing in, please wait" : "Login"}
              accessibilityHint={loading ? "" : AccessibilityService.buttonHint("sign in to your account")}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Login"}
            </Button>

            <Divider style={styles.divider} {...AccessibilityService.ignoreProps()} />

            <Button
              mode="outlined"
              onPress={() => {
                AccessibilityService.announce("Google sign in not yet implemented")
              }}
              style={styles.socialButton}
              icon={() => <Icon name="google" size={20} color="#DB4437" {...AccessibilityService.ignoreProps()} />}
              accessibilityLabel="Continue with Google"
              accessibilityHint={AccessibilityService.buttonHint("sign in using your Google account")}
              accessibilityRole="button"
            >
              Continue with Google
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                AccessibilityService.announce("Facebook sign in not yet implemented")
              }}
              style={styles.socialButton}
              icon={() => <Icon name="facebook" size={20} color="#4267B2" {...AccessibilityService.ignoreProps()} />}
              accessibilityLabel="Continue with Facebook"
              accessibilityHint={AccessibilityService.buttonHint("sign in using your Facebook account")}
              accessibilityRole="button"
            >
              Continue with Facebook
            </Button>
          </Card.Content>
        </Card>

        <View 
          style={styles.footer}
          accessible={true}
          accessibilityLabel="Don't have an account? Sign up"
          accessibilityRole="none"
        >
          <Text variant="bodyMedium">Don't have an account? </Text>
          <Button 
            mode="text" 
            onPress={() => {
              navigation.navigate("Register")
              AccessibilityService.announceNavigation("Register")
            }}
            accessibilityLabel="Sign up"
            accessibilityHint={AccessibilityService.buttonHint("create a new account")}
            accessibilityRole="button"
          >
            Sign Up
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
    marginTop: 32,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  loginButton: {
    paddingVertical: 8,
    marginBottom: 24,
  },
  divider: {
    marginBottom: 24,
  },
  socialButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
})
