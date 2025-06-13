import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RequestData } from '../../../types/response-generation';

interface ApiRequestDetailsProps {
  requestData: RequestData;
  textColor: string;
}

export function ApiRequestDetails({ requestData, textColor }: ApiRequestDetailsProps) {
  return (
    <div className="border-t pt-2">
      <strong className={`text-sm ${textColor}`}>API Request Configuration:</strong>
      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
        <div><strong>Model:</strong> {requestData.model}</div>
        <div><strong>Temperature:</strong> {requestData.temperature}</div>
        <div><strong>Max Tokens:</strong> {requestData.maxTokens}</div>
        <div><strong>Messages Count:</strong> {requestData.messagesCount}</div>
        {requestData.requestSize && (
          <div><strong>Request Size:</strong> {(requestData.requestSize / 1024).toFixed(2)} KB</div>
        )}
        {requestData.apiEndpoint && (
          <div><strong>API Endpoint:</strong> <code className="text-xs">{requestData.apiEndpoint}</code></div>
        )}
      </div>

      {/* Request Headers */}
      {requestData.requestHeaders && Object.keys(requestData.requestHeaders).length > 0 && (
        <div className="mt-2">
          <strong className="text-sm">Request Headers:</strong>
          <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2">
            <ScrollArea className="h-20 w-full">
              <div className="space-y-1">
                {Object.entries(requestData.requestHeaders).map(([key, value]) => (
                  <div key={key} className="text-xs font-mono">
                    <span className="text-blue-600 dark:text-blue-400">{key}:</span>{' '}
                    <span className="text-gray-700 dark:text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Full Request Payload */}
      {requestData.requestPayload && (
        <div className="mt-2">
          <strong className="text-sm">Full Request Payload:</strong>
          <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2 max-w-full overflow-hidden">
            <ScrollArea className="h-64 w-full">
              <pre className="font-mono text-xs whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300 max-w-full overflow-wrap-anywhere">
                {JSON.stringify(requestData.requestPayload, null, 2)}
              </pre>
            </ScrollArea>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <strong>Payload Size:</strong> {JSON.stringify(requestData.requestPayload).length} characters
          </div>
        </div>
      )}
    </div>
  );
} 