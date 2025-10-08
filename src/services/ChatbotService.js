import { DatabaseService } from '../lib/database'
import { supabase } from '../lib/supabase'

/**
 * ChatbotService
 * Processes natural language queries and retrieves relevant place information
 */
export class ChatbotService {
  /**
   * Process user message and generate appropriate response
   * @param {string} message - User's message
   * @param {Object} userLocation - User's current location {latitude, longitude}
   * @returns {Object} Response with message and places data
   */
  static async processMessage(message, userLocation = null) {
    const query = message.toLowerCase().trim()
    
    // Analyze query intent and extract keywords
    const intent = this.analyzeIntent(query)
    
    try {
      let response = {
        message: '',
        places: [],
        suggestions: []
      }

      switch (intent.type) {
        case 'nearest':
          response = await this.handleNearestQuery(intent, userLocation)
          break
        
        case 'accessibility':
          response = await this.handleAccessibilityQuery(intent, userLocation)
          break
        
        case 'category':
          response = await this.handleCategoryQuery(intent, userLocation)
          break
        
        case 'specific_place':
          response = await this.handleSpecificPlaceQuery(intent, userLocation)
          break
        
        case 'recommendation':
          response = await this.handleRecommendationQuery(intent, userLocation)
          break
        
        case 'features':
          response = await this.handleFeaturesQuery(intent, userLocation)
          break
        
        case 'greeting':
          response = this.handleGreeting()
          break
        
        case 'help':
          response = this.handleHelp()
          break
        
        default:
          response = await this.handleGeneralQuery(query, userLocation)
      }

      return response
    } catch (error) {
      console.error('Error processing message:', error)
      return {
        message: "I'm sorry, I encountered an error while processing your request. Please try again.",
        places: [],
        suggestions: this.getDefaultSuggestions()
      }
    }
  }

  /**
   * Analyze user query to determine intent
   */
  static analyzeIntent(query) {
    const intent = {
      type: 'general',
      category: null,
      accessibilityFeatures: [],
      placeName: null,
      keywords: []
    }

    // Greeting patterns
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i.test(query)) {
      intent.type = 'greeting'
      return intent
    }

    // Help patterns
    if (/help|what can you|how do|guide|assist/i.test(query)) {
      intent.type = 'help'
      return intent
    }

    // Nearest/nearby patterns
    if (/nearest|nearby|close|near me|around me|closest/i.test(query)) {
      intent.type = 'nearest'
    }

    // Accessibility patterns
    if (/wheelchair|ramp|accessible|accessibility|disabled|mobility|visual|hearing|braille|sign language/i.test(query)) {
      intent.type = 'accessibility'
      
      // Extract specific accessibility features
      if (/wheelchair/i.test(query)) intent.accessibilityFeatures.push('wheelchair_accessible')
      if (/ramp/i.test(query)) intent.accessibilityFeatures.push('ramp')
      if (/elevator|lift/i.test(query)) intent.accessibilityFeatures.push('elevator')
      if (/braille/i.test(query)) intent.accessibilityFeatures.push('braille_signage')
      if (/audio|visual|hearing/i.test(query)) intent.accessibilityFeatures.push('audio_assistance')
      if (/parking/i.test(query)) intent.accessibilityFeatures.push('accessible_parking')
    }

    // Recommendation patterns
    if (/suggest|recommend|good|best|top|popular/i.test(query)) {
      intent.type = 'recommendation'
    }

    // Feature-based patterns
    if (/with|has|have|features|facilities/i.test(query)) {
      intent.type = 'features'
    }

