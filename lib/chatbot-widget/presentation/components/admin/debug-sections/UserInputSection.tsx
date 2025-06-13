import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserInputSectionProps {
  userMessage: string;
  timestamp: string;
  processingTimeMs?: number;
  pipelineStatus?: 'processing' | 'complete' | 'error';
  totalSteps?: number;
  completedSteps?: number;
}

export function UserInputSection({ 
  userMessage, 
  timestamp, 
  processingTimeMs = 0,
  pipelineStatus = 'complete',
  totalSteps = 4,
  completedSteps = 4
}: UserInputSectionProps) {
  const getStatusBadge = () => {
    switch (pipelineStatus) {
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-600">⏳ Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Error</Badge>;
      case 'complete':
      default:
        return <Badge variant="default" className="bg-green-600">✅ Complete</Badge>;
    }
  };

  const getPipelineProgress = () => {
    const percentage = (completedSteps / totalSteps) * 100;
    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
        User Input & Processing Pipeline
      </h4>
      <div className="space-y-4">
        {/* User Message */}
        <div className="bg-white dark:bg-gray-900 rounded p-3 border">
          <div className="text-sm font-mono break-words">
            "{userMessage}"
          </div>
        </div>
        
        {/* Pipeline Overview */}
        <div className="bg-white dark:bg-gray-900 rounded p-3 border">
          <div className="flex items-center justify-between mb-2">
            <strong className="text-sm">Processing Pipeline</strong>
            {getStatusBadge()}
          </div>
          
          {/* Pipeline Steps */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Intent Analysis & Function Calling</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Business Rules & Automated Actions</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Response Generation & Final Output</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-2">
            {getPipelineProgress()}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {completedSteps}/{totalSteps} steps completed
          </div>
        </div>

        {/* Processing Metrics */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <strong>Started:</strong> {new Date(timestamp).toLocaleTimeString()}
          </div>
          <div>
            <strong>Total Time:</strong> {processingTimeMs}ms
          </div>
          <div>
            <strong>Message Length:</strong> {userMessage?.length || 0} chars
          </div>
          <div>
            <strong>Pipeline Status:</strong> {pipelineStatus}
          </div>
        </div>
      </div>
    </div>
  );
} 