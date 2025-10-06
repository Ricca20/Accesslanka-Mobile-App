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

  const renderAccessibilityRating = (ratings) => {
    if (!ratings) return null
    const avgRating = Object.values(ratings).reduce((sum, val) => sum + val, 0) / Object.keys(ratings).length
    return (
      <View style={styles.accessibilityRating}>
        <Icon name="wheelchair-accessibility" size={16} color="#2E7D32" />
        <Text variant="bodySmall" style={styles.accessibilityText}>
          {avgRating.toFixed(1)}/5 accessibility
        </Text>
      </View>
    )
  }

  const renderReview = ({ item }) => (
    <Card style={styles.reviewCard} onPress={() => {
      // Navigate to place details
      navigation.navigate('PlaceDetails', { 
        place: { id: item.business_id || item.place_id }
      })
    }}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <View style={styles.businessInfo}>
            <Text variant="titleMedium" style={styles.businessName}>
              {item.business_name || item.place_name || 'Unknown Place'}
            </Text>
            <Text variant="bodySmall" style={styles.reviewDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(item.overall_rating)}
            </View>
            <Text variant="bodySmall">{item.overall_rating}/5</Text>
          </View>
        </View>

        <Text variant="titleSmall" style={styles.reviewTitle}>
          {item.title}
        </Text>

        <Text variant="bodyMedium" style={styles.reviewContent}>
          {item.content}
        </Text>

        {renderAccessibilityRating(item.accessibility_ratings)}

        <View style={styles.reviewFooter}>
          <View style={styles.helpfulContainer}>
            <Icon name="thumb-up-outline" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.helpfulText}>
              {item.helpful_count || 0} found helpful
            </Text>
          </View>
          {item.verified && (
            <Chip mode="outlined" compact>
              Verified
            </Chip>
          )}
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
        <Text variant="headlineSmall" style={styles.title}>
          My Reviews
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </Text>
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
            <Icon name="star-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No reviews yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Start exploring and share your experiences with accessible places!
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Explore')}
              style={styles.exploreButton}
            >
              Explore Places
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
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  reviewCard: {
    marginBottom: 16,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  reviewDate: {
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  reviewTitle: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reviewContent: {
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  accessibilityRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  accessibilityText: {
    color: '#2E7D32',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpfulContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpfulText: {
    color: '#666',
  },
  emptyTitle: {
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    marginTop: 8,
  },
})