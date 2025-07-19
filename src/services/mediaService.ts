import { apiClient } from './api'
import { MediaUploadResponse } from '../types/api'

// Get the backend base URL for constructing full URLs
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'

export interface FileValidation {
  isValid: boolean
  error?: string
  size?: number
  duration?: number
}

export class MediaService {
  // Generic file upload for media
  async uploadFile(file: File): Promise<{ file_url: string; message: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.postFormData<{ file_url: string; message: string }>('/media/upload', formData)
    return response
  }

  // Upload audio file for an existing story
  async uploadAudioFile(file: File, storyId: string): Promise<MediaUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('story_id', storyId)

    const response = await apiClient.postFormData<MediaUploadResponse>('/media/upload-audio', formData)
    return response
  }

  // Get audio URL for a story
  async getAudioUrl(storyId: string): Promise<{ audio_url: string; expires_in: number; story_id: string }> {
    const response = await apiClient.get<{ audio_url: string; expires_in: number; story_id: string }>(`/media/audio/${storyId}`)
    
    // Convert relative URLs to full URLs
    if (response.audio_url.startsWith('/media/') || response.audio_url.startsWith('/api/v1/media/')) {
      response.audio_url = `${BACKEND_BASE_URL}${response.audio_url}`
    }
    
    return response
  }

  async validateAudioFile(file: File): Promise<{ isValid: boolean; error?: string }> {
    const maxSizeBytes = 100 * 1024 * 1024 // 100MB
    const allowedFormats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm']
    
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
      'audio/ogg',
      'audio/webm'
    ]
    
    if (file.type && !allowedMimeTypes.includes(file.type)) {
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

  // Estimate duration from file size (rough approximation)
  estimateAudioDuration(file: File): number {
    // Very rough estimate: assume 128kbps MP3 encoding
    // 128kbps = 16KB/s, so duration ≈ file_size_bytes / 16000
    const estimatedSeconds = Math.round(file.size / 16000)
    return Math.max(1, estimatedSeconds) // At least 1 second
  }
}

export const mediaService = new MediaService() 