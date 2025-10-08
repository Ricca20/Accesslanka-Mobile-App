import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native"
import { Text, Card, Button, Avatar, Chip, FAB, ActivityIndicator, Snackbar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { CommunityService } from "../../services/CommunityService"
import { useAuth } from "../../context/AuthContext"
import CreatePostModal from "../../components/CreatePostModal"
import PostDetailsModal from "../../components/PostDetailsModal"

export default function CommunityScreen() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [likedPosts, setLikedPosts] = useState([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")

  // Load posts when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadPosts()
      loadLikedPosts()
    }, [selectedCategory])
  )

  const loadPosts = async () => {
    setLoading(true)
    try {
      const postsData = await CommunityService.getPosts({
        category: selectedCategory,
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 50,
      })
      setPosts(postsData)
    } catch (error) {
      console.error('Error loading posts:', error)
      showSnackbar('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const loadLikedPosts = async () => {
    if (!user) return
    try {
      const likedPostIds = await CommunityService.getUserLikedPosts()
      setLikedPosts(likedPostIds)
    } catch (error) {
      console.error('Error loading liked posts:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPosts()
    await loadLikedPosts()
    setRefreshing(false)
  }

  const handleToggleLike = async (postId) => {
    if (!user) {
      showSnackbar('Please sign in to like posts')
      return
    }

    try {
      const result = await CommunityService.togglePostLike(postId)
      
      // Update local state
      if (result.liked) {
        setLikedPosts([...likedPosts, postId])
      } else {
        setLikedPosts(likedPosts.filter((id) => id !== postId))
      }

      // Update post upvotes count
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, upvotes_count: post.upvotes_count + (result.liked ? 1 : -1) }
          : post
      ))
    } catch (error) {
      console.error('Error toggling like:', error)
      showSnackbar('Failed to like post')
    }
  }

  const handleCreatePost = async (postData) => {
    try {
      await CommunityService.createPost(postData)
      showSnackbar('Post created successfully!')
      setCreateModalVisible(false)
      await loadPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  const handleOpenPost = (postId) => {
    setSelectedPostId(postId)
    setDetailsModalVisible(true)
  }

  const handleCloseDetails = async () => {
    setDetailsModalVisible(false)
    setSelectedPostId(null)
    // Refresh posts to get updated counts
    await loadPosts()
  }

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ))
  }

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(post => post.id !== postId))
    showSnackbar('Post deleted successfully')
  }

  const showSnackbar = (message) => {
    setSnackbarMessage(message)
    setSnackbarVisible(true)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
  }

  const categories = [
    { key: "all", label: "All" },
    { key: "questions", label: "Questions" },
    { key: "reviews", label: "Reviews" },
    { key: "tips", label: "Tips" },
    { key: "events", label: "Events" },
    { key: "discussion", label: "Discussion" },
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

  const renderPost = ({ item }) => {
    const isLiked = likedPosts.includes(item.id)
    const snippet = item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content

    return (
      <Card style={styles.postCard} onPress={() => handleOpenPost(item.id)}>
        <Card.Content>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              {item.authorAvatar ? (
                <Avatar.Image size={36} source={{ uri: item.authorAvatar }} />
              ) : (
                <Avatar.Text size={36} label={item.authorInitials} />
              )}
              <View style={styles.authorDetails}>
                <Text variant="titleSmall">{item.author}</Text>
                <Text variant="bodySmall" style={styles.timeText}>
                  {CommunityService.getTimeAgo(item.created_at)}
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
            {snippet}
          </Text>

          {item.image_urls && item.image_urls.length > 0 && (
            <View style={styles.imageContainer}>
              <Text variant="bodySmall" style={styles.imageIndicator}>
                📷 {item.image_urls.length} {item.image_urls.length === 1 ? 'image' : 'images'}
              </Text>
            </View>
          )}

          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} style={styles.tagChip} compact>
                  #{tag}
                </Chip>
              ))}
              {item.tags.length > 3 && (
                <Text variant="bodySmall" style={styles.moreTagsText}>
                  +{item.tags.length - 3} more
                </Text>
              )}
            </View>
          )}

          <View style={styles.postActions}>
            <View style={styles.engagementStats}>
              <View style={styles.statItem}>
                <Icon name="thumb-up" size={16} color="#666" />
                <Text variant="bodySmall" style={styles.statText}>
                  {item.upvotes_count || 0}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="comment" size={16} color="#666" />
                <Text variant="bodySmall" style={styles.statText}>
                  {item.comments_count || 0}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="eye" size={16} color="#666" />
                <Text variant="bodySmall" style={styles.statText}>
                  {item.views_count || 0}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <Button 
                mode="text" 
                icon={isLiked ? "thumb-up" : "thumb-up-outline"} 
                compact
                onPress={(e) => {
                  e.stopPropagation()
                  handleToggleLike(item.id)
                }}
                textColor={isLiked ? "#2E7D32" : undefined}
              >
                {isLiked ? "Liked" : "Like"}
              </Button>
              <Button 
                mode="text" 
                icon="comment-outline" 
                compact
                onPress={() => handleOpenPost(item.id)}
              >
                Comment
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="forum-outline" size={64} color="#CCC" />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No posts yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Be the first to share with the community!
      </Text>
      {user && (
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setCreateModalVisible(true)}
          style={styles.emptyButton}
        >
          Create Post
        </Button>
      )}
    </View>
  )

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
              onPress={() => handleCategoryChange(category.key)}
              style={styles.filterChip}
              accessibilityLabel={`Filter by ${category.label} posts`}
            >
              {category.label}
            </Chip>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            posts.length === 0 && styles.emptyListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#2E7D32"]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {user && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
          accessibilityLabel="Create new post"
        />
      )}

      <CreatePostModal
        visible={createModalVisible}
        onDismiss={() => setCreateModalVisible(false)}
        onSubmit={handleCreatePost}
      />

      <PostDetailsModal
        visible={detailsModalVisible}
        onDismiss={handleCloseDetails}
        post={posts.find(p => p.id === selectedPostId)}
        currentUserId={user?.id}
        onPostUpdate={handlePostUpdate}
        onPostDelete={handlePostDelete}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
    alignItems: "center",
  },
  tagChip: {
    backgroundColor: "#E3F2FD",
  },
  moreTagsText: {
    color: "#666",
    marginLeft: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#2E7D32",
  },
  emptyListContainer: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2E7D32",
  },
})
