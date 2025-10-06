import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Alert } from "react-native"
import { Text, Card, Chip, Button, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { DatabaseService } from "../../lib/database"

export default function BusinessesScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const categories = [
    { key: "all", label: "All", icon: "view-list" },
    { key: "hotels", label: "Hotels", icon: "bed" },
    { key: "restaurants", label: "Restaurants", icon: "silverware-fork-knife" },
    { key: "shopping", label: "Shopping", icon: "shopping" },
    { key: "entertainment", label: "Entertainment", icon: "movie" },
    { key: "healthcare", label: "Healthcare", icon: "hospital-box" },
    { key: "transport", label: "Transport", icon: "bus" },
  ]

  useEffect(() => {
    loadBusinesses()
  }, [])

  const loadBusinesses = async () => {
    try {
      setLoading(true)
      const data = await DatabaseService.getAllBusinesses()
      setBusinesses(data || [])
    } catch (error) {
      console.error('Error loading businesses:', error)
      Alert.alert('Error', 'Failed to load businesses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadBusinesses()
    setRefreshing(false)
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon key={i} name={i < Math.floor(rating) ? "star" : "star-outline"} size={14} color="#FFD700" />
    ))
  }

  const renderBusiness = ({ item }) => {
    // Handle database schema fields
    const businessImage = item.images && item.images.length > 0 
      ? { uri: item.images[0] } 
      : null // No default image - we'll handle this in the UI
    
    const priceRange = item.price_range || item.price || 'N/A'
    
    // For now, we'll use a default rating since we don't have reviews aggregated yet
    const rating = 4.0 // Default rating until we implement review aggregation
    const accessibilityRating = 4.0 // Default accessibility rating
    
    return (
      <Card style={styles.businessCard} onPress={() => navigation.navigate("PlaceDetails", { place: item })}>
        {businessImage && <Card.Cover source={businessImage} style={styles.businessImage} />}
        {!businessImage && (
          <View style={[styles.businessImage, styles.placeholderImage]}>
            <Icon name="store" size={48} color="#ccc" />
            <Text style={styles.placeholderText}>{item.category}</Text>
          </View>
        )}
        <Card.Content style={styles.cardContent}>
          <View style={styles.businessHeader}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.businessName}>
                {item.name}
              </Text>
              {item.verified && <Icon name="check-decagram" size={20} color="#2E7D32" />}
            </View>
            <Text variant="bodySmall" style={styles.priceText}>
              {priceRange}
            </Text>
          </View>

          <Text variant="bodySmall" style={styles.addressText}>
            {item.address}
          </Text>

          <View style={styles.ratingsContainer}>
            <View style={styles.ratingItem}>
              <View style={styles.starsContainer}>{renderStars(rating)}</View>
              <Text variant="bodySmall" style={styles.ratingText}>
                {rating}
              </Text>
            </View>
            <View style={styles.accessibilityRating}>
              <Icon name="wheelchair-accessibility" size={16} color="#2E7D32" />
              <Text variant="bodySmall" style={styles.accessibilityText}>
                {accessibilityRating}/5
              </Text>
            </View>
          </View>

          <Text variant="bodySmall" style={styles.description}>
            {item.description || 'No description available.'}
          </Text>

          {item.accessibility_features && item.accessibility_features.length > 0 && (
            <View style={styles.featuresContainer}>
              {item.accessibility_features.slice(0, 2).map((feature, index) => (
                <Chip key={index} style={styles.featureChip} compact>
                  {feature}
                </Chip>
              ))}
              {item.accessibility_features.length > 2 && (
                <Chip style={styles.featureChip} compact>
                  +{item.accessibility_features.length - 2} more
                </Chip>
              )}
            </View>
          )}

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
  }

  const filteredBusinesses =
    selectedCategory === "all"
      ? businesses
      : businesses.filter((business) => business.category === selectedCategory)

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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={{ marginTop: 16 }}>Loading businesses...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBusinesses}
          renderItem={renderBusiness}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Icon name="store-outline" size={64} color="#999" />
              <Text style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
                {selectedCategory === "all" ? "No businesses found." : `No ${selectedCategory} businesses found.`}
              </Text>
              <Button mode="outlined" onPress={handleRefresh} style={{ marginTop: 16 }}>
                Refresh
              </Button>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 12,
    textTransform: 'capitalize',
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
