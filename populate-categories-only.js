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

async function insertCategories() {
  try {
    console.log('🚀 Starting categories insertion...')

    // Insert categories
    const categories = [
      { name: 'restaurants', icon: 'silverware-fork-knife', color: '#FF5722' },
      { name: 'hotels', icon: 'bed', color: '#2196F3' },
      { name: 'museums', icon: 'bank', color: '#9C27B0' },
      { name: 'parks', icon: 'tree', color: '#4CAF50' },
      { name: 'shopping', icon: 'shopping', color: '#FF9800' },
      { name: 'transport', icon: 'bus', color: '#607D8B' },
      { name: 'healthcare', icon: 'hospital-box', color: '#F44336' },
      { name: 'education', icon: 'school', color: '#3F51B5' },
      { name: 'entertainment', icon: 'movie', color: '#E91E63' },
      { name: 'government', icon: 'city', color: '#795548' }
    ]

    console.log('📝 Inserting categories...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'name' })

    if (categoriesError) {
      console.error('❌ Error inserting categories:', categoriesError)
      throw categoriesError
    }

    console.log('✅ Categories inserted successfully!')
    return { success: true, message: 'Categories inserted successfully' }

  } catch (error) {
    console.error('❌ Error inserting categories:', error)
    return { success: false, error: error.message }
  }
}

async function main() {
  try {
    const result = await insertCategories()
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