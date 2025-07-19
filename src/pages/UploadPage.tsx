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
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-griot-50 to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Share Your Story
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Help preserve cultural heritage by sharing oral traditions with the world
          </p>
          
          {/* Swahili Focus Badge */}
          <div className="inline-flex items-center gap-2 bg-griot-100 text-griot-800 px-4 py-2 rounded-full text-sm font-medium">
            <span className="text-griot-600">🎯</span>
            <span><strong>Swahili Focus:</strong> Enhanced support for East African storytelling traditions</span>
          </div>
        </header>

        {/* Progress Steps */}
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

        {/* Status Alert */}
        {processingStatus.status !== 'idle' && (
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
            
            {processingStatus.progress > 0 && (
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
              
              {!audioFile ? (
                <div className="space-y-12">
                  {/* Upload Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Audio File</h3>
                    <div
                      {...getRootProps()}
                      className={`
                        relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer 
                        transition-all duration-200 ease-in-out
                        ${isDragActive 
                          ? 'border-griot-400 bg-griot-50 scale-105' 
                          : 'border-gray-300 hover:border-griot-400 hover:bg-gray-50'
                        }
                      `}
                    >
                      <input {...getInputProps()} />
                      <Upload className="mx-auto w-16 h-16 text-gray-400 mb-4" />
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        {isDragActive ? 'Drop the file here' : 'Drop your audio file here'}
                      </h4>
                      <p className="text-gray-600 mb-4">or click to select a file</p>
                      <p className="text-sm text-gray-500">
                        Supports MP3, WAV, M4A, FLAC, OGG, WebM (max 100MB)
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-4 text-sm font-medium text-gray-500">OR</span>
                    </div>
                  </div>

                  {/* Recording Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Record Live</h3>
                    <div className="text-center">
                      {!isRecording ? (
                        <div className="space-y-4">
                          <button
                            onClick={startRecording}
                            className="
                              bg-red-500 hover:bg-red-600 text-white rounded-full p-8 
                              transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl
                            "
                          >
                            <Mic className="w-8 h-8" />
                          </button>
                          <p className="text-gray-600">Click the microphone to start recording</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-center gap-6">
                            <div className="bg-red-500 rounded-full p-8 animate-pulse shadow-lg">
                              <MicOff className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-3xl font-mono text-red-600 font-bold">
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
                    </div>
                  </div>
                </div>
              ) : (
                /* Audio Preview */
                <div className="text-center space-y-6">
                  <div className="bg-gray-50 rounded-xl p-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button
                        onClick={playAudio}
                        className="
                          bg-griot-600 hover:bg-griot-700 text-white rounded-full p-3 
                          transition-colors shadow-md hover:shadow-lg
                        "
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                      <div className="text-lg font-medium text-gray-900 truncate max-w-xs">
                        {audioFile.name}
                      </div>
                      <button
                        onClick={deleteAudio}
                        className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500 space-x-4">
                      <span>Size: {mediaService.formatFileSize(audioFile.size)}</span>
                      <span>•</span>
                      <span>Est. Duration: {mediaService.formatDuration(mediaService.estimateAudioDuration(audioFile))}</span>
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
                  
                  <div className="flex justify-center gap-4">
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
            <div className="p-8 lg:p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Add Story Details
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title & Language Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Story Title <span className="text-red-500">*</span>
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

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Language <span className="text-red-500">*</span>
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

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Story Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    className="input-field resize-none"
                    value={uploadData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the story, its cultural significance, and any important context"
                  />
                </div>

                {/* Storyteller & Origin Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
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

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Origin/Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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

                {/* Storyteller Bio */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Storyteller Bio <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    name="storytellerBio"
                    rows={3}
                    className="input-field resize-none"
                    value={uploadData.storytellerBio}
                    onChange={handleInputChange}
                    placeholder="Brief background about the storyteller"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tags <span className="text-gray-500">(Press Enter to add)</span>
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
                  {uploadData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {uploadData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="
                            inline-flex items-center gap-2 bg-griot-100 text-griot-700 
                            px-3 py-1 rounded-full text-sm font-medium
                          "
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tag)}
                            className="text-griot-500 hover:text-griot-700 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consent Checkbox */}
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
                Upload Complete
              </h2>
              
              <div className="space-y-8">
                {/* Audio Review */}
                <div className="pb-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Audio File</h3>
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                    <button
                      onClick={playAudio}
                      className="
                        bg-griot-600 hover:bg-griot-700 text-white rounded-full p-2 
                        transition-colors shadow-sm
                      "
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="font-medium text-gray-900 truncate">
                      {audioFile?.name}
                    </span>
                  </div>
                </div>

                {/* Story Details Review */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Title</h4>
                      <p className="text-gray-900">{uploadData.title}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Language</h4>
                      <p className="text-gray-900">{aiService.getLanguageName(uploadData.language)}</p>
                    </div>
                    {uploadData.storytellerName && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Storyteller</h4>
                        <p className="text-gray-900">{uploadData.storytellerName}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                      <p className="text-gray-900 text-sm leading-relaxed">{uploadData.description}</p>
                    </div>
                    {uploadData.origin && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Origin</h4>
                        <p className="text-gray-900">{uploadData.origin}</p>
                      </div>
                    )}
                  </div>
                </div>

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

                {processingStatus.status === 'success' && processingStatus.storyId && (
                  <div className="pt-6 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-green-800 mb-2">🎉 Success!</h4>
                      <p className="text-green-700 mb-4 leading-relaxed">
                        Your story has been uploaded and AI processing has started. You can view the results once processing is complete.
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

                {processingStatus.status !== 'success' && (
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
    </div>
  )
} 