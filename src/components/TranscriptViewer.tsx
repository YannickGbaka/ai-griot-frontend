import { useState } from 'react'
import { ChevronDown, ChevronUp, Globe, FileText } from 'lucide-react'

interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface Translation {
  id: string
  language: string
  text: string
  confidence?: number
}

interface TranscriptViewerProps {
  transcript?: {
    id: string
    language: string
    text: string
    segments?: TranscriptSegment[]
    confidence?: number
  }
  translations?: Translation[]
  currentTime?: number
  onSeek?: (time: number) => void
  className?: string
}

export default function TranscriptViewer({
  transcript,
  translations = [],
  currentTime = 0,
  onSeek,
  className = ''
}: TranscriptViewerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(transcript?.language || 'original')
  const [isExpanded, setIsExpanded] = useState(true)

  if (!transcript && translations.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Transcript Available</h3>
        <p className="text-gray-600">
          This story is still being processed. Transcripts will be available once processing is complete.
        </p>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentSegmentIndex = () => {
    if (!transcript?.segments) return -1
    return transcript.segments.findIndex(segment => 
      currentTime >= segment.start && currentTime < segment.end
    )
  }

  const getDisplayText = () => {
    if (selectedLanguage === 'original' || selectedLanguage === transcript?.language) {
      return transcript?.text || ''
    }
    
    const translation = translations.find(t => t.language === selectedLanguage)
    return translation?.text || transcript?.text || ''
  }

  const getDisplaySegments = () => {
    // For now, we only show segments for the original transcript
    // In a more advanced implementation, we could align translated segments
    if (selectedLanguage === 'original' || selectedLanguage === transcript?.language) {
      return transcript?.segments || []
    }
    return []
  }

  const availableLanguages = [
    ...(transcript ? [{ code: transcript.language, label: 'Original', isOriginal: true }] : []),
    ...translations.map(t => ({ code: t.language, label: getLanguageLabel(t.language), isOriginal: false }))
  ]

  function getLanguageLabel(code: string): string {
    const labels: Record<string, string> = {
      'en': 'English',
      'sw': 'Swahili',
      'fr': 'French',
      'es': 'Spanish',
      'ar': 'Arabic',
      'pt': 'Portuguese'
    }
    return labels[code] || code.toUpperCase()
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-griot-600" />
            <h3 className="text-lg font-medium text-gray-900">Transcript</h3>
            {transcript?.confidence && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {Math.round(transcript.confidence * 100)}% confidence
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            {availableLanguages.length > 1 && (
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-griot-500"
                >
                  {availableLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} {lang.isOriginal && '(Original)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Segmented Transcript (if available and viewing original) */}
          {getDisplaySegments().length > 0 && onSeek && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Interactive Transcript</h4>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {getDisplaySegments().map((segment, index) => {
                  const isActive = index === getCurrentSegmentIndex()
                  return (
                    <button
                      key={index}
                      onClick={() => onSeek(segment.start)}
                      className={`block w-full text-left p-3 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-griot-100 text-griot-800 border-2 border-griot-300'
                          : 'hover:bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {formatTime(segment.start)} - {formatTime(segment.end)}
                        </span>
                        {isActive && (
                          <span className="text-xs bg-griot-600 text-white px-2 py-1 rounded">
                            Playing
                          </span>
                        )}
                      </div>
                      <p>{segment.text}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Full Text Transcript */}
          <div className={getDisplaySegments().length > 0 ? 'mt-6 pt-6 border-t border-gray-200' : ''}>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Full Text</h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {getDisplayText()}
              </p>
            </div>
            
            {/* Translation Confidence */}
            {selectedLanguage !== 'original' && selectedLanguage !== transcript?.language && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm">
                  <span className="font-medium">Translation:</span> This text has been automatically 
                  translated from {getLanguageLabel(transcript?.language || '')} to {getLanguageLabel(selectedLanguage)}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 