    // Category detection
    const categories = {
      restaurant: ['restaurant', 'food', 'eat', 'dining', 'cafe', 'coffee'],
      hotel: ['hotel', 'accommodation', 'stay', 'lodge', 'resort'],
      park: ['park', 'garden', 'outdoor', 'nature'],
      museum: ['museum', 'gallery', 'exhibition', 'art'],
      shopping: ['shop', 'mall', 'store', 'market', 'shopping'],
      transport: ['transport', 'bus', 'train', 'station', 'taxi'],
      healthcare: ['hospital', 'clinic', 'medical', 'doctor', 'pharmacy'],
      entertainment: ['cinema', 'theater', 'movie', 'entertainment', 'fun'],
      education: ['school', 'university', 'college', 'education'],
      government: ['government', 'office', 'public', 'municipal']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        intent.category = category + 's' // Add 's' for plural form matching DB
        if (intent.type === 'general') intent.type = 'category'
        break
      }
    }

    // Extract potential place name (words in quotes or after "does/is")
    const quoteMatch = query.match(/"([^"]+)"|'([^']+)'/)
    if (quoteMatch) {
      intent.placeName = quoteMatch[1] || quoteMatch[2]
      intent.type = 'specific_place'
    } else {
      const doesMatch = query.match(/does\s+([^?]+?)\s+(have|has|provide)/i)
      const isMatch = query.match(/is\s+([^?]+?)\s+(accessible|wheelchair)/i)
      if (doesMatch) {
        intent.placeName = doesMatch[1].trim()
        intent.type = 'specific_place'
      } else if (isMatch) {
        intent.placeName = isMatch[1].trim()
        intent.type = 'specific_place'
      }
    }

    // Extract keywords
    intent.keywords = query.split(' ').filter(word => word.length > 3)

    return intent
  }

  /**
   * Handle nearest/nearby queries
   */
  static async handleNearestQuery(intent, userLocation) {
    if (!userLocation) {
      return {
        message: "To find places near you, I need your location. Please enable location services.",
        places: [],
        suggestions: ['Show me restaurants', 'Find hotels with accessibility']
      }
    }

    const category = intent.category
    let places = []
    let categoryName = category ? category.replace('s', '') : 'place'

    // Fetch places from database
    const [dbPlaces, businesses] = await Promise.all([
      DatabaseService.getPlaces({}),
      DatabaseService.getBusinesses({})
    ])

    // Combine and filter
    places = [
      ...dbPlaces.map(p => this.normalizePlaceData(p, 'place')),
      ...businesses.map(b => this.normalizePlaceData(b, 'business'))
    ]

    // Filter by category if specified
    if (category) {
      places = places.filter(p => p.category === category)
    }

    // Calculate distances and sort
    places = places.map(place => ({
      ...place,
      distance: this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      )
    })).sort((a, b) => a.distance - b.distance)

    const nearest = places.slice(0, 5)

    return {
      message: nearest.length > 0
        ? `I found ${nearest.length} ${categoryName}${nearest.length > 1 ? 's' : ''} near you:`
        : `I couldn't find any ${categoryName}s near your location.`,
      places: nearest,
      suggestions: [
        'Show me hotels nearby',
        'Find accessible restaurants',
        'What parks are close?'
      ]
    }
  }

  /**
   * Handle accessibility-specific queries
   */
  static async handleAccessibilityQuery(intent, userLocation) {
    const [dbPlaces, businesses] = await Promise.all([
      DatabaseService.getPlaces({}),
      DatabaseService.getBusinesses({})
    ])

    let places = [
      ...dbPlaces.map(p => this.normalizePlaceData(p, 'place')),
      ...businesses.map(b => this.normalizePlaceData(b, 'business'))
    ]

    // Filter by category if specified
    if (intent.category) {
      places = places.filter(p => p.category === intent.category)
    }

    // Filter by accessibility features
    if (intent.accessibilityFeatures.length > 0) {
      places = places.filter(place => 
        intent.accessibilityFeatures.some(feature => 
          place.features.includes(feature)
        )
      )
    } else {
      // If no specific feature, show places with any accessibility features
      places = places.filter(place => place.features.length > 0)
    }

    // Sort by distance if location available
    if (userLocation) {
      places = places.map(place => ({
        ...place,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          place.latitude,
          place.longitude
        )
      })).sort((a, b) => a.distance - b.distance)
    }

    const results = places.slice(0, 5)
    const featureText = intent.accessibilityFeatures.length > 0
      ? intent.accessibilityFeatures.join(', ').replace(/_/g, ' ')
      : 'accessibility features'

    return {
      message: results.length > 0
        ? `I found ${results.length} places with ${featureText}:`
        : `I couldn't find places matching your accessibility requirements.`,
      places: results,
      suggestions: [
        'Hotels with wheelchair access',
        'Restaurants with ramps',
        'Parks with accessible parking'
      ]
    }
  }

  /**
   * Handle category-based queries
   */
  static async handleCategoryQuery(intent, userLocation) {
    const category = intent.category
    const [dbPlaces, businesses] = await Promise.all([
      DatabaseService.getPlaces({ category }),
      DatabaseService.getBusinesses({ category })
    ])

    let places = [
      ...dbPlaces.map(p => this.normalizePlaceData(p, 'place')),
      ...businesses.map(b => this.normalizePlaceData(b, 'business'))
    ]

    // Sort by distance if location available
    if (userLocation) {
      places = places.map(place => ({
        ...place,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          place.latitude,
          place.longitude
        )
      })).sort((a, b) => a.distance - b.distance)
    }

    const results = places.slice(0, 5)

    return {
      message: results.length > 0
        ? `Here are ${results.length} ${category}:`
        : `I couldn't find any ${category} in the database.`,
      places: results,
      suggestions: [
        'Show wheelchair accessible options',
        'Find nearby alternatives',
        'What features do they have?'
      ]
    }
  }

  /**
   * Handle specific place queries
   */
  static async handleSpecificPlaceQuery(intent, userLocation) {
    const placeName = intent.placeName
    
    if (!placeName) {
      return this.handleGeneralQuery('', userLocation)
    }

    // Search for the place by name
    const [dbPlaces, businesses] = await Promise.all([
      DatabaseService.getPlaces({}),
      DatabaseService.getBusinesses({})
    ])

    let places = [
      ...dbPlaces.map(p => this.normalizePlaceData(p, 'place')),
      ...businesses.map(b => this.normalizePlaceData(b, 'business'))
    ]

    // Find matching places
    places = places.filter(p => 
      p.name.toLowerCase().includes(placeName.toLowerCase())
    )

    if (places.length === 0) {
      return {
        message: `I couldn't find "${placeName}" in our database. Try searching for similar places.`,
        places: [],
        suggestions: [
          'Show me all restaurants',
          'Find accessible hotels',
          'What parks are available?'
        ]
      }
    }

    const place = places[0]
    const hasAccessibility = place.features.length > 0
    const features = hasAccessibility 
      ? place.features.map(f => f.replace(/_/g, ' ')).join(', ')
      : 'No specific accessibility features listed'

    let message = `I found "${place.name}". `
    if (intent.accessibilityFeatures.length > 0) {
      const hasFeature = intent.accessibilityFeatures.some(f => place.features.includes(f))
      const featureName = intent.accessibilityFeatures[0].replace(/_/g, ' ')
      message += hasFeature
        ? `Yes, it has ${featureName}.`
        : `Unfortunately, it doesn't have ${featureName} listed.`
    } else {
      message += `Accessibility features: ${features}`
    }

    return {
      message,
      places: [place],
      suggestions: [
        'Show me similar places',
        'Find alternatives nearby',
        'What are the reviews?'
      ]
    }
  }

  /**
   * Handle recommendation queries
   */
  static async handleRecommendationQuery(intent, userLocation) {
    const [dbPlaces, businesses] = await Promise.all([
      DatabaseService.getPlaces({}),
      DatabaseService.getBusinesses({})
    ])

    let places = [
      ...dbPlaces.map(p => this.normalizePlaceData(p, 'place')),
      ...businesses.map(b => this.normalizePlaceData(b, 'business'))
    ]

    // Filter by category if specified
    if (intent.category) {
      places = places.filter(p => p.category === intent.category)
    }

    // Filter for places with accessibility features if mentioned
    if (intent.accessibilityFeatures.length > 0) {
      places = places.filter(place => 
        intent.accessibilityFeatures.some(feature => 
          place.features.includes(feature)
        )
      )
    }

    // Prioritize verified places
    places.sort((a, b) => {
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1
      return 0
    })

    // Sort by distance if location available
    if (userLocation) {
      places = places.map(place => ({
        ...place,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          place.latitude,
          place.longitude
        )
      })).sort((a, b) => a.distance - b.distance)
    }

    const results = places.slice(0, 5)
    const categoryText = intent.category ? intent.category.replace('s', '') : 'place'
    const featureText = intent.accessibilityFeatures.length > 0
      ? ' with accessibility features'
      : ''

    return {
      message: results.length > 0
        ? `Here are my top recommendations for ${categoryText}s${featureText}:`
        : `I couldn't find suitable ${categoryText}s to recommend.`,
      places: results,
      suggestions: [
        'Show me more options',
        'Filter by wheelchair access',
        'Find alternatives nearby'
      ]
    }
  }

  /**
   * Handle feature-based queries
   */
  static async handleFeaturesQuery(intent, userLocation) {
    return this.handleAccessibilityQuery(intent, userLocation)
  }

  /**
   * Handle greeting
   */
  static handleGreeting() {
    return {
      message: "Hello! I'm your AccessLanka assistant. I can help you find accessible places, restaurants, hotels, and more. What would you like to know?",
      places: [],
      suggestions: this.getDefaultSuggestions()
    }
  }

  /**
   * Handle help requests
   */
  static handleHelp() {
    return {
      message: `I can help you with:

• Finding nearest places (restaurants, hotels, parks, etc.)
• Checking accessibility features of specific places
• Recommending places with accessibility features
• Searching for places by category

Try asking me questions like:
"What's the nearest restaurant?"
"Does [place name] have wheelchair access?"
"Show me hotels with accessibility features"`,
      places: [],
      suggestions: this.getDefaultSuggestions()
    }
  }

  /**
   * Handle general queries
   */
  static async handleGeneralQuery(query, userLocation) {
    // Try to search across all fields
    const [dbPlaces, businesses] = await Promise.all([
      DatabaseService.getPlaces({}),
      DatabaseService.getBusinesses({})
    ])

    let places = [
      ...dbPlaces.map(p => this.normalizePlaceData(p, 'place')),
      ...businesses.map(b => this.normalizePlaceData(b, 'business'))
    ]

    if (query) {
      places = places.filter(place => 
        place.name.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query) ||
        place.description?.toLowerCase().includes(query) ||
        place.category?.toLowerCase().includes(query)
      )
    }

    if (userLocation && places.length > 0) {
      places = places.map(place => ({
        ...place,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          place.latitude,
          place.longitude
        )
      })).sort((a, b) => a.distance - b.distance)
    }

    const results = places.slice(0, 5)

    return {
      message: results.length > 0
        ? `I found ${results.length} places matching your search:`
        : "I couldn't find what you're looking for. Try asking about specific categories like restaurants, hotels, or parks.",
      places: results,
      suggestions: this.getDefaultSuggestions()
    }
  }

  /**
   * Get default suggestions
   */
  static getDefaultSuggestions() {
    return [
      "What's the nearest restaurant?",
      "Show me hotels with wheelchair access",
      "Find accessible parks nearby",
      "Suggest good museums"
    ]
  }

  /**
   * Normalize place data from database
   */
  static normalizePlaceData(place, type) {
    return {
      id: place.id,
      name: place.name,
      address: place.address,
      category: place.category,
      description: place.description || '',
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude),
      features: place.accessibility_features || [],
      images: place.images || [],
      phone: place.phone || '',
      website: place.website || '',
      openingHours: place.opening_hours || {},
      verified: place.verified || false,
      type
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters for better accuracy
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180 // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }
}
