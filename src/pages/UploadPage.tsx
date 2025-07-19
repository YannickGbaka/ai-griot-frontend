import { useState, useRef } from 'react'
import { Upload, Mic, MicOff, Play, Pause, Trash2, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { storiesService, type StoryUploadData } from '../services/storiesService'
import { mediaService } from '../services/mediaService'
import { aiService, type TranscriptionResponse } from '../services/aiService'

interface UploadData {
  title: string
  description: string
  storytellerName: string
  storytellerBio: string
  language: string
  origin: string
  tags: string[]
  consentGiven: boolean
}

// Upload progress states
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

interface ProcessingStatus {
  status: UploadStatus
  message: string
  progress: number
  storyId?: string
  transcription?: TranscriptionResponse
  error?: string
}

export default function UploadPage() {
  const [step, setStep] = useState(1)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    message: '',
    progress: 0
  })
  
  const [uploadData, setUploadData] = useState<UploadData>({
    title: '',
    description: '',
    storytellerName: '',
    storytellerBio: '',
    language: 'sw-KE', // Default to Swahili (Kenya)
    origin: '',
    tags: [],
    consentGiven: false
  })
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<number | null>(null)

  // Get supported languages with Swahili prioritized
  const supportedLanguages = aiService.getSupportedLanguages()

  // File upload with dropzone
  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('audio/')) {
      // Validate file
      const validation = await mediaService.validateAudioFile(file)
      if (!validation.isValid) {
        setProcessingStatus({
          status: 'error',
          message: validation.error || 'Invalid file',
          progress: 0,
          error: validation.error
        })
        return
      }

      setAudioFile(file)
      setAudioUrl(URL.createObjectURL(file))
      setStep(2)
      
      // Clear any previous errors
      setProcessingStatus({
        status: 'idle',
        message: '',
        progress: 0
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm']
    },
    multiple: false
  })

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' })
        setAudioFile(file)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setProcessingStatus({
        status: 'error',
        message: 'Failed to access microphone. Please check permissions.',
        progress: 0,
        error: 'Microphone access denied'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setStep(2)
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const deleteAudio = () => {
    setAudioFile(null)
    setAudioUrl(null)
    setStep(1)
    setRecordingTime(0)
    setProcessingStatus({
      status: 'idle',
      message: '',
      progress: 0
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setUploadData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }))
    } else {
      setUploadData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !uploadData.tags.includes(tag.trim())) {
      setUploadData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Main upload and processing function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!audioFile) {
      setProcessingStatus({
        status: 'error',
        message: 'No audio file selected',
        progress: 0,
        error: 'Missing audio file'
      })
      return
    }

    try {
      setStep(3) // Move to review step
      setProcessingStatus({
        status: 'uploading',
        message: 'Uploading your story...',
        progress: 20
      })

      // Prepare story data
      const storyUploadData: StoryUploadData = {
        title: uploadData.title,
        description: uploadData.description,
        storyteller_name: uploadData.storytellerName,
        storyteller_bio: uploadData.storytellerBio,
        language: uploadData.language,
        origin: uploadData.origin,
        tags: uploadData.tags,
        consent_given: uploadData.consentGiven
      }

      // Upload complete story
      const uploadResult = await storiesService.uploadCompleteStory(audioFile, storyUploadData)
      
      setProcessingStatus({
        status: 'processing',
        message: 'Story uploaded! Starting AI transcription and analysis...',
        progress: 50,
        storyId: uploadResult.story.id
      })

      // If processing started, wait a bit and then check for results
      if (uploadResult.processing_started) {
        // Poll for processing results
        setTimeout(async () => {
          try {
            await aiService.getStoryAnalysis(uploadResult.story.id)
            
            setProcessingStatus({
              status: 'success',
              message: 'Story uploaded and processed successfully!',
              progress: 100,
              storyId: uploadResult.story.id
            })
          } catch {
            // Processing might still be in progress
            setProcessingStatus({
              status: 'processing',
              message: 'Story uploaded! AI processing is in progress...',
              progress: 75,
              storyId: uploadResult.story.id
            })
          }
        }, 5000) // Wait 5 seconds before checking
      } else {
        setProcessingStatus({
          status: 'success',
          message: 'Story uploaded successfully! (AI processing will continue in background)',
          progress: 100,
          storyId: uploadResult.story.id
        })
      }

    } catch (error) {
      console.error('Upload failed:', error)
      setProcessingStatus({
        status: 'error',
        message: 'Upload failed. Please try again.',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Try direct transcription for immediate feedback
  const handleQuickTranscribe = async () => {
    if (!audioFile) return

    try {
      setProcessingStatus({
        status: 'processing',
        message: 'Transcribing audio...',
        progress: 30
      })

      const transcription = await aiService.transcribeAudioFile(
        audioFile, 
        uploadData.language, 
        true // enhance
      )

      setProcessingStatus({
        status: 'success',
        message: 'Transcription complete!',
        progress: 100,
        transcription
      })
    } catch (error) {
      setProcessingStatus({
        status: 'error',
        message: 'Transcription failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = () => {
    switch (processingStatus.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="animate-spin" size={20} />
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />
      case 'error':
        return <AlertCircle className="text-red-600" size={20} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Share Your Story</h1>
          <p className="text-lg text-gray-600">
            Help preserve cultural heritage by sharing oral traditions with the world
          </p>
          <div className="mt-4 text-sm text-griot-600 bg-griot-50 p-3 rounded-lg max-w-md mx-auto">
            <strong>🎯 Swahili Focus:</strong> Enhanced support for East African storytelling traditions
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-griot-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-griot-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-griot-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
            <div className={`h-1 w-16 ${step >= 3 ? 'bg-griot-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-griot-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              3
            </div>
          </div>
          <div className="text-center text-sm text-gray-600">
            {step === 1 && 'Record or Upload Audio'}
            {step === 2 && 'Add Story Details'}
            {step === 3 && 'Processing & Results'}
          </div>
        </div>

        {/* Status Display */}
        {processingStatus.status !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            processingStatus.status === 'error' ? 'bg-red-50 border-red-200' :
            processingStatus.status === 'success' ? 'bg-green-50 border-green-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="font-medium">{processingStatus.message}</p>
                {processingStatus.error && (
                  <p className="text-sm text-red-600 mt-1">{processingStatus.error}</p>
                )}
                {processingStatus.transcription && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h4 className="font-medium text-sm mb-2">Transcription Preview:</h4>
                    <p className="text-sm">{processingStatus.transcription.transcript.enhanced_text || processingStatus.transcription.transcript.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Confidence: {Math.round(processingStatus.transcription.transcript.confidence * 100)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            {processingStatus.progress > 0 && (
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-griot-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingStatus.progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 1: Audio Upload/Recording */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6">Record or Upload Your Story</h2>
            
            {!audioFile ? (
              <div className="space-y-8">
                {/* Upload Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Upload Audio File</h3>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-griot-500 bg-griot-50' : 'border-gray-300 hover:border-griot-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {isDragActive ? 'Drop the file here' : 'Drop your audio file here'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      or click to select a file
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports MP3, WAV, M4A, FLAC, OGG, WebM (max 100MB)
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-gray-500 font-medium">OR</div>
                </div>

                {/* Recording Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Record Live</h3>
                  <div className="text-center">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-6 transition-colors"
                      >
                        <Mic size={32} />
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-4">
                          <div className="animate-pulse bg-red-600 rounded-full p-6">
                            <MicOff size={32} className="text-white" />
                          </div>
                          <div className="text-2xl font-mono text-red-600">
                            {formatTime(recordingTime)}
                          </div>
                        </div>
                        <button
                          onClick={stopRecording}
                          className="btn-primary"
                        >
                          Stop Recording
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-4">
                      Click the microphone to start recording
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Audio Preview */
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button
                      onClick={playAudio}
                      className="bg-griot-600 hover:bg-griot-700 text-white rounded-full p-3 transition-colors"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <div className="text-lg font-medium">
                      {audioFile.name}
                    </div>
                    <button
                      onClick={deleteAudio}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Size: {mediaService.formatFileSize(audioFile.size)} • 
                    Est. Duration: {mediaService.formatDuration(mediaService.estimateAudioDuration(audioFile))}
                  </div>
                  {audioUrl && (
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  )}
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleQuickTranscribe}
                    className="btn-secondary"
                    disabled={processingStatus.status === 'processing'}
                  >
                    Quick Transcribe
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary"
                  >
                    Continue to Story Details
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Story Details */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6">Add Story Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Story Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="input-field"
                    value={uploadData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a descriptive title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language *
                  </label>
                  <select
                    name="language"
                    required
                    className="input-field"
                    value={uploadData.language}
                    onChange={handleInputChange}
                  >
                    <option value="">Select language</option>
                    {supportedLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.recommended ? '⭐ ' : ''}{lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Story Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  className="input-field"
                  value={uploadData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the story, its cultural significance, and any important context"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storyteller Name
                  </label>
                  <input
                    type="text"
                    name="storytellerName"
                    className="input-field"
                    value={uploadData.storytellerName}
                    onChange={handleInputChange}
                    placeholder="Name or alias"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origin/Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="origin"
                      className="input-field pl-10"
                      value={uploadData.origin}
                      onChange={handleInputChange}
                      placeholder="City, Country or Region"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storyteller Bio (Optional)
                </label>
                <textarea
                  name="storytellerBio"
                  rows={3}
                  className="input-field"
                  value={uploadData.storytellerBio}
                  onChange={handleInputChange}
                  placeholder="Brief background about the storyteller"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Press Enter to add)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. folklore, creation myth, wisdom tale, hadithi, methali"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.target as HTMLInputElement
                      handleTagAdd(input.value)
                      input.value = ''
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {uploadData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-griot-100 text-griot-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="text-griot-500 hover:text-griot-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="consentGiven"
                  name="consentGiven"
                  required
                  className="h-4 w-4 text-griot-600 focus:ring-griot-500 border-gray-300 rounded"
                  checked={uploadData.consentGiven}
                  onChange={handleInputChange}
                />
                <label htmlFor="consentGiven" className="ml-2 block text-sm text-gray-900">
                  I consent to sharing this story publicly on Digital Griot platform and understand that it will be available for global access, transcription, and translation.
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Back to Audio
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!uploadData.title || !uploadData.description || !uploadData.language || !uploadData.consentGiven || processingStatus.status === 'uploading'}
                >
                  {processingStatus.status === 'uploading' ? 'Uploading...' : 'Upload Story'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Processing & Results */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6">Upload Complete</h2>
            
            <div className="space-y-6">
              {/* Audio Review */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Audio File</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4">
                  <button
                    onClick={playAudio}
                    className="bg-griot-600 hover:bg-griot-700 text-white rounded-full p-2 transition-colors"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <span className="font-medium">{audioFile?.name}</span>
                </div>
              </div>

              {/* Story Details Review */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Title</h4>
                  <p>{uploadData.title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Description</h4>
                  <p>{uploadData.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Language</h4>
                    <p>{aiService.getLanguageName(uploadData.language)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Origin</h4>
                    <p>{uploadData.origin || 'Not specified'}</p>
                  </div>
                </div>
                {uploadData.storytellerName && (
                  <div>
                    <h4 className="font-medium text-gray-700">Storyteller</h4>
                    <p>{uploadData.storytellerName}</p>
                  </div>
                )}
                {uploadData.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {uploadData.tags.map((tag) => (
                        <span key={tag} className="bg-griot-100 text-griot-700 px-2 py-1 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {processingStatus.status === 'success' && processingStatus.storyId && (
                <div className="border-t pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">🎉 Success!</h4>
                    <p className="text-green-700 mb-3">
                      Your story has been uploaded and AI processing has started. You can view the results once processing is complete.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => window.location.href = `/stories/${processingStatus.storyId}`}
                        className="btn-primary"
                      >
                        View Story
                      </button>
                      <button
                        onClick={() => window.location.reload()}
                        className="btn-secondary"
                      >
                        Upload Another
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {processingStatus.status !== 'success' && (
                <div className="flex justify-between pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-secondary"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="btn-primary"
                    disabled={processingStatus.status === 'uploading'}
                  >
                    {processingStatus.status === 'uploading' ? 'Uploading...' : 'Upload Story'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 