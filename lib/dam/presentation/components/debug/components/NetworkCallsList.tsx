/**
 * Network Calls List Component
 * 
 * Single responsibility: Display list of recent network calls
 */

import React from 'react';
import type { NetworkCall } from '../services/NetworkMonitorService';

interface NetworkCallsListProps {
  calls: NetworkCall[];
  currentAction: string;
}

export function NetworkCallsList({ calls, currentAction }: NetworkCallsListProps) {
  if (calls.length === 0) {
    return (
      <div className="text-gray-500 text-sm">No calls yet...</div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="font-medium text-gray-700 text-sm">Recent Calls:</h4>
      {calls.slice(-10).map((call, i) => (
        <div key={i} className={`text-xs p-2 rounded border ${
          call.actionContext === currentAction ? 'bg-green-50 border-green-200' : 'bg-gray-50'
        }`}>
          <div className="flex justify-between">
            <span className={`font-medium ${
              call.method === 'GET' ? 'text-blue-600' : 
              call.method === 'POST' ? 'text-green-600' : 'text-purple-600'
            }`}>
              {call.method}
            </span>
            <span className="text-gray-500">{call.timeString}</span>
          </div>
          <div className="text-gray-700 break-all">
            {call.url.replace(window.location.origin, '')}
          </div>
          {call.actionContext && (
            <div className="text-xs text-gray-500 mt-1">
              Action: {call.actionContext}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 