import { useState, useEffect, useMemo, useRef } from "react"
import { View, StyleSheet, Dimensions, Alert, TouchableOpacity, Platform } from "react-native"
import { Searchbar, FAB, Card, Text, Chip, Button, List, Divider, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import MapViewDirections from 'react-native-maps-directions'
import * as Location from 'expo-location'
import Constants from 'expo-constants'
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { DatabaseService } from "../../lib/database"
import { GooglePlacesService } from "../../services/GooglePlacesService"

const { width, height } = Dimensions.get("window")
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

export default function ExploreScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [showDirections, setShowDirections] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false)
  const [googlePlaces, setGooglePlaces] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const mapRef = useRef(null)
  const searchTimeoutRef = useRef(null)
  
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  const categories = [
    { key: "all", label: "All", icon: "view-list" },
    { key: "museum", label: "Museums", icon: "bank" },
    { key: "park", label: "Parks", icon: "tree" },
    { key: "monument", label: "Monuments", icon: "flag" },
    { key: "restaurants", label: "Restaurants", icon: "silverware-fork-knife" },
    { key: "hotels", label: "Hotels", icon: "bed" },
    { key: "temple", label: "Temples", icon: "church" },
    { key: "shopping", label: "Shopping", icon: "shopping" },
  ]

  // Request location permissions and get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Location permission is needed to show your position and provide directions.',
            [{ text: 'OK' }]
          )
          return
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        
        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
        
        setUserLocation(userCoords)
        
        // Center map on user location
        setRegion({
          ...userCoords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        })
      } catch (error) {
        console.error('Error getting location:', error)
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
          features: p.accessibility_features || [],
          images: p.images || [],
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
          features: b.accessibility_features || [],
          images: b.images || [],
          phone: b.phone,
          website: b.website,
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
    
    // Add Google Places results FIRST (real-world search)
    if (googlePlaces.length > 0) {
      googlePlaces.slice(0, 5).forEach(place => {
        suggestions.push({
          type: 'google_place',
          text: place.name,
          subtitle: place.address,
          icon: 'earth',
          data: place
        })
      })
    }
    
    // Add quick actions
    if ('nearby'.includes(query) || 'near me'.includes(query)) {
      suggestions.push({
        type: 'action',
        text: 'Search Nearby',
        subtitle: 'Find accessible places near you',
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
  }, [searchQuery, places, searchHistory, categories, googlePlaces])

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

  // Search Google Places API
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Only search if query is long enough
    if (searchQuery.trim().length >= 3) {
      setIsSearching(true)
      
      // Debounce API calls
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await GooglePlacesService.searchPlaces(
            searchQuery,
            userLocation,
            50000 // 50km radius
          )
          setGooglePlaces(results)
        } catch (error) {
          console.error('Error searching Google Places:', error)
        } finally {
          setIsSearching(false)
        }
      }, 500) // 500ms debounce
    } else {
      setGooglePlaces([])
      setIsSearching(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, userLocation])

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
    
    if (suggestion.type === 'google_place') {
      // Handle Google Place selection
      setIsSearching(true)
      try {
        const placeDetails = await GooglePlacesService.getPlaceDetails(suggestion.data.placeId)
        if (placeDetails && typeof placeDetails === 'object') {
          setSearchQuery(placeDetails.name)
          setShowSearchResults(true)
          
          // Create a place object compatible with our system
          const googlePlace = {
            ...placeDetails,
            id: placeDetails.placeId,
            features: placeDetails.wheelchairAccessible ? ['Wheelchair Accessible'] : [],
            verified: false, // Google places are not verified by us
            isGooglePlace: true
          }
          
          focusOnPlace(googlePlace)
          setSelectedPlace(googlePlace)
        } else {
          Alert.alert('Error', 'Invalid place data received. Please try another place.')
        }
      } catch (error) {
        console.error('Error getting place details:', error)
        Alert.alert('Error', 'Could not load place details. Please try again.')
      } finally {
        setIsSearching(false)
      }
    } else if (suggestion.type === 'place') {
      // Focus on specific place from our database
      const place = suggestion.data
      setSearchQuery(place.name)
      setShowSearchResults(true)
      focusOnPlace(place)
      setSelectedPlace(place)
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

  // Focus map on a specific place
  const focusOnPlace = (place) => {
    setRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000)
    }
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
      } else if (filteredPlaces.length === 1) {
        focusOnPlace(filteredPlaces[0])
      } else {
        fitMarkersToMap(filteredPlaces)
      }
    }
  }

  // Fit multiple markers in map view
  const fitMarkersToMap = (placesToFit) => {
    if (placesToFit.length > 1 && mapRef.current) {
      const coordinates = placesToFit.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }))
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      })
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
    setShowDirections(false)
    setSelectedPlace(null)
  }

  // Handle marker press
  const onMarkerPress = (place) => {
    setSelectedPlace(place)
    focusOnPlace(place)
  }

  // Show directions to selected place
  const handleShowDirections = () => {
    if (!userLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to get directions.',
        [{ text: 'OK' }]
      )
      return
    }
    
    if (!selectedPlace) {
      Alert.alert('No Place Selected', 'Please select a place first.')
      return
    }
    
    setShowDirections(true)
    
    // Fit both user location and destination in view
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [userLocation, { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude }],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      )
    }
  }

  // Get marker color based on category
  const getMarkerColor = (category) => {
    const colors = {
      museum: '#9C27B0',
      park: '#4CAF50',
      monument: '#FF5722',
      restaurants: '#FF9800',
      hotels: '#2196F3',
      temple: '#795548',
      shopping: '#E91E63',
    }
    return colors[category] || '#2E7D32'
  }

  // Custom marker component
  const renderMarker = (place) => {
    const isSelected = selectedPlace?.id === place.id
    const color = getMarkerColor(place.category)
    
    return (
      <Marker
        key={place.id}
        coordinate={{
          latitude: place.latitude,
          longitude: place.longitude,
        }}
        title={place.name}
        description={place.address}
        onPress={() => onMarkerPress(place)}
        pinColor={color}
      >
        <View style={[
          styles.customMarker,
          isSelected && styles.selectedMarker,
          { backgroundColor: color }
        ]}>
          <Icon 
            name="wheelchair-accessibility" 
            size={isSelected ? 24 : 20} 
            color="#FFFFFF" 
          />
        </View>
      </Marker>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading accessible places...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search any place worldwide..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchbar}
          accessibilityLabel="Search for accessible places"
          onSubmitEditing={handleSearchSubmit}
          onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
          loading={isSearching}
          right={() => searchQuery ? (
            <Button onPress={handleClearSearch} compact>
              Clear
            </Button>
          ) : null}
        />
        
        {/* Search suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <Card style={styles.suggestionsCard}>
            <Card.Content style={styles.suggestionsContent}>
              {searchSuggestions.map((suggestion, index) => (
                <View key={index}>
                  <TouchableOpacity onPress={() => handleSuggestionPress(suggestion)}>
                    <List.Item
                      title={suggestion.text}
                      description={suggestion.subtitle}
                      left={(props) => <List.Icon {...props} icon={suggestion.icon} />}
                      style={styles.suggestionItem}
                    />
                  </TouchableOpacity>
                  {index < searchSuggestions.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
        
        {/* Category filters */}
        <View style={styles.categoryContainer}>
          {categories.slice(0, 4).map((category) => (
            <Chip
              key={category.key}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              style={styles.categoryChip}
              icon={category.icon}
              compact
            >
              {category.label}
            </Chip>
          ))}
        </View>
        
        {/* Search results info */}
        {showSearchResults && (
          <View style={styles.resultsInfo}>
            <Text variant="bodyMedium" style={styles.resultsText}>
              {filteredPlaces.length} place{filteredPlaces.length !== 1 ? 's' : ''} found
              {searchQuery ? ` for "${searchQuery}"` : ''}
            </Text>
          </View>
        )}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        accessibilityLabel="Map showing accessible places"
        onPress={() => setShowSuggestions(false)}
      >
        {/* Render markers */}
        {filteredPlaces.map((place) => renderMarker(place))}
        
        {/* Show directions */}
        {showDirections && selectedPlace && userLocation && GOOGLE_MAPS_API_KEY && (
          <MapViewDirections
            origin={userLocation}
            destination={{
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
            }}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#2E7D32"
            optimizeWaypoints={true}
            onStart={(params) => {
              console.log(`Started routing between "${params.origin}" and "${params.destination}"`)
            }}
            onReady={result => {
              console.log(`Distance: ${result.distance} km`)
              console.log(`Duration: ${result.duration} min.`)
            }}
            onError={(errorMessage) => {
              console.error('Directions error:', errorMessage)
              Alert.alert('Directions Error', 'Unable to get directions. Please try again.')
            }}
          />
        )}
      </MapView>

      {/* Selected place info card */}
      {selectedPlace && (
        <Card style={styles.placeInfoCard}>
          <Card.Content>
            <View style={styles.placeInfoHeader}>
              <View style={styles.placeInfoText}>
                <View style={styles.placeNameRow}>
                  <Text variant="titleMedium" style={styles.placeName}>
                    {selectedPlace.name}
                  </Text>
                  {selectedPlace.isGooglePlace && (
                    <Chip
                      mode="flat"
                      style={styles.googleChip}
                      textStyle={styles.googleChipText}
                      icon="earth"
                      compact
                    >
                      Google
                    </Chip>
                  )}
                  {selectedPlace.verified && !selectedPlace.isGooglePlace && (
                    <Chip
                      mode="flat"
                      style={styles.verifiedChip}
                      textStyle={styles.verifiedChipText}
                      icon="check-decagram"
                      compact
                    >
                      Verified
                    </Chip>
                  )}
                </View>
                <Text variant="bodySmall" style={styles.placeAddress}>
                  {selectedPlace.address}
                </Text>
                {selectedPlace.rating > 0 && (
                  <Text variant="bodySmall" style={styles.placeRating}>
                    ⭐ {selectedPlace.rating.toFixed(1)}
                  </Text>
                )}
                {selectedPlace.features && selectedPlace.features.length > 0 && (
                  <Text variant="bodySmall" style={styles.placeFeatures}>
                    {selectedPlace.features.slice(0, 2).join(', ')}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.placeInfoActions}>
              {!selectedPlace.isGooglePlace && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("PlaceDetails", { place: selectedPlace })}
                  style={styles.detailsButton}
                  icon="information"
                >
                  Details
                </Button>
              )}
              {userLocation && (
                <Button
                  mode={selectedPlace.isGooglePlace ? "contained" : "outlined"}
                  onPress={handleShowDirections}
                  style={styles.directionsButton}
                  icon="directions"
                >
                  Directions
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Nearby Places FAB */}
      {userLocation && (
        <FAB 
          icon="crosshairs-gps" 
          style={styles.nearbyFab} 
          onPress={handleNearbySearch} 
          accessibilityLabel="Find nearby places"
          size="small"
          label="Nearby"
        />
      )}
      
      {/* FAB for adding new place */}
      <FAB 
        icon="plus" 
        style={styles.fab} 
        onPress={() => navigation.navigate("AddPlace")} 
        accessibilityLabel="Add new place" 
      />
      
      {/* Refresh FAB */}
      <FAB 
        icon="refresh" 
        style={styles.refreshFab} 
        onPress={fetchPlaces} 
        accessibilityLabel="Refresh places"
        size="small"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    marginRight: 4,
  },
  resultsInfo: {
    marginTop: 8,
    paddingVertical: 4,
  },
  resultsText: {
    color: "#666",
    fontWeight: "500",
  },
  map: {
    flex: 1,
    width: width,
    height: height - 250,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
  },
  placeInfoCard: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    elevation: 8,
    borderRadius: 12,
  },
  placeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  placeInfoText: {
    flex: 1,
    marginRight: 8,
  },
  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  placeName: {
    fontWeight: 'bold',
  },
  googleChip: {
    backgroundColor: '#4285F4',
    height: 24,
  },
  googleChipText: {
    fontSize: 11,
    color: '#FFFFFF',
    marginVertical: 0,
  },
  verifiedChip: {
    backgroundColor: '#2E7D32',
    height: 24,
  },
  verifiedChipText: {
    fontSize: 11,
    color: '#FFFFFF',
    marginVertical: 0,
  },
  placeAddress: {
    color: '#666',
    marginBottom: 4,
  },
  placeRating: {
    color: '#FF9800',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  placeFeatures: {
    color: '#2E7D32',
    fontStyle: 'italic',
  },
  placeInfoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    flex: 1,
  },
  directionsButton: {
    flex: 1,
  },
  nearbyFab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 160,
    backgroundColor: "#FF9800",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2E7D32",
  },
  refreshFab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: "#1976D2",
  },
})
