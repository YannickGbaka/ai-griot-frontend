import { apiClient } from './api'
import {
  UserResponse,
  UserUpdate,
  StoryResponse,
  UserStoriesQuery
} from '../types/api'

export class UsersService {
  async getCurrentUserProfile(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/users/me')
    return response
  }

  async updateCurrentUserProfile(updateData: UserUpdate): Promise<UserResponse> {
    const response = await apiClient.put<UserResponse>('/users/me', updateData)
    return response
  }

  async getCurrentUserStories(query: UserStoriesQuery = {}): Promise<StoryResponse[]> {
    const searchParams = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/users/me/stories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await apiClient.get<StoryResponse[]>(endpoint)
    return response
  }

  async getUserProfile(userId: string): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`)
    return response
  }

  async getUserStories(userId: string, query: UserStoriesQuery = {}): Promise<StoryResponse[]> {
    const searchParams = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/users/${userId}/stories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await apiClient.get<StoryResponse[]>(endpoint)
    return response
  }
}

export const usersService = new UsersService() 