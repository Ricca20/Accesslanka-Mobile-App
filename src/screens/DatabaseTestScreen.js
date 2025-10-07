import React, { useState } from 'react'
import { View, StyleSheet, Alert, ScrollView } from 'react-native'
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { insertSampleData } from '../lib/insertSampleData'
import { DatabaseService } from '../lib/database'
import { addStatusColumnToBusinesses } from '../lib/database-setup'
import { useAuth } from '../context/AuthContext'

export default function DatabaseTestScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [businessTestResult, setBusinessTestResult] = useState(null)

  const handleInsertSampleData = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await insertSampleData()
      setResult(response)
      
      if (response.success) {
        Alert.alert('Success', 'Sample data inserted successfully! You can now test the Reviews screen.')
      } else {
        Alert.alert('Error', `Failed to insert sample data: ${response.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'An unexpected error occurred')
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDatabaseSetup = async () => {
    setLoading(true)
    setBusinessTestResult(null)
    
    try {
      await addStatusColumnToBusinesses()
      setBusinessTestResult({ success: true, message: 'Database setup completed' })
      Alert.alert('Success', 'Database setup completed successfully!')
    } catch (error) {
      console.error('Database setup error:', error)
      setBusinessTestResult({ success: false, error: error.message })
      Alert.alert('Setup Info', 'Please add the status column manually in Supabase dashboard. Check console for SQL commands.')
    } finally {
      setLoading(false)
    }
  }

  const handleTestBusinessSubmission = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to test business submission')
      return
    }

    setLoading(true)
    setBusinessTestResult(null)
    
    try {
      const testBusiness = {
        name: 'Test Restaurant',
        category: 'restaurant',
        description: 'A test restaurant for validation',
        address: '123 Test Street, Colombo',
        latitude: 6.9271,
        longitude: 79.8612,
        phone: '+94112345678',
        email: 'test@restaurant.com',
        website: 'https://testrestaurant.com',
        opening_hours: {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '10:00', close: '15:00', closed: false },
          sunday: { open: '', close: '', closed: true }
        },
        accessibility_features: ['wheelchair_accessible', 'braille_menu'],
        photos: []
      }

      const businessResult = await DatabaseService.createBusinessSubmission(user.id, testBusiness)
      
      if (businessResult) {
        setBusinessTestResult({ 
          success: true, 
          message: `Business submitted successfully with ID: ${businessResult.id}`,
          data: businessResult
        })
        Alert.alert('Success', 'Test business submitted successfully!')
      } else {
        setBusinessTestResult({ success: false, error: 'Business submission returned null' })
        Alert.alert('Error', 'Business submission failed')
      }
    } catch (error) {
      console.error('Business submission error:', error)
      setBusinessTestResult({ success: false, error: error.message })
      Alert.alert('Error', `Business submission failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Database Test Suite
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Test database functionality including reviews and business submissions.
            </Text>
            
            <Button
              mode="contained"
              onPress={handleInsertSampleData}
              loading={loading}
              disabled={loading}
              style={styles.button}
              icon="database-plus"
            >
              Insert Sample Review Data
            </Button>

            <Button
              mode="contained"
              onPress={handleDatabaseSetup}
              loading={loading}
              disabled={loading}
              style={styles.button}
              icon="database-cog"
            >
              Setup Business Database
            </Button>

            <Button
              mode="contained"
              onPress={handleTestBusinessSubmission}
              loading={loading}
              disabled={loading || !user?.id}
              style={styles.button}
              icon="store-plus"
            >
              Test Business Submission
            </Button>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}

            {result && (
              <Card style={[styles.resultCard, { borderLeftColor: result.success ? '#4CAF50' : '#F44336' }]}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.resultTitle}>
                    Sample Data Result
                  </Text>
                  <Text style={[styles.resultText, { color: result.success ? '#4CAF50' : '#F44336' }]}>
                    {result.success ? 'Success' : 'Error'}: {result.error || result.message || 'Operation completed'}
                  </Text>
                  {result.details && (
                    <Text variant="bodySmall" style={styles.resultDetails}>
                      {JSON.stringify(result.details, null, 2)}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            )}

            {businessTestResult && (
              <Card style={[styles.resultCard, { borderLeftColor: businessTestResult.success ? '#4CAF50' : '#F44336' }]}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.resultTitle}>
                    Business Test Result
                  </Text>
                  <Text style={[styles.resultText, { color: businessTestResult.success ? '#4CAF50' : '#F44336' }]}>
                    {businessTestResult.success ? 'Success' : 'Error'}: {businessTestResult.error || businessTestResult.message || 'Operation completed'}
                  </Text>
                  {businessTestResult.data && (
                    <Text variant="bodySmall" style={styles.resultDetails}>
                      Business ID: {businessTestResult.data.id}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            )}

            {!user?.id && (
              <Card style={styles.infoCard}>
                <Card.Content>
                  <Text variant="bodyMedium" style={styles.infoText}>
                    Please log in to test business submission functionality.
                  </Text>
                </Card.Content>
              </Card>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginTop: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  button: {
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  resultCard: {
    marginTop: 16,
    borderLeftWidth: 4,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    marginBottom: 8,
  },
  resultDetails: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: '#E3F2FD',
  },
  infoText: {
    color: '#1976D2',
    textAlign: 'center',
  },
})