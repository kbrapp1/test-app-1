'use client';

import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  X, 
  Activity,
  Pause,
  Play,
  Wifi,
  WifiOff
} from 'lucide-react';
import { networkInterceptors } from '../../services/NetworkInterceptors';

interface NetworkMonitorHeaderProps {
  isFullPage: boolean;
  autoRefresh: boolean;
  isRefreshing: boolean;
  onToggleAutoRefresh: () => void;
  onToggleInterceptors: () => void;
  onManualRefresh: () => void;
  onClose?: () => void;
}

export function NetworkMonitorHeader({
  isFullPage,
  autoRefresh,
  isRefreshing,
  onToggleAutoRefresh,
  onToggleInterceptors,
  onManualRefresh,
  onClose
}: NetworkMonitorHeaderProps) {
  return (
    <CardHeader className={`${isFullPage ? "pb-6" : "pb-4"} border-b border-gray-100`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Network Monitor
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Real-time network activity tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={onToggleAutoRefresh}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="transition-all duration-200"
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          
          <Button
            onClick={onToggleInterceptors}
            variant={networkInterceptors['isInstalled'] ? 'default' : 'outline'}
            size="sm"
            className={networkInterceptors['isInstalled'] 
              ? "bg-green-600 hover:bg-green-700" 
              : "border-red-300 text-red-600 hover:bg-red-50"
            }
          >
            {networkInterceptors['isInstalled'] ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
            {networkInterceptors['isInstalled'] ? 'Monitoring' : 'Disabled'}
          </Button>

          <Button 
            onClick={onManualRefresh} 
            variant="ghost" 
            size="sm"
            disabled={isRefreshing}
            className="transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {onClose && (
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="sm"
              className="hover:bg-red-50 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
  );
} 