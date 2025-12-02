/**
 * Sample Data Inserter
 * Utility for inserting sample/seed data into the database
 */

import { supabase } from '../../config/supabase'

/**
 * Insert sample data for testing purposes
 * @param {string} userId - The user ID to associate sample data with
 */
export async function insertSampleData(userId) {
  try {
    console.log('Inserting sample data for user:', userId)

    // Sample categories (if not already present)
    const categories = [
      { name: 'restaurants', icon: 'silverware-fork-knife', color: '#FF5722' },
      { name: 'hotels', icon: 'bed', color: '#2196F3' },
      { name: 'museums', icon: 'bank', color: '#9C27B0' },
      { name: 'parks', icon: 'tree', color: '#4CAF50' },
      { name: 'shopping', icon: 'shopping', color: '#FF9800' },
    ]

    // Insert categories (ignore if they already exist)
    for (const category of categories) {
      await supabase
        .from('categories')
        .upsert(category, { onConflict: 'name', ignoreDuplicates: true })
    }

    // Sample businesses
    const sampleBusinesses = [
      {
        name: 'Sample Restaurant',
        category: 'restaurants',
        description: 'A sample restaurant with great accessibility features',
        address: '123 Main Street, Colombo',
        latitude: 6.9271,
        longitude: 79.8612,
        phone: '+94 11 234 5678',
        accessibility_features: ['wheelchair_accessible', 'accessible_parking', 'accessible_restroom'],
        verified: false,
        created_by: userId,
      },
      {
        name: 'Sample Hotel',
        category: 'hotels',
        description: 'Accessible hotel with modern facilities',
        address: '456 Ocean Road, Colombo',
        latitude: 6.9319,
        longitude: 79.8478,
        phone: '+94 11 876 5432',
        accessibility_features: ['wheelchair_accessible', 'elevator', 'accessible_restroom'],
        verified: false,
        created_by: userId,
      },
    ]

    const insertedBusinesses = []
    for (const business of sampleBusinesses) {
      const { data, error } = await supabase
        .from('businesses')
        .insert([business])
        .select()
        .single()

      if (error) {
        console.error('Error inserting business:', error)
      } else {
        insertedBusinesses.push(data)
      }
    }

    // Sample places
    const samplePlaces = [
      {
        name: 'Sample Park',
        category: 'parks',
        description: 'Beautiful park with accessible pathways',
        address: '789 Park Avenue, Colombo',
        latitude: 6.9147,
        longitude: 79.8730,
        accessibility_features: ['wheelchair_accessible', 'accessible_parking'],
        verified: false,
        created_by: userId,
      },
    ]

    const insertedPlaces = []
    for (const place of samplePlaces) {
      const { data, error } = await supabase
        .from('places')
        .insert([place])
        .select()
        .single()

      if (error) {
        console.error('Error inserting place:', error)
      } else {
        insertedPlaces.push(data)
      }
    }

    console.log('Sample data inserted successfully:', {
      businesses: insertedBusinesses.length,
      places: insertedPlaces.length,
    })

    return {
      success: true,
      businesses: insertedBusinesses,
      places: insertedPlaces,
    }
  } catch (error) {
    console.error('Error inserting sample data:', error)
    throw error
  }
}

export default insertSampleData
