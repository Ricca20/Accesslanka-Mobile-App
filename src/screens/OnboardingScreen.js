import { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Text, Button, Card, SegmentedButtons } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function OnboardingScreen({ navigation }) {
  const [language, setLanguage] = useState("en")

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
    <SafeAreaView style={styles.container}>
      <View style={styles.languageSelector}>
        <SegmentedButtons
          value={language}
          onValueChange={setLanguage}
          buttons={languages}
          accessibilityLabel="Language selector"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>AccessLanka</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineMedium" style={styles.tagline}>
              {getLocalizedText("tagline")}
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {getLocalizedText("subtitle")}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={styles.button}
            onPress={handleSignUp}
            accessibilityLabel={getLocalizedText("signUp")}
          >
            {getLocalizedText("signUp")}
          </Button>

          <Button
            mode="outlined"
            style={styles.button}
            onPress={handleLogin}
            accessibilityLabel={getLocalizedText("login")}
          >
            {getLocalizedText("login")}
          </Button>

          <Button
            mode="text"
            style={styles.button}
            onPress={handleGuest}
            accessibilityLabel={getLocalizedText("guest")}
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
