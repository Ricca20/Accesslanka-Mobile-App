#!/usr/bin/env node

// Sample data population script for AccessLanka Reviews
// Run with: node populate-sample-data.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
function loadEnv() {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    const lines = envFile.split('\n')
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    }
  } catch (error) {
    console.error('Could not load .env file:', error.message)
  }
}

loadEnv()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sampleData = {
  categories: [
    { name: 'museums', icon: 'bank', color: '#9C27B0' },
    { name: 'parks', icon: 'tree', color: '#4CAF50' },
    { name: 'restaurants', icon: 'silverware-fork-knife', color: '#FF5722' },
    { name: 'hotels', icon: 'bed', color: '#2196F3' },
    { name: 'shopping', icon: 'shopping', color: '#FF9800' }
  ],
  users: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      accessibility_needs: 'mobility',
      location: 'Colombo, Sri Lanka',
      verified: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      email: 'priya.silva@example.com',
      full_name: 'Priya Silva',
      accessibility_needs: 'visual',
      location: 'Kandy, Sri Lanka',
      verified: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      email: 'kamal.perera@example.com',
      full_name: 'Kamal Perera',
      accessibility_needs: 'hearing',
      location: 'Galle, Sri Lanka',
      verified: false
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      email: 'sara.fernando@example.com',
      full_name: 'Sara Fernando',
      accessibility_needs: 'cognitive',
      location: 'Negombo, Sri Lanka',
      verified: true
    }
  ],
  places: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Colombo National Museum',
      category: 'museums',
      description: 'Sri Lanka\'s largest museum showcasing cultural heritage',
      address: 'Sir Marcus Fernando Mawatha, Colombo 07',
      latitude: 6.9147,
      longitude: 79.8612,
      accessibility_features: ['wheelchair_accessible', 'audio_guides', 'tactile_exhibits'],
      verified: true,
      created_by: '550e8400-e29b-41d4-a716-446655440010'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Galle Face Green',
      category: 'parks',
      description: 'A large urban park along the coast',
      address: 'Galle Face Green, Colombo 03',
      latitude: 6.9244,
      longitude: 79.8450,
      accessibility_features: ['wide_pathways', 'accessible_restrooms', 'level_ground'],
      verified: true,
      created_by: '550e8400-e29b-41d4-a716-446655440010'
    }
  ],
  businesses: [
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Ministry of Crab',
      category: 'restaurants',
      description: 'Award-winning seafood restaurant',
      address: '2nd Floor, Dutch Hospital Shopping Precinct, Colombo 01',
      latitude: 6.9354,
      longitude: 79.8438,
      accessibility_features: ['wheelchair_accessible', 'accessible_restrooms', 'elevator_access'],
      verified: true,
      created_by: '550e8400-e29b-41d4-a716-446655440010'
    }
  ],
  reviews: [
    {
      id: '550e8400-e29b-41d4-a716-446655440020',
      place_id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440010',
      overall_rating: 4,
      accessibility_ratings: { mobility: 4, visual: 3, hearing: 5, cognitive: 4 },
      title: 'Great accessibility features',
      content: 'The museum has excellent wheelchair access and audio guides available. Some exhibits could use better lighting for people with visual impairments, but overall very accessible.',
      helpful_count: 3,
      verified: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      place_id: '550e8400-e29b-41d4-a716-446655440002',
      user_id: '550e8400-e29b-41d4-a716-446655440011',
      overall_rating: 5,
      accessibility_ratings: { mobility: 5, visual: 4, hearing: 4, cognitive: 5 },
      title: 'Perfect for wheelchair users',
      content: 'Wide open spaces and level ground make this perfect for wheelchair users. The pathways are well-maintained and there are accessible restrooms.',
      helpful_count: 2,
      verified: false
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440022',
      business_id: '550e8400-e29b-41d4-a716-446655440005',
      user_id: '550e8400-e29b-41d4-a716-446655440012',
      overall_rating: 4,
      accessibility_ratings: { mobility: 4, visual: 4, hearing: 3, cognitive: 4 },
      title: 'Excellent food, good accessibility',
      content: 'Amazing seafood and the restaurant is mostly accessible. There is elevator access to the second floor and accessible restrooms.',
      helpful_count: 2,
      verified: true
    }
  ]
}

async function populateDatabase() {
  console.log('🚀 Starting database population...')

  try {
    // Insert categories first
    console.log('📝 Inserting categories...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(sampleData.categories, { onConflict: 'name' })
    
    if (categoriesError) throw categoriesError
    console.log('✅ Categories inserted successfully')

    // Insert users
    console.log('📝 Inserting users...')
    const { error: usersError } = await supabase
      .from('users')
      .upsert(sampleData.users, { onConflict: 'id' })
    
    if (usersError) throw usersError
    console.log('✅ Users inserted successfully')

    // Insert places
    console.log('📝 Inserting places...')
    const { error: placesError } = await supabase
      .from('places')
      .upsert(sampleData.places, { onConflict: 'id' })
    
    if (placesError) throw placesError
    console.log('✅ Places inserted successfully')

    // Insert businesses
    console.log('📝 Inserting businesses...')
    const { error: businessesError } = await supabase
      .from('businesses')
      .upsert(sampleData.businesses, { onConflict: 'id' })
    
    if (businessesError) throw businessesError
    console.log('✅ Businesses inserted successfully')

    // Insert reviews
    console.log('📝 Inserting reviews...')
    const { error: reviewsError } = await supabase
      .from('reviews')
      .upsert(sampleData.reviews, { onConflict: 'id' })
    
    if (reviewsError) throw reviewsError
    console.log('✅ Reviews inserted successfully')

    console.log('🎉 Database population completed successfully!')
    console.log('💡 You can now test the Reviews page in your app')
    
  } catch (error) {
    console.error('❌ Error populating database:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  populateDatabase()
}

module.exports = { populateDatabase, sampleData }