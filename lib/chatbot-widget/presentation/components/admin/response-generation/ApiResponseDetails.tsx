import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResponseData } from '../../../types/response-generation';

interface ApiResponseDetailsProps {
  responseData: ResponseData;
  textColor: string;
}

export function ApiResponseDetails({ responseData, textColor }: ApiResponseDetailsProps) {
  return (
    <div className="border-t pt-2">
      <strong className={`text-sm ${textColor}`}>API Response Details:</strong>
      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
        <div><strong>Response ID:</strong> <code className="text-xs">{responseData.id}</code></div>
        <div><strong>Model Used:</strong> {responseData.model}</div>
        <div><strong>Processing Time:</strong> {responseData.processingTime}ms</div>
        <div><strong>Response Length:</strong> {responseData.responseLength} chars</div>
        {responseData.statusCode && (
          <div>
            <strong>Status Code:</strong> 
            <Badge variant={responseData.statusCode === 200 ? "default" : "destructive"} className="ml-1">
              {responseData.statusCode}
            </Badge>
          </div>
        )}
        {responseData.responseSize && (
          <div><strong>Response Size:</strong> {(responseData.responseSize / 1024).toFixed(2)} KB</div>
        )}
      </div>

      {/* Rate Limit Information */}
      {responseData.rateLimitInfo && (
        <div className="mt-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
          <strong className="text-sm text-yellow-800 dark:text-yellow-200">Rate Limit Status:</strong>
          <div className="grid grid-cols-3 gap-4 text-xs mt-1">
            <div><strong>Remaining:</strong> {responseData.rateLimitInfo.remaining}</div>
            <div><strong>Limit:</strong> {responseData.rateLimitInfo.limit}</div>
            <div><strong>Reset Time:</strong> {responseData.rateLimitInfo.resetTime}</div>
          </div>
          {responseData.rateLimitInfo.remaining < 10 && (
            <div className="text-orange-600 text-xs mt-1">
              ⚠ Warning: Low rate limit remaining
            </div>
          )}
        </div>
      )}

      {/* Streaming Details */}
      {responseData.streamingDetails && (
        <div className="mt-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2">
          <strong className="text-sm text-blue-800 dark:text-blue-200">Streaming Performance:</strong>
          <div className="grid grid-cols-3 gap-4 text-xs mt-1">
            <div><strong>First Token:</strong> {responseData.streamingDetails.firstTokenTime}ms</div>
            <div><strong>Tokens/Second:</strong> {responseData.streamingDetails.tokensPerSecond.toFixed(1)}</div>
            <div><strong>Total Chunks:</strong> {responseData.streamingDetails.totalChunks}</div>
          </div>
        </div>
      )}

      {/* Response Headers */}
      {responseData.responseHeaders && Object.keys(responseData.responseHeaders).length > 0 && (
        <div className="mt-2">
          <strong className="text-sm">Response Headers:</strong>
          <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2">
            <ScrollArea className="h-20 w-full">
              <div className="space-y-1">
                {Object.entries(responseData.responseHeaders).map(([key, value]) => (
                  <div key={key} className="text-xs font-mono">
                    <span className="text-green-600 dark:text-green-400">{key}:</span>{' '}
                    <span className="text-gray-700 dark:text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Full Response Payload */}
      {responseData.responsePayload && (
        <div className="mt-2">
          <strong className="text-sm">Full Response Payload:</strong>
          <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2 max-w-full overflow-hidden">
            <ScrollArea className="h-32 w-full">
              <pre className="font-mono text-xs whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300 max-w-full overflow-wrap-anywhere">
                {typeof responseData.responsePayload === 'string' 
                  ? responseData.responsePayload 
                  : JSON.stringify(responseData.responsePayload, null, 2)
                }
              </pre>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Generated Response */}
      {responseData.fullResponse && (
        <div className="mt-2">
          <strong className="text-sm">Generated Response:</strong>
          <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2 max-w-full overflow-hidden">
            <ScrollArea className="h-24 w-full">
              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words max-w-full overflow-wrap-anywhere">
                {typeof responseData.fullResponse === 'string' 
                  ? responseData.fullResponse 
                  : JSON.stringify(responseData.fullResponse, null, 2)
                }
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
} 