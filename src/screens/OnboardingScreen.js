import { useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { Text, Button, Card, SegmentedButtons } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import AccessibilityService from "../services/AccessibilityService"

export default function OnboardingScreen({ navigation }) {
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    AccessibilityService.announce("Welcome to AccessLanka. Discover accessible Sri Lanka. Find and review accessible public spaces across Sri Lanka.", 1000)
  }, [])

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_complete', 'true')
    } catch (error) {
      console.error('Error saving onboarding status:', error)
    }
  }

  const handleSignUp = async () => {
    await completeOnboarding()
    navigation.navigate("Register")
  }

  const handleLogin = async () => {
    await completeOnboarding()
    navigation.navigate("Login")
  }

  const handleGuest = async () => {
    await completeOnboarding()
    navigation.navigate("Landing")
  }

  const languages = [
    { value: "en", label: "English" },
    { value: "si", label: "සිංහල" },
    { value: "ta", label: "தமிழ்" },
  ]

  const getLocalizedText = (key) => {
    const texts = {
      en: {
        tagline: "Discover Accessible Sri Lanka",
        subtitle: "Find and review accessible public spaces across Sri Lanka",
        signUp: "Sign Up",
        login: "Login",
        guest: "Continue as Guest",
      },
      si: {
        tagline: "ප්‍රවේශ්‍ය ශ්‍රී ලංකාව සොයා ගන්න",
        subtitle: "ශ්‍රී ලංකාව පුරා ප්‍රවේශ්‍ය පොදු ස්ථාන සොයා ගෙන සමාලෝචනය කරන්න",
        signUp: "ලියාපදිංචි වන්න",
        login: "ප්‍රවේශ වන්න",
        guest: "අමුත්තෙකු ලෙස ඉදිරියට යන්න",
      },
      ta: {
        tagline: "அணுகக்கூடிய இலங்கையைக் கண்டறியுங்கள்",
        subtitle: "இலங்கை முழுவதும் அணுகக்கூடிய பொது இடங்களைக் கண்டறிந்து மதிப்பாய்வு செய்யுங்கள்",
        signUp: "பதிவு செய்யுங்கள்",
        login: "உள்நுழைய",
        guest: "விருந்தினராக தொடரவும்",
      },
    }
    return texts[language][key]
  }

  return (
    <SafeAreaView 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Welcome screen"
    >
      <View style={styles.languageSelector} accessible={false}>
        <SegmentedButtons
          value={language}
          onValueChange={(value) => {
            setLanguage(value)
            const langName = languages.find(l => l.value === value)?.label
            AccessibilityService.announce(`Language changed to ${langName}`)
          }}
          buttons={languages}
          accessibilityLabel="Language selector"
          accessibilityHint="Select your preferred language"
        />
      </View>

      <View style={styles.content} accessible={false}>
        <View 
          style={styles.logoContainer}
          accessible={true}
          accessibilityLabel="AccessLanka logo"
          accessibilityRole="header"
        >
          <Text style={styles.logo}>AccessLanka</Text>
        </View>

        <Card style={styles.card} accessible={false}>
          <Card.Content style={styles.cardContent}>
            <Text 
              variant="headlineMedium" 
              style={styles.tagline}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel={getLocalizedText("tagline")}
            >
              {getLocalizedText("tagline")}
            </Text>
            <Text 
              variant="bodyLarge" 
              style={styles.subtitle}
              accessible={true}
              accessibilityLabel={getLocalizedText("subtitle")}
            >
              {getLocalizedText("subtitle")}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer} accessible={false}>
          <Button
            mode="contained"
            style={styles.button}
            onPress={handleSignUp}
            accessibilityLabel={getLocalizedText("signUp")}
            accessibilityHint={AccessibilityService.buttonHint("create a new account")}
            accessibilityRole="button"
          >
            {getLocalizedText("signUp")}
          </Button>

          <Button
            mode="outlined"
            style={styles.button}
            onPress={handleLogin}
            accessibilityLabel={getLocalizedText("login")}
            accessibilityHint={AccessibilityService.buttonHint("sign in to your account")}
            accessibilityRole="button"
          >
            {getLocalizedText("login")}
          </Button>

          <Button
            mode="text"
            style={styles.button}
            onPress={handleGuest}
            accessibilityLabel={getLocalizedText("guest")}
            accessibilityHint={AccessibilityService.buttonHint("browse the app without signing in")}
            accessibilityRole="button"
          >
            {getLocalizedText("guest")}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  languageSelector: {
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  card: {
    marginBottom: 32,
    elevation: 4,
  },
  cardContent: {
    alignItems: "center",
    padding: 24,
  },
  tagline: {
    textAlign: "center",
    marginBottom: 16,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 8,
  },
})
