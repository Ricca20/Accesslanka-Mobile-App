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
import UserBadge from "../../components/UserBadge"

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
    { key: "tips", label: "Tips" },
    { key: "discussion", label: "Discussion" },
  ]

  const getCategoryIcon = (category) => {
    switch (category) {
      case "questions":
        return "help-circle"
      case "tips":
        return "lightbulb"
      default:
        return "forum"
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "questions":
        return "#2196F3"
      case "tips":
        return "#4CAF50"
      default:
        return "#FF9800"
    }
  }

  const renderPost = ({ item }) => {
    const isLiked = likedPosts.includes(item.id)
    const snippet = item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content

    return (
      <Card style={styles.postCard} onPress={() => handleOpenPost(item.id)}>
        <Card.Content style={styles.postCardContent}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <View style={styles.avatarContainer}>
                {item.authorAvatar ? (
                  <Avatar.Image size={44} source={{ uri: item.authorAvatar }} />
                ) : (
                  <Avatar.Text size={44} label={item.authorInitials} style={styles.avatarText} />
                )}
              </View>
              <View style={styles.authorDetails}>
                <View style={styles.authorNameRow}>
                  <Text variant="titleSmall" style={styles.authorName}>{item.author}</Text>
                  <UserBadge userId={item.authorId} size="tiny" />
                </View>
                <View style={styles.postMetaRow}>
                  <Icon name="clock-outline" size={12} color="#999" />
                  <Text variant="bodySmall" style={styles.timeText}>
                    {CommunityService.getTimeAgo(item.created_at)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.categoryBadge}>
              <Icon name={getCategoryIcon(item.category)} size={14} color={getCategoryColor(item.category)} />
              <Text style={[styles.categoryBadgeText, { color: getCategoryColor(item.category) }]}>
                {item.category}
              </Text>
            </View>
          </View>

          <View style={styles.postContent}>
            <Text variant="titleMedium" style={styles.postTitle}>
              {item.title}
            </Text>

            <Text variant="bodyMedium" style={styles.postSnippet}>
              {snippet}
            </Text>
          </View>

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
                <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Icon name="thumb-up" size={14} color="#2E7D32" />
                </View>
                <Text variant="bodySmall" style={styles.statText}>
                  {item.upvotes_count || 0}
                </Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Icon name="comment" size={14} color="#2196F3" />
                </View>
                <Text variant="bodySmall" style={styles.statText}>
                  {item.comments_count || 0}
                </Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Icon name="eye" size={14} color="#FF9800" />
                </View>
                <Text variant="bodySmall" style={styles.statText}>
                  {item.views_count || 0}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <Button 
                mode={isLiked ? "contained-tonal" : "outlined"}
                icon={isLiked ? "thumb-up" : "thumb-up-outline"} 
                compact
                onPress={(e) => {
                  e.stopPropagation()
                  handleToggleLike(item.id)
                }}
                buttonColor={isLiked ? "#E8F5E9" : undefined}
                textColor={isLiked ? "#2E7D32" : "#666"}
                style={styles.actionButton}
              >
                {isLiked ? "Liked" : "Like"}
              </Button>
              <Button 
                mode="outlined" 
                icon="comment-outline" 
                compact
                onPress={() => handleOpenPost(item.id)}
                textColor="#666"
                style={styles.actionButton}
              >
                Comment
              </Button>
              <Button 
                mode="outlined" 
                icon="share-variant" 
                compact
                onPress={(e) => {
                  e.stopPropagation()
                  showSnackbar('Share feature coming soon!')
                }}
                textColor="#666"
                style={styles.actionButton}
              >
                Share
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="forum-outline" size={56} color="#2E7D32" />
      </View>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No posts yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Be the first to share with the community!
      </Text>
      {user && (
        <Button
          mode="contained"
          icon="pencil"
          onPress={() => setCreateModalVisible(true)}
          style={styles.emptyButton}
          labelStyle={styles.emptyButtonLabel}
        >
          Create Your First Post
        </Button>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconContainer}>
            <Icon name="account-group" size={28} color="#2E7D32" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text variant="headlineSmall" style={styles.title}>
              Community
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Connect, share experiences, and help each other
            </Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.key
            return (
              <Chip
                key={category.key}
                selected={isSelected}
                onPress={() => handleCategoryChange(category.key)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected
                ]}
                textStyle={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected
                ]}
                icon={() => (
                  <Icon 
                    name={category.key === 'all' ? 'view-grid' : category.key === 'questions' ? 'help-circle' : category.key === 'tips' ? 'lightbulb' : 'forum'} 
                    size={16} 
                    color={isSelected ? '#FFFFFF' : '#2E7D32'} 
                  />
                )}
                accessibilityLabel={`Filter by ${category.label} posts`}
              >
                {category.label}
              </Chip>
            )
          })}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
          <Text variant="titleMedium" style={styles.loadingText}>Loading posts...</Text>
          <Text variant="bodySmall" style={styles.loadingSubtext}>Please wait a moment</Text>
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
          color="white"
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 24,
  },
  subtitle: {
    color: "#666",
    lineHeight: 20,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  filterChipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  filterChipText: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  postCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: "hidden",
  },
  postCardContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    backgroundColor: "#E8F5E9",
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  authorName: {
    fontWeight: "600",
    color: "#1A1A1A",
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    color: "#999",
    fontSize: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  postContent: {
    marginBottom: 16,
  },
  postTitle: {
    color: "#1A1A1A",
    fontWeight: "bold",
    marginBottom: 10,
    lineHeight: 24,
    fontSize: 17,
  },
  postSnippet: {
    color: "#666",
    lineHeight: 22,
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
    borderTopColor: "#F0F0F0",
    paddingTop: 16,
    marginTop: 8,
  },
  engagementStats: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  statText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  loadingSubtext: {
    marginTop: 8,
    color: "#999",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#2E7D32",
    marginBottom: 12,
    fontWeight: "bold",
  },
  emptySubtitle: {
    color: "#666",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
  },
  emptyButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyListContainer: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: "#2E7D32",
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
})
