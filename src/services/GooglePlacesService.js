import Constants from 'expo-constants'

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

/**
 * Google Places API Service
 * Provides real-world place search functionality
 */
export class GooglePlacesService {
  /**
   * Search for places using Google Places Autocomplete API
   * @param {string} input - Search query
   * @param {Object} location - User's current location {latitude, longitude}
   * @param {number} radius - Search radius in meters (default: 50000 = 50km)
   * @returns {Array} Array of place predictions
   */
  static async searchPlaces(input, location = null, radius = 50000) {
    if (!input || input.trim().length < 2) {
      return []
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured')
      return []
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`
      
      // Add location bias if available
      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=${radius}`
      }
      
      // Prioritize Sri Lankan results
      url += '&components=country:lk'

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.predictions) {
        return data.predictions.map(prediction => ({
          placeId: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          address: prediction.description,
          type: 'google_place',
        }))
      }

      return []
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  /**
   * Get detailed information about a place using Place Details API
   * @param {string} placeId - Google Place ID
   * @returns {Object} Detailed place information
   */
  static async getPlaceDetails(placeId) {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured')
      return null
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,types,photos,rating,formatted_phone_number,website,wheelchair_accessible_entrance&key=${GOOGLE_MAPS_API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.result) {
        const place = data.result
        
        // Validate required fields
        if (!place.name || !place.geometry?.location) {
          console.warn('Place missing required fields:', place)
          return null
        }
        
        return {
          placeId: placeId,
          name: place.name,
          address: place.formatted_address || 'Address not available',
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          category: this.getCategoryFromTypes(place.types),
          phone: place.formatted_phone_number || '',
          website: place.website || '',
          rating: place.rating || 0,
          wheelchairAccessible: place.wheelchair_accessible_entrance || false,
          photos: place.photos || [],
          types: place.types || [],
          type: 'google_place',
        }
      }

      return null
    } catch (error) {
      console.error('Error getting place details:', error)
      return null
    }
  }

  /**
   * Search for nearby places around a location
   * @param {Object} location - {latitude, longitude}
   * @param {number} radius - Search radius in meters (default: 5000 = 5km)
   * @param {string} type - Place type filter (optional)
   * @returns {Array} Array of nearby places
   */
  static async searchNearby(location, radius = 5000, type = null) {
    if (!location || !GOOGLE_MAPS_API_KEY) {
      return []
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`
      
      if (type) {
        url += `&type=${type}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.results) {
        return data.results.map(place => ({
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          category: this.getCategoryFromTypes(place.types),
          rating: place.rating || 0,
          types: place.types || [],
          type: 'google_place',
        }))
      }

      return []
    } catch (error) {
      console.error('Error searching nearby places:', error)
      return []
    }
  }

  /**
   * Map Google Place types to our app categories
   * @param {Array} types - Google Place types
   * @returns {string} Mapped category
   */
  static getCategoryFromTypes(types = []) {
    const typeMapping = {
      museum: 'museum',
      park: 'park',
      monument: 'monument',
      restaurant: 'restaurants',
      cafe: 'restaurants',
      food: 'restaurants',
      hotel: 'hotels',
      lodging: 'hotels',
      place_of_worship: 'temple',
      hindu_temple: 'temple',
      church: 'temple',
      mosque: 'temple',
      shopping_mall: 'shopping',
      store: 'shopping',
      department_store: 'shopping',
    }

    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type]
      }
    }

    return 'other'
  }
}
