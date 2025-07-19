import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Clock, CheckCircle, XCircle, Play, Edit, Trash2, Eye, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { usersService } from '../services/usersService'
import { storiesService } from '../services/storiesService'
import { StoryResponse, StoryStatus } from '../types/api'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stories, setStories] = useState<StoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'all' | 'published' | 'processing' | 'rejected'>('all')
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null)

  // Fetch user's stories
  const fetchUserStories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const userStories = await usersService.getCurrentUserStories()
      setStories(userStories)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load your stories')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserStories()
  }, [])

  // Filter stories based on selected tab
  const filteredStories = selectedTab === 'all' 
    ? stories 
    : stories.filter(story => story.status === selectedTab)

  // Calculate stats
  const totalViews = stories.reduce((sum, story) => sum + (story.analytics?.views || 0), 0)
  const totalListens = stories.reduce((sum, story) => sum + (story.analytics?.listens || 0), 0)
  const publishedCount = stories.filter(story => story.status === StoryStatus.PUBLISHED).length
  const processingCount = stories.filter(story => story.status === StoryStatus.PROCESSING).length
  const rejectedCount = stories.filter(story => story.status === StoryStatus.REJECTED).length

  const getStatusIcon = (status: StoryStatus) => {
    switch (status) {
      case StoryStatus.PUBLISHED:
        return <CheckCircle className="text-green-500" size={20} />
      case StoryStatus.PROCESSING:
        return <Clock className="text-yellow-500" size={20} />
      case StoryStatus.REJECTED:
        return <XCircle className="text-red-500" size={20} />
      default:
        return null
    }
  }

  const getStatusColor = (status: StoryStatus) => {
    switch (status) {
      case StoryStatus.PUBLISHED:
        return 'bg-green-100 text-green-800'
      case StoryStatus.PROCESSING:
        return 'bg-yellow-100 text-yellow-800'
      case StoryStatus.REJECTED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingStoryId(storyId)
      await storiesService.deleteStory(storyId)
      
      // Remove story from local state
      setStories(prev => prev.filter(story => story.id !== storyId))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete story')
    } finally {
      setDeletingStoryId(null)
    }
  }

  const retry = () => {
    fetchUserStories()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load your stories</h2>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Stories</h1>
            <p className="text-gray-600">
              {user ? `Welcome back, ${user.full_name}! ` : ''}
              Manage your submitted stories and track their progress
            </p>
          </div>
          <Link to="/upload" className="btn-primary flex items-center gap-2 mt-4 md:mt-0">
            <Plus size={20} />
            Share New Story
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-griot-600 mb-2">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                stories.length
              )}
            </div>
            <div className="text-sm text-gray-600">Total Stories</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                publishedCount
              )}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-griot-600 mb-2">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                totalViews.toLocaleString()
              )}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-griot-600 mb-2">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                totalListens.toLocaleString()
              )}
            </div>
            <div className="text-sm text-gray-600">Total Listens</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Stories', count: stories.length },
                { key: 'published', label: 'Published', count: publishedCount },
                { key: 'processing', label: 'Processing', count: processingCount },
                { key: 'rejected', label: 'Rejected', count: rejectedCount }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as 'all' | 'published' | 'processing' | 'rejected')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-griot-500 text-griot-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  {tab.label} ({isLoading ? '...' : tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Stories List */}
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-6 bg-gray-300 rounded w-48"></div>
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStories.length > 0 ? (
              filteredStories.map((story) => (
                <div key={story.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{story.title}</h3>
                        {getStatusIcon(story.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(story.status)}`}>
                          {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{story.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(story.duration_seconds)}
                        </span>
                        <span>{getLanguageLabel(story.language)}</span>
                        <span>Submitted {formatDate(story.created_at)}</span>
                        {story.updated_at && story.updated_at !== story.created_at && (
                          <span>Updated {formatDate(story.updated_at)}</span>
                        )}
                      </div>

                      {story.status === StoryStatus.PUBLISHED && (
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {story.analytics?.views?.toLocaleString() || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Play size={14} />
                            {story.analytics?.listens?.toLocaleString() || 0} listens
                          </span>
                          {story.analytics?.average_rating && (
                            <span>⭐ {story.analytics.average_rating.toFixed(1)}/5.0</span>
                          )}
                        </div>
                      )}

                      {story.status === StoryStatus.PROCESSING && (
                        <div className="text-sm text-yellow-600">
                          🔄 Your story is being processed. This usually takes 2-24 hours.
                        </div>
                      )}

                      {story.status === StoryStatus.REJECTED && (
                        <div className="text-sm text-red-600">
                          ❌ Story processing failed. Please check the audio quality and try uploading again.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {story.status === StoryStatus.PUBLISHED && (
                        <Link
                          to={`/stories/${story.id}`}
                          className="p-2 text-gray-500 hover:text-griot-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Story"
                        >
                          <Eye size={18} />
                        </Link>
                      )}
                      <button
                        className="p-2 text-gray-500 hover:text-griot-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Story (Coming Soon)"
                        disabled
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteStory(story.id)}
                        disabled={deletingStoryId === story.id}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Story"
                      >
                        {deletingStoryId === story.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedTab === 'all' ? 'No stories yet' : `No ${selectedTab} stories`}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedTab === 'all' 
                    ? 'Start sharing your cultural heritage with the world!'
                    : `You don't have any ${selectedTab} stories at the moment.`
                  }
                </p>
                {selectedTab === 'all' && (
                  <Link to="/upload" className="btn-primary">
                    Share Your First Story
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tips Section */}
        {!isLoading && stories.length > 0 && (
          <div className="mt-12 bg-griot-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-griot-900 mb-4">💡 Tips for Better Stories</h3>
            <ul className="space-y-2 text-griot-800">
              <li>• Record in a quiet environment for best audio quality</li>
              <li>• Provide detailed descriptions to help others discover your story</li>
              <li>• Use relevant tags to make your story more searchable</li>
              <li>• Include cultural context to help preserve the tradition</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
} 