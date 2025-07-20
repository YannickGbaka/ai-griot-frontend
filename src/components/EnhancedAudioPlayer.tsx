import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Image as ImageIcon } from 'lucide-react'

interface Paragraph {
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

interface EnhancedAudioPlayerProps {
  audioUrl: string
  title?: string
  paragraphs?: Paragraph[]
  onTimeUpdate?: (currentTime: number) => void
  onPlay?: () => void
  onPause?: () => void
  onParagraphChange?: (paragraph: Paragraph | null) => void
  className?: string
}

export default function EnhancedAudioPlayer({
  audioUrl,
  title,
  paragraphs = [],
  onTimeUpdate,
  onPlay,
  onPause,
  onParagraphChange,
  className = ''
}: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentParagraph, setCurrentParagraph] = useState<Paragraph | null>(null)
  const [currentIllustration, setCurrentIllustration] = useState<string | null>(null)
  const [showImageGallery, setShowImageGallery] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Find current paragraph based on time
  const findCurrentParagraph = useCallback((time: number): Paragraph | null => {
    return paragraphs.find(p => time >= p.start_time && time < p.end_time) || null
  }, [paragraphs])

  // Update current paragraph and illustration
  const updateCurrentContent = useCallback((time: number) => {
    const paragraph = findCurrentParagraph(time)
    
    if (paragraph !== currentParagraph) {
      setCurrentParagraph(paragraph)
      onParagraphChange?.(paragraph)
      
      // Update current illustration
      if (paragraph && paragraph.illustrations.length > 0) {
        const activeIllustration = paragraph.illustrations.find(ill => ill.status === 'generated')
        setCurrentIllustration(activeIllustration?.image_url || null)
      } else {
        setCurrentIllustration(null)
      }
    }
  }, [findCurrentParagraph, currentParagraph, onParagraphChange])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadStart = () => setIsLoading(true)
    const handleLoadedData = () => {
      setIsLoading(false)
      setDuration(audio.duration)
      setError(null)
    }
    const handleError = () => {
      setIsLoading(false)
      console.error('Audio failed to load:', audioUrl)
      setError('Failed to load audio')
    }
    const handleTimeUpdate = () => {
      const time = audio.currentTime
      setCurrentTime(time)
      onTimeUpdate?.(time)
      updateCurrentContent(time)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      onPause?.()
    }

    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('error', handleError)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl, onTimeUpdate, onPause, updateCurrentContent])

  const togglePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
        onPause?.()
      } else {
        await audio.play()
        setIsPlaying(true)
        onPlay?.()
      }
    } catch (err) {
      console.error('Audio playback error:', err)
      setError('Failed to play audio')
      setIsPlaying(false)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
    updateCurrentContent(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume > 0 ? volume : 0.5
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    audio.currentTime = newTime
    setCurrentTime(newTime)
    updateCurrentContent(newTime)
  }

  const jumpToParagraph = (paragraph: Paragraph) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = paragraph.start_time
    setCurrentTime(paragraph.start_time)
    updateCurrentContent(paragraph.start_time)
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Image Display */}
      {currentIllustration && (
        <div className="relative w-full h-64 bg-gray-100 rounded-t-lg overflow-hidden">
          <img
            ref={imageRef}
            src={currentIllustration}
            alt="Story illustration"
            className="w-full h-full object-cover transition-opacity duration-500"
            onLoad={() => {
              if (imageRef.current) {
                imageRef.current.style.opacity = '1'
              }
            }}
            style={{ opacity: 0 }}
          />
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowImageGallery(!showImageGallery)}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ImageIcon size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Audio Player Controls */}
      <div className="p-4">
        {title && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-900">{title}</h3>
          </div>
        )}

        {/* Current Paragraph Display */}
        {currentParagraph && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 leading-relaxed">
              {currentParagraph.content}
            </p>
            <div className="mt-2 text-xs text-blue-600">
              Paragraph {currentParagraph.sequence_order + 1} of {paragraphs.length}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <input
            ref={progressRef}
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => skip(-10)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              <SkipBack size={20} />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button
              onClick={() => skip(10)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Paragraph Navigation */}
        {paragraphs.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Paragraphs</h4>
            <div className="flex flex-wrap gap-2">
              {paragraphs.map((paragraph, index) => (
                <button
                  key={paragraph.id}
                  onClick={() => jumpToParagraph(paragraph)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    currentParagraph?.id === paragraph.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && currentParagraph && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Illustrations for Paragraph {currentParagraph.sequence_order + 1}</h3>
              <button
                onClick={() => setShowImageGallery(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {currentParagraph.illustrations.map((illustration) => (
                <div key={illustration.id} className="border rounded-lg p-4">
                  <img
                    src={illustration.image_url}
                    alt="Story illustration"
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Style:</strong> {illustration.style}</p>
                    <p><strong>Prompt:</strong> {illustration.prompt_used}</p>
                    <p><strong>Generation Time:</strong> {illustration.generation_time.toFixed(1)}s</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 