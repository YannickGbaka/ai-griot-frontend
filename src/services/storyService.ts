import { apiClient } from './apiClient'

export interface Paragraph {
  id: string
  content: string
  start_time: number
  end_time: number
  sequence_order: number
  language: string
  word_count: number
  illustrations: Array<{
    id: string
    image_url: string
    prompt_used: string
    style: string
    status: string
    generation_time: number
  }>
}

export interface Story {
  id: string
  title: string
  description?: string
  storyteller_name?: string
  storyteller_bio?: string
  language: string
  origin?: string
  audio_file_url: string
  duration_seconds?: number
  file_size_bytes?: number
  status: string
  created_at: string
  updated_at?: string
  contributor?: {
    id: string
    email: string
    full_name: string
    bio?: string
    is_active: boolean
    created_at: string
    updated_at?: string
  }
  transcript?: Record<string, unknown>
  translations?: Array<{
    id: string
    language: string
    text: string
    confidence: number
    created_at: string
    words: Record<string, unknown>[]
  }>
  tags?: Array<{
    id: string
    name: string
    description?: string
    created_at: string
  }>
  analytics?: {
    id: string
    views: number
    listens: number
    avg_rating: number
    sentiment_score?: number
    entities?: Record<string, unknown>
    keywords?: Record<string, unknown>
    cultural_analysis?: Record<string, unknown>
    created_at: string
    updated_at?: string
  }
  paragraphs: Paragraph[]
}

export interface SyncData {
  story_id: string
  audio_url: string
  duration: number
  paragraphs: Array<{
    id: string
    start_time: number
    end_time: number
    content: string
    illustrations: Array<{
      id: string
      image_url: string
      style: string
    }>
  }>
}

export class StoryService {
  // Get all stories
  static async getStories(params?: {
    skip?: number
    limit?: number
    language?: string
    status?: string
    search?: string
    tag?: string
  }): Promise<Story[]> {
    const response = await apiClient.get('/stories', { params })
    return response.data
  }

  // Get a specific story
  static async getStory(storyId: string): Promise<Story> {
    const response = await apiClient.get(`/stories/${storyId}`)
    return response.data
  }

  // Create a new story
  static async createStory(storyData: {
    title: string
    description?: string
    storyteller_name?: string
    storyteller_bio?: string
    language: string
    origin?: string
    consent_given: boolean
    audio_file_url?: string
    file_size_bytes?: number
    duration_seconds?: number
  }): Promise<Story> {
    const response = await apiClient.post('/stories', storyData)
    return response.data
  }

  // Update a story
  static async updateStory(storyId: string, storyData: {
    title?: string
    description?: string
    storyteller_name?: string
    storyteller_bio?: string
    language?: string
    origin?: string
    consent_given?: boolean
    audio_file_url?: string
    file_size_bytes?: number
    duration_seconds?: number
    status?: string
    tags?: number[]
  }): Promise<Story> {
    const response = await apiClient.put(`/stories/${storyId}`, storyData)
    return response.data
  }

  // Delete a story
  static async deleteStory(storyId: string): Promise<void> {
    await apiClient.delete(`/stories/${storyId}`)
  }

  // Enhanced Storytelling Platform Methods

  // Segment story into paragraphs
  static async segmentStoryParagraphs(
    storyId: string,
    targetLanguage: string = 'en'
  ): Promise<{
    story_id: string
    paragraphs_created: number
    paragraphs: Array<{
      id: string
      content: string
      start_time: number
      end_time: number
      sequence_order: number
      language: string
      word_count: number
    }>
  }> {
    const formData = new FormData()
    formData.append('target_language', targetLanguage)
    
    const response = await apiClient.post(`/ai/story/${storyId}/segment-paragraphs`, formData)
    return response.data
  }

  // Generate illustration for a paragraph
  static async generateParagraphIllustration(
    paragraphId: string,
    style: string = 'traditional'
  ): Promise<{
    illustration_id: string
    image_url: string
    prompt_used: string
    style: string
    status: string
    generation_time: number
  }> {
    const formData = new FormData()
    formData.append('style', style)
    
    const response = await apiClient.post(`/ai/paragraph/${paragraphId}/generate-illustration`, formData)
    return response.data
  }

