import { useState, useEffect, useMemo } from "react"
import { View, StyleSheet, Dimensions, Alert, FlatList, TouchableOpacity } from "react-native"
import { Searchbar, FAB, Card, Text, Chip, Button, List, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker } from "react-native-maps"
import { dummyPlaces } from "../../data/dummyData"

const { width, height } = Dimensions.get("window")

export default function ExploreScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
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
    { key: "restaurant", label: "Restaurants", icon: "silverware-fork-knife" },
    { key: "hotel", label: "Hotels", icon: "bed" },
    { key: "temple", label: "Temples", icon: "church" },
    { key: "shopping", label: "Shopping", icon: "shopping" },
  ]

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []
    
    const query = searchQuery.toLowerCase()
    const suggestions = []
    
    // Add place name suggestions
    dummyPlaces.forEach(place => {
      if (place.name.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'place',
          text: place.name,
          subtitle: place.address,
          icon: 'map-marker',
          data: place
        })
      }
    })
    
    // Add feature suggestions
    const allFeatures = [...new Set(dummyPlaces.flatMap(p => p.features))]
    allFeatures.forEach(feature => {
      if (feature.toLowerCase().includes(query)) {
        const placesWithFeature = dummyPlaces.filter(p => 
          p.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
        )
        suggestions.push({
          type: 'feature',
          text: feature,
          subtitle: `${placesWithFeature.length} places`,
          icon: 'check-circle',
          data: feature
        })
      }
    })
    
    // Add location suggestions
    const locations = [...new Set(dummyPlaces.map(p => p.address.split(',')[1]?.trim()).filter(Boolean))]
    locations.forEach(location => {
      if (location.toLowerCase().includes(query)) {
        const placesInLocation = dummyPlaces.filter(p => p.address.includes(location))
        suggestions.push({
          type: 'location',
          text: location,
          subtitle: `${placesInLocation.length} places`,
          icon: 'map',
          data: location
        })
      }
    })
    
    return suggestions.slice(0, 5) // Limit to 5 suggestions
  }, [searchQuery])

  // Filter places based on search query and category
  const filteredPlaces = useMemo(() => {
    let places = dummyPlaces

    // Filter by category
    if (selectedCategory !== "all") {
      places = places.filter(place => place.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      places = places.filter(place => 
        place.name.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query) ||
        place.description.toLowerCase().includes(query) ||
        place.features.some(feature => feature.toLowerCase().includes(query))
      )
    }

    return places
  }, [searchQuery, selectedCategory])

  // Handle search input
  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setShowSuggestions(query.trim().length >= 2)
    setShowSearchResults(false)
  }

  // Handle suggestion selection
  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion.text)
    setShowSuggestions(false)
    setShowSearchResults(true)
    
    if (suggestion.type === 'place') {
      // Focus on specific place
      const place = suggestion.data
      setRegion({
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
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
          `No places found for "${searchQuery}". Try a different search term or check your spelling.`,
          [{ text: "OK" }]
        )
      } else if (filteredPlaces.length === 1) {
        // If only one result, focus on it
        const place = filteredPlaces[0]
        setRegion({
          latitude: place.latitude,
          longitude: place.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })
      } else {
        // If multiple results, fit them all in view
        if (filteredPlaces.length > 1) {
          const lats = filteredPlaces.map(p => p.latitude)
          const lngs = filteredPlaces.map(p => p.longitude)
          const minLat = Math.min(...lats)
          const maxLat = Math.max(...lats)
          const minLng = Math.min(...lngs)
          const maxLng = Math.max(...lngs)
          
          setRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.2,
            longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.2,
          })
        }
      }
    }
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("")
    setShowSearchResults(false)
    setShowSuggestions(false)
    setSelectedCategory("all")
  }

  const onMarkerPress = (place) => {
    navigation.navigate("PlaceDetails", { place })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search accessible places..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchbar}
          accessibilityLabel="Search for accessible places"
          onSubmitEditing={handleSearchSubmit}
          onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
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
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        accessibilityLabel="Map showing accessible places"
        onPress={() => setShowSuggestions(false)}
      >
        {filteredPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name}
            description={`Accessibility: ${place.accessibilityRating}/5`}
            onPress={() => onMarkerPress(place)}
          />
        ))}
      </MapView>

      <FAB icon="plus" style={styles.fab} onPress={() => {}} accessibilityLabel="Add new place" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2E7D32",
  },
})
