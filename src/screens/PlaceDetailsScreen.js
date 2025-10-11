import React, { useState, useRef, useEffect } from "react"
import { View, StyleSheet, ScrollView, Dimensions, Image, FlatList, TouchableOpacity, Linking, Alert } from "react-native"
import { Text, Card, Button, Chip, Divider, Badge, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { DatabaseService } from "../lib/database"
import MapMissionBadge from "../components/MapMissionBadge"
import UserBadge from "../components/UserBadge"

import { useAuth } from "../context/AuthContext"
import { getFeatureIcon, formatFeatureLabel } from "../utils/accessibilityMapping"

const { width } = Dimensions.get("window")
const IMAGE_WIDTH = width
const IMAGE_HEIGHT = 250

export default function PlaceDetailsScreen({ route = { params: {} }, navigation = {} }) {
  const { place, missionId } = route.params
  const { user } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [missionContributions, setMissionContributions] = useState(null)
  const [loadingContributions, setLoadingContributions] = useState(false)
  const [allAccessibilityContributions, setAllAccessibilityContributions] = useState(null)
  const [loadingAllContributions, setLoadingAllContributions] = useState(false)
  const flatListRef = useRef(null)

  // Debug: Log the received place data
  console.log('PlaceDetailsScreen received place data:', JSON.stringify(place, null, 2))

  // Process place data from database
  const placeData = place ? {
    ...place,
    rating: place.rating || 4.0,
    accessibilityRating: place.accessibility_rating || 4.0,
    // Handle accessibility_features as ARRAY (from database) or features (from normalized data)
    features: place.accessibility_features 
      ? (Array.isArray(place.accessibility_features) 
          ? place.accessibility_features  // Already an array from database
          : Object.entries(place.accessibility_features)
              .filter(([key, value]) => value === true)
              .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())))
      : (place.features || []),  // Use features from normalized data
    // Handle images/photos
    images: place.images || place.photos || [],
    verified: place.verified || false,
    openingHours: place.opening_hours ? formatOpeningHours(place.opening_hours) : "Hours not available",
    contact: place.phone || "Phone not available",
    website: place.website || "Website not available",
  } : {
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

  // Debug: Log processed placeData
  console.log('Processed placeData:', {
    name: placeData.name,
    openingHours: placeData.openingHours,
    contact: placeData.contact,
    website: placeData.website,
    features: placeData.features,
    images: placeData.images,
  })

  // Check if place is already favorited
  useEffect(() => {
    if (user?.id && place?.id) {
      checkFavoriteStatus()
    }
  }, [user?.id, place?.id])

  // Fetch reviews for this place
  useEffect(() => {
    fetchReviews()
    fetchAllAccessibilityContributions()
    if (missionId) {
      fetchMissionContributions()
    }
  }, [place.id, missionId])

  // Refresh reviews when screen gains focus (e.g., returning from AddReview screen)
  useFocusEffect(
    React.useCallback(() => {
      console.log('PlaceDetailsScreen focused - refreshing reviews at:', new Date().toISOString())
      fetchReviews()
    }, [place.id])
  )

  const checkFavoriteStatus = async () => {
    try {
      // Determine if this is a business or place based on the type field or explicit IDs
      let businessId = null
      let placeId = null
      
      if (place.business_id) {
        businessId = place.business_id
      } else if (place.place_id) {
        placeId = place.place_id
      } else if (place.type === 'business') {
        businessId = place.id
      } else if (place.type === 'place') {
        placeId = place.id
      } else {
        // Default to place if type is not specified
        placeId = place.id
      }
      
      const favoriteStatus = await DatabaseService.isFavorite(user.id, businessId, placeId)
      setIsFavorite(favoriteStatus)
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const toggleFavorite = async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to save favorites.')
      return
    }

    try {
      // Determine if this is a business or place based on the type field or explicit IDs
      let businessId = null
      let placeId = null
      
      if (place.business_id) {
        businessId = place.business_id
      } else if (place.place_id) {
        placeId = place.place_id
      } else if (place.type === 'business') {
        businessId = place.id
      } else if (place.type === 'place') {
        placeId = place.id
      } else {
        // Default to place if type is not specified
        placeId = place.id
      }
      
      if (isFavorite) {
        // Remove from favorites
        await DatabaseService.removeFromFavorites(user.id, businessId, placeId)
        setIsFavorite(false)
        Alert.alert('Success', 'Removed from favorites')
      } else {
        // Add to favorites
        await DatabaseService.addToFavorites(user.id, businessId, placeId)
        setIsFavorite(true)
        Alert.alert('Success', 'Added to favorites')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      Alert.alert('Error', 'Failed to update favorites. Please try again.')
    }
  }

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true)
      
      console.log('fetchReviews - place object:', {
        id: place.id,
        name: place.name,
        type: place.type,
        business_id: place.business_id,
        place_id: place.place_id,
        price_range: place.price_range,
        opening_hours: place.opening_hours,
        email: place.email
      })

      // Determine if this is a business or a place (same logic as AddReviewScreen)
      let businessId = null
      let placeId = null

      // Priority 1: Check explicit type field (from ExploreScreen normalization)
      if (place.type === 'business') {
        console.log('Detected as business via type field')
        businessId = place.id
      } else if (place.type === 'place') {
        console.log('Detected as place via type field')
        placeId = place.id
      } 
      // Priority 2: Check explicit ID markers
      else if (place.business_id) {
        console.log('Detected as business via business_id field')
        businessId = place.business_id
      } else if (place.place_id) {
        console.log('Detected as place via place_id field')
        placeId = place.place_id
      } 
      // Priority 3: Check business-specific fields
      else {
        const hasBusinessFields = !!(place.price_range || place.opening_hours || place.email)
        console.log('Checking business-specific fields:', {
          price_range: place.price_range,
          opening_hours: place.opening_hours,
          email: place.email,
          hasBusinessFields
        })

        if (hasBusinessFields) {
          console.log('Treating as business based on fields')
          businessId = place.id
        } else {
          console.log('Treating as place (default fallback)')
          placeId = place.id
        }
      }

      console.log('Fetching reviews for:', { businessId, placeId, placeName: place.name })
      const options = { businessId, placeId }
      if (user) {
        options.currentUserId = user.id
      }
      const reviewsData = await DatabaseService.getReviews(options)
      console.log('Fetched reviews:', reviewsData?.length || 0, 'reviews')
      if (reviewsData && reviewsData.length > 0) {
        console.log('First review structure:', JSON.stringify(reviewsData[0], null, 2))
      }
      setReviews(reviewsData || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoadingReviews(false)
    }
  }

  const fetchMissionContributions = async () => {
    try {
      setLoadingContributions(true)
      const summary = await DatabaseService.getBusinessAccessibilitySummary(place.id, missionId)
      setMissionContributions(summary)
    } catch (error) {
      console.error('Error fetching mission contributions:', error)
    } finally {
      setLoadingContributions(false)
    }
  }

  const fetchAllAccessibilityContributions = async () => {
    try {
      setLoadingAllContributions(true)
      const contributions = await DatabaseService.getBusinessAccessibilityContributions(place.id)
      setAllAccessibilityContributions(contributions)
    } catch (error) {
      console.error('Error fetching all accessibility contributions:', error)
    } finally {
      setLoadingAllContributions(false)
    }
  }

  // Format opening hours from database structure
  function formatOpeningHours(hours) {
    if (typeof hours === 'string') return hours
    if (typeof hours === 'object' && hours !== null) {
      // Handle JSONB format like: {"monday": "9:00 AM - 5:00 PM", "tuesday": "9:00 AM - 5:00 PM"}
      const days = Object.keys(hours)
      if (days.length > 0) {
        const firstDay = days[0]
        const firstHours = hours[firstDay]
        // Check if all days have same hours
        const allSame = days.every(day => hours[day] === firstHours)
        if (allSame) {
          return `Daily: ${firstHours}`
        } else {
          return days.map(day => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours[day]}`).join('\n')
        }
      }
    }
    return "Hours not available"
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

  // Handle marking review as helpful
  const handleHelpful = async (reviewId, isCurrentlyHelpful) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to mark reviews as helpful.')
      return
    }

    // Prevent users from marking their own reviews as helpful
    const review = reviews.find(r => r.id === reviewId)
    if (review?.user_id === user.id) {
      Alert.alert('Cannot Mark Own Review', 'You cannot mark your own review as helpful.')
      return
    }

    try {
      if (isCurrentlyHelpful) {
        await DatabaseService.unmarkReviewHelpful(reviewId, user.id)
      } else {
        await DatabaseService.markReviewHelpful(reviewId, user.id)
      }
      
      // Update local state
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              isHelpful: !isCurrentlyHelpful,
              helpful_count: isCurrentlyHelpful 
                ? Math.max(0, (review.helpful_count || 0) - 1)
                : (review.helpful_count || 0) + 1
            }
          }
          return review
        })
      )
    } catch (error) {
      console.error('Error updating helpful status:', error)
      // Check for duplicate vote error (PostgreSQL unique violation)
      if (error.code === '23505') {
        Alert.alert('Already Voted', 'You have already marked this review as helpful.')
      } else {
        Alert.alert('Error', 'Failed to update helpful status. Please try again.')
      }
    }
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

  // Render review card
  const renderReview = (review) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
      
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const userName = review.users?.full_name || 'Anonymous User'
    const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

    return (
      <Card key={review.id} style={styles.reviewCard} elevation={2}>
        <Card.Content style={styles.reviewCardContent}>
          {/* Review Header with Avatar */}
          <View style={styles.reviewHeader}>
            <View style={styles.reviewUserSection}>
              {/* User Avatar */}
              <View style={styles.userAvatarContainer}>
                <View style={[styles.userAvatar, { backgroundColor: review.users?.verified ? '#2E7D32' : '#9E9E9E' }]}>
                  <Text style={styles.userAvatarText}>{userInitials}</Text>
                </View>
                {review.users?.verified && (
                  <View style={styles.verifiedBadge}>
                    <Icon name="check-decagram" size={14} color="#FFFFFF" />
                  </View>
                )}
              </View>

              {/* User Info */}
              <View style={styles.reviewUserInfo}>
                <View style={styles.reviewUserNameRow}>
                  <Text variant="titleSmall" style={styles.reviewUserName}>
                    {userName}
                  </Text>
                  {review.user_id && (
                    <UserBadge userId={review.user_id} size="small" />
                  )}
                </View>
                <Text variant="bodySmall" style={styles.reviewDate}>
                  {formatDate(review.created_at)}
                </Text>
              </View>
            </View>

            {/* Overall Rating Badge */}
            <View style={styles.ratingBadge}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text variant="titleMedium" style={styles.ratingBadgeText}>
                {review.overall_rating.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Review Title */}
          <Text variant="titleMedium" style={styles.reviewTitle}>
            {review.title}
          </Text>

          {/* Review Content */}
          <Text variant="bodyMedium" style={styles.reviewContent}>
            {review.content}
          </Text>

          {/* Accessibility Ratings */}
          {review.accessibility_ratings && Object.keys(review.accessibility_ratings).length > 0 && (
            <View style={styles.reviewAccessibilitySection}>
              <View style={styles.accessibilityHeader}>
                <Icon name="wheelchair-accessibility" size={16} color="#2E7D32" />
                <Text variant="labelMedium" style={styles.accessibilityHeaderText}>
                  Accessibility Ratings
                </Text>
              </View>
              <View style={styles.reviewAccessibilityRatings}>
                {Object.entries(review.accessibility_ratings).map(([featureKey, rating]) => {
                  // Skip the 'features' sub-object and only show top-level ratings
                  if (featureKey === 'features' || rating === 0 || typeof rating !== 'number') {
                    return null
                  }
                  
                  // Show category ratings (mobility, visual, hearing, cognitive)
                  if (rating > 0) {
                    return (
                      <View key={featureKey} style={styles.accessibilityRatingItem}>
                        <Icon name={getFeatureIcon(featureKey)} size={16} color="#2E7D32" />
                        <Text variant="bodySmall" style={styles.accessibilityRatingLabel}>
                          {formatFeatureLabel(featureKey)}
                        </Text>
                        <View style={styles.miniStars}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <Icon
                              key={i}
                              name={i < rating ? "star" : "star-outline"}
                              size={10}
                              color={i < rating ? "#FFD700" : "#E0E0E0"}
                            />
                          ))}
                        </View>
                        <Text variant="bodySmall" style={styles.accessibilityRatingValue}>
                          {rating}/5
                        </Text>
                      </View>
                    )
                  }
                  return null
                })}
                {/* Show detailed feature ratings if available */}
                {review.accessibility_ratings.features && Object.entries(review.accessibility_ratings.features).map(([featureKey, rating]) => {
                  if (rating > 0) {
                    return (
                      <Chip key={`feature-${featureKey}`} style={styles.featureChipOutlined} compact mode="outlined" textStyle={styles.featureChipText}>
                        <Icon name={getFeatureIcon(featureKey)} size={12} color="#666" />
                        {` ${formatFeatureLabel(featureKey)}: ${rating}/5`}
                      </Chip>
                    )
                  }
                  return null
                })}
              </View>
            </View>
          )}

          {/* Review Actions */}
          <View style={styles.reviewActions}>
            <Button
              mode={review.isHelpful ? "contained-tonal" : "outlined"}
              icon={review.isHelpful ? "thumb-up" : "thumb-up-outline"}
              compact
              onPress={() => handleHelpful(review.id, review.isHelpful || false)}
              buttonColor={review.isHelpful ? "#E8F5E8" : "transparent"}
              textColor={review.isHelpful ? "#2E7D32" : "#666"}
              style={styles.helpfulButton}
            >
              {review.isHelpful ? 'Helpful' : 'Mark Helpful'} {review.helpful_count > 0 && `(${review.helpful_count})`}
            </Button>
          </View>
        </Card.Content>
      </Card>
    )
  }

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
              onPress={toggleFavorite}
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
                color={accessibilityStatus === 'yes' ? '#ffffff' : accessibilityStatus === 'partial' ? '#FF9800' : '#666'} 
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
              
              {placeData.contact && placeData.contact !== "Phone not available" && (
                <TouchableOpacity 
                  style={styles.infoItem}
                  onPress={() => {
                    const phoneUrl = `tel:${placeData.contact.replace(/\s/g, '')}`
                    Linking.openURL(phoneUrl)
                  }}
                >
                  <Icon name="phone" size={20} color="#2E7D32" />
                  <Text variant="bodyMedium" style={[styles.infoText, styles.linkText]}>
                    {placeData.contact}
                  </Text>
                </TouchableOpacity>
              )}
              
              {placeData.website && placeData.website !== "Website not available" && (
                <TouchableOpacity 
                  style={styles.infoItem}
                  onPress={() => {
                    const websiteUrl = placeData.website.startsWith('http') 
                      ? placeData.website 
                      : `https://${placeData.website}`
                    Linking.openURL(websiteUrl)
                  }}
                >
                  <Icon name="web" size={20} color="#2E7D32" />
                  <Text variant="bodyMedium" style={[styles.infoText, styles.linkText]}>
                    {placeData.website}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* All MapMission Accessibility Contributions */}
          {allAccessibilityContributions && allAccessibilityContributions.totalContributions > 0 && (
            <>
              <View style={styles.section}>
                <View style={styles.accessibilityContributionsHeader}>
                  <Icon name="account-group" size={24} color="#2E7D32" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Community MapMission Reports
                  </Text>
                </View>
                
                <Text variant="bodySmall" style={styles.contributionsSubtext}>
                  Verified contributions from MapMission participants
                </Text>

                {loadingAllContributions ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator animating={true} color="#2E7D32" />
                    <Text style={styles.loadingText}>Loading community reports...</Text>
                  </View>
                ) : (
                  <View style={styles.allContributionsContainer}>
                    {/* Photos */}
                    {allAccessibilityContributions.photos.length > 0 && (
                      <Card style={styles.contributionTypeCard}>
                        <Card.Content>
                          <View style={styles.contributionTypeHeader}>
                            <Icon name="camera" size={20} color="#FF5722" />
                            <Text variant="titleSmall" style={styles.contributionTypeTitle}>
                              Mapmission Photos ({allAccessibilityContributions.photos.length})
                            </Text>
                          </View>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                            {allAccessibilityContributions.photos.slice(0, 5).map((photo, index) => (
                              <View key={index} style={styles.contributionPhotoItem}>
                                <Image source={{ uri: photo.photo_url }} style={styles.contributionPhoto} />
                                <Text numberOfLines={2} style={styles.photoDescription}>
                                  {photo.feature_description}
                                </Text>
                                <Text style={styles.photoMission}>
                                  From: {photo.mission_title}
                                </Text>
                              </View>
                            ))}
                          </ScrollView>
                        </Card.Content>
                      </Card>
                    )}

                    {/* Reviews */}
                    {allAccessibilityContributions.reviews.length > 0 && (
                      <Card style={styles.contributionTypeCard}>
                        <Card.Content>
                          <View style={styles.contributionTypeHeader}>
                            <Icon name="comment-text" size={20} color="#2196F3" />
                            <Text variant="titleSmall" style={styles.contributionTypeTitle}>
                              Mapmission Reviews ({allAccessibilityContributions.reviews.length})
                            </Text>
                          </View>
                          {allAccessibilityContributions.reviews.slice(0, 3).map((review, index) => (
                            <View key={index} style={styles.contributionReviewItem}>
                              <Text variant="bodyMedium" style={styles.reviewText}>
                                "{review.review_text}"
                              </Text>
                              <View style={styles.reviewMeta}>
                                <Text style={styles.reviewFeature}>
                                  {review.feature_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Text>
                                <Text style={styles.reviewMission}>
                                  {review.mission_title}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </Card.Content>
                      </Card>
                    )}

                    {/* Ratings Summary */}
                    {allAccessibilityContributions.ratings.length > 0 && (
                      <Card style={styles.contributionTypeCard}>
                        <Card.Content>
                          <View style={styles.contributionTypeHeader}>
                            <Icon name="star" size={20} color="#FF9800" />
                            <Text variant="titleSmall" style={styles.contributionTypeTitle}>
                              Mapmission Ratings ({allAccessibilityContributions.ratings.length})
                            </Text>
                          </View>
                          <View style={styles.ratingsGrid}>
                            {['accessibility_rating', 'availability_rating', 'condition_rating'].map(ratingType => {
                              const ratings = allAccessibilityContributions.ratings.map(r => r[ratingType]).filter(r => r > 0)
                              const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
                              
                              return avgRating > 0 ? (
                                <View key={ratingType} style={styles.ratingItem}>
                                  <Text style={styles.ratingLabel}>
                                    {ratingType.replace(/_rating/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Text>
                                  <View style={styles.ratingStars}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Icon
                                        key={star}
                                        name={star <= Math.round(avgRating) ? 'star' : 'star-outline'}
                                        size={16}
                                        color="#FF9800"
                                      />
                                    ))}
                                    <Text style={styles.ratingValue}>({avgRating.toFixed(1)})</Text>
                                  </View>
                                </View>
                              ) : null
                            })}
                          </View>
                        </Card.Content>
                      </Card>
                    )}
                  </View>
                )}
              </View>

              <Divider style={styles.divider} />
            </>
          )}

          {/* Mission Contributions Section */}
          {missionId && (
            <>
              <View style={styles.section}>
                <View style={styles.missionHeader}>
                  <Icon name="target" size={24} color="#4CAF50" />
                  <Text variant="titleMedium" style={styles.missionSectionTitle}>
                    Mission Contributions
                  </Text>
                  <Button
                    mode="contained"
                    icon="plus"
                    compact
                    onPress={() => navigation.navigate('AccessibilityContribution', { 
                      mission: { id: missionId },
                      business: placeData 
                    })}
                    buttonColor="#4CAF50"
                  >
                    Contribute
                  </Button>
                </View>

                {loadingContributions ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator animating={true} color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading contributions...</Text>
                  </View>
                ) : missionContributions ? (
                  <View style={styles.contributionsGrid}>
                    {Object.entries(missionContributions).map(([feature, data]) => {
                      if (data.photosCount === 0 && data.reviewsCount === 0 && data.ratingsCount === 0) return null
                      
                      return (
                        <Card key={feature} style={styles.contributionCard}>
                          <Card.Content style={styles.contributionCardContent}>
                            <Text variant="titleSmall" style={styles.featureName}>
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Text>
                            
                            <View style={styles.contributionStats}>
                              <View style={styles.contributionStat}>
                                <Icon name="camera" size={16} color="#FF5722" />
                                <Text style={styles.contributionCount}>{data.photosCount}</Text>
                              </View>
                              <View style={styles.contributionStat}>
                                <Icon name="comment-text" size={16} color="#2196F3" />
                                <Text style={styles.contributionCount}>{data.reviewsCount}</Text>
                              </View>
                              <View style={styles.contributionStat}>
                                <Icon name="star" size={16} color="#FF9800" />
                                <Text style={styles.contributionCount}>{data.ratingsCount}</Text>
                              </View>
                            </View>
                            
                            {data.averageRatings && data.averageRatings.overall > 0 && (
                              <View style={styles.averageRating}>
                                <Text style={styles.ratingLabel}>Avg: </Text>
                                <Text style={styles.ratingValue}>
                                  {data.averageRatings.overall.toFixed(1)}/5
                                </Text>
                              </View>
                            )}
                          </Card.Content>
                        </Card>
                      )
                    })}
                  </View>
                ) : (
                  <Text style={styles.noContributionsText}>
                    No contributions yet. Be the first to contribute!
                  </Text>
                )}
              </View>

              <Divider style={styles.divider} />
            </>
          )}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <View style={styles.reviewsHeaderLeft}>
                <Icon name="comment-multiple" size={28} color="#2E7D32" />
                <View>
                  <Text variant="titleLarge" style={styles.sectionTitle}>
                    User Reviews
                  </Text>
                  <Text variant="bodySmall" style={styles.reviewsCount}>
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              </View>
              <Button
                mode="contained"
                icon="plus"
                compact
                onPress={() => navigation.navigate('AddReview', { place: place })}
                style={styles.addReviewButton}
                labelStyle={styles.addReviewButtonLabel}
              >
                Add Review
              </Button>
            </View>

            {loadingReviews ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map(review => renderReview(review))}
              </View>
            ) : (
              <View style={styles.emptyReviews}>
                <Icon name="comment-text-outline" size={48} color="#CCCCCC" />
                <Text variant="titleMedium" style={styles.emptyReviewsTitle}>
                  No reviews yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptyReviewsText}>
                  Be the first to share your experience!
                </Text>
                <Button
                  mode="contained"
                  icon="star-plus"
                  style={styles.emptyReviewsButton}
                  onPress={() => navigation.navigate('AddReview', { place: place })}
                >
                  Write First Review
                </Button>
              </View>
            )}
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
    borderColor: '#ffffffff',
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
    color: '#ffffffff',
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
  starsContainer: {
    flexDirection: "row",
  },
  ratingText: {
    color: "#666",
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
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  missionSectionTitle: {
    color: "#4CAF50",
    fontWeight: "bold",
    flex: 1,
  },
  contributionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contributionCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: '48%',
  },
  contributionCardContent: {
    paddingVertical: 12,
  },
  featureName: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  contributionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  contributionStat: {
    alignItems: 'center',
    gap: 4,
  },
  contributionCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  averageRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#666',
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  noContributionsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
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
  linkText: {
    color: "#2E7D32",
    textDecorationLine: "underline",
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E8F5E8',
  },
  reviewsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  reviewsCount: {
    color: '#666',
    fontSize: 12,
    marginTop: -8,
  },
  addReviewButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  addReviewButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  reviewCardContent: {
    paddingVertical: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reviewUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatarContainer: {
    position: 'relative',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  reviewUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewUserName: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reviewDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBF0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  ratingBadgeText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  reviewTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  reviewContent: {
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
    fontSize: 14,
  },
  reviewAccessibilitySection: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  accessibilityHeaderText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  reviewAccessibilityRatings: {
    gap: 8,
    marginTop: 8,
  },
  accessibilityRatingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  accessibilityRatingLabel: {
    color: '#4B5563',
    flex: 1,
    fontWeight: '500',
  },
  miniStars: {
    flexDirection: 'row',
    gap: 2,
  },
  accessibilityRatingValue: {
    color: '#6B7280',
    fontWeight: 'bold',
    fontSize: 12,
    minWidth: 32,
  },
  featureChipOutlined: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    height: 28,
  },
  featureChipText: {
    color: '#666',
    fontSize: 11,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  helpfulButton: {
    borderRadius: 20,
    borderColor: '#E5E7EB',
  },
  emptyReviews: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  emptyReviewsTitle: {
    marginTop: 12,
    marginBottom: 4,
    color: '#666',
  },
  emptyReviewsText: {
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyReviewsButton: {
    backgroundColor: '#2E7D32',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  accessibilityContributionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  contributionsBadge: {
    backgroundColor: '#2E7D32',
    color: 'white',
  },
  contributionsSubtext: {
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  allContributionsContainer: {
    gap: 12,
  },
  contributionTypeCard: {
    backgroundColor: '#F8F9FA',
    elevation: 1,
  },
  contributionTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contributionTypeTitle: {
    color: '#333',
    fontWeight: 'bold',
  },
  photosScroll: {
    marginTop: 8,
  },
  contributionPhotoItem: {
    marginRight: 12,
    width: 120,
  },
  contributionPhoto: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },
  photoDescription: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  photoMission: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  contributionReviewItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  reviewText: {
    color: '#333',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  reviewMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  reviewFeature: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  reviewDifficulty: {
    fontSize: 12,
    color: '#FF9800',
    textTransform: 'capitalize',
  },
  reviewMission: {
    fontSize: 12,
    color: '#666',
  },
  ratingsGrid: {
    gap: 8,
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
})
