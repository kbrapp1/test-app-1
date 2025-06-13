import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DebugInfoDto } from '../../../../application/dto/DebugInfoDto';

interface FirstApiCallStepProps {
  apiDebugInfo: DebugInfoDto | null;
}

export function FirstApiCallStep({ apiDebugInfo }: FirstApiCallStepProps) {
  const firstApiCallData = apiDebugInfo?.firstApiCall;
  
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
          2
        </span>
        First OpenAI API Call - Function Calling Setup
      </h4>
      
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-3">
          <div className="text-sm">
            <strong>Business Logic:</strong> The system makes its first OpenAI API call using function calling to analyze the user's message. This call produces intent classification, entity extraction, lead scoring, and journey progression analysis. This is the 'intelligence gathering' API call.
          </div>

          {firstApiCallData ? (
            <>
              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 dark:text-blue-300">API Request Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Model:</span> {firstApiCallData.requestData.model}
                  </div>
                  <div>
                    <span className="font-medium">Temperature:</span> {firstApiCallData.requestData.temperature}
                  </div>
                  <div>
                    <span className="font-medium">Max Tokens:</span> {firstApiCallData.requestData.maxTokens}
                  </div>
                  <div>
                    <span className="font-medium">Functions Provided:</span> {firstApiCallData.requestData.functionsProvided?.length || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 dark:text-blue-300">API Response Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Response ID:</span> {firstApiCallData.responseData.id}
                  </div>
                  <div>
                    <span className="font-medium">Processing Time:</span> {firstApiCallData.responseData.processingTime}ms
                  </div>
                  <div>
                    <span className="font-medium">Function Calls:</span> {firstApiCallData.responseData.functionCallsExecuted?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {firstApiCallData.responseData.statusCode || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 dark:text-blue-300">Token Usage & Cost</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Input Tokens:</span> {firstApiCallData.costData.inputTokens}
                  </div>
                  <div>
                    <span className="font-medium">Output Tokens:</span> {firstApiCallData.costData.outputTokens}
                  </div>
                  <div>
                    <span className="font-medium">Estimated Cost:</span> {firstApiCallData.costData.estimatedCost}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 dark:text-blue-300">Full API Request Data</h5>
                <div className="max-w-full overflow-hidden">
                  <ScrollArea className="h-32 w-full rounded border bg-gray-50 dark:bg-gray-800 p-2">
                    <pre className="text-xs whitespace-pre-wrap break-all max-w-full overflow-wrap-anywhere">
                      {JSON.stringify(firstApiCallData.requestData.fullRequestPayload, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No first API call data available. This data will be populated when using Live AI mode.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 