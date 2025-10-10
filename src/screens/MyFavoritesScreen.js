import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, Alert } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, IconButton } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'

export default function MyFavoritesScreen({ navigation }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadFavorites()
    }
  }, [user])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const userFavorites = await DatabaseService.getUserFavorites(user.id)
      setFavorites(userFavorites || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
      Alert.alert('Error', 'Failed to load your favorites.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadFavorites()
    setRefreshing(false)
  }

  const removeFavorite = async (item) => {
    try {
      if (item.business_id) {
        await DatabaseService.removeFavoriteBusiness(user.id, item.business_id)
      } else if (item.place_id) {
        await DatabaseService.removeFavoritePlace(user.id, item.place_id)
      }
      
      // Update local state
      setFavorites(prev => prev.filter(fav => fav.id !== item.id))
      
      Alert.alert('Success', 'Removed from favorites')
    } catch (error) {
      console.error('Error removing favorite:', error)
      Alert.alert('Error', 'Failed to remove from favorites.')
    }
  }

  const renderStars = (rating) => {
    const defaultRating = rating || 4.0 // Default rating if not available
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name={i < Math.floor(defaultRating) ? 'star' : 'star-outline'}
        size={14}
        color="#FFD700"
      />
    ))
  }

  const getCategoryIcon = (category) => {
    const icons = {
      hotels: 'bed',
      restaurants: 'silverware-fork-knife',
      museums: 'bank',
      parks: 'tree',
      shopping: 'shopping',
      transport: 'bus',
      healthcare: 'hospital-box',
      education: 'school',
      entertainment: 'movie',
      government: 'city'
    }
    return icons[category] || 'map-marker'
  }

  const renderFavorite = ({ item }) => {
    // Handle both business and place data
    const placeData = item.business || item.place || item
    const name = placeData.name || 'Unknown Place'
    const category = placeData.category || 'general'
    const address = placeData.address || 'No address available'
    const verified = placeData.verified || false
    const rating = placeData.rating || 4.0 // Default rating
    
    // Ensure the place object has all necessary fields for PlaceDetailsScreen
    const place = {
      ...placeData,
      // Add type field to help PlaceDetailsScreen identify business vs place
      type: item.business_id ? 'business' : 'place',
      business_id: item.business_id,
      place_id: item.place_id,
    }

    return (
      <Card 
        style={styles.favoriteCard} 
        onPress={() => navigation.navigate('PlaceDetails', { place })}
      >
        <Card.Content>
          <View style={styles.favoriteHeader}>
            <View style={styles.categoryIcon}>
              <Icon name={getCategoryIcon(category)} size={28} color="#2E7D32" />
            </View>
            <View style={styles.favoriteInfo}>
              <View style={styles.titleRow}>
                <Text variant="titleMedium" style={styles.favoriteName} numberOfLines={2}>
                  {name}
                </Text>

              </View>
              <Chip 
                mode="outlined" 
                compact 
                style={styles.categoryChip}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Chip>
              <View style={styles.addressRow}>
                <Icon name="map-marker" size={14} color="#999" />
                <Text variant="bodySmall" style={styles.favoriteAddress} numberOfLines={2}>
                  {address}
                </Text>
              </View>
            </View>
            <IconButton
              icon="heart"
              iconColor="#e91e63"
              size={24}
              onPress={(e) => {
                e.stopPropagation()
                removeFavorite(item)
              }}
              style={styles.heartButton}
            />
          </View>

          <View style={styles.favoriteFooter}>
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(rating)}
              </View>
              <Text variant="bodySmall" style={styles.ratingText}>
                {rating.toFixed(1)}/5
              </Text>
            </View>
            <View style={styles.dateContainer}>
              <Icon name="clock-outline" size={12} color="#999" />
              <Text variant="bodySmall" style={styles.favoriteDate}>
                Added {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>

            <Button
              mode="text"
              compact
              icon="information"
              onPress={() => navigation.navigate('PlaceDetails', { place })}
              style={styles.actionButton}
            >
              View Details
            </Button>
          </View>
        </Card.Content>
      </Card>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={{ marginTop: 16 }}>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Icon name="heart" size={28} color="#e91e63" />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineSmall" style={styles.title}>
              My Favorites
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {favorites.length} {favorites.length === 1 ? 'place' : 'places'} saved
            </Text>
          </View>
        </View>
        {favorites.length > 0 && (
          <Text variant="bodySmall" style={styles.headerHint}>
            Tap any place to view details and reviews
          </Text>
        )}
      </View>

      <FlatList
        data={favorites}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="heart-outline" size={80} color="#e91e63" />
            </View>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Favorites Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Start exploring and save your favorite accessible places!
            </Text>
            <Text variant="bodySmall" style={styles.emptyHint}>
              Tap the heart icon on any place to add it to your favorites
            </Text>
            <Button
              mode="contained"
              icon="magnify"
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
  favoriteCard: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#e8f5e8',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteInfo: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  favoriteName: {
    color: '#2E7D32',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 26,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    height: 34,
    backgroundColor: '#F0F8F0',
    borderColor: '#2E7D32',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  favoriteAddress: {
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  heartButton: {
    margin: 0,
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    color: '#666',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteDate: {
    color: '#999',
    fontSize: 11,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF0F5',
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