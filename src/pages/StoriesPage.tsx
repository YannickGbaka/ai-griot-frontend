import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, MapPin, Clock, Play, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { storiesService } from '../services/storiesService'
import { StoryResponse } from '../types/api'

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch stories from backend
  const fetchStories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const query: Record<string, string> = {}
      if (searchTerm) query.search = searchTerm
      if (selectedLanguage) query.language = selectedLanguage
      
      const response = await storiesService.getStories(query)
      setStories(response)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load stories')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchStories()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStories()
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedLanguage])

  // Extract unique values for filters from current stories
  const languages = [...new Set(stories.map(story => story.language))]
  const origins = [...new Set(stories.map(story => story.origin).filter(Boolean))]

  // Filter stories client-side for origin (since backend doesn't filter by origin yet)
  const filteredStories = stories.filter(story => {
    const matchesOrigin = !selectedOrigin || story.origin === selectedOrigin
    return matchesOrigin
  })

  const formatDuration = (seconds?: number) => {
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

  const getStoryAnalytics = (story: StoryResponse) => {
    return {
      views: story.analytics?.views || 0,
      listens: story.analytics?.listens || 0
    }
  }

  const retry = () => {
    fetchStories()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load stories</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={retry}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore Stories</h1>
          <p className="text-lg text-gray-600 mb-6">
            Discover oral traditions and cultural heritage from communities around the world
          </p>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search stories, storytellers, or topics..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-griot-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={20} />
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2 md:w-auto"
              disabled={isLoading}
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-griot-500"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">All Languages</option>
                    {languages.map(language => (
                      <option key={language} value={language}>
                        {getLanguageLabel(language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origin
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-griot-500"
                    value={selectedOrigin}
                    onChange={(e) => setSelectedOrigin(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">All Regions</option>
                    {origins.map(origin => (
                      <option key={origin} value={origin}>{origin}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedLanguage('')
                      setSelectedOrigin('')
                      setSearchTerm('')
                    }}
                    className="w-full py-2 text-griot-600 hover:text-griot-700 font-medium"
                    disabled={isLoading}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading stories...
              </span>
            ) : (
              `${filteredStories.length} ${filteredStories.length === 1 ? 'story' : 'stories'} found`
            )}
          </p>
        </div>

        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="card animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="w-16 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-300 rounded"></div>
                </div>
                <div className="w-3/4 h-6 bg-gray-300 rounded mb-2"></div>
                <div className="w-full h-4 bg-gray-300 rounded mb-2"></div>
                <div className="w-2/3 h-4 bg-gray-300 rounded mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="w-16 h-6 bg-gray-300 rounded"></div>
                  <div className="w-20 h-6 bg-gray-300 rounded"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-24 h-4 bg-gray-300 rounded"></div>
                  <div className="w-20 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => {
              const analytics = getStoryAnalytics(story)
              return (
                <Link 
                  key={story.id} 
                  to={`/stories/${story.id}`}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-griot-600 rounded-full flex items-center justify-center">
                        <Play className="text-white" size={16} />
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {formatDuration(story.duration_seconds)}
                      </div>
                    </div>
                    <span className="text-sm bg-griot-100 text-griot-700 px-2 py-1 rounded">
                      {getLanguageLabel(story.language)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{story.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{story.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {story.tags.slice(0, 3).map((tag) => (
                      <span key={tag.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>by {story.storyteller_name}</span>
                    {story.origin && (
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {story.origin}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400">
                    {analytics.views.toLocaleString()} views • {analytics.listens.toLocaleString()} listens
                  </div>

                  {/* Processing Status */}
                  {story.status !== 'published' && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        story.status === 'processing' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {story.status === 'processing' ? 'Processing...' : 'Processing Failed'}
                      </span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {!isLoading && filteredStories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No stories found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find more stories.
            </p>
            <button
              onClick={() => {
                setSelectedLanguage('')
                setSelectedOrigin('')
                setSearchTerm('')
              }}
              className="btn-primary"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 