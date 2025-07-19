import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Clock, CheckCircle, XCircle, Play, Edit, Trash2, Eye } from 'lucide-react'

interface UserStory {
  id: string
  title: string
  description: string
  language: string
  duration: string
  status: 'processing' | 'published' | 'rejected'
  views: number
  listens: number
  rating: number
  submittedAt: string
  processedAt?: string
}

// Mock data for user's stories
const mockUserStories: UserStory[] = [
  {
    id: '1',
    title: 'My Grandmother\'s Lullaby',
    description: 'A traditional lullaby my grandmother used to sing, passed down through four generations.',
    language: 'Spanish',
    duration: '4:32',
    status: 'published',
    views: 245,
    listens: 189,
    rating: 4.8,
    submittedAt: '2024-01-15',
    processedAt: '2024-01-16'
  },
  {
    id: '2',
    title: 'The Tale of the Wise Owl',
    description: 'A folk story about wisdom and patience from my village elders.',
    language: 'English',
    duration: '8:15',
    status: 'processing',
    views: 0,
    listens: 0,
    rating: 0,
    submittedAt: '2024-01-20'
  },
  {
    id: '3',
    title: 'Harvest Festival Songs',
    description: 'Traditional songs sung during our annual harvest celebration.',
    language: 'Portuguese',
    duration: '12:45',
    status: 'published',
    views: 156,
    listens: 134,
    rating: 4.6,
    submittedAt: '2024-01-10',
    processedAt: '2024-01-12'
  },
  {
    id: '4',
    title: 'Creation Story Fragment',
    description: 'A partial recording of our creation story - audio quality needs improvement.',
    language: 'Quechua',
    duration: '6:22',
    status: 'rejected',
    views: 0,
    listens: 0,
    rating: 0,
    submittedAt: '2024-01-05'
  }
]

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'published' | 'processing' | 'rejected'>('all')

  const filteredStories = selectedTab === 'all' 
    ? mockUserStories 
    : mockUserStories.filter(story => story.status === selectedTab)

  const totalViews = mockUserStories.reduce((sum, story) => sum + story.views, 0)
  const totalListens = mockUserStories.reduce((sum, story) => sum + story.listens, 0)
  const publishedCount = mockUserStories.filter(story => story.status === 'published').length
  const processingCount = mockUserStories.filter(story => story.status === 'processing').length

  const getStatusIcon = (status: UserStory['status']) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="text-green-500" size={20} />
      case 'processing':
        return <Clock className="text-yellow-500" size={20} />
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />
      default:
        return null
    }
  }

  const getStatusColor = (status: UserStory['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Stories</h1>
            <p className="text-gray-600">Manage your submitted stories and track their progress</p>
          </div>
          <Link to="/upload" className="btn-primary flex items-center gap-2 mt-4 md:mt-0">
            <Plus size={20} />
            Share New Story
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-griot-600 mb-2">{mockUserStories.length}</div>
            <div className="text-sm text-gray-600">Total Stories</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{publishedCount}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-griot-600 mb-2">{totalViews}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-griot-600 mb-2">{totalListens}</div>
            <div className="text-sm text-gray-600">Total Listens</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Stories', count: mockUserStories.length },
                { key: 'published', label: 'Published', count: publishedCount },
                { key: 'processing', label: 'Processing', count: processingCount },
                { key: 'rejected', label: 'Rejected', count: mockUserStories.filter(s => s.status === 'rejected').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as 'all' | 'published' | 'processing' | 'rejected')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-griot-500 text-griot-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Stories List */}
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
                        {story.duration}
                      </span>
                      <span>{story.language}</span>
                      <span>Submitted {new Date(story.submittedAt).toLocaleDateString()}</span>
                      {story.processedAt && (
                        <span>Processed {new Date(story.processedAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    {story.status === 'published' && (
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {story.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Play size={14} />
                          {story.listens} listens
                        </span>
                        <span>⭐ {story.rating}/5.0</span>
                      </div>
                    )}

                    {story.status === 'processing' && (
                      <div className="text-sm text-yellow-600">
                        🔄 Your story is being processed. This usually takes 2-24 hours.
                      </div>
                    )}

                    {story.status === 'rejected' && (
                      <div className="text-sm text-red-600">
                        ❌ Story was rejected due to audio quality issues. Please re-record and resubmit.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {story.status === 'published' && (
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
                      title="Edit Story"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete Story"
                    >
                      <Trash2 size={18} />
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

        {/* Tips Section */}
        <div className="mt-12 bg-griot-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-griot-900 mb-4">💡 Tips for Better Stories</h3>
          <ul className="space-y-2 text-griot-800">
            <li>• Record in a quiet environment for best audio quality</li>
            <li>• Provide detailed descriptions to help others discover your story</li>
            <li>• Use relevant tags to make your story more searchable</li>
            <li>• Include cultural context to help preserve the tradition</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 