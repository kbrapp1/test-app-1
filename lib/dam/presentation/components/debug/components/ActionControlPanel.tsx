/**
 * Action Control Panel Component
 * 
 * Single responsibility: Manage action tracking and selection UI
 */

import React from 'react';
import { DAM_ACTION_PATTERNS } from '../NetworkMonitorConfig';
import type { ActionMarker } from '../hooks/useNetworkMonitor';

interface ActionControlPanelProps {
  currentAction: string;
  actions: ActionMarker[];
  onMarkAction: (actionName: string) => void;
}

export function ActionControlPanel({
  currentAction,
  actions,
  onMarkAction
}: ActionControlPanelProps) {
  return (
    <div className="mb-3 p-2 bg-gray-50 rounded border text-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-700">Current Action:</span>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {currentAction}
        </span>
      </div>
      
      <div className="flex gap-1 flex-wrap">
        {DAM_ACTION_PATTERNS.slice(0, 6).map(pattern => (
          <button
            key={pattern.name}
            onClick={() => onMarkAction(pattern.name)}
            className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-100"
            title={pattern.description}
          >
            {pattern.name}
          </button>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="mt-2">
          <h4 className="font-medium text-gray-700 text-sm mb-1">Recent Actions:</h4>
          <div className="space-y-1">
            {actions.slice(-3).map((action, i) => (
              <div key={i} className="text-xs bg-blue-50 p-1 rounded border">
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">{action.name}</span>
                  <span className="text-gray-500">{action.timeString}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 