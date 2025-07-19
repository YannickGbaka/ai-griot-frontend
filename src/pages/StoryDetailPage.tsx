import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Pause, Volume2, Share2, Heart, MapPin, Clock, User, Tag, Star, ChevronDown, ChevronUp } from 'lucide-react'

interface Story {
  id: string
  title: string
  description: string
  storyteller: string
  storytellerBio: string
  origin: string
  language: string
  duration: string
  audioUrl: string
  transcript: TranscriptSegment[]
  translations: Translation[]
  tags: string[]
  views: number
  listens: number
  rating: number
  reviewCount: number
  submittedAt: string
}

interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface Translation {
  language: string
  text: string
}

// Mock data
const mockStory: Story = {
  id: '1',
  title: 'The Creation of the Baobab Tree',
  description: 'An ancient tale about how the mighty baobab tree came to be, passed down through generations in the Mandé people. This story explains not only the unique appearance of the baobab tree but also teaches important lessons about humility and respect for nature.',
  storyteller: 'Amara Diallo',
  storytellerBio: 'Amara Diallo is a traditional griot from Mali who has dedicated her life to preserving the oral traditions of her people. She learned these stories from her grandmother and has been sharing them for over 30 years.',
  origin: 'Mali, West Africa',
  language: 'Bambara',
  duration: '8:45',
  audioUrl: '/api/audio/story-1.mp3', // Mock URL
  transcript: [
    { start: 0, end: 15, text: 'Long ago, when the world was young and the gods still walked among us...' },
    { start: 15, end: 32, text: 'There lived a magnificent tree, the most beautiful in all the forest.' },
    { start: 32, end: 48, text: 'This tree was proud of its beauty and looked down upon all other plants.' },
    { start: 48, end: 65, text: 'The tree would say to the grass, "Look how small and insignificant you are!"' },
    { start: 65, end: 82, text: 'To the flowers it would boast, "Your beauty fades in a day, while mine lasts forever!"' }
  ],
  translations: [
    { language: 'English', text: 'Long ago, when the world was young and the gods still walked among us, there lived a magnificent tree, the most beautiful in all the forest. This tree was proud of its beauty and looked down upon all other plants...' },
    { language: 'French', text: 'Il y a longtemps, quand le monde était jeune et que les dieux marchaient encore parmi nous, vivait un arbre magnifique, le plus beau de toute la forêt. Cet arbre était fier de sa beauté et méprisait toutes les autres plantes...' },
    { language: 'Spanish', text: 'Hace mucho tiempo, cuando el mundo era joven y los dioses aún caminaban entre nosotros, vivía un árbol magnífico, el más hermoso de todo el bosque. Este árbol estaba orgulloso de su belleza y despreciaba a todas las demás plantas...' }
  ],
  tags: ['creation myth', 'nature', 'folklore', 'wisdom tale', 'baobab', 'humility'],
  views: 1243,
  listens: 987,
  rating: 4.8,
  reviewCount: 47,
  submittedAt: '2024-01-10'
}

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [selectedTranslation, setSelectedTranslation] = useState('Original')
  const [isLiked, setIsLiked] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showStorytellerBio, setShowStorytellerBio] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  // Mock audio duration since we don't have real audio
  useEffect(() => {
    setDuration(525) // 8:45 in seconds
    // TODO: Replace with actual API call using id parameter
    console.log('Loading story with ID:', id)
  }, [id])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getActiveTranscriptIndex = () => {
    return mockStory.transcript.findIndex(segment => 
      currentTime >= segment.start && currentTime < segment.end
    )
  }

  const getCurrentTranslationText = () => {
    if (selectedTranslation === 'Original') {
      return mockStory.transcript.map(segment => segment.text).join(' ')
    }
    
    const translation = mockStory.translations.find(t => t.language === selectedTranslation)
    return translation?.text || ''
  }

  const shareStory = () => {
    if (navigator.share) {
      navigator.share({
        title: mockStory.title,
        text: mockStory.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link to="/stories" className="text-griot-600 hover:text-griot-700 font-medium">
            ← Back to Stories
          </Link>
        </nav>

        {/* Story Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{mockStory.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <User size={16} />
                  <span>by {mockStory.storyteller}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{mockStory.origin}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{mockStory.duration}</span>
                </div>
                <span className="bg-griot-100 text-griot-700 px-2 py-1 rounded text-xs font-medium">
                  {mockStory.language}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>{mockStory.views.toLocaleString()} views</span>
                <span>{mockStory.listens.toLocaleString()} listens</span>
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-500 fill-current" size={16} />
                  <span>{mockStory.rating}/5.0 ({mockStory.reviewCount} reviews)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {mockStory.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-3 rounded-full border transition-colors ${
                  isLiked 
                    ? 'bg-red-100 border-red-300 text-red-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart size={20} className={isLiked ? 'fill-current' : ''} />
              </button>
              <button
                onClick={shareStory}
                className="p-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Story Description */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              {showFullDescription 
                ? mockStory.description 
                : mockStory.description.slice(0, 200) + (mockStory.description.length > 200 ? '...' : '')
              }
              {mockStory.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-griot-600 hover:text-griot-700 ml-2 font-medium"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          </div>

          {/* Storyteller Bio */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowStorytellerBio(!showStorytellerBio)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-griot-600 transition-colors"
            >
              About the Storyteller
              {showStorytellerBio ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showStorytellerBio && (
              <p className="mt-4 text-gray-700 leading-relaxed">{mockStory.storytellerBio}</p>
            )}
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Listen to Story</h2>
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-6 mb-6">
              <button
                onClick={togglePlayPause}
                className="bg-griot-600 hover:bg-griot-700 text-white rounded-full p-4 transition-colors"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full"
              />
            </div>

            {/* Mock audio element */}
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            >
              <source src={mockStory.audioUrl} type="audio/mpeg" />
            </audio>
          </div>
        </div>

        {/* Transcript and Translations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Transcript & Translations</h2>
            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-griot-500"
            >
              <option value="Original">Original ({mockStory.language})</option>
              {mockStory.translations.map(translation => (
                <option key={translation.language} value={translation.language}>
                  {translation.language}
                </option>
              ))}
            </select>
          </div>

          <div className="prose max-w-none">
            {selectedTranslation === 'Original' ? (
              <div className="space-y-3">
                {mockStory.transcript.map((segment, index) => (
                  <p
                    key={index}
                    className={`leading-relaxed cursor-pointer transition-colors p-2 rounded ${
                      getActiveTranscriptIndex() === index
                        ? 'bg-griot-100 text-griot-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setCurrentTime(segment.start)
                      if (audioRef.current) {
                        audioRef.current.currentTime = segment.start
                      }
                    }}
                  >
                    {segment.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-gray-700 leading-relaxed">
                <p>{getCurrentTranslationText()}</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p>
              💡 <strong>Tip:</strong> When viewing the original transcript, click on any paragraph to jump to that part of the audio.
              Translations are generated by AI and may not capture all cultural nuances.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 