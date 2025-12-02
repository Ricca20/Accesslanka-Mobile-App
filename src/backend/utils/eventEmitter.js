/**
 * Event Emitter for Database Events
 * Manages callbacks for contribution and helpful vote updates
 */

class EventEmitter {
  constructor() {
    this.listeners = new Map()
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName).add(callback)
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function to remove
   */
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(callback)
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - Name of the event
   * @param {*} data - Data to pass to callbacks
   */
  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => {
        if (typeof callback === 'function') {
          try {
            callback(data)
          } catch (error) {
            console.error(`Error in event listener for ${eventName}:`, error)
          }
        }
      })
    }
  }

  /**
   * Clear all listeners for an event
   * @param {string} eventName - Name of the event
   */
  clear(eventName) {
    if (eventName) {
      this.listeners.delete(eventName)
    } else {
      this.listeners.clear()
    }
  }
}

export const databaseEvents = new EventEmitter()

// Event names
export const EVENT_NAMES = {
  CONTRIBUTION_UPDATED: 'contribution:updated',
  HELPFUL_VOTE_UPDATED: 'helpful_vote:updated',
}
