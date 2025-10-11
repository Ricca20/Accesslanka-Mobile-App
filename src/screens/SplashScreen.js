import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Animated, Dimensions, Image, TouchableWithoutFeedback } from 'react-native'
import { Text } from 'react-native-paper'

const { width, height } = Dimensions.get('window')

export default function SplashScreen({ onComplete }) {
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.8)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const backgroundOpacity = useRef(new Animated.Value(1)).current
  const [canTap, setCanTap] = useState(false)
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false)

  useEffect(() => {
    // Start the splash animation sequence
    startSplashSequence()
  }, [])

  const startSplashSequence = () => {
    // Phase 1: Logo appears with scale and fade
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Mark logo animation as complete
      setLogoAnimationComplete(true)
      
      // Add a longer delay before text appears
      setTimeout(() => {
        // Phase 2: Text appears after logo
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          // Enable tap after animations complete
          setCanTap(true)
        })
      }, 500) // 500ms delay after logo completes
    })
  }

  const handleTap = () => {
    if (!canTap) return
    
    // Fade out when tapped
    Animated.timing(backgroundOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // Call onComplete when animation is done
      onComplete()
    })
  }

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
        <View style={styles.whiteBackground}>
          <View style={styles.content}>
            {/* Logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Image
                source={require('../../assets/AccessLanka Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* App Name */}
            {logoAnimationComplete && (
              <Animated.View
                style={[
                  styles.textContainer,
                  { opacity: textOpacity },
                ]}
              >
                <Text variant="bodyLarge" style={styles.tagline}>
                  Explore Sri Lanka without barriers!
                </Text>
              </Animated.View>
            )}

            {/* Tap instruction */}
            {logoAnimationComplete && (
              <Animated.View
                style={[
                  styles.tapInstruction,
                  { opacity: textOpacity },
                ]}
              >
                <Text variant="bodySmall" style={styles.tapText}>
                  Tap to continue
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    elevation: 8,
  },
  logo: {
    width: 170,
    height: 170,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    color: '#1F2937',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: -40,
  },
  tapInstruction: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
  tapText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})