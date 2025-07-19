import { apiClient } from './api'
import { MediaUploadResponse } from '../types/api'

export class MediaService {
  async uploadAudioFile(file: File, storyId: string): Promise<MediaUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('story_id', storyId)

    const response = await apiClient.postFormData<MediaUploadResponse>('/media/upload-audio', formData)
    return response
  }

  async validateAudioFile(file: File): Promise<{ isValid: boolean; error?: string }> {
    const maxSizeBytes = 100 * 1024 * 1024 // 100MB
    const allowedFormats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg']
    
    // Check file size
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${maxSizeBytes / (1024 * 1024)}MB`
      }
    }

    // Check file type
    const fileName = file.name.toLowerCase()
    const hasValidExtension = allowedFormats.some(format => fileName.endsWith(format))
    
    if (!hasValidExtension) {
      return {
        isValid: false,
        error: `Unsupported file format. Allowed formats: ${allowedFormats.join(', ')}`
      }
    }

    // Check MIME type
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/flac',
      'audio/ogg'
    ]
    
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type detected'
      }
    }

    return { isValid: true }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }
}

export const mediaService = new MediaService() 