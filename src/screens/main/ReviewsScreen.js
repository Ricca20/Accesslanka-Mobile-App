import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Alert, RefreshControl } from "react-native"
import { Text, Card, Chip, Button, Avatar, Portal, Modal, TextInput, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { DatabaseService } from "../../lib/database"
<<<<<<< HEAD
import UserBadge from "../../components/UserBadge"
=======
import { reviewMatchesCategory } from "../../utils/accessibilityMapping"
>>>>>>> origin/User-and-Community-Management

export default function ReviewsScreen({ navigation }) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [replyModalVisible, setReplyModalVisible] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [replyText, setReplyText] = useState("")
  const [submittingReply, setSubmittingReply] = useState(false)

  const filters = [
    { key: "all", label: "All", icon: "view-list" },
    { key: "mobility", label: "Mobility", icon: "wheelchair-accessibility" },
    { key: "visual", label: "Visual", icon: "eye" },
    { key: "hearing", label: "Hearing", icon: "ear-hearing" },
    { key: "cognitive", label: "Cognitive", icon: "brain" },
  ]

  useEffect(() => {
    loadReviews()
  }, [])

  useEffect(() => {
    // Reload when user changes (login/logout)
    loadReviews()
  }, [user])

  // Fallback dummy data for when database is empty
  const getDummyReviews = () => [
    {
      id: '00000000-0000-0000-0000-000000000001',
      overall_rating: 4,
      accessibility_ratings: { mobility: 4, visual: 3, hearing: 5, cognitive: 4 },
      title: 'Great accessibility features',
      content: 'This location has excellent wheelchair access and clear signage. Some areas could use better lighting for people with visual impairments, but overall very accessible. The staff is helpful and knowledgeable about accessibility features.',
      helpful_count: 12,
      verified: true,
      user_id: '00000000-0000-0000-0000-000000000101',
      place_name: 'National Museum',
      business_name: null,
      user_name: 'Priya Silva',
      user_avatar: null,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      is_helpful: false,
      isDummy: true // Flag to identify dummy data
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      overall_rating: 5,
      accessibility_ratings: { mobility: 5, visual: 4, hearing: 4, cognitive: 5 },
      title: 'Perfect for wheelchair users',
      content: 'Wide open spaces, easy to navigate. Perfect for wheelchair users. Beautiful views and the pathways are well-maintained. Great place for families with accessibility needs.',
      helpful_count: 8,
      verified: false,
      user_id: '00000000-0000-0000-0000-000000000102',
      place_name: 'Galle Face Green',
      business_name: null,
      user_name: 'Kamal Perera',
      user_avatar: null,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      is_helpful: false,
      isDummy: true
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      overall_rating: 4,
      accessibility_ratings: { mobility: 4, visual: 4, hearing: 3, cognitive: 4 },
      title: 'Excellent food, good accessibility',
      content: 'Amazing cuisine and the restaurant is wheelchair accessible. The elevator works well and staff is accommodating. However, it can get quite noisy during peak hours which might be challenging for those with hearing sensitivity.',
      helpful_count: 15,
      verified: true,
      user_id: '00000000-0000-0000-0000-000000000103',
      place_name: null,
      business_name: 'Ministry of Crab',
      user_name: 'Nisali Fernando',
      user_avatar: null,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      is_helpful: false,
      isDummy: true
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      overall_rating: 5,
      accessibility_ratings: { mobility: 5, visual: 5, hearing: 5, cognitive: 5 },
      title: 'Outstanding accessibility standards',
      content: 'This establishment sets the standard for accessibility in Colombo. Multiple accessible facilities, excellent lighting, clear signage, and staff trained in disability awareness. Highly recommend for travelers with accessibility needs.',
      helpful_count: 20,
      verified: true,
      user_id: '00000000-0000-0000-0000-000000000104',
      place_name: null,
      business_name: 'Shangri-La Hotel',
      user_name: 'Rajith Kumar',
      user_avatar: null,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      is_helpful: false,
      isDummy: true
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      overall_rating: 3,
      accessibility_ratings: { mobility: 3, visual: 2, hearing: 4, cognitive: 3 },
      title: 'Historic site with some limitations',
      content: 'Beautiful historic location but accessibility could be improved. There are ramps but they are quite steep. Limited signage for people with visual impairments. Still worth a visit for the historical significance.',
      helpful_count: 6,
      verified: false,
      user_id: '00000000-0000-0000-0000-000000000105',
      place_name: 'Independence Memorial Hall',
      business_name: null,
      user_name: 'Amara Jayasinghe',
      user_avatar: null,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      is_helpful: false,
      isDummy: true
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      overall_rating: 4,
      accessibility_ratings: { mobility: 4, visual: 4, hearing: 4, cognitive: 4 },
      title: 'Family-friendly and accessible',
      content: 'Great location for families with children who have disabilities. The facilities have accessible equipment and the paths are well-paved. Some areas have braille signs which is excellent. Clean accessible restrooms available.',
      helpful_count: 10,
      verified: true,
      user_id: '00000000-0000-0000-0000-000000000106',
      place_name: 'Viharamahadevi Park',
      business_name: null,
      user_name: 'Sanduni Perera',
      user_avatar: null,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      is_helpful: false,
      isDummy: true
    }
  ]

  const loadReviews = async () => {
    try {
      setLoading(true)
      const options = user ? { currentUserId: user.id } : {}
      const data = await DatabaseService.getReviews(options)
      
      // If no reviews found, use dummy data for demonstration
      if (!data || data.length === 0) {
        console.log('No reviews found in database, using dummy data for demonstration')
        setReviews(getDummyReviews())
      } else {
        setReviews(data)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      // Fallback to dummy data if database error
      console.log('Database error, using dummy data for demonstration')
      setReviews(getDummyReviews())
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadReviews()
    setRefreshing(false)
  }

  const handleAddSampleData = async () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please log in to add sample data to the database.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }
        ]
      )
      return
    }

    try {
      setLoading(true)
      const result = await DatabaseService.insertSampleData(user.id)
      if (result.success) {
        Alert.alert(
          'Success',
          'Sample data has been added to the database successfully!',
          [
            { text: 'OK', onPress: () => loadReviews() }
          ]
        )
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      Alert.alert(
        'Error',
        'Failed to add sample data. Please try again.\n\n' + error.message,
        [{ text: 'OK', style: 'default' }]
      )
    } finally {
      setLoading(false)
    }
  }

  const handleHelpful = async (reviewId, isCurrentlyHelpful) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to mark reviews as helpful.')
      return
    }

    // Check if this is dummy data
    const review = reviews.find(r => r.id === reviewId)
    if (review?.isDummy) {
      Alert.alert(
        'Demo Data', 
        'This is sample data for demonstration. Please add real data to the database to test the helpful feature!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Real Data', onPress: handleAddSampleData }
        ]
      )
      return
    }

    try {
      if (isCurrentlyHelpful) {
        await DatabaseService.unmarkReviewHelpful(reviewId, user.id)
      } else {
        await DatabaseService.markReviewHelpful(reviewId, user.id)
      }
      
      // Update local state
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              isHelpful: !isCurrentlyHelpful,
              helpful_count: isCurrentlyHelpful 
                ? Math.max(0, review.helpful_count - 1)
                : review.helpful_count + 1
            }
          }
          return review
        })
      )
    } catch (error) {
      console.error('Error updating helpful status:', error)
      Alert.alert('Error', 'Failed to update helpful status. Please try again.')
    }
  }

  const handleReply = (review) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to reply to reviews.')
      return
    }

    // Check if this is dummy data
    if (review?.isDummy) {
      Alert.alert(
        'Demo Data', 
        'This is sample data for demonstration. Please add real data to the database to test the reply feature!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Real Data', onPress: handleAddSampleData }
        ]
      )
      return
    }

    setSelectedReview(review)
    setReplyModalVisible(true)
  }

  const submitReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply message.')
      return
    }

    try {
      setSubmittingReply(true)
      await DatabaseService.createReviewReply({
        review_id: selectedReview.id,
        user_id: user.id,
        content: replyText.trim()
      })
      
      // Update local state to add the new reply
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === selectedReview.id) {
            const newReply = {
              id: Date.now(), // Temporary ID
              content: replyText.trim(),
              created_at: new Date().toISOString(),
              user: {
                name: user.full_name || user.email || 'You',
                email: user.email
              }
            }
            return {
              ...review,
              replies: [...(review.replies || []), newReply]
            }
          }
          return review
        })
      )
      
      setReplyModalVisible(false)
      setReplyText("")
      setSelectedReview(null)
    } catch (error) {
      console.error('Error submitting reply:', error)
      Alert.alert('Error', 'Failed to submit reply. Please try again.')
    } finally {
      setSubmittingReply(false)
    }
  }

  const getFilteredReviews = () => {
    if (selectedFilter === "all") return reviews
    
    return reviews.filter(review => {
      const accessibilityRatings = review.accessibility_ratings || {}
      // Use the utility function that handles both feature-based and category-based ratings
      return reviewMatchesCategory(accessibilityRatings, selectedFilter)
    })
  }

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

    const labels = {
      mobility: "Mobility",
      visual: "Visual",
      hearing: "Hearing",
      cognitive: "Cognitive",
    }

    return (
      <View style={styles.accessibilityItem}>
        <Icon name={icons[category]} size={16} color={theme.colors.onSurfaceVariant} />
        <Text variant="bodySmall" style={[styles.accessibilityText, { color: theme.colors.onSurfaceVariant }]}>
          {labels[category]}: {rating}/5
        </Text>
      </View>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid date"
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch (error) {
      return "Unknown date"
    }
  }

  const getUserInitials = (name) => {
    if (!name) return "U"
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const renderReview = ({ item }) => {
    if (!item) return null
    
    const placeName = item.place?.name || item.business?.name || item.place_name || item.business_name || "Unknown Location"
    const userName = item.user?.full_name || item.user?.name || item.user_name || "Anonymous User"
    const userInitials = getUserInitials(userName)
    const accessibilityRatings = item.accessibility_ratings || {}
    const replies = item.replies || []
    
    return (
      <Card style={[styles.reviewCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.reviewHeader}>
            <View style={styles.userInfo}>
              <Avatar.Text size={40} label={userInitials} />
              <View style={styles.userDetails}>
                <View style={styles.userNameRow}>
                  <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                    {userName}
                  </Text>
                  {item.user?.email_verified && 
                    <Icon name="check-decagram" size={16} color={theme.colors.primary} />
                  }
                  {/* User Badge */}
                  <UserBadge userId={item.user_id} size="tiny" />
                </View>
                <Text variant="bodySmall" style={[styles.placeText, { color: theme.colors.onSurfaceVariant }]}>
                  {placeName}
                </Text>
              </View>
            </View>
            <Text variant="bodySmall" style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.overallRating}>
              <View style={styles.starsContainer}>{renderStars(item.overall_rating || 0)}</View>
              <Text variant="bodySmall" style={[styles.ratingText, { color: theme.colors.onSurfaceVariant }]}>
                {item.overall_rating || 0}/5
              </Text>
            </View>
          </View>

          {Object.keys(accessibilityRatings).length > 0 && (
            <View style={styles.accessibilityRatings}>
              {Object.entries(accessibilityRatings).map(([category, rating]) => (
                <View key={category}>
                  {renderAccessibilityRating(category, rating)}
                </View>
              ))}
            </View>
          )}

          <Text variant="bodyMedium" style={[styles.reviewText, { color: theme.colors.onSurface }]}>
            {item.content || "No content available"}
          </Text>

          <View style={styles.reviewActions}>
            <Button 
              mode="text" 
              icon={item.isHelpful ? "thumb-up" : "thumb-up-outline"} 
              compact
              onPress={() => handleHelpful(item.id, item.isHelpful || false)}
              textColor={item.isHelpful ? theme.colors.primary : theme.colors.onSurfaceVariant}
            >
              Helpful {(item.helpful_count || 0) > 0 && `(${item.helpful_count || 0})`}
            </Button>
            <Button 
              mode="text" 
              icon="reply" 
              compact
              onPress={() => handleReply(item)}
              textColor={theme.colors.onSurfaceVariant}
            >
              Reply {replies.length > 0 && `(${replies.length})`}
            </Button>
          </View>

          {replies.length > 0 && (
            <View style={styles.repliesContainer}>
              <Text variant="titleSmall" style={[styles.repliesTitle, { color: theme.colors.onSurface }]}>
                Replies
              </Text>
              {replies.map((reply, index) => (
                <View key={reply.id || index} style={styles.replyItem}>
                  <View style={styles.replyHeader}>
                    <Text variant="bodySmall" style={[styles.replyUser, { color: theme.colors.onSurface }]}>
                      {reply.user?.full_name || reply.user?.name || "Anonymous"}
                    </Text>
                    <Text variant="bodySmall" style={[styles.replyDate, { color: theme.colors.onSurfaceVariant }]}>
                      {formatDate(reply.created_at)}
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={[styles.replyContent, { color: theme.colors.onSurfaceVariant }]}>
                    {reply.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading reviews...
          </Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredReviews()}
          renderItem={renderReview}
          keyExtractor={(item) => (item?.id || Math.random()).toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="comment-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                No Reviews Found
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {selectedFilter === "all" 
                  ? "No reviews available yet. Add some sample data to test the reviews functionality!"
                  : `No reviews found for ${selectedFilter} accessibility. Try a different filter.`
                }
              </Text>
              {selectedFilter === "all" && (
                <Button
                  mode="contained"
                  onPress={handleAddSampleData}
                  style={styles.addDataButton}
                  disabled={loading}
                >
                  {loading ? 'Adding Data...' : 'Add Sample Data'}
                </Button>
              )}
            </View>
          }
        />
      )}

      <Portal>
        <Modal 
          visible={replyModalVisible} 
          onDismiss={() => setReplyModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Reply to Review
          </Text>
          
          {selectedReview && (
            <View style={styles.originalReview}>
              <Text variant="bodySmall" style={[styles.originalReviewLabel, { color: theme.colors.onSurfaceVariant }]}>
                Replying to:
              </Text>
              <Text variant="bodyMedium" style={[styles.originalReviewText, { color: theme.colors.onSurface }]}>
                "{selectedReview.content.length > 100 
                  ? selectedReview.content.substring(0, 100) + "..." 
                  : selectedReview.content}"
              </Text>
            </View>
          )}

          <TextInput
            label="Your reply"
            value={replyText}
            onChangeText={setReplyText}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.replyInput}
            placeholder="Share your thoughts or ask a question..."
          />

          <View style={styles.modalActions}>
            <Button 
              mode="text" 
              onPress={() => setReplyModalVisible(false)}
              disabled={submittingReply}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={submitReply}
              loading={submittingReply}
              disabled={submittingReply || !replyText.trim()}
            >
              Submit Reply
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 2,
  },
  title: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  addDataButton: {
    marginTop: 16,
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
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
  },
  reviewText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: "row",
    gap: 8,
  },
  repliesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  repliesTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  replyItem: {
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E0E0E0',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyUser: {
    fontWeight: '600',
  },
  replyDate: {
    fontSize: 11,
  },
  replyContent: {
    lineHeight: 16,
  },
  modalContent: {
    padding: 24,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  originalReview: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  originalReviewLabel: {
    marginBottom: 4,
    fontWeight: '600',
  },
  originalReviewText: {
    fontStyle: 'italic',
  },
  replyInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
})
