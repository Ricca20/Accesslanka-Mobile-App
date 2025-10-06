#!/usr/bin/env node

// Simple sample data population script for AccessLanka
// This script only populates non-user data

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
  ]
}

async function populateBasicData() {
  console.log('🚀 Starting basic data population...')

  try {
    // Insert categories
    console.log('📝 Inserting categories...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(sampleData.categories, { onConflict: 'name' })
    
    if (categoriesError) throw categoriesError
    console.log('✅ Categories inserted successfully')

    console.log('🎉 Basic data population completed!')
    console.log('💡 Now you can use the in-app "Add Sample Data" button to add reviews')
    console.log('📱 Go to Profile → Database Test → Insert Sample Review Data')
    
  } catch (error) {
    console.error('❌ Error populating database:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  populateBasicData()
}

module.exports = { populateBasicData }