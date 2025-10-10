import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, Badge, Divider } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'
import UserBadge from '../components/UserBadge'

const STATUS_COLORS = {
  pending: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
  verified: '#9C27B0',
}

const STATUS_LABELS = {
  pending: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  verified: 'Verified',
}

export default function MyBusinessSubmissionsScreen({ navigation }) {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [businessContributions, setBusinessContributions] = useState({})
  const [expandedBusinesses, setExpandedBusinesses] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadSubmissions()
    }
  }, [user])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const userSubmissions = await DatabaseService.getUserBusinessSubmissions(user.id)
      setSubmissions(userSubmissions || [])
      
      // Load MapMission contributions for approved/verified businesses
      await loadBusinessContributions(userSubmissions || [])
    } catch (error) {
      console.error('Error loading business submissions:', error)
      Alert.alert('Error', 'Failed to load your business submissions.')
    } finally {
      setLoading(false)
    }
  }

  const loadBusinessContributions = async (businessList) => {
    try {
      const approvedBusinesses = businessList.filter(b => 
        b.status === 'approved' || b.status === 'verified'
      )
      
      if (approvedBusinesses.length === 0) return

      const contributionPromises = approvedBusinesses.map(async (business) => {
        try {
          const contributions = await DatabaseService.getBusinessAccessibilityContributions(business.id)
          return { businessId: business.id, contributions }
        } catch (error) {
          console.error(`Error loading contributions for business ${business.id}:`, error)
          return { businessId: business.id, contributions: null }
        }
      })

      const results = await Promise.all(contributionPromises)
      const contributionsMap = {}
      
      results.forEach(({ businessId, contributions }) => {
        contributionsMap[businessId] = contributions
      })

      setBusinessContributions(contributionsMap)
    } catch (error) {
      console.error('Error loading business contributions:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSubmissions()
    setRefreshing(false)
  }

  const toggleBusinessExpansion = (businessId) => {
    setExpandedBusinesses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(businessId)) {
        newSet.delete(businessId)
      } else {
        newSet.add(businessId)
      }
      return newSet
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'clock-outline'
      case 'approved':
        return 'check-circle-outline'
      case 'rejected':
        return 'close-circle-outline'
      case 'verified':
        return 'shield-check-outline'
      default:
        return 'help-circle-outline'
    }
  }

  const renderContributionStats = (businessId) => {
    const contributions = businessContributions[businessId]
    if (!contributions) return null

    const { photos, reviews, ratings } = contributions
    const totalContributions = (photos?.length || 0) + (reviews?.length || 0) + (ratings?.length || 0)

    if (totalContributions === 0) {
      return (
        <View style={styles.noContributionsContainer}>
          <Icon name="information-outline" size={16} color="#666" />
          <Text variant="bodySmall" style={styles.noContributionsText}>
            No MapMission contributions yet
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.contributionStatsContainer}>
        <Text variant="titleSmall" style={styles.contributionStatsTitle}>
          MapMission Contributions
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="camera" size={16} color="#EF4444" />
            <Text style={styles.statText}>{photos?.length || 0} Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="comment-text" size={16} color="#3B82F6" />
            <Text style={styles.statText}>{reviews?.length || 0} Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={16} color="#F59E0B" />
            <Text style={styles.statText}>{ratings?.length || 0} Ratings</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderExpandedContributions = (businessId) => {
    const contributions = businessContributions[businessId]
    if (!contributions) return null

    const { photos, reviews, ratings } = contributions

    return (
      <View style={styles.expandedContainer}>
        <Divider style={styles.divider} />
        
        {/* Reviews Section */}
        {reviews && reviews.length > 0 && (
          <View style={styles.contributionSection}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              <Icon name="comment-text" size={16} color="#3B82F6" /> Reviews ({reviews.length})
            </Text>
            {reviews.slice(0, 3).map((review, index) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUserInfo}>
                    <Text variant="bodySmall" style={styles.reviewUser}>
                      {review.user_name || 'Anonymous User'}
                    </Text>
                    <UserBadge userId={review.user_id} size="tiny" />
                  </View>
                  <Chip 
                    mode="flat" 
                    compact 
                    style={styles.featureChip}
                    textStyle={styles.featureChipText}
                  >
                    {review.feature_type}
                  </Chip>
                </View>
                <Text variant="bodySmall" style={styles.reviewText}>
                  {review.review_text}
                </Text>
                <View style={styles.reviewMeta}>
                  <View style={styles.difficultyContainer}>
                    <Text variant="bodySmall" style={styles.difficultyLabel}>
                      Difficulty: 
                    </Text>
                    <Chip 
                      mode="flat" 
                      compact 
                      style={[styles.difficultyChip, { 
                        backgroundColor: review.difficulty_level === 'easy' ? '#D1FAE5' : 
                                       review.difficulty_level === 'moderate' ? '#FEF3C7' : '#FEE2E2' 
                      }]}
                      textStyle={[styles.difficultyText, {
                        color: review.difficulty_level === 'easy' ? '#065F46' : 
                               review.difficulty_level === 'moderate' ? '#92400E' : '#991B1B'
                      }]}
                    >
                      {review.difficulty_level}
                    </Chip>
                  </View>
                  <Text variant="bodySmall" style={styles.reviewDate}>
                    {formatDate(review.created_at)}
                  </Text>
                </View>
              </View>
            ))}
            {reviews.length > 3 && (
              <Text variant="bodySmall" style={styles.moreText}>
                +{reviews.length - 3} more reviews
              </Text>
            )}
          </View>
        )}

        {/* Ratings Section */}
        {ratings && ratings.length > 0 && (
          <View style={styles.contributionSection}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              <Icon name="star" size={16} color="#F59E0B" /> Ratings ({ratings.length})
            </Text>
            {ratings.slice(0, 3).map((rating, index) => (
              <View key={rating.id} style={styles.ratingItem}>
                <View style={styles.ratingHeader}>
                  <View style={styles.reviewUserInfo}>
                    <Text variant="bodySmall" style={styles.reviewUser}>
                      {rating.user_name || 'Anonymous User'}
                    </Text>
                    <UserBadge userId={rating.user_id} size="tiny" />
                  </View>
                  <Chip 
                    mode="flat" 
                    compact 
                    style={styles.featureChip}
                    textStyle={styles.featureChipText}
                  >
                    {rating.feature_type}
                  </Chip>
                </View>
                <View style={styles.ratingScores}>
                  <View style={styles.ratingScore}>
                    <Text variant="bodySmall" style={styles.ratingLabel}>Accessibility:</Text>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Icon 
                          key={star} 
                          name={star <= rating.accessibility_rating ? "star" : "star-outline"} 
                          size={14} 
                          color="#F59E0B" 
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.ratingScore}>
                    <Text variant="bodySmall" style={styles.ratingLabel}>Availability:</Text>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Icon 
                          key={star} 
                          name={star <= rating.availability_rating ? "star" : "star-outline"} 
                          size={14} 
                          color="#F59E0B" 
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.ratingScore}>
                    <Text variant="bodySmall" style={styles.ratingLabel}>Condition:</Text>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Icon 
                          key={star} 
                          name={star <= rating.condition_rating ? "star" : "star-outline"} 
                          size={14} 
                          color="#F59E0B" 
                        />
                      ))}
                    </View>
                  </View>
                </View>
                {rating.notes && (
                  <Text variant="bodySmall" style={styles.ratingNotes}>
                    Note: {rating.notes}
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.reviewDate}>
                  {formatDate(rating.created_at)}
                </Text>
              </View>
            ))}
            {ratings.length > 3 && (
              <Text variant="bodySmall" style={styles.moreText}>
                +{ratings.length - 3} more ratings
              </Text>
            )}
          </View>
        )}

        {/* Photos Section */}
        {photos && photos.length > 0 && (
          <View style={styles.contributionSection}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              <Icon name="camera" size={16} color="#EF4444" /> Photos ({photos.length})
            </Text>
            <Text variant="bodySmall" style={styles.photoSummary}>
              {photos.length} accessibility photos submitted by MapMission participants
            </Text>
          </View>
        )}
      </View>
    )
  }

  const renderSubmission = ({ item }) => {
    const isExpanded = expandedBusinesses.has(item.id)
    const contributions = businessContributions[item.id]
    const hasContributions = contributions && (
      (contributions.photos?.length || 0) + 
      (contributions.reviews?.length || 0) + 
      (contributions.ratings?.length || 0)
    ) > 0

    return (
      <Card style={styles.submissionCard}>
        <Card.Content>
          <View style={styles.submissionHeader}>
            <View style={styles.businessInfo}>
              <Text variant="titleMedium" style={styles.businessName}>
                {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.businessCategory}>
                {item.category} • {formatDate(item.created_at)}
              </Text>
            </View>
            <Chip
              mode="flat"
              icon={getStatusIcon(item.status)}
              textStyle={{ color: STATUS_COLORS[item.status] }}
              style={[styles.statusChip, { borderColor: STATUS_COLORS[item.status] }]}
            >
              {STATUS_LABELS[item.status]}
            </Chip>
          </View>

          <Text variant="bodyMedium" style={styles.businessDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.businessDetails}>
            <View style={styles.detailRow}>
              <Icon name="map-marker-outline" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.detailText}>
                {item.address}
              </Text>
            </View>
            
            {item.phone && (
              <View style={styles.detailRow}>
                <Icon name="phone-outline" size={16} color="#666" />
                <Text variant="bodySmall" style={styles.detailText}>
                  {item.phone}
                </Text>
              </View>
            )}

            {item.accessibility_features && item.accessibility_features.length > 0 && (
              <View style={styles.accessibilityContainer}>
                <Icon name="wheelchair-accessibility" size={16} color="#2E7D32" />
                <Text variant="bodySmall" style={styles.accessibilityText}>
                  {item.accessibility_features.length} accessibility features
                </Text>
              </View>
            )}
          </View>

          {/* MapMission Contributions Summary */}
          {(item.status === 'approved' || item.status === 'verified') && (
            <View style={styles.contributionsContainer}>
              {renderContributionStats(item.id)}
              
              {hasContributions && (
                <TouchableOpacity 
                  style={styles.expandButton} 
                  onPress={() => toggleBusinessExpansion(item.id)}
                >
                  <Text variant="bodySmall" style={styles.expandButtonText}>
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </Text>
                  <Icon 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#6366F1" 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Expanded Contributions */}
          {isExpanded && renderExpandedContributions(item.id)}

          {item.status === 'approved' && (
            <View style={styles.approvedActions}>
              <Button
                mode="outlined"
                icon="eye-outline"
                compact
                onPress={() => {
                  // Navigate to business details
                  navigation.navigate('PlaceDetails', { 
                    place: { id: item.id, type: 'business' }
                  })
                }}
              >
                View Listing
              </Button>
            </View>
          )}

          {item.status === 'rejected' && (
            <View style={styles.rejectedActions}>
              <Text variant="bodySmall" style={styles.rejectedText}>
                Your submission was not approved. You can submit a new business or contact support for more information.
              </Text>
              <Button
                mode="outlined"
                icon="refresh"
                compact
                onPress={() => navigation.navigate('AddMyBusiness')}
                style={styles.resubmitButton}
              >
                Submit New Business
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={{ marginTop: 16 }}>Loading your submissions...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          My Business Submissions
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
        </Text>
      </View>

      <FlatList
        data={submissions}
        renderItem={renderSubmission}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Icon name="store-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No business submissions yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Submit your business to be listed on AccessLanka and help build an accessible community!
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddMyBusiness')}
              style={styles.addButton}
              icon="store-plus"
            >
              Add My Business
            </Button>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  submissionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
    marginRight: 12,
  },
  businessName: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  businessCategory: {
    color: '#666',
    marginTop: 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  businessDescription: {
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  businessDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  accessibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  accessibilityText: {
    color: '#2E7D32',
    marginLeft: 8,
  },
  contributionsContainer: {
    marginBottom: 12,
  },
  contributionStatsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  contributionStatsTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  noContributionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  noContributionsText: {
    color: '#666',
    fontStyle: 'italic',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  expandButtonText: {
    color: '#6366F1',
    fontWeight: '500',
  },
  expandedContainer: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  contributionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewUser: {
    color: '#1F2937',
    fontWeight: '600',
  },
  featureChip: {
    backgroundColor: '#E5E7EB',
    height: 24,
  },
  featureChipText: {
    fontSize: 11,
    color: '#374151',
  },
  reviewText: {
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficultyLabel: {
    color: '#6B7280',
  },
  difficultyChip: {
    height: 20,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#9CA3AF',
  },
  ratingItem: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingScores: {
    gap: 8,
    marginBottom: 8,
  },
  ratingScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingLabel: {
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingNotes: {
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  photoSummary: {
    color: '#6B7280',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  moreText: {
    color: '#6366F1',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  approvedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  rejectedActions: {
    marginTop: 8,
  },
  rejectedText: {
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  resubmitButton: {
    alignSelf: 'flex-start',
  },
  emptyTitle: {
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    marginTop: 8,
  },
})