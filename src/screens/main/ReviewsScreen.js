import { useState } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Text, Card, Chip, Button, Avatar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

export default function ReviewsScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState("all")

  const filters = [
    { key: "all", label: "All", icon: "view-list" },
    { key: "mobility", label: "Mobility", icon: "wheelchair-accessibility" },
    { key: "visual", label: "Visual", icon: "eye" },
    { key: "hearing", label: "Hearing", icon: "ear-hearing" },
    { key: "cognitive", label: "Cognitive", icon: "brain" },
  ]

  const dummyReviews = [
    {
      id: 1,
      placeName: "Colombo National Museum",
      userName: "Priya Silva",
      userAvatar: "PS",
      rating: 4.2,
      accessibilityRatings: {
        mobility: 4,
        visual: 3,
        hearing: 5,
        cognitive: 4,
      },
      review: "Great wheelchair access and audio guides available. Some exhibits could use better lighting.",
      date: "2024-01-15",
      verified: true,
    },
    {
      id: 2,
      placeName: "Galle Face Green",
      userName: "Kamal Perera",
      userAvatar: "KP",
      rating: 4.5,
      accessibilityRatings: {
        mobility: 5,
        visual: 4,
        hearing: 4,
        cognitive: 5,
      },
      review: "Wide open spaces, easy to navigate. Perfect for wheelchair users. Beautiful sunset views.",
      date: "2024-01-12",
      verified: false,
    },
  ]

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon key={i} name={i < Math.floor(rating) ? "star" : "star-outline"} size={16} color="#FFD700" />
    ))
  }

  const renderAccessibilityRating = (category, rating) => {
    const icons = {
      mobility: "wheelchair-accessibility",
      visual: "eye",
      hearing: "ear-hearing",
      cognitive: "brain",
    }

    return (
      <View style={styles.accessibilityItem}>
        <Icon name={icons[category]} size={16} color="#666" />
        <Text variant="bodySmall" style={styles.accessibilityText}>
          {rating}/5
        </Text>
      </View>
    )
  }

  const renderReview = ({ item }) => (
    <Card style={styles.reviewCard}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text size={40} label={item.userAvatar} />
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text variant="titleSmall">{item.userName}</Text>
                {item.verified && <Icon name="check-decagram" size={16} color="#2E7D32" />}
              </View>
              <Text variant="bodySmall" style={styles.placeText}>
                {item.placeName}
              </Text>
            </View>
          </View>
          <Text variant="bodySmall" style={styles.dateText}>
            {item.date}
          </Text>
        </View>

        <View style={styles.ratingContainer}>
          <View style={styles.overallRating}>
            <View style={styles.starsContainer}>{renderStars(item.rating)}</View>
            <Text variant="bodySmall" style={styles.ratingText}>
              {item.rating}/5
            </Text>
          </View>
        </View>

        <View style={styles.accessibilityRatings}>
          {Object.entries(item.accessibilityRatings).map(([category, rating]) => (
            <View key={category}>
              {renderAccessibilityRating(category, rating)}
            </View>
          ))}
        </View>

        <Text variant="bodyMedium" style={styles.reviewText}>
          {item.review}
        </Text>

        <View style={styles.reviewActions}>
          <Button mode="text" icon="thumb-up-outline" compact>
            Helpful
          </Button>
          <Button mode="text" icon="reply" compact>
            Reply
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Reviews
        </Text>
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <Chip
              key={filter.key}
              selected={selectedFilter === filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              icon={filter.icon}
              style={styles.filterChip}
              accessibilityLabel={`Filter by ${filter.label}`}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={dummyReviews}
        renderItem={renderReview}
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
  reviewCard: {
    marginBottom: 16,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  placeText: {
    color: "#666",
    marginTop: 2,
  },
  dateText: {
    color: "#666",
  },
  ratingContainer: {
    marginBottom: 12,
  },
  overallRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starsContainer: {
    flexDirection: "row",
  },
  ratingText: {
    color: "#666",
  },
  accessibilityRatings: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  accessibilityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accessibilityText: {
    color: "#666",
  },
  reviewText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: "row",
    gap: 8,
  },
})
