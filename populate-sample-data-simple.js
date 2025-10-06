#!/usr/bin/env node

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertData() {
  try {
    console.log('🚀 Starting data insertion...')

    // Insert sample places (no user_id required)
    const places = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Independence Memorial Hall',
        category: 'museums',
        description: 'National monument commemorating Sri Lankan independence',
        address: 'Independence Avenue, Colombo 07',
        latitude: 6.9034,
        longitude: 79.8606,
        accessibility_features: ['wheelchair_accessible', 'accessible_restrooms', 'elevator_access'],
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'National Museum of Colombo',
        category: 'museums',
        description: 'The largest museum in Sri Lanka with historical artifacts',
        address: 'Sir Marcus Fernando Mawatha, Colombo 07',
        latitude: 6.9107,
        longitude: 79.8611,
        accessibility_features: ['wheelchair_accessible', 'audio_guides', 'tactile_exhibits'],
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Viharamahadevi Park',
        category: 'parks',
        description: 'The oldest and largest park in Colombo located in front of the Town Hall',
        address: 'Ananda Coomaraswamy Mawatha, Colombo 07',
        latitude: 6.9176,
        longitude: 79.8606,
        accessibility_features: ['paved_paths', 'accessible_playground', 'braille_signs'],
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Galle Face Green',
        category: 'parks',
        description: 'Ocean-side urban park in the heart of Colombo',
        address: 'Galle Road, Colombo 03',
        latitude: 6.9271,
        longitude: 79.8412,
        accessibility_features: ['wide_open_spaces', 'accessible_parking'],
        verified: true
      }
    ]

    console.log('📝 Inserting places...')
    const { error: placesError } = await supabase
      .from('places')
      .upsert(places, { onConflict: 'id' })

    if (placesError) {
      console.error('❌ Error inserting places:', placesError)
      throw placesError
    }
    console.log('✅ Places inserted successfully!')

    // Insert sample businesses (no user_id required)
    const businesses = [
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Ministry of Crab',
        category: 'restaurants',
        description: 'Award-winning seafood restaurant in a restored Dutch hospital',
        address: '2nd Floor, Dutch Hospital Shopping Precinct, Colombo 01',
        latitude: 6.9354,
        longitude: 79.8438,
        phone: '+94112342200',
        website: 'https://ministryofcrab.com',
        accessibility_features: ['wheelchair_accessible', 'accessible_restrooms', 'elevator_access'],
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'Shangri-La Hotel Colombo',
        category: 'hotels',
        description: 'Luxury hotel with ocean views and premium amenities',
        address: '1 Galle Face Green, Colombo 02',
        latitude: 6.9238,
        longitude: 79.8439,
        phone: '+94112376111',
        website: 'https://shangri-la.com',
        accessibility_features: ['wheelchair_accessible', 'accessible_rooms', 'elevator_access', 'pool_lift'],
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Odel',
        category: 'shopping',
        description: 'Popular department store with multiple floors of fashion and lifestyle products',
        address: '5 Alexandra Place, Colombo 07',
        latitude: 6.9138,
        longitude: 79.8567,
        phone: '+94112682712',
        website: 'https://odel.lk',
        accessibility_features: ['elevator_access', 'wide_aisles', 'accessible_restrooms'],
        verified: true
      }
    ]

    console.log('📝 Inserting businesses...')
    const { error: businessesError } = await supabase
      .from('businesses')
      .upsert(businesses, { onConflict: 'id' })

    if (businessesError) {
      console.error('❌ Error inserting businesses:', businessesError)
      throw businessesError
    }
    console.log('✅ Businesses inserted successfully!')

    // Insert sample reviews (without user_id to avoid RLS issues)
    const reviews = [
      {
        id: '550e8400-e29b-41d4-a716-446655440020',
        place_id: '550e8400-e29b-41d4-a716-446655440001',
        business_id: null,
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 3, hearing: 5, cognitive: 4 },
        title: 'Great accessibility features',
        content: 'The Independence Memorial Hall has excellent wheelchair access and clear signage. Some exhibits could use better lighting for people with visual impairments, but overall very accessible. The staff is helpful and knowledgeable about accessibility features.',
        helpful_count: 3,
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        place_id: '550e8400-e29b-41d4-a716-446655440002',
        business_id: null,
        overall_rating: 5,
        accessibility_ratings: { mobility: 5, visual: 4, hearing: 4, cognitive: 5 },
        title: 'Outstanding museum accessibility',
        content: 'The National Museum has fantastic exhibits and is very well designed for accessibility. Audio guides available and wide corridors throughout. Tactile exhibits are a wonderful addition.',
        helpful_count: 12,
        verified: false
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        place_id: null,
        business_id: '550e8400-e29b-41d4-a716-446655440005',
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 4, hearing: 3, cognitive: 4 },
        title: 'Excellent food, good accessibility',
        content: 'Amazing seafood and the restaurant is mostly accessible. There is elevator access to the second floor and accessible restrooms. Can get quite noisy during peak hours which might be challenging for people with hearing sensitivities.',
        helpful_count: 8,
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440023',
        place_id: '550e8400-e29b-41d4-a716-446655440003',
        business_id: null,
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 5, hearing: 4, cognitive: 4 },
        title: 'Beautiful park with great paths',
        content: 'Viharamahadevi Park is lovely for a peaceful walk. Most paths are paved and accessible, and the braille signs are a nice touch. The accessible playground is perfect for families.',
        helpful_count: 6,
        verified: false
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440024',
        place_id: '550e8400-e29b-41d4-a716-446655440004',
        business_id: null,
        overall_rating: 3,
        accessibility_ratings: { mobility: 2, visual: 4, hearing: 4, cognitive: 3 },
        title: 'Beach access needs improvement',
        content: 'Galle Face Green is a great place to watch the sunset, but beach access is challenging for people with mobility issues. The main green area is accessible though.',
        helpful_count: 9,
        verified: false
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440025',
        business_id: '550e8400-e29b-41d4-a716-446655440006',
        place_id: null,
        overall_rating: 5,
        accessibility_ratings: { mobility: 5, visual: 5, hearing: 5, cognitive: 5 },
        title: 'Luxury with accessibility in mind',
        content: 'Shangri-La Hotel Colombo excels in both luxury and accessibility. They have accessible rooms, pool lifts, and very attentive staff. The accessibility features are exceptional.',
        helpful_count: 20,
        verified: true
      }
    ]

    console.log('📝 Inserting reviews...')
    const { error: reviewsError } = await supabase
      .from('reviews')
      .upsert(reviews, { onConflict: 'id' })

    if (reviewsError) {
      console.error('❌ Error inserting reviews:', reviewsError)
      throw reviewsError
    }
    console.log('✅ Reviews inserted successfully!')

    console.log('🎉 All sample data inserted successfully!')
    return { success: true, message: 'All sample data inserted successfully' }

  } catch (error) {
    console.error('❌ Error inserting sample data:', error)
    return { success: false, error: error.message }
  }
}

async function main() {
  try {
    const result = await insertData()
    if (result.success) {
      console.log('🎉 Database population completed successfully!')
    } else {
      console.error('❌ Database population failed:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

main()