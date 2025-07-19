import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services'
import { ApiError } from '../services/api'
import { UserResponse, LoginRequest, UserCreate } from '../types/api'

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: UserCreate) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser()
        setUser(userData)
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          // Token is invalid, logout
          authService.logout()
          setUser(null)
        } else {
          setError(err.detail)
        }
      } else {
        setError('Failed to get user information')
      }
    }
  }

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await authService.login(credentials)
      await refreshUser()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.detail)
      } else {
        setError('Login failed')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: UserCreate) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await authService.register(userData)
      
      // Auto-login after registration
      await login({
        username: userData.email,
        password: userData.password
      })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.detail)
      } else {
        setError('Registration failed')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setError(null)
  }

  // Initialize user on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          await refreshUser()
        }
      } catch (err: unknown) {
        console.error('Failed to initialize auth:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    error,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 