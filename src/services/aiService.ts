import { apiClient } from './api'
import {
  TranscriptionRequest,
  TranscriptionResponse,
  TranslationRequest,
  TranslationResponse,
  TextToSpeechRequest,
  TextToSpeechResponse
} from '../types/api'

export class AIService {
  async transcribeStory(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const response = await apiClient.post<TranscriptionResponse>('/ai/transcribe', request)
    return response
  }

  async translateStory(request: TranslationRequest): Promise<TranslationResponse> {
    const response = await apiClient.post<TranslationResponse>('/ai/translate', request)
    return response
  }

  async generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    const response = await apiClient.post<TextToSpeechResponse>('/ai/text-to-speech', request)
    return response
  }

  async getTranscriptionStatus(storyId: string): Promise<{ status: string; progress?: number }> {
    const response = await apiClient.get<{ status: string; progress?: number }>(`/ai/transcribe/status/${storyId}`)
    return response
  }

  async getTranslationStatus(storyId: string, language: string): Promise<{ status: string; progress?: number }> {
    const response = await apiClient.get<{ status: string; progress?: number }>(`/ai/translate/status/${storyId}/${language}`)
    return response
  }

  // Helper methods for common AI operations
  async startStoryProcessing(storyId: string, language_code = 'en-US'): Promise<TranscriptionResponse> {
    return this.transcribeStory({
      story_id: storyId,
      language_code
    })
  }

  async translateToLanguage(storyId: string, targetLanguage: string, sourceLanguage = 'auto'): Promise<TranslationResponse> {
    return this.translateStory({
      story_id: storyId,
      target_language: targetLanguage,
      source_language: sourceLanguage
    })
  }

  async generateAudioFromText(text: string, language: string, voiceStyle?: string): Promise<TextToSpeechResponse> {
    return this.generateSpeech({
      text,
      language,
      voice_style: voiceStyle
    })
  }

  // Supported languages for transcription and translation
  getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'en-US', name: 'English', nativeName: 'English' },
      { code: 'sw-KE', name: 'Swahili', nativeName: 'Kiswahili' },
      { code: 'fr-FR', name: 'French', nativeName: 'Français' },
      { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
      { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
      { code: 'ha-NG', name: 'Hausa', nativeName: 'Hausa' },
      { code: 'yo-NG', name: 'Yoruba', nativeName: 'Yorùbá' },
      { code: 'ig-NG', name: 'Igbo', nativeName: 'Igbo' },
      { code: 'am-ET', name: 'Amharic', nativeName: 'አማርኛ' },
      { code: 'zu-ZA', name: 'Zulu', nativeName: 'isiZulu' },
      { code: 'xh-ZA', name: 'Xhosa', nativeName: 'isiXhosa' },
      { code: 'af-ZA', name: 'Afrikaans', nativeName: 'Afrikaans' }
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
}

export const aiService = new AIService() 