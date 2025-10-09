/**
 * AccessibilityService
 * 
 * Provides centralized accessibility utilities for voice-over support
 * to help blind and visually impaired users navigate the app.
 */

import { AccessibilityInfo, Platform, findNodeHandle } from 'react-native';

class AccessibilityService {
  /**
   * Announces a message to screen readers
   * @param {string} message - The message to announce
   * @param {number} delay - Optional delay in ms before announcing
   */
  static announce(message, delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(message);
      }, delay);
    } else {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  /**
   * Announces a message for screen readers with options
   * @param {string} message - The message to announce
   * @param {Object} options - Options object
   * @param {number} options.delay - Delay before announcing
   * @param {boolean} options.queue - Whether to queue the announcement
   */
  static announceWithOptions(message, options = {}) {
    const { delay = 0, queue = false } = options;
    
    if (queue) {
      // For queued announcements, use a small delay
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(message);
      }, delay || 100);
    } else {
      this.announce(message, delay);
    }
  }

  /**
   * Checks if screen reader is currently enabled
   * @returns {Promise<boolean>} True if screen reader is enabled
   */
  static async isScreenReaderEnabled() {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.error('Error checking screen reader status:', error);
      return false;
    }
  }

  /**
   * Sets accessibility focus to a specific component
   * @param {Object} reactNode - The React component ref
   */
  static setAccessibilityFocus(reactNode) {
    if (reactNode && reactNode.current) {
      const node = findNodeHandle(reactNode.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  }

  /**
   * Generates accessibility label for navigation items
   * @param {string} label - The label text
   * @param {boolean} isActive - Whether the item is currently active
   * @returns {string} Formatted accessibility label
   */
  static navItemLabel(label, isActive = false) {
    return `${label}${isActive ? ', currently active' : ''}, tab`;
  }

  /**
   * Generates accessibility hint for buttons
   * @param {string} action - The action description
   * @returns {string} Formatted accessibility hint
   */
  static buttonHint(action) {
    return `Double tap to ${action}`;
  }

  /**
   * Generates accessibility label for input fields
   * @param {string} label - Field label
   * @param {boolean} required - Whether field is required
   * @param {string} currentValue - Current value
   * @returns {string} Formatted accessibility label
   */
  static inputLabel(label, required = false, currentValue = '') {
    let result = label;
    if (required) result += ', required';
    if (currentValue) result += `, current value: ${currentValue}`;
    return result;
  }

  /**
   * Generates accessibility label for lists
   * @param {string} itemName - Item name
   * @param {number} index - Item index
   * @param {number} total - Total items
   * @returns {string} Formatted accessibility label
   */
  static listItemLabel(itemName, index, total) {
    return `${itemName}, item ${index + 1} of ${total}`;
  }

  /**
   * Generates accessibility label for cards
   * @param {string} title - Card title
   * @param {string} description - Card description
   * @returns {string} Formatted accessibility label
   */
  static cardLabel(title, description = '') {
    return description ? `${title}. ${description}` : title;
  }

  /**
   * Generates accessibility label for star ratings
   * @param {number} rating - Rating value
   * @param {number} maxRating - Maximum rating
   * @returns {string} Formatted accessibility label
   */
  static ratingLabel(rating, maxRating = 5) {
    return `Rating: ${rating} out of ${maxRating} stars`;
  }

  /**
   * Generates accessibility label for map markers
   * @param {string} placeName - Name of the place
   * @param {string} category - Category of the place
   * @returns {string} Formatted accessibility label
   */
  static markerLabel(placeName, category = '') {
    return category ? `${placeName}, ${category}, map marker` : `${placeName}, map marker`;
  }

  /**
   * Generates accessibility hint for map markers
   * @returns {string} Formatted accessibility hint
   */
  static markerHint() {
    return 'Double tap to view place details';
  }

  /**
   * Generates accessibility label for images
   * @param {string} description - Image description
   * @param {boolean} decorative - Whether image is decorative
   * @returns {Object} Accessibility props for image
   */
  static imageProps(description, decorative = false) {
    if (decorative) {
      return {
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants',
      };
    }
    return {
      accessible: true,
      accessibilityLabel: description,
      accessibilityRole: 'image',
    };
  }

  /**
   * Generates accessibility props for loading states
   * @param {string} context - Context of what's loading
   * @returns {Object} Accessibility props
   */
  static loadingProps(context = 'content') {
    return {
      accessible: true,
      accessibilityLabel: `Loading ${context}`,
      accessibilityRole: 'progressbar',
      accessibilityLiveRegion: 'polite',
    };
  }

  /**
   * Generates accessibility props for error messages
   * @param {string} errorMessage - The error message
   * @returns {Object} Accessibility props
   */
  static errorProps(errorMessage) {
    return {
      accessible: true,
      accessibilityLabel: `Error: ${errorMessage}`,
      accessibilityRole: 'alert',
      accessibilityLiveRegion: 'assertive',
    };
  }

  /**
   * Generates accessibility props for search bars
   * @param {string} placeholder - Placeholder text
   * @param {string} currentValue - Current search value
   * @returns {Object} Accessibility props
   */
  static searchProps(placeholder, currentValue = '') {
    return {
      accessible: true,
      accessibilityLabel: currentValue ? `Search: ${currentValue}` : placeholder,
      accessibilityRole: 'search',
      accessibilityHint: 'Enter text to search',
    };
  }

  /**
   * Announces navigation changes
   * @param {string} screenName - Name of the screen navigated to
   */
  static announceNavigation(screenName) {
    this.announce(`Navigated to ${screenName}`, 500);
  }

  /**
   * Announces form errors
   * @param {string} fieldName - Name of the field with error
   * @param {string} errorMessage - The error message
   */
  static announceFormError(fieldName, errorMessage) {
    this.announce(`Error in ${fieldName}: ${errorMessage}`, 100);
  }

  /**
   * Announces success messages
   * @param {string} message - Success message
   */
  static announceSuccess(message) {
    this.announce(`Success: ${message}`, 100);
  }

  /**
   * Groups related elements for accessibility
   * @param {string} groupLabel - Label for the group
   * @returns {Object} Accessibility props
   */
  static groupProps(groupLabel) {
    return {
      accessible: true,
      accessibilityLabel: groupLabel,
      accessibilityRole: 'none',
    };
  }

  /**
   * Makes an element ignorable by screen readers
   * @returns {Object} Accessibility props
   */
  static ignoreProps() {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    };
  }
}

export default AccessibilityService;
