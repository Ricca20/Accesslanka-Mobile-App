import { useState, useEffect, useMemo, useRef } from "react"
import { View, StyleSheet, Dimensions, Alert, TouchableOpacity, Platform } from "react-native"
import { Searchbar, Card, Text, Button, List, Divider, ActivityIndicator, FAB, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps"
import * as Location from 'expo-location'
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { DatabaseService } from "../../lib/database"
import { DatabasePlacesService } from "../../services/DatabasePlacesService"
import AccessibilityService from "../../services/AccessibilityService"

const { width, height } = Dimensions.get("window")
// Malabe area coordinates (center of Malabe, Sri Lanka)
const MALABE_CENTER = {
  latitude: 6.9063,
  longitude: 79.9738,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

export default function ExploreScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [searchHistory, setSearchHistory] = useState([])
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [region, setRegion] = useState(MALABE_CENTER)
  const mapRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  const categories = [
    { key: "all", label: "All", icon: "view-list" },
    { key: "education", label: "Education", icon: "school" },
    { key: "parks", label: "Parks", icon: "tree" },
    { key: "restaurants", label: "Restaurants", icon: "silverware-fork-knife" },
    { key: "shopping", label: "Shopping", icon: "shopping" },
    { key: "healthcare", label: "Healthcare", icon: "hospital-box" },
    { key: "temple", label: "Religious", icon: "church" },
    { key: "government", label: "Services", icon: "city" },
  ]

  // Announce screen when loaded
  useEffect(() => {
    AccessibilityService.announce("Explore screen. Search for accessible places or browse the map.", 500)
  }, [])

  // Request location permissions and get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          const message = 'Location permission is needed to show your position and provide directions.'
          Alert.alert('Permission Required', message, [{ text: 'OK' }])
          AccessibilityService.announce(message)
          return
        }

        AccessibilityService.announce("Getting your location")
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        
        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
        
        setUserLocation(userCoords)
        AccessibilityService.announce("Location found. Map centered on your position.")
        
        // Center map on user location
        setRegion({
          ...userCoords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        })
      } catch (error) {
        console.error('Error getting location:', error)
        AccessibilityService.announce("Unable to get your location")
      }
    })()
  }, [])

  // Fetch places from Supabase
  useEffect(() => {
    fetchPlaces()
  }, [])

  const fetchPlaces = async () => {
    try {
      setLoading(true)
      // Fetch both places and businesses
      const [placesData, businessesData] = await Promise.all([
        DatabaseService.getPlaces({ verified: true }),
        DatabaseService.getBusinesses({ verified: true })
      ])
      
      // Combine and normalize data
      const allPlaces = [
        ...placesData.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          address: p.address,
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          accessibility_features: p.accessibility_features || [],
          features: p.accessibility_features || [],
          images: p.images || [],
          photos: p.images || [],
          phone: p.phone || null,
          website: p.website || null,
          opening_hours: p.opening_hours || null,
          rating: p.rating || 4.0,
          accessibility_rating: p.accessibility_rating || 4.0,
          type: 'place',
          verified: p.verified,
        })),
        ...businessesData.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category,
          description: b.description,
          address: b.address,
          latitude: parseFloat(b.latitude),
          longitude: parseFloat(b.longitude),
          accessibility_features: b.accessibility_features || [],
          features: b.accessibility_features || [],
          images: b.images || [],
          photos: b.images || [],
          phone: b.phone || null,
          website: b.website || null,
          opening_hours: b.opening_hours || null,
          rating: b.rating || 4.0,
          accessibility_rating: b.accessibility_rating || 4.0,
          type: 'business',
          verified: b.verified,
        }))
      ]
      
      setPlaces(allPlaces)
    } catch (error) {
      console.error('Error fetching places:', error)
      Alert.alert('Error', 'Failed to load places. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      // Show recent searches when no query
      if (searchHistory.length > 0) {
        return searchHistory.slice(0, 3).map(item => ({
          type: 'history',
          text: item,
          subtitle: 'Recent search',
          icon: 'history',
          data: item
        }))
      }
      return []
    }
    
    const query = searchQuery.toLowerCase()
    const suggestions = []
    
    // Add quick actions
    if ('nearby'.includes(query) || 'near me'.includes(query)) {
      suggestions.push({
        type: 'action',
        text: 'Search Nearby',
        subtitle: 'Find accessible places near you in Malabe',
        icon: 'crosshairs-gps',
        data: 'nearby'
      })
    }
    
    // Add category suggestions
    categories.forEach(category => {
      if (category.key !== 'all' && category.label.toLowerCase().includes(query)) {
        const categoryPlaces = places.filter(p => p.category === category.key)
        if (categoryPlaces.length > 0) {
          suggestions.push({
            type: 'category',
            text: category.label,
            subtitle: `${categoryPlaces.length} verified accessible places`,
            icon: category.icon,
            data: category.key
          })
        }
      }
    })
    
    // Add our database place suggestions
    places.forEach(place => {
      if (place.name.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'place',
          text: place.name,
          subtitle: `${place.category} • ${place.address.split(',')[0]} • Verified`,
          icon: 'check-decagram',
          data: place
        })
      }
    })
    
    // Add feature suggestions
    const allFeatures = [...new Set(places.flatMap(p => p.features || []))]
    allFeatures.forEach(feature => {
      if (feature.toLowerCase().includes(query)) {
        const placesWithFeature = places.filter(p => 
          p.features?.some(f => f.toLowerCase().includes(feature.toLowerCase()))
        )
        if (placesWithFeature.length > 0) {
          suggestions.push({
            type: 'feature',
            text: feature,
            subtitle: `${placesWithFeature.length} verified accessible places`,
            icon: 'wheelchair-accessibility',
            data: feature
          })
        }
      }
    })
    
    return suggestions.slice(0, 10)
  }, [searchQuery, places, searchHistory, categories])

  // Filter places based on search query and category
  const filteredPlaces = useMemo(() => {
    let filteredList = places

    // Filter by category
    if (selectedCategory !== "all") {
      filteredList = filteredList.filter(place => place.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filteredList = filteredList.filter(place => 
        place.name.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query) ||
        place.description?.toLowerCase().includes(query) ||
        place.features?.some(feature => feature.toLowerCase().includes(query))
      )
    }

    return filteredList
  }, [searchQuery, selectedCategory, places])

  // No longer using Google Places API - all searches are from local database

  // Handle search input
  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setShowSuggestions(query.trim().length >= 2)
    setShowSearchResults(false)
  }

  // Handle suggestion selection
  const handleSuggestionPress = async (suggestion) => {
    setShowSuggestions(false)
    
    // Add to search history
    if (!searchHistory.includes(suggestion.text)) {
      setSearchHistory([suggestion.text, ...searchHistory.slice(0, 9)])
    }
    
    if (suggestion.type === 'place') {
      // Navigate to place details screen
      const place = suggestion.data
      navigation.navigate('PlaceDetails', { place })
    } else if (suggestion.type === 'category') {
      // Filter by category
      setSelectedCategory(suggestion.data)
      setSearchQuery('')
      setShowSearchResults(true)
    } else if (suggestion.type === 'action' && suggestion.data === 'nearby') {
      // Search nearby places
      handleNearbySearch()
    } else {
      // General search
      setSearchQuery(suggestion.text)
      setShowSearchResults(true)
      handleSearchSubmit()
    }
  }

  // Select a specific place
  const selectPlace = (place) => {
    setSelectedPlace(place)
  }

  // Focus map on a specific place
  const focusOnPlace = (place) => {
    if (mapRef.current && place.latitude && place.longitude) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000)
      setSelectedPlace(place)
    }
  }

  // Handle marker press - navigate to details screen
  const handleMarkerPress = (place) => {
    navigation.navigate('PlaceDetails', { place })
  }

  // Handle search submit
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      setShowSearchResults(true)
      
      if (filteredPlaces.length === 0) {
        Alert.alert(
          "No Results",
          `No places found for "${searchQuery}". Try a different search term.`,
          [{ text: "OK" }]
        )
      }
    }
  }

  // Search nearby places
  const handleNearbySearch = () => {
    if (!userLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to search nearby places.',
        [{ text: 'OK' }]
      )
      return
    }
    
    setSearchQuery('Nearby Places')
    setShowSearchResults(true)
    setShowNearbyPlaces(true)
    setShowSuggestions(false)
    
    // Calculate distances and sort by nearest
    const placesWithDistance = places.map(place => ({
      ...place,
      distance: getDistance(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      )
    })).sort((a, b) => a.distance - b.distance)
    
    // Show nearest 10 places
    const nearbyPlaces = placesWithDistance.slice(0, 10)
    
    if (nearbyPlaces.length > 0) {
      fitMarkersToMap(nearbyPlaces)
    }
  }
  
  // Calculate distance between two coordinates (in km)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("")
    setShowSearchResults(false)
    setShowSuggestions(false)
    setShowNearbyPlaces(false)
    setSelectedCategory("all")
    setSelectedPlace(null)
  }

  // Get category icon
  const getCategoryIcon = (category) => {
    const categoryItem = categories.find(c => c.key === category)
    return categoryItem?.icon || 'map-marker'
  }
  
  // Get category color based on category
  const getCategoryColor = (category) => {
    const colors = {
      education: '#3F51B5',
      parks: '#4CAF50',
      restaurants: '#FF9800',
      shopping: '#E91E63',
      healthcare: '#F44336',
      temple: '#795548',
      government: '#607D8B',
    }
    return colors[category] || '#2E7D32'
  }
  
  // Render a place card
  const renderPlaceCard = (place, index, totalPlaces) => {
    const categoryColor = getCategoryColor(place.category)
    const features = place.features && place.features.length > 0 
      ? place.features.slice(0, 2).join(', ') 
      : 'No accessibility features listed'
    const verifiedStatus = place.verified ? 'Verified accessible' : 'Not verified'
    
    const accessibilityLabel = AccessibilityService.listItemLabel(
      `${place.name}, ${place.category}, ${place.address}, ${features}, ${verifiedStatus}`,
      index,
      totalPlaces
    )
    
    return (
      <Card
        key={place.id}
        style={styles.placeCard}
        onPress={() => {
          navigation.navigate("PlaceDetails", { place })
          AccessibilityService.announce(`Opening ${place.name}`)
        }}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={AccessibilityService.buttonHint("view place details")}
        accessibilityRole="button"
      >
        <Card.Content>
          <View style={styles.placeCardHeader} accessible={false}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]} {...AccessibilityService.ignoreProps()}>
              <Icon name={getCategoryIcon(place.category)} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.placeCardInfo}>
              <Text variant="titleMedium" style={styles.placeCardTitle}>
                {place.name}
              </Text>
              <Text variant="bodySmall" style={styles.placeCardAddress}>
                {place.address}
              </Text>
              {place.features && place.features.length > 0 && (
                <View style={styles.featuresContainer}>
                  <Icon name="wheelchair-accessibility" size={14} color="#2E7D32" {...AccessibilityService.ignoreProps()} />
                  <Text variant="bodySmall" style={styles.featuresText}>
                    {place.features.slice(0, 2).join(', ')}
                  </Text>
                </View>
              )}
            </View>
            {place.verified && (
              <Chip
                mode="flat"
                style={styles.verifiedChip}
                textStyle={styles.verifiedChipText}
                icon="check-decagram"
                compact
                {...AccessibilityService.ignoreProps()}
              >
                Verified
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View 
          style={styles.loadingContainer}
          {...AccessibilityService.loadingProps('accessible places')}
        >
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading accessible places...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView 
      style={styles.container}
      accessible={false}
    >
      <View style={styles.searchContainer}>
        <View
          accessible={true}
          accessibilityLabel={searchQuery ? `Search for accessible places. Current text: ${searchQuery}` : "Search for accessible places"}
          accessibilityHint="Double tap to search for places"
          accessibilityRole="search"
        >
          <Searchbar
            placeholder="Search for accessible places"
            onChangeText={handleSearchChange}
            value={searchQuery}
            style={styles.searchbar}
            onSubmitEditing={handleSearchSubmit}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            loading={isSearching}
            importantForAccessibility="no-hide-descendants"
            right={() => searchQuery ? (
              <Button 
                onPress={handleClearSearch} 
                compact
                accessibilityLabel="Clear search"
                accessibilityHint={AccessibilityService.buttonHint("clear search text")}
                accessibilityRole="button"
              >
                Clear
              </Button>
            ) : null}
          />
        </View>
        
        {/* Search suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <Card 
            style={styles.suggestionsCard}
            accessible={true}
            accessibilityLabel={`${searchSuggestions.length} search suggestions available`}
            accessibilityRole="menu"
          >
            <Card.Content style={styles.suggestionsContent}>
              {searchSuggestions.map((suggestion, index) => (
                <View key={index}>
                  <TouchableOpacity 
                    onPress={() => {
                      handleSuggestionPress(suggestion)
                      AccessibilityService.announce(`Selected ${suggestion.text}`)
                    }}
                    accessible={true}
                    accessibilityLabel={AccessibilityService.listItemLabel(
                      `${suggestion.text}. ${suggestion.subtitle}`,
                      index,
                      searchSuggestions.length
                    )}
                    accessibilityHint={AccessibilityService.buttonHint(`select ${suggestion.text}`)}
                    accessibilityRole="menuitem"
                  >
                    <List.Item
                      title={suggestion.text}
                      description={suggestion.subtitle}
                      left={(props) => <List.Icon {...props} icon={suggestion.icon} {...AccessibilityService.ignoreProps()} />}
                      style={styles.suggestionItem}
                      accessible={false}
                    />
                  </TouchableOpacity>
                  {index < searchSuggestions.length - 1 && <Divider {...AccessibilityService.ignoreProps()} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Map View */}
      <View 
        style={styles.mapContainer}
        accessible={false}
      >
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          accessible={false}
          accessibilityElementsHidden={true}
        >
          {/* Render markers for all places */}
          {filteredPlaces.map((place, index) => (
            <Marker
              key={place.id}
              coordinate={{
                latitude: parseFloat(place.latitude),
                longitude: parseFloat(place.longitude),
              }}
              title={place.name}
              description={`${place.address} - Tap to view details`}
              onPress={() => {
                handleMarkerPress(place)
                AccessibilityService.announce(`Opening ${place.name}`)
              }}
              accessible={true}
              accessibilityLabel={AccessibilityService.markerLabel(place.name, place.category)}
              accessibilityHint={AccessibilityService.markerHint()}
              accessibilityRole="button"
            >
              <View style={[
                styles.markerContainer,
                selectedPlace?.id === place.id && styles.selectedMarker
              ]}>
                <Icon 
                  name={place.accessibility_features?.wheelchair_accessible ? "wheelchair-accessibility" : "map-marker"}
                  size={30}
                  color={selectedPlace?.id === place.id ? "#2E7D32" : "#1976D2"}
                />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>
      
      {/* Floating AI Assistant Button */}
      <View
        style={styles.fabContainer}
        accessible={true}
        accessibilityLabel="AI Assistant button"
        accessibilityHint="Double tap to open AI chatbot assistant"
        accessibilityRole="button"
      >
        <FAB
          icon="robot"
          style={styles.fab}
          onPress={() => {
            navigation.navigate('Chatbot')
            AccessibilityService.announceNavigation('AI Assistant')
          }}
          label="AI Assistant"
          color="#FFFFFF"
          importantForAccessibility="no-hide-descendants"
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 4,
    zIndex: 1,
  },
  searchbar: {
    elevation: 2,
    marginBottom: 12,
  },
  suggestionsCard: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
    elevation: 8,
  },
  suggestionsContent: {
    padding: 0,
  },
  suggestionItem: {
    paddingVertical: 8,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
  },
  fabContainer: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  fab: {
    backgroundColor: '#2E7D32',
  },
})