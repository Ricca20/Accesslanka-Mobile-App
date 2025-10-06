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
    const place = item.business || item.place || item
    const name = place.name || 'Unknown Place'
    const category = place.category || 'general'
    const address = place.address || 'No address available'
    const verified = place.verified || false
    const rating = place.rating || 4.0 // Default rating

    return (
      <Card 
        style={styles.favoriteCard} 
        onPress={() => navigation.navigate('PlaceDetails', { place })}
      >
        <Card.Content>
          <View style={styles.favoriteHeader}>
            <View style={styles.categoryIcon}>
              <Icon name={getCategoryIcon(category)} size={24} color="#2E7D32" />
            </View>
            <View style={styles.favoriteInfo}>
              <View style={styles.titleRow}>
                <Text variant="titleMedium" style={styles.favoriteName}>
                  {name}
                </Text>
                {verified && (
                  <Icon name="check-decagram" size={16} color="#2E7D32" />
                )}
              </View>
              <Text variant="bodySmall" style={styles.favoriteCategory}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <Text variant="bodySmall" style={styles.favoriteAddress}>
                {address}
              </Text>
            </View>
            <IconButton
              icon="heart"
              iconColor="#e91e63"
              size={24}
              onPress={() => removeFavorite(item)}
            />
          </View>

          <View style={styles.favoriteFooter}>
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(rating)}
              </View>
              <Text variant="bodySmall" style={styles.ratingText}>
                {rating}/5
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.favoriteDate}>
              Added {new Date(item.created_at).toLocaleDateString()}
            </Text>
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
        <Text variant="headlineSmall" style={styles.title}>
          My Favorites
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {favorites.length} {favorites.length === 1 ? 'place' : 'places'} saved
        </Text>
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
            <Icon name="heart-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No favorites yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Start exploring and save your favorite accessible places!
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
  favoriteCard: {
    marginBottom: 16,
    elevation: 2,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#e8f5e8',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteName: {
    color: '#2E7D32',
    fontWeight: 'bold',
    flex: 1,
  },
  favoriteCategory: {
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  favoriteAddress: {
    color: '#999',
    marginTop: 2,
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    color: '#666',
  },
  favoriteDate: {
    color: '#999',
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