import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Heart, BookOpen, Globe } from 'lucide-react'
import { storiesService } from '../services/storiesService'
import IllustratedTranscriptPlayer from '../components/IllustratedTranscriptPlayer'

interface StoryDetail {
  id: string
  title: string
  description: string
  storyteller_name: string
  storyteller_bio?: string
  language: string
  origin: string
  audio_file_url: string
  duration_seconds: number
  status: string
  created_at: string
  contributor: {
    id: string
    full_name: string
    bio?: string
  }
  transcript: {
    original_text: string
    enhanced_text: string
    words: Array<{
      word: string
      start_time: number
      end_time: number
    }>
    confidence: number
  } | null
  translations: Array<{
    language: string
    text: string
    words?: Array<{
      word: string
      start_time: number
      end_time: number
    }>
  }>
  paragraphs: Array<{
    id: string
    sequence_order: number  // Changed from paragraph_index
    content: string  // Changed from text
    start_time?: number
    end_time?: number
    word_count?: number
    illustrations: Array<{
      id: string
      image_url: string
      prompt_used?: string
      style?: string  // Changed from style_description
      generation_metadata?: Record<string, unknown>
    }>
  }>
  analytics: {
    views: number
    listens: number
    average_rating: number
  } | null
}

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const [story, setStory] = useState<StoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null)

  useEffect(() => {
    if (!storyId) return

    const fetchStory = async () => {
      try {
        setLoading(true)
        const storyData = await storiesService.getStory(storyId)
        
        // Convert StoryResponse to StoryDetail with proper type handling
        const storyDetail: StoryDetail = {
          id: storyData.id,
          title: storyData.title,
          description: storyData.description,
          storyteller_name: storyData.storyteller_name,
          storyteller_bio: storyData.storyteller_bio,
          language: storyData.language,
          origin: storyData.origin || '',
          audio_file_url: storyData.audio_file_url ? 
            (storyData.audio_file_url.startsWith('http') ? 
              storyData.audio_file_url : 
              (storyData.audio_file_url.startsWith('/media/') ? 
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${storyData.audio_file_url}` :
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/media/files/${storyData.audio_file_url}`
              )
            ) : '',
          duration_seconds: storyData.duration_seconds || 0,
          status: storyData.status,
          created_at: storyData.created_at,
          contributor: {
            id: storyData.contributor.id,
            full_name: storyData.contributor.full_name,
            bio: storyData.contributor.bio || ''
          },
          transcript: storyData.transcript ? {
            original_text: storyData.transcript.original_text || '',
            enhanced_text: storyData.transcript.enhanced_text || storyData.transcript.original_text || '',
            words: storyData.transcript.words || [],
            confidence: storyData.transcript.confidence || 0.7
          } : null,
          translations: storyData.translations?.map(t => ({
            language: t.language,
            text: t.text,
            words: t.words || []
          })) || [],
          paragraphs: [], // For now, we'll use empty array until backend supports paragraphs
          analytics: storyData.analytics ? {
            views: storyData.analytics.views || 0,
            listens: storyData.analytics.listens || 0,
            average_rating: storyData.analytics.average_rating || 0
          } : null
        }
        
        // Debug logging
        console.log('🔍 Story Data Debug:', {
          storyData,
          processedStory: storyDetail,
          transcript: storyDetail.transcript,
          translations: storyDetail.translations,
          audioUrl: storyDetail.audio_file_url
        })
        
        setStory(storyDetail)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load story')
      } finally {
        setLoading(false)
      }
    }

    fetchStory()
  }, [storyId])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story?.title,
        text: story?.description,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      'sw-KE': 'Swahili (Kenya)',
      'sw-TZ': 'Swahili (Tanzania)',
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'fr-FR': 'French',
      'es-ES': 'Spanish',
      'ar-SA': 'Arabic'
    }
    return languages[code] || code
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-griot-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading story...</p>
        </div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Story Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The story you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/stories')}
            className="btn-primary"
          >
            Back to Stories
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Share story"
              >
                <Share2 size={20} />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Like story"
              >
                <Heart size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Story Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{story.title}</h1>
              <p className="text-gray-700 leading-relaxed mb-6">{story.description}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} />
                  <span>{getLanguageName(story.language)}</span>
                </div>
                {story.origin && (
                  <div className="flex items-center gap-2">
                    <Globe size={16} />
                    <span>{story.origin}</span>
                  </div>
                )}
                {story.analytics && (
                  <div>
                    <span>{story.analytics.views} views</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript Player */}
            {story.transcript && (
              <IllustratedTranscriptPlayer
                audioUrl={story.audio_file_url}
                transcript={{
                  text: story.transcript.original_text,
                  words: story.transcript.words,
                  confidence: story.transcript.confidence,
                  enhanced_text: story.transcript.enhanced_text
                }}
                translations={story.translations.map(t => ({
                  language: t.language,
                  text: t.text,
                  words: t.words || []
                }))}
                paragraphs={story.paragraphs}
                title={story.title}
                onTimeUpdate={(time) => {
                  // Track listening progress if needed
                  console.log('Current time:', time)
                }}
                onEnded={() => {
                  // Handle audio ended
                  console.log('Audio ended')
                }}
              />
            )}

            {/* Translations */}
            {story.translations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Translations</h3>
                
                <div className="mb-4">
                  <select
                    value={selectedTranslation || ''}
                    onChange={(e) => setSelectedTranslation(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a language</option>
                    {story.translations.map((translation) => (
                      <option key={translation.language} value={translation.language}>
                        {getLanguageName(translation.language)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedTranslation && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {getLanguageName(selectedTranslation)}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {story.translations.find(t => t.language === selectedTranslation)?.text}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Storyteller Info */}
            {story.storyteller_name && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Storyteller</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{story.storyteller_name}</h4>
                    {story.storyteller_bio && (
                      <p className="text-gray-600 text-sm mt-1">{story.storyteller_bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contributor Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contributor</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{story.contributor.full_name}</h4>
                  {story.contributor.bio && (
                    <p className="text-gray-600 text-sm mt-1">{story.contributor.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Story Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Language:</span>
                  <span className="text-gray-900">{getLanguageName(story.language)}</span>
                </div>
                {story.origin && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Origin:</span>
                    <span className="text-gray-900">{story.origin}</span>
                  </div>
                )}
                {story.duration_seconds && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="text-gray-900">
                      {Math.floor(story.duration_seconds / 60)}:{String(story.duration_seconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 capitalize">{story.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Added:</span>
                  <span className="text-gray-900">
                    {new Date(story.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Analytics */}
            {story.analytics && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="text-gray-900">{story.analytics.views}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listens:</span>
                    <span className="text-gray-900">{story.analytics.listens}</span>
                  </div>
                  {story.analytics.average_rating > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rating:</span>
                      <span className="text-gray-900">{story.analytics.average_rating.toFixed(1)}/5</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 