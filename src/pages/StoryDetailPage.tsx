import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Clock, User, Tag, Star, ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { storiesService } from '../services/storiesService'
import { mediaService } from '../services/mediaService'
import { StoryResponse } from '../types/api'
import AudioPlayer from '../components/AudioPlayer'
import TranscriptViewer from '../components/TranscriptViewer'

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [story, setStory] = useState<StoryResponse | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showStorytellerBio, setShowStorytellerBio] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('Story ID not provided')
      setIsLoading(false)
      return
    }

    const fetchStory = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch story details
        const storyData = await storiesService.getStory(id)
        setStory(storyData)

        // Get audio URL if story has audio
        if (storyData.audio_file_url) {
          try {
            const audioResponse = await mediaService.getAudioUrl(storyData.id)
            setAudioUrl(audioResponse.audio_url)
          } catch (audioError) {
            console.warn('Failed to get audio URL:', audioError)
            // Use the original URL as fallback
            setAudioUrl(storyData.audio_file_url)
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load story')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStory()
  }, [id])

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getLanguageLabel = (code: string): string => {
    const labels: Record<string, string> = {
      'en-US': 'English (US)',
      'en': 'English',
      'sw-KE': 'Swahili (Kenya)',
      'sw': 'Swahili',
      'fr-FR': 'French (France)',
      'fr': 'French',
      'es': 'Spanish',
      'ar': 'Arabic',
      'pt': 'Portuguese'
    }
    return labels[code] || code
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  const handlePlay = () => {
    // Increment listen count (could be optimized to only count once per session)
    if (story?.analytics) {
      // This would typically be handled by the backend
      console.log('Incrementing listen count for story:', story.id)
    }
  }

  const retry = () => {
    window.location.reload()
  }

  // Prepare transcript data for components
  const transcript = story?.transcript ? {
    id: story.transcript.id,
    language: story.transcript.language,
    text: story.transcript.text,
    segments: story.transcript.segments || [],
    confidence: story.transcript.confidence
  } : undefined

  const translations = story?.translations || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-griot-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading story...</h2>
          <p className="text-gray-600">Please wait while we fetch the story details</p>
        </div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load story</h2>
          <p className="text-gray-600 mb-4">{error || 'Story not found'}</p>
          <div className="flex gap-4 justify-center">
            <Link to="/stories" className="btn-secondary">
              <ArrowLeft size={16} className="mr-2" />
              Back to Stories
            </Link>
            <button onClick={retry} className="btn-primary flex items-center gap-2">
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link to="/stories" className="inline-flex items-center text-griot-600 hover:text-griot-700 mb-6">
          <ArrowLeft size={16} className="mr-2" />
          Back to Stories
        </Link>

        {/* Story Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{story.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <User size={16} className="mr-2" />
                  <span>by {story.storyteller_name}</span>
                </div>
                
                {story.origin && (
                  <div className="flex items-center text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    <span>{story.origin}</span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <Clock size={16} className="mr-2" />
                  <span>{formatTime(story.duration_seconds)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-griot-100 text-griot-700 px-3 py-1 rounded-full text-sm font-medium">
                  {getLanguageLabel(story.language)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  story.status === 'published' 
                    ? 'bg-green-100 text-green-700'
                    : story.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {story.status === 'published' ? 'Published' : 
                   story.status === 'processing' ? 'Processing...' : 'Failed'}
                </span>
              </div>
            </div>

            {/* Story Stats */}
            <div className="flex gap-6 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-griot-600">
                  {story.analytics?.views?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-griot-600">
                  {story.analytics?.listens?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Listens</div>
              </div>
              {story.analytics?.average_rating && (
                <div className="text-center">
                  <div className="flex items-center justify-center text-2xl font-bold text-griot-600">
                    <Star size={20} className="mr-1 fill-current" />
                    {story.analytics.average_rating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-3">About this story</h3>
            <div className="text-gray-700">
              <p className={showFullDescription ? '' : 'line-clamp-3'}>
                {story.description}
              </p>
              {story.description && story.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-griot-600 hover:text-griot-700 font-medium mt-2 flex items-center"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                  {showFullDescription ? 
                    <ChevronUp size={16} className="ml-1" /> : 
                    <ChevronDown size={16} className="ml-1" />
                  }
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <span key={tag.id} className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    <Tag size={14} className="mr-1" />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-6">
            <AudioPlayer
              audioUrl={audioUrl}
              title={story.title}
              transcript={transcript?.segments || []}
              onTimeUpdate={setCurrentTime}
              onPlay={handlePlay}
            />
          </div>
        )}

        {/* Transcript Viewer */}
        <div className="mb-6">
          <TranscriptViewer
            transcript={transcript}
            translations={translations}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
        </div>

        {/* Storyteller Bio */}
        {story.storyteller_bio && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">About the Storyteller</h3>
              <button
                onClick={() => setShowStorytellerBio(!showStorytellerBio)}
                className="text-griot-600 hover:text-griot-700"
              >
                {showStorytellerBio ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            
            {showStorytellerBio && (
              <div className="text-gray-700">
                <p className="whitespace-pre-wrap">{story.storyteller_bio}</p>
              </div>
            )}
          </div>
        )}

        {/* Story Metadata */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Story Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Contributed by:</span>
              <span className="ml-2 text-gray-600">{story.contributor.full_name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Submitted:</span>
              <span className="ml-2 text-gray-600">{formatDate(story.created_at)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Language:</span>
              <span className="ml-2 text-gray-600">{getLanguageLabel(story.language)}</span>
            </div>
            {story.duration_seconds && (
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <span className="ml-2 text-gray-600">{formatTime(story.duration_seconds)}</span>
              </div>
            )}
            {story.file_size_bytes && (
              <div>
                <span className="font-medium text-gray-700">File Size:</span>
                <span className="ml-2 text-gray-600">
                  {(story.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            )}
            {story.origin && (
              <div>
                <span className="font-medium text-gray-700">Region:</span>
                <span className="ml-2 text-gray-600">{story.origin}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 