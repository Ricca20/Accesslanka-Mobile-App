import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kcweuoztirpgetzniidv.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjd2V1b3p0aXJwZ2V0em5paWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjMxNDksImV4cCI6MjA3MjczOTE0OX0.Gvz9gt5XblRou4K3raexLJNq320wspP2WWZTZtbP-zc'

// Log configuration for debugging
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable URL session detection for deep linking
  },
  global: {
    headers: {
      'X-Client-Info': 'accesslanka-mobile-app',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
