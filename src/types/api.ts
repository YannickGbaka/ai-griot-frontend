// API Type definitions matching backend models

// User types
export interface User {
  id: string
  email: string
  full_name: string
  bio?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserCreate {
  email: string
  password: string
  full_name: string
  bio?: string
}

export interface UserUpdate {
  full_name?: string
  bio?: string
  password?: string
}

export type UserResponse = Omit<User, 'password_hash'>

// Auth types
export interface Token {
  access_token: string
  token_type: string
}

export interface LoginRequest {
  username: string // email in OAuth2PasswordRequestForm
  password: string
}

// Story types
export enum StoryStatus {
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  REJECTED = 'rejected'
}

export interface Story {
  id: string
  title: string
  description: string
  storyteller_name: string
  storyteller_bio?: string
  language: string
  origin: string
  duration_seconds?: number
  audio_file_url?: string
  file_size_bytes?: number
  status: StoryStatus
  contributor_id: string
  created_at: string
  updated_at: string
}

export interface StoryCreate {
  title: string
  description: string
  storyteller_name: string
  storyteller_bio?: string
  language: string
  origin: string
  audio_file_url?: string  // Audio file URL from upload
  file_size_bytes?: number  // File size in bytes
  duration_seconds?: number  // Audio duration in seconds
  consent_given?: boolean  // User consent for sharing
}

export interface StoryUpdate {
  title?: string
  description?: string
  storyteller_name?: string
  storyteller_bio?: string
  language?: string
  origin?: string
  status?: StoryStatus
}

export interface StoryResponse extends Story {
  contributor: UserResponse
  transcript?: Transcript
  translations: Translation[]
  tags: Tag[]
  analytics?: Analytics
}

// Transcript types
export interface TranscriptSegment {
  start: number
  end: number
  text: string
  word?: string
  start_time?: number
  end_time?: number
}

export interface Transcript {
  original_text: string
  enhanced_text?: string
  words: Array<{
    word: string
    start_time: number
    end_time: number
  }>
  confidence: number
  analysis?: Record<string, unknown>
  transcription_method?: string
}

export interface TranscriptCreate {
  story_id: string
  language: string
  text: string
  segments: TranscriptSegment[]
  confidence: number
}

// Translation types
export interface Translation {
  id: string
  story_id: string
  language: string
  text: string
  confidence: number
  processing_status: string
  created_at: string
  updated_at: string
  words?: Array<{
    word: string
    start_time: number
    end_time: number
  }>
}

export interface TranslationCreate {
  story_id: string
  language: string
  text: string
  confidence: number
}

// Tag types
export interface Tag {
  id: string
  name: string
  description?: string
  category?: string
  created_at: string
}

export interface TagCreate {
  name: string
  description?: string
  category?: string
}

export type TagResponse = Tag

// Analytics types
export interface Analytics {
  id: string
  story_id: string
  views: number
  listens: number
  downloads: number
  shares: number
  likes: number
  average_rating: number
  total_ratings: number
  created_at: string
  updated_at: string
}

export type AnalyticsResponse = Analytics

// Media upload types
export interface MediaUploadRequest {
  file: File
  story_id: string
}

export interface MediaUploadResponse {
  audio_url: string
  file_size_bytes: number
  duration_seconds: number
  message: string
}

// API Query parameters
export interface StoriesQuery {
  skip?: number
  limit?: number
  language?: string
  status?: StoryStatus
  search?: string
  tag?: string
}

export interface UserStoriesQuery {
  skip?: number
  limit?: number
}

export interface TagsQuery {
  skip?: number
  limit?: number
}

// AI Processing types
export interface TranscriptionRequest {
  story_id: string
  language_code?: string
}

export interface TranscriptionResponse {
  transcript: Transcript
  processing_status: string
  confidence: number
}

export interface TranslationRequest {
  story_id: string
  target_language: string
  source_language?: string
}

export interface TranslationResponse {
  translation: Translation
  processing_status: string
  confidence: number
}

export interface TextToSpeechRequest {
  text: string
  language: string
  voice_style?: string
}

export interface TextToSpeechResponse {
  audio_url: string
  duration_seconds: number
}

// Error types
export interface ApiErrorResponse {
  detail: string
  status: number
} 