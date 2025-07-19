import { apiClient } from './api'
import {
  StoryCreate,
  StoryUpdate,
  StoryResponse,
  StoriesQuery,
  TagCreate,
  TagResponse,
  TagsQuery
} from '../types/api'

// Enhanced story creation data to match UploadPage form
export interface StoryUploadData {
  title: string
  description: string
  storyteller_name: string
  storyteller_bio?: string
  language: string
  origin: string
  tags: string[]
  consent_given: boolean
  audio_file_url?: string
}

export class StoriesService {
  async createStory(storyData: StoryCreate): Promise<StoryResponse> {
    const response = await apiClient.post<StoryResponse>('/stories/', storyData)
    return response
  }

  // Enhanced story creation for upload workflow
  async createStoryFromUpload(uploadData: StoryUploadData): Promise<StoryResponse> {
    const storyData: StoryCreate = {
      title: uploadData.title,
      description: uploadData.description,
      storyteller_name: uploadData.storyteller_name,
      storyteller_bio: uploadData.storyteller_bio,
      language: uploadData.language,
      origin: uploadData.origin,
      // audio_file_url will be set after upload
    }

    const response = await apiClient.post<StoryResponse>('/stories/', storyData)
    return response
  }

  // Complete story upload workflow
  async uploadCompleteStory(audioFile: File, uploadData: StoryUploadData): Promise<{
    story: StoryResponse
    audio_url: string
    processing_started: boolean
  }> {
    try {
      // Step 1: Upload audio file first to get the URL
      const formData = new FormData()
      formData.append('file', audioFile)

      const audioResponse = await apiClient.postFormData<{
        file_url: string
        file_size: number
        message: string
      }>('/media/upload', formData)

      // Step 2: Create story record with the audio URL
      const storyData: StoryCreate = {
        title: uploadData.title,
        description: uploadData.description,
        storyteller_name: uploadData.storyteller_name,
        storyteller_bio: uploadData.storyteller_bio,
        language: uploadData.language,
        origin: uploadData.origin,
        // Now we have the audio_file_url from the upload
      }

      const story = await apiClient.post<StoryResponse>('/stories/', {
        ...storyData,
        audio_file_url: audioResponse.file_url,
        file_size_bytes: audioResponse.file_size,
        consent_given: uploadData.consent_given
      })

      // Step 3: Start AI processing
      let processingStarted = false
      try {
        await apiClient.post('/ai/process-story', { story_id: story.id })
        processingStarted = true
      } catch (error) {
        console.warn('AI processing failed to start:', error)
      }

      return {
        story,
        audio_url: audioResponse.file_url,
        processing_started: processingStarted
      }
    } catch (error) {
      throw new Error(`Failed to upload story: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getStories(query: StoriesQuery = {}): Promise<StoryResponse[]> {
    const searchParams = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/stories/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await apiClient.get<StoryResponse[]>(endpoint)
    return response
  }

  async getStory(storyId: string): Promise<StoryResponse> {
    const response = await apiClient.get<StoryResponse>(`/stories/${storyId}`)
    return response
  }

  async updateStory(storyId: string, updateData: StoryUpdate): Promise<StoryResponse> {
    const response = await apiClient.put<StoryResponse>(`/stories/${storyId}`, updateData)
    return response
  }

  async deleteStory(storyId: string): Promise<void> {
    await apiClient.delete<void>(`/stories/${storyId}`)
  }

  // Enhanced story queries focusing on Swahili content
  async getSwahiliStories(filters: Partial<StoriesQuery> = {}): Promise<StoryResponse[]> {
    const query: StoriesQuery = {
      language: 'sw-KE', // Default to Swahili Kenya
      ...filters
    }
    return this.getStories(query)
  }

  async getStoriesByLanguageGroup(): Promise<Record<string, StoryResponse[]>> {
    const allStories = await this.getStories({ limit: 1000 })
    
    const groupedStories: Record<string, StoryResponse[]> = {}
    
    allStories.forEach(story => {
      const langKey = story.language || 'unknown'
      if (!groupedStories[langKey]) {
        groupedStories[langKey] = []
      }
      groupedStories[langKey].push(story)
    })

    return groupedStories
  }

  // Tag operations
  async getTags(query: TagsQuery = {}): Promise<TagResponse[]> {
    const searchParams = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/stories/tags/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await apiClient.get<TagResponse[]>(endpoint)
    return response
  }

  async createTag(tagData: TagCreate): Promise<TagResponse> {
    const response = await apiClient.post<TagResponse>('/stories/tags/', tagData)
    return response
  }

  // Create multiple tags from upload form
  async createTagsFromArray(tagNames: string[]): Promise<TagResponse[]> {
    const createdTags: TagResponse[] = []
    
    for (const tagName of tagNames) {
      try {
        const tag = await this.createTag({ name: tagName.trim() })
        createdTags.push(tag)
      } catch (error) {
        // Tag might already exist, that's ok
        console.warn(`Failed to create tag "${tagName}":`, error)
      }
    }
    
    return createdTags
  }

  // Search and filter helpers
  async searchStories(searchTerm: string, filters: Partial<StoriesQuery> = {}): Promise<StoryResponse[]> {
    const query: StoriesQuery = {
      search: searchTerm,
      ...filters
    }
    return this.getStories(query)
  }

  async getStoriesByLanguage(language: string, filters: Partial<StoriesQuery> = {}): Promise<StoryResponse[]> {
    const query: StoriesQuery = {
      language,
      ...filters
    }
    return this.getStories(query)
  }

  async getStoriesByTag(tag: string, filters: Partial<StoriesQuery> = {}): Promise<StoryResponse[]> {
    const query: StoriesQuery = {
      tag,
      ...filters
    }
    return this.getStories(query)
  }

  // Helper to check if story processing is complete
  async checkStoryProcessingStatus(storyId: string): Promise<{
    status: string
    hasTranscript: boolean
    hasAnalysis: boolean
  }> {
    try {
      const story = await this.getStory(storyId)
      const hasTranscript = !!story.transcript
      const hasAnalysis = hasTranscript && !!story.transcript
      
      return {
        status: story.status.toString(),
        hasTranscript,
        hasAnalysis
      }
    } catch {
      return {
        status: 'unknown',
        hasTranscript: false,
        hasAnalysis: false
      }
    }
  }
}

export const storiesService = new StoriesService() 