import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, TextInput, Button, Card, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../../context/AuthContext"

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)

      // Validation
      if (!email || !password) {
        Alert.alert("Error", "Please fill in all fields")
        return
      }

      // Sign in user - AuthContext will handle navigation
      await signIn(email, password)
    } catch (error) {
      console.error("Login error:", error)
      Alert.alert("Error", error.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign in to continue exploring accessible spaces
          </Text>
        </View>

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
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                />
              }
              accessibilityLabel="Password input field"
            />

            <Button
              mode="text"
              onPress={() => {}}
              style={styles.forgotPassword}
              accessibilityLabel="Forgot password link"
            >
              Forgot Password?
            </Button>

            <Button 
              mode="contained" 
              onPress={handleLogin} 
              style={styles.loginButton} 
              accessibilityLabel="Login button"
              loading={loading}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Login"}
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={() => {}}
              style={styles.socialButton}
              icon={() => <Icon name="google" size={20} color="#DB4437" />}
              accessibilityLabel="Login with Google"
            >
              Continue with Google
            </Button>

            <Button
              mode="outlined"
              onPress={() => {}}
              style={styles.socialButton}
              icon={() => <Icon name="facebook" size={20} color="#4267B2" />}
              accessibilityLabel="Login with Facebook"
            >
              Continue with Facebook
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text variant="bodyMedium">Don't have an account? </Text>
          <Button mode="text" onPress={() => navigation.navigate("Register")} accessibilityLabel="Go to sign up">
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
