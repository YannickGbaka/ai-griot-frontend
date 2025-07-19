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

export class StoriesService {
  async createStory(storyData: StoryCreate): Promise<StoryResponse> {
    const response = await apiClient.post<StoryResponse>('/stories/', storyData)
    return response
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
}

export const storiesService = new StoriesService() 