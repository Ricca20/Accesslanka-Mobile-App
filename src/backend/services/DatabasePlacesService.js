import { DatabaseService } from '../../lib/database'

/**
 * Database Places Service
 * Provides place search functionality using local database
 * Replaces Google Places API integration
 */
export class DatabasePlacesService {
  /**
   * Search for places in the database
   * @param {string} input - Search query
   * @param {Object} location - User's current location {latitude, longitude} (optional)
   * @param {number} radius - Search radius in meters (optional, for future use)
   * @returns {Array} Array of place predictions
   */
  static async searchPlaces(input, location = null, radius = 50000) {
    if (!input || input.trim().length < 2) {
      return []
    }

    try {
      const query = input.toLowerCase().trim()
      
      // Fetch all places and businesses from database
      const [places, businesses] = await Promise.all([
        DatabaseService.getPlaces({ verified: true }),
        DatabaseService.getBusinesses({ verified: true })
      ])

      // Combine and normalize data
      const allPlaces = [
        ...places.map(p => ({
          id: p.id,
          placeId: p.id,
          name: p.name,
          address: p.address,
          category: p.category,
          description: p.description,
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          features: p.accessibility_features || [],
          images: p.images || [],
          phone: p.phone || '',
          website: p.website || '',
          openingHours: p.opening_hours || {},
          type: 'database_place',
          verified: p.verified,
        })),
        ...businesses.map(b => ({
          id: b.id,
          placeId: b.id,
          name: b.name,
          address: b.address,
          category: b.category,
          description: b.description,
          latitude: parseFloat(b.latitude),
          longitude: parseFloat(b.longitude),
          features: b.accessibility_features || [],
          images: b.images || [],
          phone: b.phone || '',
          website: b.website || '',
          openingHours: b.opening_hours || {},
          type: 'database_business',
          verified: b.verified,
        }))
      ]

      // Filter by search query
      const filteredPlaces = allPlaces.filter(place => 
        place.name.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query) ||
        place.description?.toLowerCase().includes(query) ||
        place.category?.toLowerCase().includes(query) ||
        place.features?.some(feature => feature.toLowerCase().includes(query))
      )

      // If location is provided, sort by distance
      if (location) {
        filteredPlaces.forEach(place => {
          place.distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            place.latitude,
            place.longitude
          )
        })
        filteredPlaces.sort((a, b) => a.distance - b.distance)
      }

      return filteredPlaces.slice(0, 20) // Return top 20 results
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  /**
   * Get detailed information about a place from database
   * @param {string} placeId - Database place ID
   * @returns {Object} Detailed place information
   */
  static async getPlaceDetails(placeId) {
    try {
      // Try to get from places table first
      const place = await DatabaseService.getPlace(placeId)
      
      if (place) {
        return {
          placeId: place.id,
          name: place.name,
          address: place.address,
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude),
          category: place.category,
          description: place.description,
          phone: place.phone || '',
          website: place.website || '',
          openingHours: place.opening_hours || {},
          rating: 0, // Calculate from reviews if needed
          wheelchairAccessible: place.accessibility_features?.includes('Wheelchair accessible entrance') || false,
          photos: place.images || [],
          features: place.accessibility_features || [],
          type: 'database_place',
          verified: place.verified,
        }
      }

      // Try businesses table
      const business = await DatabaseService.getBusiness(placeId)
      
      if (business) {
        return {
          placeId: business.id,
          name: business.name,
          address: business.address,
          latitude: parseFloat(business.latitude),
          longitude: parseFloat(business.longitude),
          category: business.category,
          description: business.description,
          phone: business.phone || '',
          website: business.website || '',
          openingHours: business.opening_hours || {},
          rating: 0, // Calculate from reviews if needed
          wheelchairAccessible: business.accessibility_features?.includes('Wheelchair accessible entrance') || false,
          photos: business.images || [],
          features: business.accessibility_features || [],
          type: 'database_business',
          verified: business.verified,
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
   * @param {string} category - Place category filter (optional)
   * @returns {Array} Array of nearby places
   */
  static async searchNearby(location, radius = 5000, category = null) {
    if (!location) {
      return []
    }

    try {
      // Fetch all places and businesses
      const [places, businesses] = await Promise.all([
        category 
          ? DatabaseService.getPlaces({ verified: true, category })
          : DatabaseService.getPlaces({ verified: true }),
        category 
          ? DatabaseService.getBusinesses({ verified: true, category })
          : DatabaseService.getBusinesses({ verified: true })
      ])

      // Combine and normalize data
      const allPlaces = [
        ...places.map(p => ({
          id: p.id,
          placeId: p.id,
          name: p.name,
          address: p.address,
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          category: p.category,
          description: p.description,
          features: p.accessibility_features || [],
          images: p.images || [],
          phone: p.phone || '',
          website: p.website || '',
          openingHours: p.opening_hours || {},
          rating: 0,
          type: 'database_place',
          verified: p.verified,
        })),
        ...businesses.map(b => ({
          id: b.id,
          placeId: b.id,
          name: b.name,
          address: b.address,
          latitude: parseFloat(b.latitude),
          longitude: parseFloat(b.longitude),
          category: b.category,
          description: b.description,
          features: b.accessibility_features || [],
          images: b.images || [],
          phone: b.phone || '',
          website: b.website || '',
          openingHours: b.opening_hours || {},
          rating: 0,
          type: 'database_business',
          verified: b.verified,
        }))
      ]

      // Calculate distance for each place
      const placesWithDistance = allPlaces.map(place => ({
        ...place,
        distance: this.calculateDistance(
          location.latitude,
          location.longitude,
          place.latitude,
          place.longitude
        )
      }))

      // Filter by radius and sort by distance
      const nearbyPlaces = placesWithDistance
        .filter(place => place.distance <= radius)
        .sort((a, b) => a.distance - b.distance)

      return nearbyPlaces
    } catch (error) {
      console.error('Error searching nearby places:', error)
      return []
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in meters
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  /**
   * Get all places by category
   * @param {string} category - Category name
   * @returns {Array} Array of places in the category
   */
  static async getPlacesByCategory(category) {
    try {
      const [places, businesses] = await Promise.all([
        DatabaseService.getPlaces({ verified: true, category }),
        DatabaseService.getBusinesses({ verified: true, category })
      ])

      return [
        ...places.map(p => ({
          id: p.id,
          placeId: p.id,
          name: p.name,
          address: p.address,
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          category: p.category,
          type: 'database_place',
        })),
        ...businesses.map(b => ({
          id: b.id,
          placeId: b.id,
          name: b.name,
          address: b.address,
          latitude: parseFloat(b.latitude),
          longitude: parseFloat(b.longitude),
          category: b.category,
          type: 'database_business',
        }))
      ]
    } catch (error) {
      console.error('Error getting places by category:', error)
      return []
    }
  }

  /**
   * Map category keys to display names
   * @param {string} category - Category key
   * @returns {string} Category display name
   */
  static getCategoryDisplayName(category) {
    const categoryMap = {
      restaurants: 'Restaurants & Cafes',
      hotels: 'Hotels & Accommodations',
      museums: 'Museums',
      parks: 'Parks & Recreation',
      shopping: 'Shopping',
      transport: 'Transportation',
      healthcare: 'Healthcare',
      education: 'Education',
      entertainment: 'Entertainment',
      government: 'Government Services',
      temple: 'Religious Sites',
    }

    return categoryMap[category] || category
  }
}
