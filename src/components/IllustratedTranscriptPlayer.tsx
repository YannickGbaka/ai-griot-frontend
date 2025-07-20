import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Globe, Image, Eye, EyeOff } from 'lucide-react'

interface Word {
  word: string
  start_time: number
  end_time: number
}

interface TranscriptData {
  text: string
  words: Word[]
  confidence: number
  enhanced_text?: string
}

interface Translation {
  language: string
  text: string
  words?: Word[]
}

interface Paragraph {
  id: string
  sequence_order: number  // Changed from paragraph_index
  content: string  // Changed from text
  start_time?: number
  end_time?: number
  word_count?: number
  illustrations: Illustration[]
}

interface Illustration {
  id: string
  image_url: string
  prompt_used?: string
  style?: string  // Changed from style_description
  generation_metadata?: Record<string, unknown>
}

interface IllustratedTranscriptPlayerProps {
  audioUrl: string
  transcript: TranscriptData
  title: string
  translations?: Translation[]
  paragraphs?: Paragraph[]
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
}

export default function IllustratedTranscriptPlayer({ 
  audioUrl, 
  transcript, 
  title,
  translations = [],
  paragraphs = [],
  onTimeUpdate,
  onEnded 
}: IllustratedTranscriptPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [showTranscript, setShowTranscript] = useState(true)
  const [showIllustrations, setShowIllustrations] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('original')
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(-1)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const currentWordRef = useRef<HTMLSpanElement>(null)
  const illustrationRef = useRef<HTMLDivElement>(null)
  
  // Get current transcript data based on selected language
  const getCurrentTranscript = () => {
    if (selectedLanguage === 'original') {
      return transcript
    }
    const translation = translations.find(t => t.language === selectedLanguage)
    if (translation && translation.words) {
      return {
        text: translation.text,
        words: translation.words,
        confidence: transcript.confidence,
        enhanced_text: translation.text
      }
    }
    return transcript
  }
  
  const currentTranscript = getCurrentTranscript()
  
  // Debug logging
  console.log('🎨 IllustratedTranscriptPlayer Debug:', {
    audioUrl,
    transcript,
    translations,
    paragraphs,
    selectedLanguage,
    currentTranscript
  })
  
  // Monitor transcript data changes
  useEffect(() => {
    console.log('🔄 Transcript data changed:', {
      transcript,
      translations,
      paragraphs,
      currentTranscript,
      wordsCount: currentTranscript?.words?.length || 0
    })
  }, [transcript, translations, paragraphs, currentTranscript])
  
  // Handle audio time updates
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return
    
    const time = audioRef.current.currentTime
    setCurrentTime(time)
    onTimeUpdate?.(time)
    
    // Find current word based on timestamp
    const wordIndex = currentTranscript.words.findIndex(word => 
      time >= word.start_time && time <= word.end_time
    )
    
    if (wordIndex !== currentWordIndex) {
      setCurrentWordIndex(wordIndex)
      
      // Scroll to current word
      if (currentWordRef.current) {
        currentWordRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
    
    // Find current paragraph based on timestamp
    const paragraphIndex = paragraphs.findIndex(paragraph => 
      paragraph.start_time !== undefined && 
      paragraph.end_time !== undefined &&
      time >= paragraph.start_time && time <= paragraph.end_time
    )
    
    if (paragraphIndex !== currentParagraphIndex) {
      setCurrentParagraphIndex(paragraphIndex)
      
      // Scroll to current illustration
      if (illustrationRef.current && paragraphIndex >= 0) {
        illustrationRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [currentTranscript.words, currentWordIndex, paragraphs, currentParagraphIndex, onTimeUpdate])
  
  // Handle audio loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }
  
  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    setCurrentWordIndex(-1)
    setCurrentParagraphIndex(-1)
    onEnded?.()
  }
  
  // Play/pause toggle
  const togglePlayPause = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }
  
  // Seek to specific time
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }
  
  // Skip forward/backward
  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      seekTo(newTime)
    }
  }
  
  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Get language name
  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      'original': 'Original',
      'sw': 'Swahili',
      'en': 'English',
      'fr': 'French',
      'es': 'Spanish',
      'ar': 'Arabic'
    }
    return languages[code] || code
  }
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Audio Player Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIllustrations(!showIllustrations)}
              className="text-sm text-griot-600 hover:text-griot-800 transition-colors flex items-center gap-1"
            >
              {showIllustrations ? <EyeOff size={16} /> : <Eye size={16} />}
              {showIllustrations ? 'Hide' : 'Show'} Illustrations
            </button>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-sm text-griot-600 hover:text-griot-800 transition-colors"
            >
              {showTranscript ? 'Hide' : 'Show'} Transcript
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-griot-600 transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => skip(-10)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Skip backward 10s"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 bg-griot-600 text-white rounded-full flex items-center justify-center hover:bg-griot-700 transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button
            onClick={() => skip(10)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Skip forward 10s"
          >
            <SkipForward size={20} />
          </button>
          
          <button
            onClick={toggleMute}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex">
        {/* Illustrations Panel */}
        {showIllustrations && (
          <div className="w-1/2 p-6 bg-gray-50 border-r border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Image size={20} />
              Story Illustrations
            </h4>
            
            {paragraphs.length === 0 ? (
              <div className="text-center py-8">
                <Image size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No illustrations available yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Illustrations will be generated during story processing
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {paragraphs.map((paragraph, index) => {
                  const isCurrent = index === currentParagraphIndex
                  const illustration = paragraph.illustrations[0]
                  
                  return (
                    <div
                      key={paragraph.id}
                      ref={isCurrent ? illustrationRef : null}
                      className={`
                        p-4 rounded-lg border-2 transition-all duration-300
                        ${isCurrent 
                          ? 'border-griot-600 bg-griot-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      {illustration ? (
                        <div className="space-y-3">
                          <img
                            src={illustration.image_url}
                            alt={`Illustration for paragraph ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              // Fallback for failed images
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDMyMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgNjRDMjA4LjggNjQgMjQ4IDEwMy4yIDI0OCAxNTJDMjQ4IDIwMC44IDIwOC44IDI0MCAxNjAgMjQwQzExMS4yIDI0MCA3MiAyMDAuOCA3MiAxNTJDNzIgMTAzLjIgMTExLjIgNjQgMTYwIDY0WiIgZmlsbD0iI0QxRDVEMyIvPgo8cGF0aCBkPSJNMTYwIDg4QzE3Ni41IDg4IDE5MCAxMDEuNSAxOTAgMTE4QzE5MCAxMzQuNSAxNzYuNSAxNDggMTYwIDE0OEMxNDMuNSAxNDggMTMwIDEzNC41IDEzMCAxMThDMTMwIDEwMS41IDE0My41IDg4IDE2MCA4OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                            }}
                          />
                          <div className="text-xs text-gray-600">
                            <p className="font-medium">Paragraph {index + 1}</p>
                            <p className="text-gray-500 truncate">
                              {paragraph.content.substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                          <div className="text-center">
                            <Image size={32} className="text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Illustration generating...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Transcript Panel */}
        {showTranscript && (
          <div className={`p-6 bg-gray-50 ${showIllustrations ? 'w-1/2' : 'w-full'} max-h-96 overflow-y-auto`}>
            {/* Language Selector */}
            {translations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Language:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedLanguage('original')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedLanguage === 'original'
                        ? 'bg-griot-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {getLanguageName('original')}
                  </button>
                  {translations.map((translation) => (
                    <button
                      key={translation.language}
                      onClick={() => setSelectedLanguage(translation.language)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedLanguage === translation.language
                          ? 'bg-griot-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {getLanguageName(translation.language)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {getLanguageName(selectedLanguage)} Transcript
              </h4>
              <div className="text-xs text-gray-500">
                Confidence: {Math.round(currentTranscript.confidence * 100)}%
              </div>
            </div>
            
            <div 
              ref={transcriptRef}
              className="text-gray-800 leading-relaxed"
            >
              {currentTranscript.words.map((word, index) => (
                <span
                  key={index}
                  ref={index === currentWordIndex ? currentWordRef : null}
                  className={`
                    inline-block mr-1 px-1 py-0.5 rounded transition-all duration-200
                    ${index === currentWordIndex 
                      ? 'bg-griot-600 text-white font-medium' 
                      : 'hover:bg-gray-200 cursor-pointer'
                    }
                  `}
                  onClick={() => seekTo(word.start_time)}
                  title={`Click to jump to ${formatTime(word.start_time)}`}
                >
                  {word.word}
                </span>
              ))}
            </div>
            
            {/* Enhanced Text (if available) */}
            {currentTranscript.enhanced_text && currentTranscript.enhanced_text !== currentTranscript.text && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Enhanced Version</h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {currentTranscript.enhanced_text}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />
    </div>
  )
} 