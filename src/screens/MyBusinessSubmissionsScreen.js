import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, Badge } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../context/AuthContext'
import { DatabaseService } from '../lib/database'

const STATUS_COLORS = {
  pending: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
}

const STATUS_LABELS = {
  pending: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function MyBusinessSubmissionsScreen({ navigation }) {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
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
    } catch (error) {
      console.error('Error loading business submissions:', error)
      Alert.alert('Error', 'Failed to load your business submissions.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSubmissions()
    setRefreshing(false)
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
      default:
        return 'help-circle-outline'
    }
  }

  const renderSubmission = ({ item }) => (
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
  approvedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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