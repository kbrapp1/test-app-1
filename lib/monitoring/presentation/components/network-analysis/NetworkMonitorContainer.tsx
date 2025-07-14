'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader as _CardHeader } from '@/components/ui/card';
import { Button as _Button } from '@/components/ui/button';
import { Activity, X as _X } from 'lucide-react';
import { withMonitoringErrorBoundary } from '../error/MonitoringErrorBoundary';
import { NetworkMonitorHeader } from '../network-analysis/NetworkMonitorHeader';
import { NetworkStatsOverview } from '../network-analysis/NetworkStatsOverview';
import { NetworkAlertSection } from '../network-analysis/NetworkAlertSection';
import { NetworkMonitorTabs } from '../network-analysis/NetworkMonitorTabs';
import { NetworkMonitorWidget } from '../network-analysis/NetworkMonitorWidget';
import { useNetworkMonitorState } from '../../hooks/network-analysis/useNetworkMonitorState';

interface NetworkMonitorContainerProps {
  isFullPage?: boolean;
}

const NetworkLoadingState = React.memo(() => {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Activity className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Network Statistics</h3>
      <p className="text-gray-500">Gathering network activity data...</p>
    </div>
  );
});

NetworkLoadingState.displayName = 'NetworkLoadingState';

const NetworkMonitorContainerComponent = React.memo<NetworkMonitorContainerProps>(({ isFullPage = false }) => {
  const [isOpen, setIsOpen] = useState(isFullPage ? true : false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const {
    stats,
    isRefreshing,
    handleClear,
    handleToggleInterceptors,
    handleManualRefresh
  } = useNetworkMonitorState(isOpen, autoRefresh);

  // Memoize expensive className calculations
  const containerClassName = useMemo(() => {
    return `${
      isFullPage 
        ? "w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" 
        : "fixed bottom-6 right-6 z-50 w-[900px] max-h-[700px] shadow-2xl"
    } transition-all duration-500`;
  }, [isFullPage]);

  const cardClassName = useMemo(() => {
    return `${
      isFullPage 
        ? "w-full border-0 shadow-none bg-transparent" 
        : "w-full border-2 border-blue-100 bg-white/95 backdrop-blur-sm"
    }`;
  }, [isFullPage]);

  const contentClassName = useMemo(() => {
    return `${isFullPage ? "p-8" : "p-6"} space-y-6`;
  }, [isFullPage]);

  // Memoize event handlers
  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefresh(!autoRefresh);
  }, [autoRefresh]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Floating widget when not full page
  if (!isOpen && !isFullPage) {
    return (
      <NetworkMonitorWidget
        stats={stats}
        onOpen={handleOpen}
      />
    );
  }

  return (
    <div className={containerClassName}>
      <Card className={cardClassName}>
        <NetworkMonitorHeader
          isFullPage={isFullPage}
          autoRefresh={autoRefresh}
          isRefreshing={isRefreshing}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          onToggleInterceptors={handleToggleInterceptors}
          onManualRefresh={handleManualRefresh}
          onClose={!isFullPage ? handleClose : undefined}
        />
        
        <CardContent className={contentClassName}>
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
});

NetworkMonitorContainerComponent.displayName = 'NetworkMonitorContainer';

// Wrap with error boundary for enhanced error handling
export const NetworkMonitorContainer = withMonitoringErrorBoundary(
  NetworkMonitorContainerComponent,
  {
    componentName: 'NetworkMonitorContainer',
    retryable: true,
    onError: (error, _errorInfo) => {
      // Additional error handling for network monitoring
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NetworkMonitorContainer] Error in network monitoring:', error.message);
      }
    }
  }
); 