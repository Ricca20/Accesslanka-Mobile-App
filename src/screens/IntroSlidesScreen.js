import React, { useState, useRef, useEffect } from 'react'
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  PanGesturer, 
  ScrollView 
} from 'react-native'
import { Text, Button, Surface } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

const { width, height } = Dimensions.get('window')

const introSlides = [
  {
    id: 1,
    title: "Explore Sri Lanka Without Barriers",
    subtitle: "Find wheelchair-friendly locations, accessible restrooms, and barrier-free venues across Sri Lanka",
    icon: "wheelchair-accessibility",
    color: "#2E7D32",
    gradient: ["#E8F5E8", "#F1F8E9"]
  },
  {
    id: 2,
    title: "Share Your Experience",
    subtitle: "Help others by rating accessibility features and sharing reviews of places you visit",
    icon: "star-circle",
    color: "#1976D2", 
    gradient: ["#E3F2FD", "#E8F4FD"]
  },
  {
    id: 3,
    title: "Join the Community",
    subtitle: "Connect with other users, participate in MapMissions, and contribute to accessibility data",
    icon: "account-group",
    color: "#7B1FA2",
    gradient: ["#F3E5F5", "#F8E5FB"]
  }
]

export default function IntroSlidesScreen({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slideOpacity = useRef(new Animated.Value(1)).current
  const slideTranslate = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef(null)

  // Removed auto-advance functionality - now only advances on user interaction

  const nextSlide = () => {
    if (currentSlide < introSlides.length - 1) {
      Animated.parallel([
        Animated.timing(slideOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideTranslate, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCurrentSlide(currentSlide + 1)
        slideTranslate.setValue(50)
        Animated.parallel([
          Animated.timing(slideOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideTranslate, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start()
      })
    }
  }

  const skipToSignUp = () => {
    onComplete()
  }

  const handleContinue = () => {
    if (currentSlide < introSlides.length - 1) {
      // Not on last slide - advance to next slide
      nextSlide()
    } else {
      // On last slide - go to sign up
      onComplete()
    }
  }

  const currentSlideData = introSlides[currentSlide]

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Button 
            mode="text" 
            onPress={skipToSignUp}
            textColor="#6B7280"
            compact
          >
            Skip
          </Button>
        </View>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.slideContent,
              {
                opacity: slideOpacity,
                transform: [{ translateY: slideTranslate }],
              },
            ]}
          >
            {/* Icon */}
            <Surface style={[styles.iconContainer, { backgroundColor: currentSlideData.color + '15' }]}>
              <Icon 
                name={currentSlideData.icon} 
                size={80} 
                color={currentSlideData.color} 
              />
            </Surface>

            {/* Text Content */}
            <View style={styles.textContent}>
              <Text variant="headlineMedium" style={styles.title}>
                {currentSlideData.title}
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                {currentSlideData.subtitle}
              </Text>
            </View>
          </Animated.View>

          {/* Progress Indicators */}
          <View style={styles.progressContainer}>
            {introSlides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index === currentSlide 
                      ? currentSlideData.color 
                      : '#D1D5DB',
                    width: index === currentSlide ? 24 : 8,
                  }
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Slide {currentSlide + 1} of {introSlides.length}
          </Text>
          
          <Button
            mode="contained"
            onPress={handleContinue}
            style={[styles.nextButton, { backgroundColor: currentSlideData.color }]}
            contentStyle={styles.nextButtonContent}
          >
            {currentSlide === introSlides.length - 1 ? "Get Started" : "Continue"}
          </Button>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfffe',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#1F2937',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  footerText: {
    color: '#6B7280',
  },
  nextButton: {
    borderRadius: 25,
    minWidth: 200,
  },
  nextButtonContent: {
    paddingVertical: 8,
  },
})