import React, { useState, useEffect, useRef } from "react"
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  StatusBar,
  Image,
} from "react-native"
import {
  Text,
  Button,
  Card,
  Surface,
  Chip,
  useTheme,
} from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const { width, height } = Dimensions.get("window")

export default function LandingScreen({ navigation }) {
  const theme = useTheme()
  const [activeFeature, setActiveFeature] = useState(0)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: "wheelchair-accessibility",
      title: "Accessibility First",
      description: "Discover places with detailed accessibility information verified by our community.",
      color: "#4CAF50",
    },
    {
      icon: "map-search",
      title: "Smart Discovery",
      description: "Find accessible restaurants, hotels, and attractions near you with AI-powered recommendations.",
      color: "#2196F3",
    },
    {
      icon: "account-group",
      title: "Community Driven",
      description: "Join thousands of users sharing accessibility insights to help everyone explore freely.",
      color: "#FF5722",
    },
    {
      icon: "star-check",
      title: "Verified Reviews",
      description: "Read authentic reviews from people with similar accessibility needs and experiences.",
      color: "#9C27B0",
    },
  ]

  const stats = [
    { number: "10K+", label: "Places Mapped", icon: "map-marker" },
    { number: "5K+", label: "Active Users", icon: "account-group" },
    { number: "15K+", label: "Reviews", icon: "star" },
    { number: "98%", label: "Satisfaction", icon: "heart" },
  ]

  const benefits = [
    "Real-time accessibility updates",
    "Offline map access",
    "Community verification system",
    "Personalized recommendations",
    "Multi-language support",
    "Voice-guided navigation",
  ]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={["#1B5E20", "#2E7D32", "#4CAF50"]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Surface style={styles.logoSurface} elevation={4}>
                <Icon name="wheelchair-accessibility" size={40} color="#2E7D32" />
              </Surface>
              <Text variant="headlineLarge" style={styles.appName}>
                AccessLanka
              </Text>
            </View>

            <Text variant="headlineSmall" style={styles.heroTitle}>
              Explore Sri Lanka{"\n"}Without Barriers
            </Text>

            <Text variant="bodyLarge" style={styles.heroSubtitle}>
              Your trusted companion for discovering accessible places, 
              sharing experiences, and building an inclusive travel community.
            </Text>

            <View style={styles.heroButtons}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate("Register")}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.primaryButtonText}
                icon="account-plus"
              >
                Get Started Free
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => navigation.navigate("Login")}
                style={styles.secondaryButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.secondaryButtonText}
                icon="login"
              >
                Sign In
              </Button>
              
              <Button
                mode="text"
                onPress={() => navigation.navigate("Onboarding")}
                style={styles.textButton}
                labelStyle={styles.textButtonLabel}
              >
                Learn More
              </Button>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text variant="headlineMedium" style={styles.sectionTitle}>
            Why Choose AccessLanka?
          </Text>
          
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    opacity: activeFeature === index ? 1 : 0.7,
                    transform: [
                      {
                        scale: activeFeature === index ? 1.05 : 1,
                      },
                    ],
                  },
                ]}
              >
                <Card style={styles.card} elevation={activeFeature === index ? 8 : 2}>
                  <Card.Content style={styles.cardContent}>
                    <Surface
                      style={[
                        styles.featureIconContainer,
                        { backgroundColor: feature.color + "20" },
                      ]}
                      elevation={2}
                    >
                      <Icon name={feature.icon} size={32} color={feature.color} />
                    </Surface>
                    
                    <Text variant="titleLarge" style={styles.featureTitle}>
                      {feature.title}
                    </Text>
                    
                    <Text variant="bodyMedium" style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </Card.Content>
                </Card>
              </Animated.View>
            ))}
          </View>

          {/* Feature Indicators */}
          <View style={styles.indicators}>
            {features.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: activeFeature === index ? "#2E7D32" : "#E0E0E0",
                    width: activeFeature === index ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <Surface style={styles.statsSection} elevation={4}>
          <Text variant="headlineMedium" style={styles.sectionTitle}>
            Trusted by Community
          </Text>
          
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Icon name={stat.icon} size={24} color="#2E7D32" />
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stat.number}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </Surface>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text variant="headlineMedium" style={styles.sectionTitle}>
            What You Get
          </Text>
          
          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text variant="bodyLarge" style={styles.benefitText}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <LinearGradient
          colors={["#2E7D32", "#4CAF50"]}
          style={styles.ctaSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text variant="headlineMedium" style={styles.ctaTitle}>
            Ready to Explore?
          </Text>
          
          <Text variant="bodyLarge" style={styles.ctaSubtitle}>
            Join our community and start discovering accessible places in Sri Lanka today.
          </Text>
          
          <Button
            mode="contained"
            onPress={() => navigation.navigate("Register")}
            style={styles.ctaButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.ctaButtonText}
            icon="rocket-launch"
          >
            Start Your Journey
          </Button>
          
          <Text variant="bodySmall" style={styles.ctaNote}>
            Free to use • No credit card required
          </Text>
        </LinearGradient>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Making Sri Lanka accessible for everyone
          </Text>
          
          <View style={styles.footerLinks}>
            <Text variant="bodySmall" style={styles.link}>Privacy</Text>
            <Text variant="bodySmall" style={styles.separator}>•</Text>
            <Text variant="bodySmall" style={styles.link}>Terms</Text>
            <Text variant="bodySmall" style={styles.separator}>•</Text>
            <Text variant="bodySmall" style={styles.link}>Support</Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: height * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
    maxWidth: width - 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoSurface: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    marginBottom: 16,
  },
  appName: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  heroTitle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 42,
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  heroButtons: {
    width: "100%",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "white",
    borderRadius: 28,
  },
  secondaryButton: {
    borderColor: "white",
    borderWidth: 2,
    borderRadius: 28,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  textButton: {
    marginTop: 8,
  },
  textButtonLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
  },
  featuresSection: {
    padding: 20,
    backgroundColor: "white",
  },
  sectionTitle: {
    color: "#2E7D32",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 20,
  },
  featureCard: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: "white",
  },
  cardContent: {
    padding: 24,
    alignItems: "center",
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  featureTitle: {
    color: "#2E7D32",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  featureDescription: {
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    transition: "all 0.3s ease",
  },
  statsSection: {
    margin: 20,
    padding: 24,
    backgroundColor: "white",
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  statItem: {
    alignItems: "center",
    minWidth: "20%",
    marginVertical: 10,
  },
  statNumber: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  benefitsSection: {
    padding: 20,
    backgroundColor: "#F8F9FA",
  },
  benefitsContainer: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  benefitText: {
    color: "#333",
    flex: 1,
  },
  ctaSection: {
    padding: 40,
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 20,
    marginVertical: 20,
  },
  ctaTitle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  ctaSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: "white",
    borderRadius: 28,
    marginBottom: 16,
  },
  ctaButtonText: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 16,
  },
  ctaNote: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  footer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  footerText: {
    color: "#666",
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  link: {
    color: "#2E7D32",
  },
  separator: {
    color: "#666",
  },
})
