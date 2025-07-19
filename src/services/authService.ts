import { apiClient } from './api'
import { UserCreate, UserResponse, Token, LoginRequest } from '../types/api'

export class AuthService {
  async register(userData: UserCreate): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>('/auth/register', userData)
    return response
  }

  async login(credentials: LoginRequest): Promise<Token> {
    // Convert to form data as expected by OAuth2PasswordRequestForm
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    const response = await apiClient.postFormData<Token>('/auth/login', formData)
    
    // Store the token
    apiClient.setToken(response.access_token)
    
    return response
  }

  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/auth/me')
    return response
  }

  async refreshToken(): Promise<Token> {
    const response = await apiClient.post<Token>('/auth/refresh')
    
    // Update stored token
    apiClient.setToken(response.access_token)
    
    return response
  }

  logout() {
    apiClient.setToken(null)
  }

  isAuthenticated(): boolean {
    return apiClient.getToken() !== null
  }

  getToken(): string | null {
    return apiClient.getToken()
  }
}

export const authService = new AuthService() 