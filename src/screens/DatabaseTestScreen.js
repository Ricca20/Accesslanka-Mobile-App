import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Text, Button, Card } from 'react-native-paper'
import { insertSampleData } from '../lib/insertSampleData'

export default function DatabaseTestScreen() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

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

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Database Test
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            This screen helps you populate the database with sample review data to test the Reviews functionality.
          </Text>
          
          <Button
            mode="contained"
            onPress={handleInsertSampleData}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Insert Sample Review Data
          </Button>

          {result && (
            <Card style={[styles.resultCard, result.success ? styles.successCard : styles.errorCard]}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.resultTitle}>
                  {result.success ? 'Success!' : 'Error'}
                </Text>
                <Text variant="bodyMedium">
                  {result.success ? result.message : result.error}
                </Text>
              </Card.Content>
            </Card>
          )}
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginTop: 32,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#2E7D32',
  },
  description: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  button: {
    marginBottom: 16,
  },
  resultCard: {
    marginTop: 16,
  },
  successCard: {
    backgroundColor: '#E8F5E8',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
  },
  resultTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
})