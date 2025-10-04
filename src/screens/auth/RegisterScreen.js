import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, TextInput, Button, Card, Checkbox } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAuth } from "../../context/AuthContext"

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

  const handleRegister = async () => {
    try {
      setLoading(true)

      // Validation
      if (!formData.name || !formData.email || !formData.password) {
        Alert.alert("Error", "Please fill in all required fields")
        return
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert("Error", "Passwords do not match")
        return
      }

      if (formData.password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters")
        return
      }

      // Sign up user
      await signUp(formData.email, formData.password, formData.name)

      Alert.alert(
        "Success",
        "Account created successfully! Please check your email to verify your account.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]
      )
    } catch (error) {
      console.error("Registration error:", error)
      Alert.alert("Error", error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateDisabilities = (field) => {
    setDisabilities((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Join AccessLanka
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Help build a more accessible Sri Lanka
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => updateFormData("name", value)}
              mode="outlined"
              style={styles.input}
              accessibilityLabel="Full name input field"
            />

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateFormData("email", value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="Email input field"
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
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                />
              }
              accessibilityLabel="Password input field"
            />

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData("confirmPassword", value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              accessibilityLabel="Confirm password input field"
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accessibility Preferences (Optional)
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              Help us personalize your experience
            </Text>

            <View style={styles.checkboxContainer}>
              <Checkbox.Item
                label="Mobility accessibility"
                status={disabilities.mobility ? "checked" : "unchecked"}
                onPress={() => updateDisabilities("mobility")}
                accessibilityLabel="Mobility accessibility preference"
              />
              <Checkbox.Item
                label="Visual accessibility"
                status={disabilities.visual ? "checked" : "unchecked"}
                onPress={() => updateDisabilities("visual")}
                accessibilityLabel="Visual accessibility preference"
              />
              <Checkbox.Item
                label="Hearing accessibility"
                status={disabilities.hearing ? "checked" : "unchecked"}
                onPress={() => updateDisabilities("hearing")}
                accessibilityLabel="Hearing accessibility preference"
              />
              <Checkbox.Item
                label="Cognitive accessibility"
                status={disabilities.cognitive ? "checked" : "unchecked"}
                onPress={() => updateDisabilities("cognitive")}
                accessibilityLabel="Cognitive accessibility preference"
              />
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              accessibilityLabel="Create account button"
              loading={loading}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text variant="bodyMedium">Already have an account? </Text>
          <Button mode="text" onPress={() => navigation.navigate("Login")} accessibilityLabel="Go to login">
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
