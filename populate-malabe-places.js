/**
 * Populate Malabe Places Data
 * 
 * This script populates the database with public places near Malabe area
 * Run this script to add sample data to your Supabase database
 * 
 * IMPORTANT: You need to provide either:
 * 1. SUPABASE_SERVICE_ROLE_KEY in .env (recommended - bypasses RLS)
 * 2. Or valid user credentials (email/password)
 * 
 * Usage: 
 * Option 1: Add SUPABASE_SERVICE_ROLE_KEY to .env
 *   node populate-malabe-places.js
 * 
 * Option 2: Run with user credentials
 *   node populate-malabe-places.js your-email@example.com your-password
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in .env file')
  process.exit(1)
}

// Use service role key if available (bypasses RLS), otherwise use anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey
const supabase = createClient(supabaseUrl, supabaseKey)

// Get user credentials from command line args if provided
const userEmail = process.argv[2]
const userPassword = process.argv[3]

// Sample places data for Malabe area
const malabePlaces = [
  {
    name: 'Sri Lanka Institute of Information Technology (SLIIT)',
    category: 'education',
    description: 'Premier private higher education institution offering IT and engineering programs with modern facilities.',
    address: 'New Kandy Rd, Malabe, Sri Lanka',
    latitude: 6.9146,
    longitude: 79.9730,
    opening_hours: {
      monday: '8:00 AM - 5:00 PM',
      tuesday: '8:00 AM - 5:00 PM',
      wednesday: '8:00 AM - 5:00 PM',
      thursday: '8:00 AM - 5:00 PM',
      friday: '8:00 AM - 5:00 PM',
      saturday: '8:00 AM - 12:00 PM',
      sunday: 'Closed'
    },
    phone: '+94 11 241 3900',
    website: 'https://www.sliit.lk',
    accessibility_features: ['Wheelchair accessible entrance', 'Accessible parking', 'Elevator access', 'Accessible restrooms', 'Ramps'],
    verified: true,
    images: []
  },
  {
    name: 'Horizon Campus',
    category: 'education',
    description: 'Modern university campus offering undergraduate and postgraduate programs in various disciplines.',
    address: 'No.12, Thalapathpitiya Road, Malabe, Sri Lanka',
    latitude: 6.9093,
    longitude: 79.9740,
    opening_hours: {
      monday: '8:00 AM - 4:30 PM',
      tuesday: '8:00 AM - 4:30 PM',
      wednesday: '8:00 AM - 4:30 PM',
      thursday: '8:00 AM - 4:30 PM',
      friday: '8:00 AM - 4:30 PM',
      saturday: 'Closed',
      sunday: 'Closed'
    },
    phone: '+94 11 243 1999',
    website: 'https://www.horizoncampus.edu.lk',
    accessibility_features: ['Wheelchair accessible entrance', 'Elevator access', 'Accessible parking', 'Accessible restrooms'],
    verified: true,
    images: []
  },
  {
    name: 'Malabe Junction Shopping Complex',
    category: 'shopping',
    description: 'Local shopping complex with supermarket, retail stores, and dining options.',
    address: 'Kaduwela Road, Malabe, Sri Lanka',
    latitude: 6.9063,
    longitude: 79.9738,
    opening_hours: {
      monday: '9:00 AM - 9:00 PM',
      tuesday: '9:00 AM - 9:00 PM',
      wednesday: '9:00 AM - 9:00 PM',
      thursday: '9:00 AM - 9:00 PM',
      friday: '9:00 AM - 9:00 PM',
      saturday: '9:00 AM - 9:00 PM',
      sunday: '9:00 AM - 9:00 PM'
    },
    phone: '+94 11 241 5678',
    website: '',
    accessibility_features: ['Wheelchair accessible entrance', 'Accessible parking', 'Wide aisles', 'Elevator access'],
    verified: true,
    images: []
  },
  {
    name: 'Keells Super - Malabe',
    category: 'shopping',
    description: 'Modern supermarket chain offering groceries, fresh produce, and household items.',
    address: 'New Kandy Road, Malabe, Sri Lanka',
    latitude: 6.9125,
    longitude: 79.9710,
    opening_hours: {
      monday: '8:00 AM - 10:00 PM',
      tuesday: '8:00 AM - 10:00 PM',
      wednesday: '8:00 AM - 10:00 PM',
      thursday: '8:00 AM - 10:00 PM',
      friday: '8:00 AM - 10:00 PM',
      saturday: '8:00 AM - 10:00 PM',
      sunday: '8:00 AM - 10:00 PM'
    },
    phone: '+94 11 241 2345',
    website: 'https://www.keellssuper.com',
    accessibility_features: ['Wheelchair accessible entrance', 'Accessible parking', 'Wide aisles', 'Accessible checkout counters'],
    verified: true,
    images: []
  },
  {
    name: 'Malabe Park',
    category: 'parks',
    description: 'Community park with walking paths, playground, and green spaces for relaxation.',
    address: 'Robert Gunawardena Mawatha, Malabe, Sri Lanka',
    latitude: 6.9050,
    longitude: 79.9720,
    opening_hours: {
      monday: '6:00 AM - 6:00 PM',
      tuesday: '6:00 AM - 6:00 PM',
      wednesday: '6:00 AM - 6:00 PM',
      thursday: '6:00 AM - 6:00 PM',
      friday: '6:00 AM - 6:00 PM',
      saturday: '6:00 AM - 6:00 PM',
      sunday: '6:00 AM - 6:00 PM'
    },
    phone: '',
    website: '',
    accessibility_features: ['Paved pathways', 'Accessible parking', 'Benches with back support', 'Accessible restrooms'],
    verified: true,
    images: []
  },
  {
    name: 'Burger King Malabe',
    category: 'restaurants',
    description: 'Fast food restaurant chain serving burgers, fries, and beverages.',
    address: 'New Kandy Road, Malabe, Sri Lanka',
    latitude: 6.9140,
    longitude: 79.9725,
    opening_hours: {
      monday: '10:00 AM - 10:00 PM',
      tuesday: '10:00 AM - 10:00 PM',
      wednesday: '10:00 AM - 10:00 PM',
      thursday: '10:00 AM - 10:00 PM',
      friday: '10:00 AM - 11:00 PM',
      saturday: '10:00 AM - 11:00 PM',
      sunday: '10:00 AM - 10:00 PM'
    },
    phone: '+94 11 241 3456',
    website: 'https://www.burgerking.lk',
    accessibility_features: ['Wheelchair accessible entrance', 'Accessible parking', 'Accessible seating', 'Accessible restrooms'],
    verified: true,
    images: []
  },
  {
    name: 'KFC Malabe',
    category: 'restaurants',
    description: 'Popular fast food chain specializing in fried chicken and sides.',
    address: 'Kaduwela Road, Malabe, Sri Lanka',
    latitude: 6.9070,
    longitude: 79.9750,
    opening_hours: {
      monday: '10:00 AM - 10:00 PM',
      tuesday: '10:00 AM - 10:00 PM',
      wednesday: '10:00 AM - 10:00 PM',
      thursday: '10:00 AM - 10:00 PM',
      friday: '10:00 AM - 11:00 PM',
      saturday: '10:00 AM - 11:00 PM',
      sunday: '10:00 AM - 10:00 PM'
    },
    phone: '+94 11 241 4567',
    website: 'https://www.kfc.lk',
    accessibility_features: ['Wheelchair accessible entrance', 'Accessible parking', 'Accessible seating'],
    verified: true,
    images: []
  },
  {
    name: 'Malabe Medicare Hospital',
    category: 'healthcare',
    description: 'Private healthcare facility providing medical services, diagnostics, and emergency care.',
    address: 'Robert Gunawardena Mawatha, Malabe, Sri Lanka',
    latitude: 6.9080,
    longitude: 79.9745,
    opening_hours: {
      monday: 'Open 24 hours',
      tuesday: 'Open 24 hours',
      wednesday: 'Open 24 hours',
      thursday: 'Open 24 hours',
      friday: 'Open 24 hours',
      saturday: 'Open 24 hours',
      sunday: 'Open 24 hours'
    },
    phone: '+94 11 241 6789',
    website: '',
    accessibility_features: ['Wheelchair accessible entrance', 'Accessible parking', 'Elevator access', 'Accessible restrooms', 'Ramps', 'Accessible examination rooms'],
    verified: true,
    images: []
  },
  {
    name: 'Malabe Buddhist Temple',
    category: 'temple',
    description: 'Historic Buddhist temple serving the local community with daily worship and ceremonies.',
    address: 'Temple Road, Malabe, Sri Lanka',
    latitude: 6.9040,
    longitude: 79.9700,
    opening_hours: {
      monday: '6:00 AM - 7:00 PM',
      tuesday: '6:00 AM - 7:00 PM',
      wednesday: '6:00 AM - 7:00 PM',
      thursday: '6:00 AM - 7:00 PM',
      friday: '6:00 AM - 7:00 PM',
      saturday: '6:00 AM - 7:00 PM',
      sunday: '6:00 AM - 7:00 PM'
    },
    phone: '+94 11 241 8901',
    website: '',
    accessibility_features: ['Ramps available', 'Accessible parking', 'Ground level access to main shrine'],
    verified: true,
    images: []
  },
  {
    name: 'Commercial Bank - Malabe Branch',
    category: 'government',
    description: 'Full-service bank branch with ATM facilities and customer service.',
    address: 'New Kandy Road, Malabe, Sri Lanka',
    latitude: 6.9110,
    longitude: 79.9735,
    opening_hours: {
      monday: '9:00 AM - 3:00 PM',
      tuesday: '9:00 AM - 3:00 PM',
      wednesday: '9:00 AM - 3:00 PM',
      thursday: '9:00 AM - 3:00 PM',
      friday: '9:00 AM - 3:00 PM',
      saturday: 'Closed',
      sunday: 'Closed'
    },
    phone: '+94 11 241 9012',
    website: 'https://www.combank.lk',
    accessibility_features: ['Wheelchair accessible entrance', 'Accessible parking', 'Ramps', 'Accessible ATM', 'Accessible counters'],
    verified: true,
    images: []
  }
]

async function populateMalabePlaces() {
  try {
    console.log('Starting to populate Malabe places data...')
    
    // Check if using service role key
    if (supabaseServiceKey) {
      console.log('✓ Using service role key (bypasses RLS)')
    } else if (userEmail && userPassword) {
      // Authenticate with provided credentials
      console.log(`Authenticating as ${userEmail}...`)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword
      })
      
      if (authError) {
        console.error('Authentication failed:', authError.message)
        console.log('\n💡 Options to fix this:')
        console.log('1. Add SUPABASE_SERVICE_ROLE_KEY to your .env file (recommended)')
        console.log('2. Run: node populate-malabe-places.js your-email@example.com your-password')
        console.log('3. Update RLS policies in Supabase to allow anon inserts (not recommended)')
        return
      }
      
      console.log('✓ Authenticated successfully')
    } else {
      console.error('❌ Authentication required!')
      console.log('\nThis script needs authentication to insert data due to Row Level Security policies.')
      console.log('\n💡 Options:')
      console.log('1. Add SUPABASE_SERVICE_ROLE_KEY to your .env file (recommended)')
      console.log('   Get it from: Supabase Dashboard > Settings > API > service_role key')
      console.log('\n2. Run with your account credentials:')
      console.log('   node populate-malabe-places.js your-email@example.com your-password')
      console.log('\n3. Temporarily disable RLS on places table (not recommended for production)')
      return
    }
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    
    if (!userId && !supabaseServiceKey) {
      console.error('Could not get user ID')
      return
    }
    
    console.log(`Using user ID: ${userId || 'service_role'}`)
    
    // Step 1: Ensure categories exist
    console.log('\nStep 1: Checking and inserting categories...')
    const categories = [
      { name: 'education', icon: 'school', color: '#3F51B5' },
      { name: 'shopping', icon: 'shopping', color: '#FF9800' },
      { name: 'parks', icon: 'tree', color: '#4CAF50' },
      { name: 'restaurants', icon: 'silverware-fork-knife', color: '#FF5722' },
      { name: 'healthcare', icon: 'hospital-box', color: '#F44336' },
      { name: 'temple', icon: 'church', color: '#795548' },
      { name: 'government', icon: 'city', color: '#607D8B' },
      { name: 'hotels', icon: 'bed', color: '#2196F3' },
      { name: 'transport', icon: 'bus', color: '#607D8B' },
      { name: 'entertainment', icon: 'movie', color: '#E91E63' }
    ]
    
    for (const category of categories) {
      // Check if category exists
      const { data: existing, error: checkError } = await supabase
        .from('categories')
        .select('name')
        .eq('name', category.name)
        .single()
      
      if (!existing) {
        // Insert category if it doesn't exist
        const { error: insertError } = await supabase
          .from('categories')
          .insert([category])
        
        if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
          console.log(`  ⚠️  Could not insert category '${category.name}': ${insertError.message}`)
        } else if (!insertError) {
          console.log(`  ✓ Added category: ${category.name}`)
        }
      } else {
        console.log(`  ✓ Category exists: ${category.name}`)
      }
    }
    
    console.log('\nStep 2: Inserting places...')
    
    // Add created_by to each place
    const placesWithCreator = malabePlaces.map(place => ({
      ...place,
      created_by: userId || 'd33bc607-2d36-4362-9337-cd4f812c3bea' // fallback ID for service role
    }))
    
    // Insert places
    const { data, error } = await supabase
      .from('places')
      .insert(placesWithCreator)
      .select()
    
    if (error) {
      console.error('❌ Error inserting places:', error)
      
      if (error.code === '23503') {
        console.log('\n💡 This is a foreign key error. Missing categories in database.')
        console.log('The script should have created them automatically. Try running again.')
      } else {
        console.log('\n💡 Troubleshooting:')
        console.log('1. Check if the places table exists')
        console.log('2. Verify RLS policies allow inserts')
        console.log('3. Ensure created_by user ID exists in users table')
        console.log('4. Try using service role key in .env')
      }
      return
    }
    
    console.log(`\n✅ Successfully added ${data.length} places to the database!`)
    console.log('\nPlaces added:')
    data.forEach((place, index) => {
      console.log(`  ${index + 1}. ${place.name} (${place.category})`)
    })
    
    console.log('\n🎉 Database population complete!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
populateMalabePlaces()
