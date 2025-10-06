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

async function insertBasicReviews() {
  try {
    console.log('🚀 Starting basic reviews insertion...')

    // Try inserting reviews without user references for now
    const basicReviews = [
      {
        id: '550e8400-e29b-41d4-a716-446655440020',
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 3, hearing: 5, cognitive: 4 },
        title: 'Great accessibility features',
        content: 'The National Museum has excellent wheelchair access and audio guides available. Some exhibits could use better lighting for people with visual impairments, but overall very accessible. The staff is helpful and knowledgeable about accessibility features.',
        helpful_count: 12,
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        overall_rating: 5,
        accessibility_ratings: { mobility: 5, visual: 4, hearing: 4, cognitive: 5 },
        title: 'Perfect for wheelchair users',
        content: 'Wide open spaces, easy to navigate. Perfect for wheelchair users. Beautiful sunset views and the pathways are well-maintained. Great place for families with accessibility needs.',
        helpful_count: 8,
        verified: false
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 4, hearing: 3, cognitive: 4 },
        title: 'Excellent food, good accessibility',
        content: 'Amazing seafood and the restaurant is wheelchair accessible. The elevator works well and staff is accommodating. However, it can get quite noisy during peak hours which might be challenging for those with hearing sensitivity.',
        helpful_count: 15,
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440023',
        overall_rating: 5,
        accessibility_ratings: { mobility: 5, visual: 4, hearing: 4, cognitive: 5 },
        title: 'Outstanding accessibility standards',
        content: 'This hotel sets the standard for accessibility in Colombo. Multiple accessible rooms, pool lift available, and staff trained in disability awareness. Highly recommend for travelers with mobility needs.',
        helpful_count: 20,
        verified: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440024',
        overall_rating: 3,
        accessibility_ratings: { mobility: 3, visual: 2, hearing: 4, cognitive: 3 },
        title: 'Historic site with some limitations',
        content: 'Beautiful historic monument but accessibility could be improved. There are ramps but they are quite steep. Limited signage for people with visual impairments. Still worth a visit for the historical significance.',
        helpful_count: 6,
        verified: false
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440025',
        overall_rating: 4,
        accessibility_ratings: { mobility: 4, visual: 4, hearing: 4, cognitive: 4 },
        title: 'Family-friendly and accessible',
        content: 'Great park for families with children who have disabilities. The playground has accessible equipment and the paths are well-paved. Some areas have braille signs which is excellent. Clean accessible restrooms available.',
        helpful_count: 10,
        verified: true
      }
    ]

    console.log('📝 Inserting basic reviews...')
    const { error: reviewsError } = await supabase
      .from('reviews')
      .upsert(basicReviews, { onConflict: 'id' })

    if (reviewsError) {
      console.error('❌ Error inserting reviews:', reviewsError)
      throw reviewsError
    }

    console.log('✅ Reviews inserted successfully!')
    console.log('🎉 Basic reviews insertion completed successfully!')
    return { success: true, message: 'Basic reviews inserted successfully' }

  } catch (error) {
    console.error('❌ Error inserting basic reviews:', error)
    return { success: false, error: error.message }
  }
}

async function main() {
  try {
    const result = await insertBasicReviews()
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