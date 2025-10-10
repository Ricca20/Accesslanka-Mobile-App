import { supabase } from '../lib/supabase'
import * as FileSystem from 'expo-file-system/legacy'

/**
 * StorageService - Handles all file uploads to Supabase Storage
 * 
 * Buckets used:
 * - avatars: User profile photos
 * - business-photos: Business listing images
 * - accessibility-photos: MapMission accessibility photos
 */
export class StorageService {
  // Supported image types
  static SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  static MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  /**
   * Upload a photo to Supabase Storage
   * @param {string} localUri - Local file URI from expo-image-picker
   * @param {string} bucket - Supabase storage bucket name
   * @param {string} path - Storage path (e.g., 'user-123/avatar.jpg')
   * @returns {Promise<{publicUrl: string, path: string}>}
   */
  static async uploadPhoto(localUri, bucket, path) {
    try {
      console.log(`[StorageService] Uploading to ${bucket}/${path}...`)

      // Validate URI
      if (!localUri || typeof localUri !== 'string') {
        throw new Error('Invalid local URI provided')
      }

      // Get file info using legacy API
      const fileInfo = await FileSystem.getInfoAsync(localUri)
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist at the provided URI')
      }

      // Check file size
      if (fileInfo.size > this.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
      }

      // Read file as base64 using legacy API
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Determine content type from URI extension
      const extension = localUri.split('.').pop().toLowerCase()
      let contentType = 'image/jpeg'
      if (extension === 'png') contentType = 'image/png'
      if (extension === 'webp') contentType = 'image/webp'

      // Convert base64 to ArrayBuffer for React Native
      const binaryString = atob(base64)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      console.log(`[StorageService] File prepared: ${bytes.length} bytes, type: ${contentType}`)

      // Upload to Supabase Storage
      // Use ArrayBuffer directly - Supabase JS client handles it properly
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, bytes.buffer, {
          contentType: contentType,
          upsert: false, // Don't overwrite existing files
        })

      if (error) {
        console.error('[StorageService] Upload error:', error)
        throw error
      }

      console.log('[StorageService] Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      console.log('[StorageService] Public URL:', publicUrl)

      return {
        publicUrl,
        path: data.path,
      }
    } catch (error) {
      console.error('[StorageService] Upload failed:', error)
      throw new Error(`Failed to upload photo: ${error.message}`)
    }
  }

  /**
   * Upload avatar photo
   * @param {string} localUri - Local file URI
   * @param {string} userId - User ID
   * @returns {Promise<{publicUrl: string, path: string}>}
   */
  static async uploadAvatar(localUri, userId) {
    const timestamp = Date.now()
    const extension = localUri.split('.').pop().toLowerCase()
    const filename = `avatar_${timestamp}.${extension}`
    const path = `${userId}/${filename}`

    return await this.uploadPhoto(localUri, 'avatars', path)
  }

  /**
   * Upload business photo
   * @param {string} localUri - Local file URI
   * @param {string} businessId - Business ID or temp identifier
   * @param {number} index - Photo index
   * @returns {Promise<{publicUrl: string, path: string}>}
   */
  static async uploadBusinessPhoto(localUri, businessId, index = 0) {
    const timestamp = Date.now()
    const extension = localUri.split('.').pop().toLowerCase()
    const filename = `photo_${index}_${timestamp}.${extension}`
    const path = `${businessId}/${filename}`

    return await this.uploadPhoto(localUri, 'business-photos', path)
  }

  /**
   * Upload accessibility photo
   * @param {string} localUri - Local file URI
   * @param {string} missionId - MapMission ID
   * @param {string} businessId - Business ID
   * @param {string} userId - User ID
   * @returns {Promise<{publicUrl: string, path: string}>}
   */
  static async uploadAccessibilityPhoto(localUri, missionId, businessId, userId) {
    const timestamp = Date.now()
    const extension = localUri.split('.').pop().toLowerCase()
    const filename = `${userId}_${timestamp}.${extension}`
    const path = `mission_${missionId}/business_${businessId}/${filename}`

    return await this.uploadPhoto(localUri, 'accessibility-photos', path)
  }

  /**
   * Delete a photo from storage
   * @param {string} bucket - Storage bucket name
   * @param {string} path - File path in storage
   * @returns {Promise<boolean>}
   */
  static async deletePhoto(bucket, path) {
    try {
      console.log(`[StorageService] Deleting ${bucket}/${path}...`)

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) {
        console.error('[StorageService] Delete error:', error)
        throw error
      }

      console.log('[StorageService] Delete successful')
      return true
    } catch (error) {
      console.error('[StorageService] Delete failed:', error)
      // Don't throw - allow graceful degradation
      return false
    }
  }

  /**
   * Delete avatar photo
   * @param {string} path - Storage path
   * @returns {Promise<boolean>}
   */
  static async deleteAvatar(path) {
    return await this.deletePhoto('avatars', path)
  }

  /**
   * Delete business photo
   * @param {string} path - Storage path
   * @returns {Promise<boolean>}
   */
  static async deleteBusinessPhoto(path) {
    return await this.deletePhoto('business-photos', path)
  }

  /**
   * Delete accessibility photo
   * @param {string} path - Storage path
   * @returns {Promise<boolean>}
   */
  static async deleteAccessibilityPhoto(path) {
    return await this.deletePhoto('accessibility-photos', path)
  }

  /**
   * Upload multiple photos in batch
   * @param {Array<string>} localUris - Array of local URIs
   * @param {string} bucket - Storage bucket
   * @param {string} prefix - Path prefix
   * @returns {Promise<Array<{publicUrl: string, path: string}>>}
   */
  static async uploadMultiplePhotos(localUris, bucket, prefix) {
    const results = []
    
    for (let i = 0; i < localUris.length; i++) {
      const uri = localUris[i]
      const timestamp = Date.now()
      const extension = uri.split('.').pop().toLowerCase()
      const filename = `photo_${i}_${timestamp}.${extension}`
      const path = `${prefix}/${filename}`

      try {
        const result = await this.uploadPhoto(uri, bucket, path)
        results.push(result)
      } catch (error) {
        console.error(`[StorageService] Failed to upload photo ${i}:`, error)
        // Continue with other uploads
      }
    }

    return results
  }

  /**
   * Get file extension from URI
   * @param {string} uri - File URI
   * @returns {string}
   */
  static getFileExtension(uri) {
    return uri.split('.').pop().toLowerCase()
  }

  /**
   * Check if file is a valid image
   * @param {string} uri - File URI
   * @returns {boolean}
   */
  static isValidImage(uri) {
    const extension = this.getFileExtension(uri)
    return ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
  }
}

export default StorageService
