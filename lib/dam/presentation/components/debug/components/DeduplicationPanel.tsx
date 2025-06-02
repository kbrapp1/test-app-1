"use client";

/**
 * Deduplication Panel Component
 * 
 * Single responsibility: Display detailed deduplication monitoring information
 * Shows pending requests and recent deduplication events
 */

import React from 'react';

interface DeduplicationEvent {
  actionId: string;
  timestamp: number;
  key: string;
  timeoutMs: number;
}

interface PendingRequest {
  actionId: string;
  timestamp: number;
  deduplicationCount: number;
  key: string;
  age: number;
}

interface DeduplicationPanelProps {
  pendingRequests: PendingRequest[];
  recentDeduplications: DeduplicationEvent[];
  onClearRecent: () => void;
}

export function DeduplicationPanel({
  pendingRequests,
  recentDeduplications,
  onClearRecent
}: DeduplicationPanelProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatAge = (ageMs: number) => {
    if (ageMs < 1000) return `${ageMs}ms`;
    return `${(ageMs / 1000).toFixed(1)}s`;
  };

  if (pendingRequests.length === 0 && recentDeduplications.length === 0) {
    return (
      <div className="border-t border-gray-200 pt-3">
        <div className="text-sm text-gray-500 italic">
          No deduplication activity
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-700">Deduplication Activity</h4>
        {recentDeduplications.length > 0 && (
          <button
            onClick={onClearRecent}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-1">
            Pending Requests ({pendingRequests.length})
          </div>
          <div className="space-y-1">
            {pendingRequests.map((request, index) => (
              <div
                key={`${request.key}-${index}`}
                className="bg-green-50 border border-green-200 rounded px-2 py-1"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-green-800 truncate">
                      {request.actionId}
                    </div>
                    <div className="text-xs text-green-600">
                      Age: {formatAge(request.age)}
                      {request.deduplicationCount > 0 && (
                        <span className="ml-2 bg-green-200 px-1 rounded">
                          Blocked: {request.deduplicationCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Deduplications */}
      {recentDeduplications.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">
            Recent Deduplications ({recentDeduplications.length})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recentDeduplications.map((event, index) => (
              <div
                key={`${event.key}-${event.timestamp}-${index}`}
                className="bg-orange-50 border border-orange-200 rounded px-2 py-1"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-orange-800 truncate">
                      {event.actionId}
                    </div>
                    <div className="text-xs text-orange-600">
                      {formatTime(event.timestamp)} • Window: {event.timeoutMs}ms
                    </div>
                  </div>
                  <div className="text-xs text-orange-500 flex-shrink-0 ml-1">
                    🔄
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 