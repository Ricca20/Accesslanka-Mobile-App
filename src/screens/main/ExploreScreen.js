import { useState } from "react"
import { View, StyleSheet, Dimensions } from "react-native"
import { Searchbar, FAB } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker } from "react-native-maps"

const { width, height } = Dimensions.get("window")

export default function ExploreScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  const dummyPlaces = [
    {
      id: 1,
      name: "Colombo National Museum",
      latitude: 6.9108,
      longitude: 79.8612,
      rating: 4.2,
      accessibilityRating: 3.8,
    },
    {
      id: 2,
      name: "Galle Face Green",
      latitude: 6.9271,
      longitude: 79.8456,
      rating: 4.5,
      accessibilityRating: 4.1,
    },
    {
      id: 3,
      name: "Independence Square",
      latitude: 6.9034,
      longitude: 79.8682,
      rating: 4.0,
      accessibilityRating: 3.5,
    },
  ]

  const onMarkerPress = (place) => {
    navigation.navigate("PlaceDetails", { place })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search accessible places..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          accessibilityLabel="Search for accessible places"
        />
      </View>

      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        accessibilityLabel="Map showing accessible places"
      >
        {dummyPlaces.map((place) => (
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
  },
  map: {
    flex: 1,
    width: width,
    height: height - 200,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2E7D32",
  },
})
