import { useState, useRef } from "react"
import { View, StyleSheet, ScrollView, Dimensions, Image, FlatList, TouchableOpacity } from "react-native"
import { Text, Card, Button, Chip, Divider, Badge } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const { width } = Dimensions.get("window")
const IMAGE_WIDTH = width
const IMAGE_HEIGHT = 250

export default function PlaceDetailsScreen({ route = { params: {} }, navigation = {} }) {
  const { place } = route.params
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const flatListRef = useRef(null)

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

  // Handle image scroll
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / IMAGE_WIDTH)
    setCurrentImageIndex(index)
  }

  // Render image item
  const renderImageItem = ({ item }) => (
    <View style={styles.imageSlide}>
      <Image
        source={{ uri: item }}
        style={styles.carouselImage}
        resizeMode="cover"
      />
    </View>
  )

  // Determine wheelchair accessibility status
  const getAccessibilityStatus = () => {
    if (placeData.isGooglePlace) {
      return placeData.wheelchairAccessible ? 'yes' : 'unknown'
    }
    
    // Check features for wheelchair access
    const hasWheelchairAccess = placeData.features?.some(f => 
      f.toLowerCase().includes('wheelchair') || 
      f.toLowerCase().includes('ramp') ||
      f.toLowerCase().includes('elevator')
    )
    
    if (hasWheelchairAccess) return 'yes'
    if (placeData.accessibilityRating >= 3.5) return 'yes'
    if (placeData.accessibilityRating >= 2) return 'partial'
    return 'unknown'
  }

  const accessibilityStatus = getAccessibilityStatus()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={placeData.images || []}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          
          {/* Image Counter */}
          {placeData.images && placeData.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {placeData.images.length}
              </Text>
            </View>
          )}

          {/* Favorite Button Overlay */}
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

          {/* Wheelchair Accessibility Badge - Like Google Maps */}
          <View style={styles.accessibilityBadge}>
            <View style={[
              styles.wheelchairBadge,
              accessibilityStatus === 'yes' && styles.wheelchairBadgeYes,
              accessibilityStatus === 'partial' && styles.wheelchairBadgePartial,
              accessibilityStatus === 'unknown' && styles.wheelchairBadgeUnknown,
            ]}>
              <Icon 
                name="wheelchair-accessibility" 
                size={20} 
                color={accessibilityStatus === 'yes' ? '#2E7D32' : accessibilityStatus === 'partial' ? '#FF9800' : '#666'} 
              />
              <Text style={[
                styles.wheelchairText,
                accessibilityStatus === 'yes' && styles.wheelchairTextYes,
                accessibilityStatus === 'partial' && styles.wheelchairTextPartial,
              ]}>
                {accessibilityStatus === 'yes' && 'Wheelchair accessible'}
                {accessibilityStatus === 'partial' && 'Partially accessible'}
                {accessibilityStatus === 'unknown' && 'Accessibility unknown'}
              </Text>
            </View>
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

          {/* Photo Gallery Thumbnails */}
          {placeData.images && placeData.images.length > 1 && (
            <>
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Photos ({placeData.images.length})
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailScroll}
                >
                  {placeData.images.map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setCurrentImageIndex(index)
                        flatListRef.current?.scrollToIndex({ index, animated: true })
                      }}
                      style={styles.thumbnailContainer}
                    >
                      <Image
                        source={{ uri: image }}
                        style={[
                          styles.thumbnail,
                          currentImageIndex === index && styles.thumbnailActive
                        ]}
                      />
                      {currentImageIndex === index && (
                        <View style={styles.thumbnailActiveBorder} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Divider style={styles.divider} />
            </>
          )}

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

          {/* Prominent Wheelchair Accessibility Section */}
          <View style={styles.section}>
            <View style={styles.accessibilityHeaderSection}>
              <Icon name="wheelchair-accessibility" size={28} color="#2E7D32" />
              <View style={styles.accessibilityHeaderText}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Wheelchair Accessibility
                </Text>
                <Text variant="bodySmall" style={styles.accessibilitySubtext}>
                  {accessibilityStatus === 'yes' && 'This place has wheelchair accessible facilities'}
                  {accessibilityStatus === 'partial' && 'This place has limited accessibility'}
                  {accessibilityStatus === 'unknown' && 'Accessibility information not verified'}
                </Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Accessibility Features */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accessibility Features
            </Text>
            <View style={styles.featuresContainer}>
              {placeData.features && placeData.features.length > 0 ? (
                placeData.features.map((feature, index) => (
                  <Chip key={index} style={styles.featureChip} icon="check">
                    {feature}
                  </Chip>
                ))
              ) : (
                <Text variant="bodyMedium" style={styles.noFeaturesText}>
                  No accessibility features reported yet
                </Text>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Detailed Accessibility Ratings */}
          {placeData.accessibilityDetails && (
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
          )}

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
    height: IMAGE_HEIGHT,
    backgroundColor: '#000',
  },
  imageSlide: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  carouselImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  favoriteButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  accessibilityBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  wheelchairBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  wheelchairBadgeYes: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  wheelchairBadgePartial: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  wheelchairBadgeUnknown: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  wheelchairText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  wheelchairTextYes: {
    color: '#2E7D32',
  },
  wheelchairTextPartial: {
    color: '#FF9800',
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
  thumbnailScroll: {
    marginTop: 8,
  },
  thumbnailContainer: {
    marginRight: 12,
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    opacity: 0.6,
  },
  thumbnailActive: {
    opacity: 1,
    borderWidth: 3,
    borderColor: '#2E7D32',
  },
  thumbnailActiveBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#2E7D32',
  },
  description: {
    color: "#666",
    lineHeight: 22,
  },
  accessibilityHeaderSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  accessibilityHeaderText: {
    flex: 1,
  },
  accessibilitySubtext: {
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureChip: {
    backgroundColor: "#E8F5E8",
  },
  noFeaturesText: {
    color: '#999',
    fontStyle: 'italic',
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
