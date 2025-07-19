import { apiClient } from './api'

// Updated types to match backend response format
export interface TranscriptData {
  text: string
  enhanced_text?: string
  words: Array<{
    word: string
    start_time: number
    end_time: number
    confidence: number
  }>
  confidence: number
  chunks?: Array<{
    text: string
    confidence: number
  }>
}

export interface TranscriptionResponse {
  transcript: TranscriptData
  message: string
}

export interface StoryAnalysisResponse {
  story: {
    id: string
    title: string
    description: string
    storyteller_name: string
    language: string
    status: string
    created_at: string
  }
  transcript: {
    original_text: string
    enhanced_text: string
    words: Array<{
      word: string
      start_time: number
      end_time: number
      confidence: number
    }>
    confidence: number
    analysis: {
      sentiment: {
        overall: string
        confidence: number
        emotions: string[]
      }
      cultural_context: {
        themes: string[]
        cultural_elements: string[]
        story_type: string
        moral_lessons: string[]
        traditional_elements: string[]
      }
      entities: {
        people: string[]
        places: string[]
        objects: string[]
        concepts: string[]
        animals: string[]
      }
      language_analysis: {
        register: string
        dialect_markers: string[]
        arabic_influences: string[]
      }
    }
  } | null
  translations: Array<{
    language: string
    text: string
  }>
  analytics: {
    views: number
    listens: number
    avg_rating: number
  } | null
}

export interface StoryProcessingResponse {
  message: string
  story_id: string
  status: string
}

export interface TTSResponse {
  // This will be a file download
  blob: Blob
}

export class AIService {
  // Direct audio transcription
  async transcribeAudioFile(
    file: File, 
    language: string = "sw-KE", // Default to Swahili (Kenya)
    enhance: boolean = true
  ): Promise<TranscriptionResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    formData.append('enhance', enhance.toString())

    const response = await apiClient.postFormData<TranscriptionResponse>('/ai/transcribe', formData)
    return response
  }

  // Process complete story (after upload)
  async processStory(storyId: string): Promise<StoryProcessingResponse> {
    const response = await apiClient.post<StoryProcessingResponse>('/ai/process-story', {
      story_id: storyId
    })
    return response
  }

  // Get story analysis results
  async getStoryAnalysis(storyId: string): Promise<StoryAnalysisResponse> {
    const response = await apiClient.get<StoryAnalysisResponse>(`/ai/story/${storyId}/analysis`)
    return response
  }

  // Generate speech from text (Gemini TTS)
  async generateSpeech(
    text: string,
    language: string = "sw", // Default to Swahili
    voiceName?: string,
    multiSpeaker: boolean = false
  ): Promise<Blob> {
    const formData = new FormData()
    formData.append('text', text)
    formData.append('language', language)
    if (voiceName) formData.append('voice_name', voiceName)
    formData.append('multi_speaker', multiSpeaker.toString())
    formData.append('return_file', 'true')

    const response = await fetch(`${apiClient['baseURL']}/ai/generate-speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to generate speech')
    }

    return await response.blob()
  }

  // Get available TTS voices
  async getAvailableVoices(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/ai/voices')
    return response
  }

  // Check AI services health
  async checkAIHealth(): Promise<{ status: string; services: Record<string, boolean> }> {
    const response = await apiClient.get<{ status: string; services: Record<string, boolean> }>('/ai/health')
    return response
  }

  // Get supported languages with enhanced Swahili focus
  getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string; recommended?: boolean }> {
    return [
      { code: 'sw-KE', name: 'Swahili (Kenya)', nativeName: 'Kiswahili (Kenya)', recommended: true },
      { code: 'sw-TZ', name: 'Swahili (Tanzania)', nativeName: 'Kiswahili (Tanzania)', recommended: true },
      { code: 'en-US', name: 'English (US)', nativeName: 'English' },
      { code: 'en-GB', name: 'English (UK)', nativeName: 'English' },
      { code: 'fr-FR', name: 'French', nativeName: 'Français' },
      { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
      { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português' },
      { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
      { code: 'it-IT', name: 'Italian', nativeName: 'Italiano' },
      { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
      { code: 'zh-CN', name: 'Chinese (Mandarin)', nativeName: '中文' }
    ]
  }

  // Get TTS language codes (simplified for TTS)
  getTTSLanguages(): Array<{ code: string; name: string; nativeName: string; voices: string[] }> {
    return [
      { 
        code: 'sw', 
        name: 'Swahili', 
        nativeName: 'Kiswahili', 
        voices: ['Zephyr', 'Kore'] // Best voices for Swahili
      },
      { 
        code: 'en', 
        name: 'English', 
        nativeName: 'English', 
        voices: ['Zephyr', 'Puck', 'Charon', 'Kore']
      },
      { 
        code: 'fr', 
        name: 'French', 
        nativeName: 'Français', 
        voices: ['Zephyr', 'Puck']
      },
      { 
        code: 'es', 
        name: 'Spanish', 
        nativeName: 'Español', 
        voices: ['Zephyr', 'Puck']
      },
      { 
        code: 'ar', 
        name: 'Arabic', 
        nativeName: 'العربية', 
        voices: ['Zephyr']
      }
    ]
  }

  getLanguageName(code: string): string {
    const language = this.getSupportedLanguages().find(lang => lang.code === code)
    return language?.name || code
  }

  getLanguageNativeName(code: string): string {
    const language = this.getSupportedLanguages().find(lang => lang.code === code)
    return language?.nativeName || code
  }

  // Helper to get language code for transcription from TTS code
  getTranscriptionLanguageCode(ttsCode: string): string {
    const mapping: Record<string, string> = {
      'sw': 'sw-KE', // Default Swahili to Kenya
      'en': 'en-US',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'ar': 'ar-SA'
    }
    return mapping[ttsCode] || ttsCode
  }
}

export const aiService = new AIService() 