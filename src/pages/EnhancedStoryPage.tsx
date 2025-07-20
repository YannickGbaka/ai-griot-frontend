import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import EnhancedStoryViewer from '../components/EnhancedStoryViewer'
import { StoryService, Story } from '../services/storyService'

export default function EnhancedStoryPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>('')

  useEffect(() => {
    if (!storyId) return

    const loadStory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load the story
        const storyData = await StoryService.getStory(storyId)
        setStory(storyData)
        
        // If story has no paragraphs, try to segment them
        if (storyData.paragraphs.length === 0) {
          setProcessingStatus('Segmenting story into paragraphs...')
          await StoryService.segmentStoryParagraphs(storyId, 'en')
          
          // Reload story to get paragraphs
          const updatedStory = await StoryService.getStory(storyId)
          setStory(updatedStory)
        }
        
        // If paragraphs exist but no illustrations, generate them
        if (storyData.paragraphs.length > 0 && 
            storyData.paragraphs.every(p => p.illustrations.length === 0)) {
          setProcessingStatus('Generating illustrations...')
          await StoryService.generateAllStoryIllustrations(storyId, 'traditional')
          
          // Reload story to get illustrations
          const finalStory = await StoryService.getStory(storyId)
          setStory(finalStory)
        }
        
      } catch (err) {
        console.error('Failed to load story:', err)
        setError(err instanceof Error ? err.message : 'Failed to load story')
      } finally {
        setLoading(false)
        setProcessingStatus('')
      }
    }

    loadStory()
  }, [storyId])

  const handleGenerateIllustrations = async () => {
    if (!storyId) return
    
    try {
      setProcessingStatus('Generating illustrations for all paragraphs...')
      await StoryService.generateAllStoryIllustrations(storyId, 'traditional')
      
      // Reload story to get new illustrations
      const updatedStory = await StoryService.getStory(storyId)
      setStory(updatedStory)
      setProcessingStatus('')
    } catch (err) {
      console.error('Failed to generate illustrations:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate illustrations')
      setProcessingStatus('')
    }
  }

  const handleSegmentParagraphs = async () => {
    if (!storyId) return
    
    try {
      setProcessingStatus('Segmenting story into paragraphs...')
      await StoryService.segmentStoryParagraphs(storyId, 'en')
      
      // Reload story to get paragraphs
      const updatedStory = await StoryService.getStory(storyId)
      setStory(updatedStory)
      setProcessingStatus('')
    } catch (err) {
      console.error('Failed to segment paragraphs:', err)
      setError(err instanceof Error ? err.message : 'Failed to segment paragraphs')
      setProcessingStatus('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{processingStatus || 'Loading story...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Story Not Found</h2>
          <p className="text-gray-600">The requested story could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Enhanced Story Viewer</h1>
            </div>
            <div className="flex items-center space-x-4">
              {story.paragraphs.length === 0 && (
                <button
                  onClick={handleSegmentParagraphs}
                  disabled={!!processingStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Segment Paragraphs
                </button>
              )}
              {story.paragraphs.length > 0 && 
               story.paragraphs.every(p => p.illustrations.length === 0) && (
                <button
                  onClick={handleGenerateIllustrations}
                  disabled={!!processingStatus}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Generate Illustrations
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {processingStatus && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800 text-sm">{processingStatus}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedStoryViewer story={story} />
      </div>

      {/* Story Statistics */}
      <div className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{story.paragraphs.length}</div>
              <div className="text-sm text-gray-600">Paragraphs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {story.paragraphs.reduce((total, p) => total + p.illustrations.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Illustrations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {story.paragraphs.reduce((total, p) => total + p.word_count, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {story.duration_seconds ? Math.floor(story.duration_seconds / 60) : 0}
              </div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 