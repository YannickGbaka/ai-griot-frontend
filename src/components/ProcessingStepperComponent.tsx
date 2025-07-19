import React from 'react'
import { CheckCircle, Loader2, AlertCircle, Upload, FileText, Sparkles, Languages, CheckCheck, LucideIcon } from 'lucide-react'

export interface ProcessingStep {
  key: string
  label: string
  icon: LucideIcon
  description: string
}

export interface ProcessingStatus {
  current_step: string
  progress_percentage: number
  message: string
  error?: string
  transcript_text?: string
}

interface ProcessingStepperProps {
  status: ProcessingStatus
  className?: string
}

export const PROCESSING_STEPS: ProcessingStep[] = [
  {
    key: 'uploading',
    label: 'Uploading',
    icon: Upload,
    description: 'Uploading your audio file securely'
  },
  {
    key: 'transcribing',
    label: 'Transcribing',
    icon: FileText,
    description: 'Converting audio to text with Gemini AI'
  },
  {
    key: 'enhancing',
    label: 'Enhancing',
    icon: Sparkles,
    description: 'Improving transcript quality and clarity'
  },
  {
    key: 'analyzing',
    label: 'Analyzing',
    icon: CheckCircle,
    description: 'Extracting cultural context and themes'
  },
  {
    key: 'translating',
    label: 'Translating',
    icon: Languages,
    description: 'Generating multilingual translations'
  },
  {
    key: 'published',
    label: 'Published',
    icon: CheckCheck,
    description: 'Story ready and available to the world'
  }
]

export default function ProcessingStepperComponent({ status, className = '' }: ProcessingStepperProps) {
  const currentStepIndex = PROCESSING_STEPS.findIndex(step => step.key === status.current_step)
  const isError = status.current_step === 'failed'
  
  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' | 'error' => {
    if (isError && stepIndex === currentStepIndex) return 'error'
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'pending'
  }

  const getStepIcon = (step: ProcessingStep, stepStatus: string) => {
    if (stepStatus === 'error') return AlertCircle
    if (stepStatus === 'completed') return CheckCircle
    if (stepStatus === 'current') return Loader2
    return step.icon
  }

  const getStepIconColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'text-green-600'
      case 'current': return 'text-blue-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  const getStepBgColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'bg-green-100 border-green-300'
      case 'current': return 'bg-blue-100 border-blue-300'
      case 'error': return 'bg-red-100 border-red-300'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  const getConnectorColor = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'bg-green-500'
    if (isError && stepIndex === currentStepIndex - 1) return 'bg-red-500'
    return 'bg-gray-300'
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isError ? 'Processing Failed' : 'Processing Your Story'}
        </h3>
        <p className="text-sm text-gray-600">
          {status.message}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isError ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-green-500'
            }`}
            style={{ width: `${status.progress_percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span className="font-medium">{status.progress_percentage}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {PROCESSING_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index)
          const StepIcon = getStepIcon(step, stepStatus)
          const isCurrentStep = stepStatus === 'current' || stepStatus === 'error'
          
          return (
            <div key={step.key} className="relative flex items-start">
              {/* Connector Line */}
              {index < PROCESSING_STEPS.length - 1 && (
                <div 
                  className={`absolute left-6 top-12 w-0.5 h-8 ${getConnectorColor(index)}`}
                />
              )}
              
              {/* Step Icon */}
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full border-2 
                ${getStepBgColor(stepStatus)} relative z-10
              `}>
                <StepIcon 
                  size={20} 
                  className={`
                    ${getStepIconColor(stepStatus)}
                    ${stepStatus === 'current' ? 'animate-spin' : ''}
                  `}
                />
              </div>
              
              {/* Step Content */}
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    isCurrentStep ? 'text-gray-900' : 
                    stepStatus === 'completed' ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </h4>
                  
                  {stepStatus === 'completed' && (
                    <span className="text-xs text-green-600 font-medium">Completed</span>
                  )}
                  {stepStatus === 'current' && !isError && (
                    <span className="text-xs text-blue-600 font-medium">In Progress</span>
                  )}
                  {stepStatus === 'error' && (
                    <span className="text-xs text-red-600 font-medium">Failed</span>
                  )}
                </div>
                
                <p className={`text-xs mt-1 ${
                  isCurrentStep ? 'text-gray-700' : 
                  stepStatus === 'completed' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
                
                {/* Show current step details */}
                {isCurrentStep && status.transcript_text && step.key === 'transcribing' && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 font-medium mb-1">Transcript Preview:</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {status.transcript_text.substring(0, 150)}
                      {status.transcript_text.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )}
                
                {/* Show error details */}
                {stepStatus === 'error' && status.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600">{status.error}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Success Message */}
      {status.current_step === 'published' && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCheck size={16} className="mr-2" />
            Story Published Successfully!
          </div>
        </div>
      )}
    </div>
  )
} 