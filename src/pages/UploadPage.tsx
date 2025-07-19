import { useState, useRef } from 'react'
import { Upload, Mic, MicOff, Play, Pause, Trash2, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { storiesService, type StoryUploadData } from '../services/storiesService'
import { mediaService } from '../services/mediaService'
import { aiService, type TranscriptionResponse } from '../services/aiService'
import { processingService, type ProcessingStatusResponse } from '../services/processingService'
import ProcessingStepperComponent from '../components/ProcessingStepperComponent'

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

// Updated upload progress states to match processing steps
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

interface ProcessingStatus {
  status: UploadStatus
  message: string
  progress: number
  storyId?: string
  transcription?: TranscriptionResponse
  error?: string
  // Add detailed processing status
  detailedStatus?: ProcessingStatusResponse
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

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setUploadData(prev => ({ ...prev, [name]: checked }))
    } else {
      setUploadData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Tag management
  const addTag = (tag: string) => {
    if (tag.trim() && !uploadData.tags.includes(tag.trim())) {
      setUploadData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
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
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  // Enhanced upload and processing function with real-time progress tracking
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
      setStep(3) // Move to processing step
      setProcessingStatus({
        status: 'uploading',
        message: 'Uploading your story...',
        progress: 10
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
        message: 'Story uploaded! Starting AI processing...',
        progress: 20,
        storyId: uploadResult.story.id
      })

      // Start real-time progress tracking
      if (uploadResult.processing_started && uploadResult.story.id) {
        try {
          // Add timeout for processing
          const processingTimeout = setTimeout(() => {
            setProcessingStatus({
              status: 'success',
              message: 'Story uploaded successfully! Processing continues in background.',
              progress: 100,
              storyId: uploadResult.story.id
            })
          }, 120000) // 2 minutes timeout

          // Start polling for processing status
          await processingService.pollProcessingStatus(
            uploadResult.story.id,
            // On status update
            (status: ProcessingStatusResponse) => {
              setProcessingStatus({
                status: 'processing',
                message: status.message,
                progress: status.progress_percentage,
                storyId: uploadResult.story.id,
                detailedStatus: status
              })
            },
            // On completion
            (status: ProcessingStatusResponse) => {
              clearTimeout(processingTimeout)
              setProcessingStatus({
                status: 'success',
                message: 'Story published successfully! ✨',
                progress: 100,
                storyId: uploadResult.story.id,
                detailedStatus: {
                  ...status,
                  current_step: 'published' // Ensure we're in published state
                }
              })
            },
            // On error
            (error: string) => {
              clearTimeout(processingTimeout)
              setProcessingStatus({
                status: 'error',
                message: 'Processing failed',
                progress: 0,
                storyId: uploadResult.story.id,
                error: error
              })
            },
            3000, // Poll every 3 seconds
            40    // Max 40 retries (2 minutes)
          )
        } catch (pollingError) {
          console.error('Failed to start polling:', pollingError)
          // Fallback to simple success message
          setProcessingStatus({
            status: 'success',
            message: 'Story uploaded! Processing will continue in background.',
            progress: 100,
            storyId: uploadResult.story.id
          })
        }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Story</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload or record your oral tradition and let AI help preserve it for future generations
          </p>
        </div>

        {/* Progress Stepper - Simple version for steps 1-2 */}
        {step < 3 && (
          <div className="mb-10">
            <div className="flex items-center justify-center mb-4">
              {[1, 2, 3].map((stepNum, index) => (
                <div key={stepNum} className="flex items-center">
                  {/* Step Circle */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                    ${step >= stepNum 
                      ? 'bg-griot-600 text-white shadow-lg' 
                      : 'bg-white border-2 border-gray-200 text-gray-400'
                    }
                    transition-all duration-300
                  `}>
                    {stepNum}
                  </div>
                  
                  {/* Connecting Line */}
                  {index < 2 && (
                    <div className={`
                      w-16 h-1 mx-2
                      ${step > stepNum ? 'bg-griot-600' : 'bg-gray-200'}
                      transition-all duration-300
                    `} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <span className="text-sm font-medium text-gray-600">
                {step === 1 && 'Record or Upload Audio'}
                {step === 2 && 'Add Story Details'}
                {step === 3 && 'Processing & Results'}
              </span>
            </div>
          </div>
        )}

        {/* Detailed Processing Stepper - Only show during processing */}
        {step === 3 && processingStatus.detailedStatus && (
          <div className="mb-8">
            <ProcessingStepperComponent
              status={{
                current_step: processingStatus.detailedStatus.current_step,
                progress_percentage: processingStatus.detailedStatus.progress_percentage,
                message: processingStatus.detailedStatus.message,
                error: processingStatus.detailedStatus.error,
                transcript_text: processingStatus.detailedStatus.transcript_text
              }}
            />
          </div>
        )}

        {/* Status Alert - Only show if no detailed status or for upload errors */}
        {(processingStatus.status !== 'idle' && !processingStatus.detailedStatus) && (
          <div className={`
            mb-8 p-4 rounded-xl border shadow-sm
            ${processingStatus.status === 'error' 
              ? 'bg-red-50 border-red-200' 
              : processingStatus.status === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }
          `}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getStatusIcon()}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{processingStatus.message}</p>
                
                {processingStatus.error && (
                  <p className="text-sm text-red-600 mt-1">{processingStatus.error}</p>
                )}
                
                {processingStatus.transcription && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Transcription Preview:</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {processingStatus.transcription.transcript.enhanced_text || processingStatus.transcription.transcript.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Confidence: {Math.round(processingStatus.transcription.transcript.confidence * 100)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {processingStatus.progress > 0 && !processingStatus.detailedStatus && (
              <div className="mt-4">
                <div className="bg-white rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-griot-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${processingStatus.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step 1: Audio Upload/Recording */}
          {step === 1 && (
            <div className="p-8 lg:p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Record or Upload Your Story
              </h2>

              {/* Upload Section */}
              <div className="mb-8">
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                    ${isDragActive 
                      ? 'border-griot-400 bg-griot-50' 
                      : 'border-gray-300 hover:border-griot-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-griot-600 font-medium">Drop your audio file here</p>
                  ) : (
                    <>
                      <p className="text-gray-900 font-medium mb-2">
                        Click to browse or drag and drop your audio file
                      </p>
                      <p className="text-gray-500 text-sm">
                        Supports MP3, WAV, M4A, FLAC, OGG, WebM
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* OR Divider */}
              <div className="flex items-center my-8">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="bg-white px-4 text-gray-500 text-sm">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Recording Section */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Your Story</h3>
                
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Mic size={20} />
                    Start Recording
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-lg font-medium text-gray-900">
                        Recording: {formatTime(recordingTime)}
                      </span>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      <MicOff size={20} />
                      Stop Recording
                    </button>
                  </div>
                )}
              </div>

              {/* Audio Preview */}
              {audioUrl && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Audio Preview</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={playAudio}
                      className="w-12 h-12 bg-griot-600 text-white rounded-full flex items-center justify-center hover:bg-griot-700 transition-colors"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">
                        {audioFile?.name || 'Recorded Audio'}
                      </p>
                      <div className="text-xs text-gray-500">
                        Size: {audioFile ? (audioFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
                      </div>
                    </div>
                    <button
                      onClick={deleteAudio}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={handleQuickTranscribe}
                      className="text-sm text-griot-600 hover:text-griot-800 transition-colors"
                    >
                      Quick Transcribe Preview
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="btn-primary"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Story Details Form */}
          {step === 2 && (
            <div className="p-8 lg:p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Tell Us About Your Story
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Story Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="input-field"
                    placeholder="Enter the title of your story"
                    value={uploadData.title}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Story Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Describe what this story is about, its significance, and any context that would help listeners understand it better"
                    value={uploadData.description}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Storyteller Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="storytellerName" className="block text-sm font-medium text-gray-700 mb-2">
                      Storyteller Name
                    </label>
                    <input
                      type="text"
                      id="storytellerName"
                      name="storytellerName"
                      className="input-field"
                      placeholder="Name of the person telling the story"
                      value={uploadData.storytellerName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                      Language *
                    </label>
                    <select
                      id="language"
                      name="language"
                      required
                      className="input-field"
                      value={uploadData.language}
                      onChange={handleInputChange}
                    >
                      {supportedLanguages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Origin */}
                <div>
                  <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
                    Geographic Origin
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      id="origin"
                      name="origin"
                      className="input-field pl-10"
                      placeholder="e.g., Nairobi, Kenya or Zanzibar, Tanzania"
                      value={uploadData.origin}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Storyteller Bio */}
                <div>
                  <label htmlFor="storytellerBio" className="block text-sm font-medium text-gray-700 mb-2">
                    About the Storyteller
                  </label>
                  <textarea
                    id="storytellerBio"
                    name="storytellerBio"
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Brief background about the storyteller (optional)"
                    value={uploadData.storytellerBio}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {uploadData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-griot-100 text-griot-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-griot-600 hover:text-griot-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a tag"
                      className="input-field flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                        addTag(input.value)
                        input.value = ''
                      }}
                      className="btn-secondary"
                    >
                      Add Tag
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested: folklore, traditional, wisdom, family story, legend, historical
                  </p>
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="consentGiven"
                    name="consentGiven"
                    required
                    className="
                      w-4 h-4 text-griot-600 border-gray-300 rounded 
                      focus:ring-griot-500 focus:ring-2 mt-0.5
                    "
                    checked={uploadData.consentGiven}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="consentGiven" className="text-sm text-gray-700 leading-relaxed">
                    I consent to sharing this story publicly on Digital Griot platform and understand 
                    that it will be available for global access, transcription, and translation.
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
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
            <div className="p-8 lg:p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Story Summary
              </h2>

              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{uploadData.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{uploadData.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Story Details</h4>
                    <div className="space-y-1 text-gray-600">
                      <p><span className="font-medium">Language:</span> {supportedLanguages.find(l => l.code === uploadData.language)?.name}</p>
                      {uploadData.storytellerName && (
                        <p><span className="font-medium">Storyteller:</span> {uploadData.storytellerName}</p>
                      )}
                      {uploadData.origin && (
                        <p><span className="font-medium">Origin:</span> {uploadData.origin}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Audio File</h4>
                    <div className="space-y-1 text-gray-600">
                      <p><span className="font-medium">File:</span> {audioFile?.name}</p>
                      <p><span className="font-medium">Size:</span> {audioFile ? (audioFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</p>
                      <p><span className="font-medium">Type:</span> {audioFile?.type}</p>
                    </div>
                  </div>
                </div>

                {uploadData.storytellerBio && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">About the Storyteller</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{uploadData.storytellerBio}</p>
                  </div>
                )}

                {uploadData.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {uploadData.tags.map((tag) => (
                        <span key={tag} className="bg-griot-100 text-griot-700 px-2 py-1 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success State */}
                {(processingStatus.status === 'success' || 
                  (processingStatus.detailedStatus && processingStatus.detailedStatus.current_step === 'published')) && 
                 processingStatus.storyId && (
                  <div className="pt-6 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-green-800 mb-2">🎉 Success!</h4>
                      <p className="text-green-700 mb-4 leading-relaxed">
                        Your story has been uploaded and processed successfully! You can now view it and share it with the world.
                      </p>
                      <div className="flex gap-4">
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

                {/* Debug Info */}
                {processingStatus.storyId && import.meta.env.DEV && (
                  <div className="pt-4 border-t border-gray-100">
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">Debug Info</summary>
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <p><strong>Status:</strong> {processingStatus.status}</p>
                        <p><strong>Story ID:</strong> {processingStatus.storyId}</p>
                        {processingStatus.detailedStatus && (
                          <>
                            <p><strong>Current Step:</strong> {processingStatus.detailedStatus.current_step}</p>
                            <p><strong>Progress:</strong> {processingStatus.detailedStatus.progress_percentage}%</p>
                            <p><strong>Message:</strong> {processingStatus.detailedStatus.message}</p>
                          </>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/v1/ai/debug/story/${processingStatus.storyId}`, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                              })
                              const debug = await response.json()
                              console.log('Debug info:', debug)
                              alert('Debug info logged to console')
                            } catch (error) {
                              console.error('Debug failed:', error)
                            }
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800 underline"
                        >
                          Check Debug Info
                        </button>
                      </div>
                    </details>
                  </div>
                )}

                {/* Action Buttons - Only show if not in final success state */}
                {!(processingStatus.status === 'success' || 
                   (processingStatus.detailedStatus && processingStatus.detailedStatus.current_step === 'published')) && (
                  <div className="flex justify-between pt-6 border-t border-gray-200">
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
                      disabled={processingStatus.status === 'uploading' || processingStatus.status === 'processing'}
                    >
                      {processingStatus.status === 'uploading' ? 'Uploading...' : 
                       processingStatus.status === 'processing' ? 'Processing...' : 'Upload Story'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 