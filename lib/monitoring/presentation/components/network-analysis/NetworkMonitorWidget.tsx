'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { NetworkStats } from '../../../domain/network-efficiency/entities/NetworkCall';

interface NetworkMonitorWidgetProps {
  stats: NetworkStats | null;
  onOpen: () => void;
}

export function NetworkMonitorWidget({ stats, onOpen }: NetworkMonitorWidgetProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onOpen}
        className="h-14 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 group"
        size="lg"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Activity className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            {stats && stats.redundantCalls > 0 && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Network Monitor</span>
            {stats && (
              <span className="text-xs opacity-90">
                {stats.totalCalls} calls
                {stats.redundantCalls > 0 && (
                  <span className="ml-1 text-red-200">• {stats.redundantCalls} redundant</span>
                )}
              </span>
            )}
          </div>
        </div>
      </Button>
    </div>
  );
} 