import { useState } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Text, Card, Chip, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

export default function BusinessesScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { key: "all", label: "All", icon: "view-list" },
    { key: "hotels", label: "Hotels", icon: "bed" },
    { key: "restaurants", label: "Restaurants", icon: "silverware-fork-knife" },
    { key: "shopping", label: "Shopping", icon: "shopping" },
    { key: "entertainment", label: "Entertainment", icon: "movie" },
  ]

  const dummyBusinesses = [
    {
      id: 1,
      name: "Cinnamon Grand Colombo",
      category: "hotels",
      image: "/luxury-hotel-lobby.png",
      rating: 4.5,
      accessibilityRating: 4.8,
      verified: true,
      address: "Galle Road, Colombo 03",
      features: ["Wheelchair Access", "Audio Assistance", "Braille Signage"],
      price: "$$$",
      description: "Luxury hotel with excellent accessibility features and trained staff.",
    },
    {
      id: 2,
      name: "Ministry of Crab",
      category: "restaurants",
      image: "/seafood-restaurant-interior.jpg",
      rating: 4.7,
      accessibilityRating: 4.2,
      verified: true,
      address: "Old Dutch Hospital, Colombo 01",
      features: ["Wheelchair Access", "Accessible Restrooms"],
      price: "$$$$",
      description: "World-renowned seafood restaurant with good accessibility.",
    },
    {
      id: 3,
      name: "Odel Department Store",
      category: "shopping",
      image: "/modern-department-store.jpg",
      rating: 4.3,
      accessibilityRating: 4.0,
      verified: false,
      address: "Alexandra Place, Colombo 07",
      features: ["Elevator Access", "Wide Aisles", "Accessible Parking"],
      price: "$$",
      description: "Popular department store with multiple floors and good accessibility.",
    },
  ]

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon key={i} name={i < Math.floor(rating) ? "star" : "star-outline"} size={14} color="#FFD700" />
    ))
  }

  const renderBusiness = ({ item }) => (
    <Card style={styles.businessCard} onPress={() => navigation.navigate("PlaceDetails", { place: item })}>
      <Card.Cover source={{ uri: item.image }} style={styles.businessImage} />
      <Card.Content style={styles.cardContent}>
        <View style={styles.businessHeader}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.businessName}>
              {item.name}
            </Text>
            {item.verified && <Icon name="check-decagram" size={20} color="#2E7D32" />}
          </View>
          <Text variant="bodySmall" style={styles.priceText}>
            {item.price}
          </Text>
        </View>

        <Text variant="bodySmall" style={styles.addressText}>
          {item.address}
        </Text>

        <View style={styles.ratingsContainer}>
          <View style={styles.ratingItem}>
            <View style={styles.starsContainer}>{renderStars(item.rating)}</View>
            <Text variant="bodySmall" style={styles.ratingText}>
              {item.rating}
            </Text>
          </View>
          <View style={styles.accessibilityRating}>
            <Icon name="wheelchair-accessibility" size={16} color="#2E7D32" />
            <Text variant="bodySmall" style={styles.accessibilityText}>
              {item.accessibilityRating}/5
            </Text>
          </View>
        </View>

        <Text variant="bodySmall" style={styles.description}>
          {item.description}
        </Text>

        <View style={styles.featuresContainer}>
          {item.features.slice(0, 2).map((feature, index) => (
            <Chip key={index} style={styles.featureChip} compact>
              {feature}
            </Chip>
          ))}
          {item.features.length > 2 && (
            <Chip style={styles.featureChip} compact>
              +{item.features.length - 2} more
            </Chip>
          )}
        </View>

        <View style={styles.actionContainer}>
          <Button mode="outlined" compact style={styles.actionButton}>
            View Details
          </Button>
          <Button mode="text" compact style={styles.actionButton}>
            Add Review
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  const filteredBusinesses =
    selectedCategory === "all"
      ? dummyBusinesses
      : dummyBusinesses.filter((business) => business.category === selectedCategory)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Accessible Businesses
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Verified accessible hotels, restaurants & more
        </Text>

        <View style={styles.filterContainer}>
          {categories.map((category) => (
            <Chip
              key={category.key}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              icon={category.icon}
              style={styles.filterChip}
              accessibilityLabel={`Filter by ${category.label}`}
            >
              {category.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredBusinesses}
        renderItem={renderBusiness}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  title: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
  businessCard: {
    marginBottom: 16,
    elevation: 2,
  },
  businessImage: {
    height: 120,
  },
  cardContent: {
    padding: 16,
  },
  businessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  businessName: {
    color: "#2E7D32",
    fontWeight: "bold",
    flex: 1,
  },
  priceText: {
    color: "#666",
    fontWeight: "bold",
  },
  addressText: {
    color: "#666",
    marginBottom: 8,
  },
  ratingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingItem: {
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
  accessibilityRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accessibilityText: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  description: {
    color: "#666",
    marginBottom: 12,
    lineHeight: 18,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  featureChip: {
    backgroundColor: "#E8F5E8",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
})
