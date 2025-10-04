import { useState } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Text, Card, Button, Avatar, Chip, FAB } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

export default function CommunityScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { key: "all", label: "All" },
    { key: "questions", label: "Questions" },
    { key: "reviews", label: "Reviews" },
    { key: "tips", label: "Tips" },
    { key: "events", label: "Events" },
  ]

  const dummyPosts = [
    {
      id: 1,
      category: "questions",
      title: "Best wheelchair accessible beaches in Sri Lanka?",
      snippet: "Planning a family trip and looking for beaches that are accessible for my wheelchair-using daughter...",
      author: "Saman Kumara",
      authorAvatar: "SK",
      timeAgo: "2 hours ago",
      upvotes: 15,
      comments: 8,
      tags: ["beaches", "wheelchair", "family-travel"],
      hasImage: false,
    },
    {
      id: 2,
      category: "tips",
      title: "Navigating Colombo Fort Station with Visual Impairment",
      snippet: "Here are some helpful tips I learned after multiple visits to the main railway station...",
      author: "Priya Fernando",
      authorAvatar: "PF",
      timeAgo: "5 hours ago",
      upvotes: 32,
      comments: 12,
      tags: ["visual-impairment", "transportation", "colombo"],
      hasImage: true,
    },
    {
      id: 3,
      category: "events",
      title: "Accessibility Awareness Walk - Kandy",
      snippet: "Join us for a community walk to raise awareness about accessibility challenges in Kandy city...",
      author: "AccessLanka Team",
      authorAvatar: "AT",
      timeAgo: "1 day ago",
      upvotes: 45,
      comments: 23,
      tags: ["event", "kandy", "awareness", "community"],
      hasImage: true,
    },
    {
      id: 4,
      category: "reviews",
      title: "Amazing experience at Sigiriya with mobility aids",
      snippet: "Visited Sigiriya last week with my mobility scooter. Here's what you need to know...",
      author: "Kamal Silva",
      authorAvatar: "KS",
      timeAgo: "2 days ago",
      upvotes: 28,
      comments: 15,
      tags: ["sigiriya", "mobility-scooter", "heritage-sites"],
      hasImage: true,
    },
  ]

  const getCategoryIcon = (category) => {
    switch (category) {
      case "questions":
        return "help-circle"
      case "reviews":
        return "star"
      case "tips":
        return "lightbulb"
      case "events":
        return "calendar"
      default:
        return "forum"
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "questions":
        return "#2196F3"
      case "reviews":
        return "#FF9800"
      case "tips":
        return "#4CAF50"
      case "events":
        return "#9C27B0"
      default:
        return "#666"
    }
  }

  const renderPost = ({ item }) => (
    <Card style={styles.postCard}>
      <Card.Content>
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <Avatar.Text size={36} label={item.authorAvatar} />
            <View style={styles.authorDetails}>
              <Text variant="titleSmall">{item.author}</Text>
              <Text variant="bodySmall" style={styles.timeText}>
                {item.timeAgo}
              </Text>
            </View>
          </View>
          <Chip
            icon={getCategoryIcon(item.category)}
            style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) + "20" }]}
            textStyle={{ color: getCategoryColor(item.category) }}
            compact
          >
            {item.category}
          </Chip>
        </View>

        <Text variant="titleMedium" style={styles.postTitle}>
          {item.title}
        </Text>

        <Text variant="bodyMedium" style={styles.postSnippet}>
          {item.snippet}
        </Text>

        {item.hasImage && (
          <View style={styles.imageContainer}>
            <Text variant="bodySmall" style={styles.imageIndicator}>
              📷 Contains images
            </Text>
          </View>
        )}

        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <Chip key={index} style={styles.tagChip} compact>
              #{tag}
            </Chip>
          ))}
        </View>

        <View style={styles.postActions}>
          <View style={styles.engagementStats}>
            <View style={styles.statItem}>
              <Icon name="thumb-up" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.statText}>
                {item.upvotes}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="comment" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.statText}>
                {item.comments}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button mode="text" icon="thumb-up-outline" compact>
              Upvote
            </Button>
            <Button mode="text" icon="comment-outline" compact>
              Comment
            </Button>
            <Button mode="text" icon="share-outline" compact>
              Share
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  )

  const filteredPosts =
    selectedCategory === "all" ? dummyPosts : dummyPosts.filter((post) => post.category === selectedCategory)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Community
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Connect, share experiences, and help each other
        </Text>

        <View style={styles.filterContainer}>
          {categories.map((category) => (
            <Chip
              key={category.key}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              style={styles.filterChip}
              accessibilityLabel={`Filter by ${category.label} posts`}
            >
              {category.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => {}} accessibilityLabel="Create new post" />
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
  postCard: {
    marginBottom: 16,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  timeText: {
    color: "#666",
    marginTop: 2,
  },
  categoryChip: {
    alignSelf: "flex-start",
  },
  postTitle: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 22,
  },
  postSnippet: {
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  imageContainer: {
    marginBottom: 12,
  },
  imageIndicator: {
    color: "#666",
    fontStyle: "italic",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: "#E3F2FD",
  },
  postActions: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
  },
  engagementStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2E7D32",
  },
})
