import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, Alert } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'

export default function MyReviewsScreen({ navigation }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadReviews()
    }
  }, [user])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const userReviews = await DatabaseService.getUserReviews(user.id)
      setReviews(userReviews || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
      Alert.alert('Error', 'Failed to load your reviews.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadReviews()
    setRefreshing(false)
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name={i < Math.floor(rating) ? 'star' : 'star-outline'}
        size={16}
        color="#FFD700"
      />
    ))
  }

  const getAccessibilityIcon = (category) => {
    const icons = {
      mobility: 'wheelchair-accessibility',
      visual: 'eye',
      hearing: 'ear-hearing',
      cognitive: 'brain',
    }
    return icons[category] || 'check-circle'
  }

  const getAccessibilityLabel = (category) => {
    const labels = {
      mobility: 'Mobility',
      visual: 'Visual',
      hearing: 'Hearing',
      cognitive: 'Cognitive',
    }
    return labels[category] || category
  }

  const renderAccessibilityRating = (ratings) => {
    if (!ratings || typeof ratings !== 'object' || Object.keys(ratings).length === 0) return null
    
    // Filter out features sub-object and get category ratings
    const categoryRatings = Object.entries(ratings)
      .filter(([key, value]) => key !== 'features' && typeof value === 'number' && value > 0)
    
    if (categoryRatings.length === 0) return null

    return (
      <View style={styles.accessibilitySection}>
        <Text variant="labelMedium" style={styles.accessibilitySectionTitle}>
          Accessibility Ratings
        </Text>
        <View style={styles.accessibilityGrid}>
          {categoryRatings.map(([category, rating]) => (
            <View key={category} style={styles.accessibilityItem}>
              <Icon name={getAccessibilityIcon(category)} size={16} color="#2E7D32" />
              <Text variant="bodySmall" style={styles.accessibilityLabel}>
                {getAccessibilityLabel(category)}
              </Text>
              <View style={styles.accessibilityStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Icon
                    key={i}
                    name={i < Math.floor(rating) ? 'star' : 'star-outline'}
                    size={12}
                    color="#FFD700"
                  />
                ))}
              </View>
              <Text variant="bodySmall" style={styles.accessibilityValue}>
                {rating}/5
              </Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const handleNavigateToPlace = async (item) => {
    try {
      // Fetch full place/business data before navigating
      let placeData = null
      
      if (item.business_id) {
        placeData = await DatabaseService.getBusiness(item.business_id)
        if (placeData) {
          placeData = {
            ...placeData,
            type: 'business',
            business_id: placeData.id,
          }
        }
      } else if (item.place_id) {
        placeData = await DatabaseService.getPlace(item.place_id)
        if (placeData) {
          placeData = {
            ...placeData,
            type: 'place',
            place_id: placeData.id,
          }
        }
      }
      
      // If we couldn't fetch full data, use minimal data as fallback
      if (!placeData) {
        placeData = {
          id: item.business_id || item.place_id,
          type: item.business_id ? 'business' : 'place',
          business_id: item.business_id,
          place_id: item.place_id,
          name: item.business_name || item.place_name,
        }
      }
      
      navigation.navigate('PlaceDetails', { place: placeData })
    } catch (error) {
      console.error('Error fetching place data:', error)
      // Fallback to minimal data
      const place = {
        id: item.business_id || item.place_id,
        type: item.business_id ? 'business' : 'place',
        business_id: item.business_id,
        place_id: item.place_id,
        name: item.business_name || item.place_name,
      }
      navigation.navigate('PlaceDetails', { place })
    }
  }

  const renderReview = ({ item }) => (
    <Card style={styles.reviewCard} onPress={() => handleNavigateToPlace(item)}>
      <Card.Content>
        {/* Place Header */}
        <View style={styles.placeHeader}>
          <View style={styles.placeIconContainer}>
            <Icon name="map-marker" size={20} color="#2E7D32" />
          </View>
          <View style={styles.placeInfo}>
            <Text variant="titleMedium" style={styles.businessName} numberOfLines={2}>
              {item.business_name || item.place_name || 'Unknown Place'}
            </Text>
            <View style={styles.dateRow}>
              <Icon name="clock-outline" size={12} color="#999" />
              <Text variant="bodySmall" style={styles.reviewDate}>
                Reviewed on {new Date(item.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </View>
          {item.verified && (
            <Chip mode="outlined" compact style={styles.verifiedChip}>
              Verified
            </Chip>
          )}
        </View>

        {/* Overall Rating */}
        <View style={styles.overallRatingSection}>
          <View style={styles.ratingContainer}>
            <Text variant="titleLarge" style={styles.ratingNumber}>
              {item.overall_rating.toFixed(1)}
            </Text>
            <View style={styles.starsColumn}>
              <View style={styles.starsContainer}>
                {renderStars(item.overall_rating)}
              </View>
              <Text variant="bodySmall" style={styles.ratingLabel}>
                Overall Rating
              </Text>
            </View>
          </View>
        </View>

        {/* Review Title */}
        <Text variant="titleMedium" style={styles.reviewTitle}>
          {item.title}
        </Text>

        {/* Review Content */}
        <Text variant="bodyMedium" style={styles.reviewContent} numberOfLines={4}>
          {item.content}
        </Text>

        {/* Accessibility Ratings */}
        {renderAccessibilityRating(item.accessibility_ratings)}

        {/* Footer */}
        <View style={styles.reviewFooter}>
          <View style={styles.helpfulContainer}>
            <Icon name="thumb-up" size={16} color="#2E7D32" />
            <Text variant="bodySmall" style={styles.helpfulText}>
              {item.helpful_count || 0} {item.helpful_count === 1 ? 'person found' : 'people found'} this helpful
            </Text>
          </View>
          <Button
            mode="text"
            compact
            icon="arrow-right"
            onPress={() => handleNavigateToPlace(item)}
          >
            View Place
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={{ marginTop: 16 }}>Loading your reviews...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Icon name="star-circle" size={28} color="#FFD700" />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineSmall" style={styles.title}>
              My Reviews
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
        </View>
        {reviews.length > 0 && (
          <Text variant="bodySmall" style={styles.headerHint}>
            Tap any review to view the place and read more reviews
          </Text>
        )}
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="star-outline" size={80} color="#FFD700" />
            </View>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Reviews Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Share your experiences with accessible places to help others!
            </Text>
            <Text variant="bodySmall" style={styles.emptyHint}>
              Your reviews help make places more accessible for everyone
            </Text>
            <Button
              mode="contained"
              icon="magnify"
              onPress={() => navigation.navigate('Explore')}
              style={styles.exploreButton}
            >
              Explore & Review Places
            </Button>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 2,
  },
  headerHint: {
    color: '#999',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  reviewCard: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
    gap: 4,
  },
  businessName: {
    color: '#2E7D32',
    fontWeight: 'bold',
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewDate: {
    color: '#999',
    fontSize: 11,
  },
  verifiedChip: {
    height: 28,
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  overallRatingSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFBF0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingNumber: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 28,

  },
  starsColumn: {
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  ratingLabel: {
    color: '#666',
  },
  reviewTitle: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  reviewContent: {
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  accessibilitySection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  accessibilitySectionTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  accessibilityGrid: {
    gap: 8,
  },
  accessibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  accessibilityLabel: {
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  accessibilityStars: {
    flexDirection: 'row',
    gap: 2,
  },
  accessibilityValue: {
    color: '#666',
    fontWeight: 'bold',
    minWidth: 32,
    textAlign: 'right',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  helpfulContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  helpfulText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFBF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#333',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emptyHint: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  exploreButton: {
    marginTop: 8,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
  },
})