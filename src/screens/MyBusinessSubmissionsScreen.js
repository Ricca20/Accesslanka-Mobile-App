import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity, Image, ScrollView } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, Divider, FAB, Surface } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'
import UserBadge from '../components/UserBadge'

const STATUS_COLORS = {
  pending: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
  verified: '#2E7D32',
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
      <Surface style={styles.contributionStatsCard} elevation={1}>
        <Text variant="titleSmall" style={styles.contributionStatsTitle}>
          MapMission Contributions
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="camera" size={20} color="#EF4444" />
            <Text variant="titleSmall" style={styles.statNumber}>{photos?.length || 0}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="comment-text" size={20} color="#3B82F6" />
            <Text variant="titleSmall" style={styles.statNumber}>{reviews?.length || 0}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="star" size={20} color="#F59E0B" />
            <Text variant="titleSmall" style={styles.statNumber}>{ratings?.length || 0}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Ratings</Text>
          </View>
        </View>
      </Surface>
    )
  }

  const renderAccessibilityFeatureRatings = (ratings) => {
    // Group ratings by feature_type and calculate overall average
    const featureRatings = {}
    
    ratings.forEach(rating => {
      const featureType = rating.feature_type
      if (!featureRatings[featureType]) {
        featureRatings[featureType] = {
          totalRatings: [],
          count: 0
        }
      }
      
      // Calculate overall rating from accessibility, availability, and condition
      const overallRating = (
        (rating.accessibility_rating || 0) + 
        (rating.availability_rating || 0) + 
        (rating.condition_rating || 0)
      ) / 3
      
      featureRatings[featureType].totalRatings.push(overallRating)
      featureRatings[featureType].count++
    })

    // Calculate averages and render
    return Object.entries(featureRatings).map(([featureType, data]) => {
      const avgRating = data.totalRatings.reduce((sum, val) => sum + val, 0) / data.count

      return (
        <View key={featureType} style={styles.featureRatingItem}>
          <View style={styles.featureRatingRow}>
            <Text variant="bodyMedium" style={styles.featureRatingTitle}>
              {featureType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            <View style={styles.starsContainer}>
              {renderStars(avgRating)}
              <Text variant="bodySmall" style={styles.ratingValue}>
                {avgRating.toFixed(1)} 
              </Text>
            </View>
          </View>
        </View>
      )
    })
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={`full-${i}`} name="star" size={14} color="#F59E0B" />
      )
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <Icon key="half" name="star-half-full" size={14} color="#F59E0B" />
      )
    }
    
    // Empty stars
    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star-outline" size={14} color="#D1D5DB" />
      )
    }
    
    return <View style={styles.starsRow}>{stars}</View>
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
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="comment-text-outline" size={18} color="#3B82F6" />
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Community Reviews
                </Text>
              </View>
              <View style={styles.reviewsCount}>
                <Text variant="bodySmall" style={styles.reviewsCountText}>
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            
            <View style={styles.reviewsList}>
              {reviews.slice(0, 3).map((review, index) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.reviewUserSection}>
                      <View style={styles.userAvatar}>
                        <Icon name="account" size={16} color="#6B7280" />
                      </View>
                      <View style={styles.userDetails}>
                        <View style={styles.userNameRow}>
                          <Text variant="bodySmall" style={styles.reviewUserName}>
                            {review.user_name || 'Anonymous User'}
                          </Text>
                          <UserBadge userId={review.user_id} size="tiny" />
                        </View>
                        <Text variant="bodySmall" style={styles.reviewDate}>
                          {formatDate(review.created_at)}
                        </Text>
                      </View>
                    </View>
                    
                    
                  </View>
                  
                  <View style={styles.reviewContent}>
                    <Text variant="bodyMedium" style={styles.reviewText}>
                      "{review.review_text}"
                    </Text>
                  </View>
                  
                  
                </View>
              ))}
            </View>
            
            {reviews.length > 3 && (
              <View style={styles.moreReviewsContainer}>
                <Text variant="bodySmall" style={styles.moreReviewsText}>
                  +{reviews.length - 3} more review{reviews.length - 3 !== 1 ? 's' : ''} available
                </Text>
                <Icon name="chevron-right" size={16} color="#6366F1" />
              </View>
            )}
          </View>
        )}

        {/* Ratings Section */}
        {ratings && ratings.length > 0 && (
          <View style={styles.contributionSection}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              <Icon name="star" size={16} color="#F59E0B" /> Accessibility  Rating ({ratings.length})
            </Text>
            {renderAccessibilityFeatureRatings(ratings)}
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
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photosScrollView}
              contentContainerStyle={styles.photosContainer}
            >
              {photos.slice(0, 10).map((photo, index) => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image 
                    source={{ uri: photo.photo_url }} 
                    style={styles.photoImage}
                    resizeMode="cover"
                    onError={() => {
                      console.log('Failed to load image:', photo.photo_url)
                    }}
                  />
                  <View style={styles.photoImageFallback}>
                    <Icon name="image-off" size={24} color="#9CA3AF" />
                  </View>
                  <View style={styles.photoOverlay}>
                    <Text variant="bodySmall" style={styles.photoUser}>
                      {photo.user_name || 'Anonymous'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            {photos.length > 10 && (
              <Text variant="bodySmall" style={styles.morePhotosText}>
                +{photos.length - 10} more photos
              </Text>
            )}
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
      <Surface style={styles.submissionCard} elevation={2}>
        <View style={styles.submissionContent}>
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
              <Icon name="map-marker-outline" size={16} color="#2E7D32" />
              <Text variant="bodySmall" style={styles.detailText}>
                {item.address}
              </Text>
            </View>
            
            {item.phone && (
              <View style={styles.detailRow}>
                <Icon name="phone-outline" size={16} color="#2E7D32" />
                <Text variant="bodySmall" style={styles.detailText}  >
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
                    color="#2E7D32" 
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
        </View>
      </Surface>
    )
  }

  if (loading) {
    return (
      <LinearGradient
        colors={['#F8FAFC', '#EBF8FF']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={{ marginTop: 16 }}>Loading your submissions...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={['#F8FAFC', '#EBF8FF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
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
                labelStyle={styles.addButtonText}
                icon="store-plus"
              >
                Add My Business
              </Button>
            </View>
          }
        />
        
        {/* Floating Action Button for Adding New Business */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('AddMyBusiness')}
          label="Add Business"
          color="#fff"
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  submissionContent: {
    padding: 20,
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
    color: '#1F2937',
    fontWeight: 'bold',
  },
  businessCategory: {
    color: '#6B7280',
    marginTop: 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  businessDescription: {
    color: '#6B7280',
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
    color: '#2E7D32',
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
  contributionStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  contributionStatsTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 10,
  },
  noContributionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  noContributionsText: {
    color: '#6B7280',
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
    color: '#2E7D32',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewsCount: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewsCountText: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 11,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  reviewUserName: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 12,
  },
  reviewDate: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  reviewFeatureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  reviewFeatureText: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '600',
  },
  reviewContent: {
    marginBottom: 12,
  },
  reviewText: {
    color: '#374151',
    lineHeight: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  difficultyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
  },
  helpfulnessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  helpfulnessText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '600',
  },
  moreReviewsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    gap: 4,
  },
  moreReviewsText: {
    color: '#6366F1',
    fontWeight: '500',
  },
  photoSummary: {
    color: '#6B7280',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    marginBottom: 12,
  },
  photosScrollView: {
    marginVertical: 8,
  },
  photosContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoImageFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    zIndex: -1,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    gap: 4,
  },
  photoUser: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  photoFeatureChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    height: 18,
    alignSelf: 'flex-start',
  },
  photoFeatureText: {
    fontSize: 9,
    color: '#374151',
    fontWeight: '600',
  },
  morePhotosText: {
    color: '#EF4444',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
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
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#2E7D32',
  },
  addButtonText: {
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E7D32',
  },
  featureRatingItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  featureRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureRatingTitle: {
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    color: '#1F2937',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
})