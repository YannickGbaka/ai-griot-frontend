import { useState, useEffect } from 'react'
import EnhancedAudioPlayer from './EnhancedAudioPlayer'

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

interface Story {
  id: string
  title: string
  description?: string
  storyteller_name?: string
  language: string
  audio_file_url: string
  duration_seconds?: number
  paragraphs: Paragraph[]
}

interface EnhancedStoryViewerProps {
  story: Story
  className?: string
}

export default function EnhancedStoryViewer({
  story,
  className = ''
}: EnhancedStoryViewerProps) {
  const [currentParagraph, setCurrentParagraph] = useState<Paragraph | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParagraphChange = (paragraph: Paragraph | null) => {
    setCurrentParagraph(paragraph)
  }

  const handlePlay = () => {
    // Analytics tracking could be added here
    console.log('Story playback started')
  }

  const handlePause = () => {
    // Analytics tracking could be added here
    console.log('Story playback paused')
  }

  const handleTimeUpdate = (currentTime: number) => {
    // Real-time analytics tracking could be added here
    // console.log('Current time:', currentTime)
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Story Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{story.title}</h1>
        {story.description && (
          <p className="text-gray-600 mb-4">{story.description}</p>
        )}
        {story.storyteller_name && (
          <p className="text-sm text-gray-500">
            Told by <span className="font-medium">{story.storyteller_name}</span>
          </p>
        )}
      </div>

      {/* Enhanced Audio Player */}
      <div className="mb-8">
        <EnhancedAudioPlayer
          audioUrl={story.audio_file_url}
          title={story.title}
          paragraphs={story.paragraphs}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onParagraphChange={handleParagraphChange}
          className="shadow-lg"
        />
      </div>

      {/* Story Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Story Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Language:</span>
              <span className="ml-2 text-gray-900">{story.language}</span>
            </div>
            {story.duration_seconds && (
              <div>
                <span className="text-sm font-medium text-gray-500">Duration:</span>
                <span className="ml-2 text-gray-900">
                  {Math.floor(story.duration_seconds / 60)}:{(story.duration_seconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Paragraphs:</span>
              <span className="ml-2 text-gray-900">{story.paragraphs.length}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Illustrations:</span>
              <span className="ml-2 text-gray-900">
                {story.paragraphs.reduce((total, p) => total + p.illustrations.length, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Paragraph Details */}
        {currentParagraph && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Current Paragraph ({currentParagraph.sequence_order + 1} of {story.paragraphs.length})
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Timing:</span>
                <span className="ml-2 text-gray-900">
                  {Math.floor(currentParagraph.start_time)}s - {Math.floor(currentParagraph.end_time)}s
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Words:</span>
                <span className="ml-2 text-gray-900">{currentParagraph.word_count}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Illustrations:</span>
                <span className="ml-2 text-gray-900">{currentParagraph.illustrations.length}</span>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-500">Content:</span>
                <p className="mt-2 text-gray-700 text-sm leading-relaxed">
                  {currentParagraph.content}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All Paragraphs Overview */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Paragraphs</h3>
        <div className="space-y-4">
          {story.paragraphs.map((paragraph, index) => (
            <div
              key={paragraph.id}
              className={`bg-white border rounded-lg p-4 transition-colors ${
                currentParagraph?.id === paragraph.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Paragraph {index + 1}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.floor(paragraph.start_time)}s - {Math.floor(paragraph.end_time)}s
                    </span>
                    {paragraph.illustrations.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {paragraph.illustrations.length} illustration{paragraph.illustrations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {paragraph.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="mt-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading story...</p>
        </div>
      )}

      {error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
} 