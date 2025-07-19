import { useState } from 'react'
import { Search, Filter, MapPin, Clock, Play } from 'lucide-react'

interface Story {
  id: string
  title: string
  storyteller: string
  origin: string
  duration: string
  language: string
  description: string
  tags: string[]
  views: number
}

// Mock data
const mockStories: Story[] = [
  {
    id: '1',
    title: 'The Creation of the Baobab Tree',
    storyteller: 'Amara Diallo',
    origin: 'Mali',
    duration: '8:45',
    language: 'Bambara',
    description: 'An ancient tale about how the mighty baobab tree came to be, passed down through generations in the Mandé people.',
    tags: ['creation myth', 'nature', 'folklore'],
    views: 1243
  },
  {
    id: '2',
    title: 'The Legend of Anansi',
    storyteller: 'Kofi Asante',
    origin: 'Ghana',
    duration: '12:30',
    language: 'Twi',
    description: 'Stories of the clever spider Anansi, the trickster figure central to West African and Caribbean folklore.',
    tags: ['trickster', 'wisdom', 'folklore'],
    views: 2156
  },
  {
    id: '3',
    title: 'Songs of the Ancestors',
    storyteller: 'Maria Santos',
    origin: 'Brazil',
    duration: '15:20',
    language: 'Portuguese',
    description: 'Traditional songs that connect the living with ancestral spirits, preserved in Brazilian Candomblé traditions.',
    tags: ['spiritual', 'music', 'ritual'],
    views: 987
  },
  {
    id: '4',
    title: 'The Rainbow Serpent',
    storyteller: 'David Wayarra',
    origin: 'Australia',
    duration: '10:15',
    language: 'English',
    description: 'Aboriginal dreamtime story about the Rainbow Serpent, creator of rivers and life.',
    tags: ['creation myth', 'dreamtime', 'aboriginal'],
    views: 1567
  },
  {
    id: '5',
    title: 'Grandmother Moon',
    storyteller: 'Sarah Whitehorse',
    origin: 'Canada',
    duration: '6:30',
    language: 'Ojibwe',
    description: 'Traditional teaching about the phases of the moon and women\'s connection to lunar cycles.',
    tags: ['teachings', 'moon', 'women'],
    views: 891
  },
  {
    id: '6',
    title: 'The First Fire',
    storyteller: 'Juan Mamani',
    origin: 'Peru',
    duration: '9:45',
    language: 'Quechua',
    description: 'Andean legend about how humans first obtained fire from the mountain spirits.',
    tags: ['fire', 'spirits', 'andean'],
    views: 1323
  }
]

export default function StoriesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique values for filters
  const languages = [...new Set(mockStories.map(story => story.language))]
  const origins = [...new Set(mockStories.map(story => story.origin))]

  // Filter stories based on search and filters
  const filteredStories = mockStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.storyteller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesLanguage = !selectedLanguage || story.language === selectedLanguage
    const matchesOrigin = !selectedOrigin || story.origin === selectedOrigin
    
    return matchesSearch && matchesLanguage && matchesOrigin
  })

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
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2 md:w-auto"
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
                  >
                    <option value="">All Languages</option>
                    {languages.map(language => (
                      <option key={language} value={language}>{language}</option>
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
            {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'} found
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <div key={story.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-griot-600 rounded-full flex items-center justify-center">
                    <Play className="text-white" size={16} />
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    {story.duration}
                  </div>
                </div>
                <span className="text-sm bg-griot-100 text-griot-700 px-2 py-1 rounded">
                  {story.language}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold mb-2 line-clamp-2">{story.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{story.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {story.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>by {story.storyteller}</span>
                <div className="flex items-center">
                  <MapPin size={14} className="mr-1" />
                  {story.origin}
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                {story.views.toLocaleString()} views
              </div>
            </div>
          ))}
        </div>

        {filteredStories.length === 0 && (
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