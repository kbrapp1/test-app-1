"use client";

/**
 * Network Monitor Display Component
 * 
 * Presentation layer component for network monitoring UI
 * Single responsibility: Coordinate UI layout and user interactions
 * Follows DDD principles with clear separation of concerns
 */

import React, { useState, useEffect } from 'react';
import { useAuthWithSuperAdmin } from '@/lib/auth/super-admin';
import { useNetworkMonitor } from './hooks/useNetworkMonitor';
import { ActionControlPanel } from './components/ActionControlPanel';
import { AnalysisResultsPanel } from './components/AnalysisResultsPanel';
import { NetworkCallsList } from './components/NetworkCallsList';
import { DeduplicationPanel } from './components/DeduplicationPanel';
import { ServerActionMonitor } from './components/ServerActionMonitor';
import { apiDeduplicationService } from '@/lib/dam/application/services/ApiDeduplicationService';

export function NetworkMonitorDisplay() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'network' | 'server-actions'>('network');
  const [copyButtonState, setCopyButtonState] = useState<'default' | 'success'>('default');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [recentDeduplications, setRecentDeduplications] = useState<any[]>([]);
  
  const { isSuperAdmin, loading } = useAuthWithSuperAdmin();
  const {
    calls,
    analysis,
    actions,
    currentAction,
    initializeMonitoring,
    analyzeRedundancy,
    analyzeCurrentAction,
    copyAnalysis,
    markAction,
    clearAll
  } = useNetworkMonitor();

  useEffect(() => {
    if (!isSuperAdmin || loading) return;
    
    initializeMonitoring();
  }, [isSuperAdmin, loading, initializeMonitoring]);

  // Monitor deduplication service (legacy - React Query now handles deduplication)
  useEffect(() => {
    if (!isSuperAdmin || loading) return;

    const interval = setInterval(() => {
      const count = apiDeduplicationService.getPendingCount();
      const pending = apiDeduplicationService.getPendingRequests();
      const recent = apiDeduplicationService.getRecentDeduplications(10);
      
      setPendingCount(count);
      setPendingRequests(pending);
      setRecentDeduplications(recent);
    }, 100);

    return () => clearInterval(interval);
  }, [isSuperAdmin, loading]);

  // Super admin restriction - early return after all hooks
  if (loading || !isSuperAdmin) {
    return null;
  }

  const handleCopyAnalysis = async () => {
    if (!analysis) return;
    
    const success = await copyAnalysis();
    if (success) {
      setCopyButtonState('success');
      setTimeout(() => setCopyButtonState('default'), 2000);
    }
  };

  const handleClearRecentDeduplications = () => {
    apiDeduplicationService.clearRecentDeduplications();
    setRecentDeduplications([]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Deduplication status indicator */}
      {pendingCount > 0 && (
        <div className="mb-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-sm shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-800 dark:text-green-200">
              {pendingCount} deduplicating...
            </span>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 text-sm font-medium"
      >
        📊 Monitor {calls.length > 0 && `(${calls.length})`}
      </button>

      {isVisible && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-[500px] max-h-[700px] overflow-auto">
          <MonitorHeader 
            onAnalyzeAll={analyzeRedundancy}
            onAnalyzeAction={analyzeCurrentAction}
            onCopy={handleCopyAnalysis}
            onClear={clearAll}
            analysis={analysis}
            copyButtonState={copyButtonState}
            pendingCount={pendingCount}
          />

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('network')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'network'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Network Calls
            </button>
            <button
              onClick={() => setActiveTab('server-actions')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'server-actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Server Actions
            </button>
          </div>

          {activeTab === 'network' && (
            <>
              <ActionControlPanel
                currentAction={currentAction}
                actions={actions}
                onMarkAction={markAction}
              />

              {analysis && (
                <AnalysisResultsPanel analysis={analysis} />
              )}

              <NetworkCallsList 
                calls={calls}
                currentAction={currentAction}
              />

              <DeduplicationPanel
                pendingRequests={pendingRequests}
                recentDeduplications={recentDeduplications}
                onClearRecent={handleClearRecentDeduplications}
              />
            </>
          )}

          {activeTab === 'server-actions' && (
            <ServerActionMonitor />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Monitor Header Component
 * 
 * Single responsibility: Display header controls and actions
 */
interface MonitorHeaderProps {
  onAnalyzeAll: () => void;
  onAnalyzeAction: () => void;
  onCopy: () => void;
  onClear: () => void;
  analysis: any;
  copyButtonState: 'default' | 'success';
  pendingCount: number;
}

function MonitorHeader({
  onAnalyzeAll,
  onAnalyzeAction,
  onCopy,
  onClear,
  analysis,
  copyButtonState,
  pendingCount
}: MonitorHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900">DAM Network Monitor</h3>
          {pendingCount > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 text-xs font-medium">
                {pendingCount} deduplicating
              </span>
            </div>
          )}
        </div>
              <div className="flex gap-1">
          <button
            onClick={onAnalyzeAll}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
            title="Analyze all calls"
          >
            All
          </button>
          <button
            onClick={onAnalyzeAction}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
            title="Analyze current action only"
          >
            Action
          </button>
          {analysis && (
            <button
              onClick={onCopy}
              className={`px-2 py-1 rounded text-xs ${
                copyButtonState === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {copyButtonState === 'success' ? '✓ Copied!' : 'Copy'}
            </button>
          )}
          <button
            onClick={onClear}
            className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
} 