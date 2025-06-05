'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, X } from 'lucide-react';
import { NetworkMonitorHeader } from './NetworkMonitorHeader';
import { NetworkStatsOverview } from './NetworkStatsOverview';
import { NetworkAlertSection } from './NetworkAlertSection';
import { NetworkMonitorTabs } from './NetworkMonitorTabs';
import { NetworkMonitorWidget } from './NetworkMonitorWidget';
import { useNetworkMonitorState } from '../hooks/useNetworkMonitorState';

interface NetworkMonitorContainerProps {
  isFullPage?: boolean;
}

export function NetworkMonitorContainer({ isFullPage = false }: NetworkMonitorContainerProps) {
  const [isOpen, setIsOpen] = useState(isFullPage ? true : false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const {
    stats,
    isRefreshing,
    handleClear,
    handleToggleInterceptors,
    handleManualRefresh
  } = useNetworkMonitorState(isOpen, autoRefresh);

  // Floating widget when not full page
  if (!isOpen && !isFullPage) {
    return (
      <NetworkMonitorWidget
        stats={stats}
        onOpen={() => setIsOpen(true)}
      />
    );
  }

  return (
    <div 
      className={`${
        isFullPage 
          ? "w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" 
          : "fixed bottom-6 right-6 z-50 w-[900px] max-h-[700px] shadow-2xl"
      } transition-all duration-500`}
    >
      <Card className={`${
        isFullPage 
          ? "w-full border-0 shadow-none bg-transparent" 
          : "w-full border-2 border-blue-100 bg-white/95 backdrop-blur-sm"
      }`}>
        <NetworkMonitorHeader
          isFullPage={isFullPage}
          autoRefresh={autoRefresh}
          isRefreshing={isRefreshing}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
          onToggleInterceptors={handleToggleInterceptors}
          onManualRefresh={handleManualRefresh}
          onClose={!isFullPage ? () => setIsOpen(false) : undefined}
        />
        
        <CardContent className={`${isFullPage ? "p-8" : "p-6"} space-y-6`}>
          {!stats ? (
            <NetworkLoadingState />
          ) : (
            <>
              <NetworkStatsOverview stats={stats} />
              <NetworkAlertSection stats={stats} />
              <NetworkMonitorTabs 
                stats={stats} 
                onClear={handleClear}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NetworkLoadingState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Activity className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Network Statistics</h3>
      <p className="text-gray-500">Gathering network activity data...</p>
    </div>
  );
} 