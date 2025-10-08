import { useState, useContext } from "react"
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native"
import { Text, TextInput, Button, Chip, Divider, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { AuthContext } from "../context/AuthContext"
import { DatabaseService } from "../lib/database"

export default function AddReviewScreen({ route, navigation }) {
  const { place } = route.params
  const { user } = useContext(AuthContext)
  
  const [overallRating, setOverallRating] = useState(0)
  const [accessibilityRatings, setAccessibilityRatings] = useState({
    mobility: 0,
    visual: 0,
    hearing: 0,
    cognitive: 0,
  })
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const accessibilityCategories = [
    { key: "mobility", label: "Mobility", icon: "wheelchair-accessibility" },
    { key: "visual", label: "Visual", icon: "eye" },
    { key: "hearing", label: "Hearing", icon: "ear-hearing" },
    { key: "cognitive", label: "Cognitive", icon: "brain" },
  ]

  const renderStars = (rating, onPress) => {
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: 5 }, (_, i) => (
          <Icon
            key={i}
            name={i < rating ? "star" : "star-outline"}
            size={32}
            color={i < rating ? "#FFD700" : "#CCCCCC"}
            onPress={() => onPress(i + 1)}
            style={styles.starIcon}
          />
        ))}
      </View>
    )
  }

  const validateForm = () => {
    if (overallRating === 0) {
      Alert.alert("Rating Required", "Please provide an overall rating.")
      return false
    }
    if (!title.trim()) {
      Alert.alert("Title Required", "Please provide a review title.")
      return false
    }
    if (!content.trim()) {
      Alert.alert("Review Required", "Please write your review.")
      return false
    }
    if (content.trim().length < 20) {
      Alert.alert("Review Too Short", "Please write at least 20 characters.")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    if (!user) {
      Alert.alert("Authentication Required", "Please log in to submit a review.")
      return
    }

    try {
      setSubmitting(true)

      const reviewData = {
        place_id: place.id,
        user_id: user.id,
        overall_rating: overallRating,
        accessibility_ratings: accessibilityRatings,
        title: title.trim(),
        content: content.trim(),
      }

      await DatabaseService.createReview(reviewData)

      Alert.alert(
        "Success",
        "Your review has been submitted successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      )
    } catch (error) {
      console.error("Error submitting review:", error)
      Alert.alert(
        "Error",
        "Failed to submit review. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Place Info */}
          <View style={styles.placeInfo}>
            <Text variant="headlineSmall" style={styles.placeName}>
              {place.name}
            </Text>
            <Text variant="bodyMedium" style={styles.placeAddress}>
              {place.address}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* Overall Rating */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Overall Rating *
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              How would you rate this place overall?
            </Text>
            {renderStars(overallRating, setOverallRating)}
            {overallRating > 0 && (
              <Text variant="bodySmall" style={styles.ratingText}>
                {overallRating} out of 5 stars
              </Text>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Accessibility Ratings */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accessibility Ratings
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              Rate accessibility features (optional)
            </Text>
            
            {accessibilityCategories.map((category) => (
              <View key={category.key} style={styles.accessibilityItem}>
                <View style={styles.accessibilityHeader}>
                  <Icon name={category.icon} size={24} color="#2E7D32" />
                  <Text variant="titleSmall" style={styles.accessibilityLabel}>
                    {category.label}
                  </Text>
                </View>
                {renderStars(
                  accessibilityRatings[category.key],
                  (rating) =>
                    setAccessibilityRatings({
                      ...accessibilityRatings,
                      [category.key]: rating,
                    })
                )}
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* Review Title */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Review Title *
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Summarize your experience"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              maxLength={100}
              accessibilityLabel="Review title"
            />
            <Text variant="bodySmall" style={styles.charCount}>
              {title.length}/100 characters
            </Text>
          </View>

          {/* Review Content */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Review *
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Share your experience with accessibility features, staff helpfulness, and any tips for others..."
              value={content}
              onChangeText={setContent}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={6}
              maxLength={1000}
              accessibilityLabel="Review content"
            />
            <Text variant="bodySmall" style={styles.charCount}>
              {content.length}/1000 characters (minimum 20)
            </Text>
          </View>

          {/* Review Guidelines */}
          <View style={styles.guidelines}>
            <Icon name="information-outline" size={20} color="#666" />
            <View style={styles.guidelinesText}>
              <Text variant="bodySmall" style={styles.guidelineItem}>
                • Be honest and specific about your experience
              </Text>
              <Text variant="bodySmall" style={styles.guidelineItem}>
                • Focus on accessibility features
              </Text>
              <Text variant="bodySmall" style={styles.guidelineItem}>
                • Be respectful and constructive
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={submitting}
              loading={submitting}
              icon="check"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={submitting}
            >
              Cancel
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardView: {
    flex: 1,
  },
  placeInfo: {
    padding: 16,
    backgroundColor: "#fff",
  },
  placeName: {
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  placeAddress: {
    color: "#666",
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "#666",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  starIcon: {
    padding: 4,
  },
  ratingText: {
    color: "#666",
    marginTop: 4,
  },
  accessibilityItem: {
    marginBottom: 16,
  },
  accessibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  accessibilityLabel: {
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  textArea: {
    minHeight: 120,
  },
  charCount: {
    color: "#999",
    textAlign: "right",
  },
  guidelines: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF9E6",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 12,
  },
  guidelinesText: {
    flex: 1,
  },
  guidelineItem: {
    color: "#666",
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  submitButton: {
    paddingVertical: 8,
    backgroundColor: "#2E7D32",
  },
  cancelButton: {
    paddingVertical: 8,
  },
})