  // Generate illustrations for all paragraphs in a story
  static async generateAllStoryIllustrations(
    storyId: string,
    style: string = 'traditional'
  ): Promise<{
    story_id: string
    illustrations_generated: number
    illustrations: Array<{
      paragraph_id: string
      illustration_id: string
      image_url: string
      status: string
    }>
  }> {
    const formData = new FormData()
    formData.append('style', style)
    
    const response = await apiClient.post(`/ai/story/${storyId}/generate-all-illustrations`, formData)
    return response.data
  }

  // Get all paragraphs for a story
  static async getStoryParagraphs(storyId: string): Promise<{
    story_id: string
    paragraphs: Paragraph[]
  }> {
    const response = await apiClient.get(`/ai/story/${storyId}/paragraphs`)
    return response.data
  }

  // Get synchronization data for audio-visual playback
  static async getStorySyncData(storyId: string): Promise<SyncData> {
    const response = await apiClient.get(`/ai/story/${storyId}/sync-data`)
    return response.data
  }

  // Process complete story (existing method)
  static async processStory(storyId: string): Promise<{
    message: string
    story_id: string
    status: string
  }> {
    const response = await apiClient.post('/ai/process-story', { story_id: storyId })
    return response.data
  }

  // Get story processing status
  static async getStoryProcessingStatus(storyId: string): Promise<{
    story_id: string
    current_step: string
    progress_percentage: number
    message: string
    error?: string
    transcript_text?: string
    created_at: string
  }> {
    const response = await apiClient.get(`/ai/story/${storyId}/processing-status`)
    return response.data
  }

  // Get story analysis
  static async getStoryAnalysis(storyId: string): Promise<{
    story_id: string
    analysis: {
      themes: string[]
      cultural_elements: string[]
      characters: string[]
      emotions: string[]
      traditional_elements: string[]
      illustration_keywords: string[]
      cultural_significance: string
      sentiment_score: number
      complexity_level: string
    }
  }> {
    const response = await apiClient.get(`/ai/story/${storyId}/analysis`)
    return response.data
  }

  // AI Processing Methods

  // Transcribe audio file
  static async transcribeAudio(
    file: File,
    language: string = 'sw-KE',
    enhance: boolean = true
  ): Promise<{
    transcript: Record<string, unknown>
    language: string
    confidence: number
    processing_time: number
  }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    formData.append('enhance', enhance.toString())
    
    const response = await apiClient.post('/ai/transcribe', formData)
    return response.data
  }

  // Generate speech from text
  static async generateSpeech(
    text: string,
    language: string = 'sw',
    voiceName?: string,
    multiSpeaker: boolean = false,
    returnFile: boolean = true
  ): Promise<{
    audio_url: string
    duration: number
    word_count: number
    language: string
    voice_used: string
  }> {
    const formData = new FormData()
    formData.append('text', text)
    formData.append('language', language)
    if (voiceName) formData.append('voice_name', voiceName)
    formData.append('multi_speaker', multiSpeaker.toString())
    formData.append('return_file', returnFile.toString())
    
    const response = await apiClient.post('/ai/generate-speech', formData)
    return response.data
  }

  // Generate story narration
  static async generateStoryNarration(
    storyId: string,
    language: string = 'sw',
    voiceName?: string,
    useTranslation: boolean = false
  ): Promise<{
    audio_url: string
    duration: number
    language: string
    voice_used: string
    word_count: number
  }> {
    const formData = new FormData()
    formData.append('story_id', storyId)
    formData.append('language', language)
    if (voiceName) formData.append('voice_name', voiceName)
    formData.append('use_translation', useTranslation.toString())
    
    const response = await apiClient.post('/ai/generate-story-narration', formData)
    return response.data
  }

  // Get available voices
  static async getAvailableVoices(): Promise<{
    available_voices: string[]
    swahili_recommended: string[]
    default_voice: string
    supported_languages: string[]
  }> {
    const response = await apiClient.get('/ai/voices')
    return response.data
  }

  // Health check
  static async healthCheck(): Promise<{
    status: string
    services: {
      google_cloud_speech: boolean
      google_cloud_translate: boolean
      google_gemini_content: boolean
      google_gemini_tts: boolean
      spacy_ner: boolean
      sentiment_analysis: boolean
    }
    supported_languages: string[]
    translation_targets: string[]
    tts_model: string
    swahili_support: boolean
  }> {
    const response = await apiClient.get('/ai/health')
    return response.data
  }
} 