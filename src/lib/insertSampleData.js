import { supabase } from './supabase'

export const insertSampleData = async () => {
  try {
    console.log('Starting sample data insertion...')

    // Note: We skip inserting users because of RLS policies
    // Users must be created through proper authentication
    console.log('⚠️  Skipping user insertion (requires authentication)')

    // Insert categories first
    const categories = [
      { name: 'museums', icon: 'bank', color: '#9C27B0' },
      { name: 'parks', icon: 'tree', color: '#4CAF50' },
      { name: 'restaurants', icon: 'silverware-fork-knife', color: '#FF5722' },
      { name: 'hotels', icon: 'bed', color: '#2196F3' },
      { name: 'shopping', icon: 'shopping', color: '#FF9800' }
    ]

    console.log('Inserting categories...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'name' })

    if (categoriesError) {
      console.error('Error inserting categories:', categoriesError)
      throw categoriesError
    }

    // Insert sample places (we'll use the current authenticated user if available)
    const getCurrentUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id
    }

    const currentUserId = await getCurrentUserId()
    
    if (!currentUserId) {
      console.warn('⚠️  No authenticated user found. Places and businesses will be created without a creator.')
      // For demo purposes, we'll proceed without a creator if possible
    }

    const places = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Colombo National Museum',
        category: 'museums',
        description: 'Sri Lanka\'s largest museum showcasing the island\'s cultural heritage',
        address: 'Sir Marcus Fernando Mawatha, Colombo 07',
        latitude: 6.9147,
        longitude: 79.8612,
        accessibility_features: ['wheelchair_accessible', 'audio_guides', 'tactile_exhibits'],
        verified: true,
        ...(currentUserId && { created_by: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Galle Face Green',
        category: 'parks',
        description: 'A large urban park stretching along the coast in the heart of Colombo',
        address: 'Galle Face Green, Colombo 03',
        latitude: 6.9244,
        longitude: 79.8450,
        accessibility_features: ['wide_pathways', 'accessible_restrooms', 'level_ground'],
        verified: true,
        ...(currentUserId && { created_by: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Independence Memorial Hall',
        category: 'government',
        description: 'A national monument built for commemoration of the independence of Sri Lanka',
        address: 'Independence Avenue, Colombo 07',
        latitude: 6.9065,
        longitude: 79.8695,
        accessibility_features: ['ramp_access', 'accessible_parking', 'wide_pathways'],
        verified: true,
        ...(currentUserId && { created_by: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Viharamahadevi Park',
        category: 'parks',
        description: 'The oldest and largest park in Colombo located in front of the Town Hall',
        address: 'Ananda Coomaraswamy Mawatha, Colombo 07',
        latitude: 6.9176,
        longitude: 79.8606,
        accessibility_features: ['paved_paths', 'accessible_playground', 'braille_signs'],
        verified: true,
        ...(currentUserId && { created_by: currentUserId })
      }
    ]

    console.log('Inserting places...')
    const { error: placesError } = await supabase
      .from('places')
      .upsert(places, { onConflict: 'id' })

    if (placesError) {
      console.error('Error inserting places:', placesError)
      throw placesError
    }

    // Insert sample businesses
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
        verified: true,
        ...(currentUserId && { created_by: currentUserId })
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
        verified: true,
        ...(currentUserId && { created_by: currentUserId })
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
        verified: true,
        ...(currentUserId && { created_by: currentUserId })
      }
    ]

    console.log('Inserting businesses...')
    const { error: businessesError } = await supabase
      .from('businesses')
      .upsert(businesses, { onConflict: 'id' })

    if (businessesError) {
      console.error('Error inserting businesses:', businessesError)
      throw businessesError
    }

    // Insert sample reviews
    const reviews = [
      {
        id: '550e8400-e29b-41d4-a716-446655440020',
        place_id: '550e8400-e29b-41d4-a716-446655440001',
        business_id: null,
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 3, hearing: 5, cognitive: 4 },
        title: 'Great accessibility features',
        content: 'The museum has excellent wheelchair access and audio guides available. Some exhibits could use better lighting for people with visual impairments, but overall very accessible. The staff is helpful and knowledgeable about accessibility features.',
        helpful_count: 3,
        verified: true,
        ...(currentUserId && { user_id: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        place_id: '550e8400-e29b-41d4-a716-446655440002',
        business_id: null,
        overall_rating: 5,
        accessibility_ratings: { mobility: 5, visual: 4, hearing: 4, cognitive: 5 },
        title: 'Perfect for wheelchair users',
        content: 'Wide open spaces and level ground make this perfect for wheelchair users. The pathways are well-maintained and there are accessible restrooms. Beautiful sunset views and very peaceful environment.',
        helpful_count: 2,
        verified: false,
        ...(currentUserId && { user_id: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        place_id: null,
        business_id: '550e8400-e29b-41d4-a716-446655440005',
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 4, hearing: 3, cognitive: 4 },
        title: 'Excellent food, good accessibility',
        content: 'Amazing seafood and the restaurant is mostly accessible. There is elevator access to the second floor and accessible restrooms. Can get quite noisy during peak hours which might be challenging for people with hearing sensitivities.',
        helpful_count: 2,
        verified: true,
        ...(currentUserId && { user_id: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440023',
        place_id: '550e8400-e29b-41d4-a716-446655440003',
        business_id: null,
        overall_rating: 3,
        accessibility_ratings: { mobility: 3, visual: 2, hearing: 4, cognitive: 3 },
        title: 'Historical but needs improvement',
        content: 'Beautiful historical site but accessibility could be better. There are some ramps but the signage is not very clear. The grounds are mostly accessible but some areas are challenging for people with mobility issues.',
        helpful_count: 2,
        verified: false,
        ...(currentUserId && { user_id: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440024',
        place_id: null,
        business_id: '550e8400-e29b-41d4-a716-446655440006',
        overall_rating: 5,
        accessibility_ratings: { mobility: 5, visual: 5, hearing: 5, cognitive: 5 },
        title: 'Outstanding accessibility',
        content: 'This hotel sets the standard for accessibility. Wheelchair accessible rooms, pool lift, excellent lighting, clear signage, and very helpful staff. They clearly understand accessibility needs and cater to them excellently.',
        helpful_count: 0,
        verified: true,
        ...(currentUserId && { user_id: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440025',
        place_id: null,
        business_id: '550e8400-e29b-41d4-a716-446655440007',
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 4, hearing: 4, cognitive: 3 },
        title: 'Good shopping experience',
        content: 'Nice department store with elevator access and wide aisles. The layout can be a bit confusing on upper floors but staff are helpful. Good selection of products and accessible facilities throughout.',
        helpful_count: 1,
        verified: false,
        ...(currentUserId && { user_id: currentUserId })
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440026',
        place_id: '550e8400-e29b-41d4-a716-446655440004',
        business_id: null,
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 5, hearing: 4, cognitive: 4 },
        title: 'Great park for families',
        content: 'Lovely park with paved paths and an accessible playground. The braille signs are a nice touch. Good seating areas and the playground equipment is designed to be inclusive. Perfect for families with diverse accessibility needs.',
        helpful_count: 1,
        verified: true,
        ...(currentUserId && { user_id: currentUserId })
      }
    ]

    console.log('Inserting reviews...')
    const { error: reviewsError } = await supabase
      .from('reviews')
      .upsert(reviews, { onConflict: 'id' })

    if (reviewsError) {
      console.error('Error inserting reviews:', reviewsError)
      throw reviewsError
    }

    console.log('Sample data inserted successfully!')
    return { success: true, message: 'All sample data inserted successfully' }

  } catch (error) {
    console.error('Error inserting sample data:', error)
    return { success: false, error: error.message }
  }
}