import { useState } from "react"
import { View, StyleSheet, ScrollView, Dimensions } from "react-native"
import { Text, Card, Button, Chip, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const { width } = Dimensions.get("window")

export default function PlaceDetailsScreen({ route = { params: {} }, navigation = {} }) {
  const { place } = route.params
  const [isFavorite, setIsFavorite] = useState(false)

  // Mock data if no place is provided
  const placeData = place || {
    id: 1,
    name: "Colombo National Museum",
    rating: 4.2,
    accessibilityRating: 3.8,
    address: "Sir Marcus Fernando Mawatha, Colombo 07",
    description: "The National Museum of Colombo is a museum in Colombo and the largest museum in Sri Lanka.",
    images: ["/museum-exterior.jpg", "/museum-interior.jpg", "/museum-exhibits.jpg"],
    verified: true,
    features: ["Wheelchair Access", "Audio Guides", "Accessible Restrooms", "Braille Signage"],
    accessibilityDetails: {
      mobility: 4,
      visual: 3,
      hearing: 5,
      cognitive: 4,
    },
    openingHours: "Daily 9:00 AM - 5:00 PM",
    contact: "+94 11 269 4767",
    website: "www.museum.gov.lk",
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon key={i} name={i < Math.floor(rating) ? "star" : "star-outline"} size={16} color="#FFD700" />
    ))
  }

  const renderAccessibilityRating = (category, rating) => {
    const icons = {
      mobility: "wheelchair-accessibility",
      visual: "eye",
      hearing: "ear-hearing",
      cognitive: "brain",
    }

    const labels = {
      mobility: "Mobility",
      visual: "Visual",
      hearing: "Hearing",
      cognitive: "Cognitive",
    }

    return (
      <View style={styles.accessibilityItem}>
        <View style={styles.accessibilityHeader}>
          <Icon name={icons[category]} size={20} color="#2E7D32" />
          <Text variant="titleSmall" style={styles.accessibilityLabel}>
            {labels[category]}
          </Text>
        </View>
        <View style={styles.accessibilityRating}>
          <View style={styles.starsContainer}>{renderStars(rating)}</View>
          <Text variant="bodySmall" style={styles.ratingText}>
            {rating}/5
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Card.Cover source={{ uri: placeData.images[0] }} style={styles.headerImage} />
          <View style={styles.imageOverlay}>
            <Button
              mode="contained-tonal"
              icon={isFavorite ? "heart" : "heart-outline"}
              onPress={() => setIsFavorite(!isFavorite)}
              style={styles.favoriteButton}
              accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? "Saved" : "Save"}
            </Button>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title and Basic Info */}
          <View style={styles.titleSection}>
            <View style={styles.titleContainer}>
              <Text variant="headlineSmall" style={styles.placeName}>
                {placeData.name}
              </Text>
              {placeData.verified && <Icon name="check-decagram" size={24} color="#2E7D32" />}
            </View>

            <Text variant="bodyMedium" style={styles.address}>
              {placeData.address}
            </Text>

            <View style={styles.ratingsContainer}>
              <View style={styles.overallRating}>
                <View style={styles.starsContainer}>{renderStars(placeData.rating)}</View>
                <Text variant="bodyMedium" style={styles.ratingText}>
                  {placeData.rating}/5 Overall
                </Text>
              </View>
              <View style={styles.accessibilityOverall}>
                <Icon name="wheelchair-accessibility" size={20} color="#2E7D32" />
                <Text variant="bodyMedium" style={styles.accessibilityText}>
                  {placeData.accessibilityRating}/5 Accessibility
                </Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {placeData.description}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* Accessibility Features */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accessibility Features
            </Text>
            <View style={styles.featuresContainer}>
              {placeData.features.map((feature) => (
                <Chip key={feature} style={styles.featureChip} icon="check">
                  {feature}
                </Chip>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Detailed Accessibility Ratings */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accessibility Ratings
            </Text>
            <View style={styles.accessibilityGrid}>
              {Object.entries(placeData.accessibilityDetails).map(([category, rating]) => (
                <View key={category}>
                  {renderAccessibilityRating(category, rating)}
                </View>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Contact Information */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Information
            </Text>
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Icon name="clock-outline" size={20} color="#666" />
                <Text variant="bodyMedium" style={styles.infoText}>
                  {placeData.openingHours}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="phone" size={20} color="#666" />
                <Text variant="bodyMedium" style={styles.infoText}>
                  {placeData.contact}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="web" size={20} color="#666" />
                <Text variant="bodyMedium" style={styles.infoText}>
                  {placeData.website}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Button
              mode="contained"
              icon="star-plus"
              style={styles.actionButton}
              onPress={() => {}}
              accessibilityLabel="Add review for this place"
            >
              Add Review
            </Button>
            <Button
              mode="outlined"
              icon="flag"
              style={styles.actionButton}
              onPress={() => {}}
              accessibilityLabel="Report issue with this place"
            >
              Report Issue
            </Button>
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
  imageContainer: {
    position: "relative",
  },
  headerImage: {
    height: 200,
    width: width,
  },
  imageOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  favoriteButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  placeName: {
    color: "#2E7D32",
    fontWeight: "bold",
    flex: 1,
  },
  address: {
    color: "#666",
    marginBottom: 12,
  },
  ratingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overallRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accessibilityOverall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  starsContainer: {
    flexDirection: "row",
  },
  ratingText: {
    color: "#666",
  },
  accessibilityText: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    color: "#666",
    lineHeight: 22,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureChip: {
    backgroundColor: "#E8F5E8",
  },
  accessibilityGrid: {
    gap: 16,
  },
  accessibilityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  accessibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accessibilityLabel: {
    color: "#2E7D32",
  },
  accessibilityRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoContainer: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    color: "#666",
    flex: 1,
  },
  actionSection: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
  },
})
