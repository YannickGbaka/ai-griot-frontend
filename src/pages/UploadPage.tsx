import { useState, useRef } from 'react'
import { Upload, Mic, MicOff, Play, Pause, Trash2, MapPin } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

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

export default function UploadPage() {
  const [step, setStep] = useState(1)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadData, setUploadData] = useState<UploadData>({
    title: '',
    description: '',
    storytellerName: '',
    storytellerBio: '',
    language: '',
    origin: '',
    tags: [],
    consentGiven: false
  })
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<number | null>(null)

  // File upload with dropzone
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file)
      setAudioUrl(URL.createObjectURL(file))
      setStep(2)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg']
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement upload logic
    console.log('Upload data:', { audioFile, uploadData })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
            {step === 3 && 'Review & Submit'}
          </div>
        </div>

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
                      Supports MP3, WAV, M4A, FLAC, OGG (max 100MB)
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
                  {audioUrl && (
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  )}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  Continue to Story Details
                </button>
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
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="Arabic">العربية</option>
                    <option value="Mandarin">中文</option>
                    <option value="Hindi">हिन्दी</option>
                    <option value="Portuguese">Português</option>
                    <option value="Other">Other</option>
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
                  placeholder="e.g. folklore, creation myth, wisdom tale"
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
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary"
                  disabled={!uploadData.title || !uploadData.description || !uploadData.language || !uploadData.consentGiven}
                >
                  Review Submission
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6">Review Your Submission</h2>
            
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
                    <p>{uploadData.language}</p>
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
                >
                  Submit Story
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 