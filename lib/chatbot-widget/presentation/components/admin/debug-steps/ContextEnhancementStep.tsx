import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DebugInfoDto } from '../../../../application/dto/DebugInfoDto';

interface ContextEnhancementStepProps {
  functionCalls?: DebugInfoDto['functionCalls'];
  requestData?: DebugInfoDto['requestData'];
}

export function ContextEnhancementStep({ functionCalls, requestData }: ContextEnhancementStepProps) {
  return (
    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-800 dark:text-orange-200">
        <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</span>
        Enhanced System Prompt Construction & Second API Call Preparation
      </h4>
      <div className="space-y-2">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border">
          <div className="text-sm">
            <strong>Business Logic:</strong> System constructs enhanced system prompt with extracted entities, lead score, journey state, and business rules to prepare optimized context for the second API call response generation.
          </div>
          {functionCalls?.secondApiCall && (
            <div className="mt-2 space-y-2">
              <div className="text-xs">
                <strong>Context from Functions:</strong>
                <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <ScrollArea className="h-16 w-full">
                    <pre className="font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                      {JSON.stringify(functionCalls.secondApiCall.contextFromFunctions, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
              <div className="text-xs">
                <strong>Additional Instructions:</strong>
                <div className="mt-1 flex flex-wrap gap-1">
                  {functionCalls.secondApiCall.additionalInstructions.map((instruction, idx) => (
                    <span key={idx} className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-xs">
                      {instruction}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced System Prompt Preview */}
        {requestData?.systemPrompt && (
          <div className="bg-white dark:bg-gray-900 rounded p-3 border">
            <strong className="text-sm">Enhanced System Prompt Preview:</strong>
            <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-3">
              <ScrollArea className="h-64 w-full">
                <pre className="font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                  {requestData.systemPrompt}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 