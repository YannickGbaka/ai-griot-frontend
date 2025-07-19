import { apiClient } from './api'

export interface ProcessingStatusResponse {
  story_id: string
  current_step: string
  progress_percentage: number
  message: string
  error?: string
  transcript_text?: string
  created_at: string
}

export class ProcessingService {
  /**
   * Get the current processing status for a story
   */
  async getProcessingStatus(storyId: string): Promise<ProcessingStatusResponse> {
    try {
      const response = await apiClient.get<ProcessingStatusResponse>(`/ai/story/${storyId}/processing-status`)
      return response
    } catch (error) {
      console.error('Failed to get processing status:', error)
      throw error
    }
  }

  /**
   * Poll processing status with automatic retries
   */
  async pollProcessingStatus(
    storyId: string,
    onUpdate: (status: ProcessingStatusResponse) => void,
    onComplete: (status: ProcessingStatusResponse) => void,
    onError: (error: string) => void,
    pollInterval: number = 3000,
    maxRetries: number = 100
  ): Promise<void> {
    let retryCount = 0
    
    const poll = async () => {
      try {
        const status = await this.getProcessingStatus(storyId)
        console.log(`📊 Processing status for ${storyId}:`, status)
        
        onUpdate(status)
        
        // Check if processing is complete
        if (status.current_step === 'published') {
          console.log(`✅ Processing completed for ${storyId}`)
          onComplete(status)
          return
        }
        
        // Check if processing failed
        if (status.current_step === 'failed') {
          console.log(`❌ Processing failed for ${storyId}: ${status.error}`)
          onError(status.error || 'Processing failed')
          return
        }
        
        // Continue polling if still processing
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`🔄 Polling attempt ${retryCount}/${maxRetries} for ${storyId}`)
          setTimeout(poll, pollInterval)
        } else {
          console.log(`⏰ Polling timeout for ${storyId} after ${maxRetries} attempts`)
          onError('Processing timeout - please check back later')
        }
        
      } catch (error) {
        console.error(`❌ Error polling processing status for ${storyId}:`, error)
        
        // Retry on error
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`🔄 Retry ${retryCount}/${maxRetries} after error for ${storyId}`)
          setTimeout(poll, pollInterval * 2) // Longer interval on error
        } else {
          console.log(`❌ Max retries reached for ${storyId}`)
          onError('Failed to check processing status')
        }
      }
    }
    
    // Start polling
    console.log(`🚀 Starting polling for story ${storyId}`)
    poll()
  }

  /**
   * Start polling with a promise-based approach
   */
  async waitForProcessingComplete(
    storyId: string,
    onUpdate?: (status: ProcessingStatusResponse) => void,
    pollInterval: number = 3000,
    maxRetries: number = 100
  ): Promise<ProcessingStatusResponse> {
    return new Promise((resolve, reject) => {
      this.pollProcessingStatus(
        storyId,
        (status) => {
          onUpdate?.(status)
        },
        (status) => {
          resolve(status)
        },
        (error) => {
          reject(new Error(error))
        },
        pollInterval,
        maxRetries
      )
    })
  }
}

export const processingService = new ProcessingService() 