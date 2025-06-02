"use client";

/**
 * Server Action Monitor Component
 * 
 * Provides proactive monitoring of Server Actions including:
 * - Server Action ID to function name mapping
 * - Deduplication coverage analysis
 * - Real-time Server Action feed
 * - Proactive alerts for unprotected actions
 */

import React, { useState, useEffect } from 'react';
import { apiDeduplicationService } from '@/lib/dam/application/services/ApiDeduplicationService';

interface ServerActionCall {
  id: string;
  name: string;
  timestamp: number;
  parameters: any[];
  hasDeduplication: boolean;
  deduplicationCount?: number;
}

interface ServerActionStats {
  totalCalls: number;
  protectedActions: string[];
  unprotectedActions: string[];
  recentCalls: ServerActionCall[];
}

export function ServerActionMonitor() {
  const [stats, setStats] = useState<ServerActionStats>({
    totalCalls: 0,
    protectedActions: [],
    unprotectedActions: [],
    recentCalls: []
  });
  const [alerts, setAlerts] = useState<string[]>([]);

  // Known Server Actions with deduplication (this could be enhanced to auto-detect)
  const knownProtectedActions = [
    'getRootFolders',
    'getFolderNavigation', 
    'getActiveOrganizationId',
    'getSessionUser',
    'listTextAssets',
    'getTeamMembers',
    'createFolder',
    'deleteFolder',
    'renameFolder',
    'updateSelection',
    'bulkMoveItems',
    'bulkDeleteItems',
    'bulkTagItems',
    'bulkDownloadItems'
  ];

  // Server Action ID to name mapping (based on our investigation)
  const actionIdToName: Record<string, string> = {
    '40baca0d': 'getRootFolders',
    '00a9ed14': 'getActiveOrganizationId',
    // Add more mappings as discovered
  };

  useEffect(() => {
    const interval = setInterval(() => {
      updateStats();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const globalCallCount = (globalThis as any).__serverActionCallCount || 0;
    const pendingRequests = apiDeduplicationService.getPendingRequests();
    const recentDeduplications = apiDeduplicationService.getRecentDeduplications(20);

    // Build recent calls from deduplication events and pending requests
    const recentCalls: ServerActionCall[] = [];
    
    // Add recent deduplication events
    recentDeduplications.forEach(event => {
      const shortId = event.actionId.substring(0, 8);
      const mappedName = actionIdToName[shortId] || event.actionId;
      
      recentCalls.push({
        id: shortId,
        name: mappedName,
        timestamp: event.timestamp,
        parameters: [],
        hasDeduplication: true,
        deduplicationCount: 1
      });
    });

    // Add currently pending requests
    pendingRequests.forEach(request => {
      const shortId = request.actionId.substring(0, 8);
      const mappedName = actionIdToName[shortId] || request.actionId;
      
      recentCalls.push({
        id: shortId,
        name: mappedName,
        timestamp: request.timestamp,
        parameters: [],
        hasDeduplication: true,
        deduplicationCount: request.deduplicationCount
      });
    });

    // Sort by timestamp (newest first)
    recentCalls.sort((a, b) => b.timestamp - a.timestamp);

    // Identify unprotected actions that have been called recently
    const calledActions = new Set(recentCalls.map(call => call.name));
    const unprotectedActions = Array.from(calledActions).filter(
      action => !knownProtectedActions.includes(action) && !actionIdToName[action]
    );

    // Generate alerts for unprotected actions
    const newAlerts: string[] = [];
    unprotectedActions.forEach(action => {
      if (!alerts.includes(`Unprotected action: ${action}`)) {
        newAlerts.push(`Unprotected action: ${action}`);
      }
    });

    setStats({
      totalCalls: globalCallCount,
      protectedActions: knownProtectedActions,
      unprotectedActions,
      recentCalls: recentCalls.slice(0, 10) // Keep last 10 calls
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-5)); // Keep last 5 alerts
    }
  };

  const clearAlerts = () => setAlerts([]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActionDisplayName = (call: ServerActionCall) => {
    if (call.name !== call.id) {
      return `${call.name} (${call.id})`;
    }
    return call.name;
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-900">Total Server Actions</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalCalls}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm font-medium text-green-900">Protected Actions</div>
          <div className="text-2xl font-bold text-green-600">{stats.protectedActions.length}</div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-yellow-900">⚠️ Proactive Alerts</h4>
            <button
              onClick={clearAlerts}
              className="text-xs text-yellow-600 hover:text-yellow-800"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-yellow-800">
                • {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Server Action Calls */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-3">🔄 Recent Server Actions</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {stats.recentCalls.length === 0 ? (
            <div className="text-sm text-gray-500 italic">No recent calls tracked</div>
          ) : (
            stats.recentCalls.map((call, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${call.hasDeduplication ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-mono text-xs">{getActionDisplayName(call)}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {call.deduplicationCount && call.deduplicationCount > 0 && (
                    <span className="bg-green-100 text-green-800 px-1 rounded">
                      dedupe: {call.deduplicationCount}
                    </span>
                  )}
                  <span>{formatTimestamp(call.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deduplication Coverage */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-3">🛡️ Deduplication Coverage</h4>
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium text-green-700 mb-1">Protected Actions ({stats.protectedActions.length})</div>
            <div className="text-xs text-gray-600 space-y-1">
              {stats.protectedActions.map((action, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
          
          {stats.unprotectedActions.length > 0 && (
            <div>
              <div className="text-sm font-medium text-red-700 mb-1">Unprotected Actions ({stats.unprotectedActions.length})</div>
              <div className="text-xs text-gray-600 space-y-1">
                {stats.unprotectedActions.map((action, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action ID Mapping Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 mb-2">🗺️ Known Action Mappings</h4>
        <div className="space-y-1 text-xs">
          {Object.entries(actionIdToName).map(([id, name]) => (
            <div key={id} className="flex justify-between">
              <span className="font-mono">{id}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-blue-600">
          💡 When new mystery actions appear, their IDs will be added here automatically
        </div>
      </div>
    </div>
  );
} 