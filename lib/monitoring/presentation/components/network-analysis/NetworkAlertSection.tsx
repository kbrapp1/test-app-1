'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { NetworkStats } from '../../../domain/network-efficiency/entities/NetworkCall';

interface NetworkAlertSectionProps {
  stats: NetworkStats;
}

export function NetworkAlertSection({ stats }: NetworkAlertSectionProps) {
  if (stats.persistentRedundantCount === 0) {
    return null;
  }

  return (
    <Alert 
      variant={stats.redundantCalls > 0 ? "destructive" : "default"}
      className={`border-l-4 ${
        stats.redundantCalls > 0 
          ? 'border-l-red-500 bg-red-50' 
          : 'border-l-yellow-500 bg-yellow-50'
      }`}
    >
      <AlertTriangle className="h-5 w-5" />
      <AlertDescription className="text-sm">
        {stats.redundantCalls > 0 ? (
          <div>
            <strong className="text-red-800">
              {stats.redundantCalls} redundant calls detected this session!
            </strong>
            <div className="mt-1 text-red-700">
              Session redundancy rate: {stats.redundancyRate.toFixed(1)}% - Issues persist for analysis
            </div>
          </div>
        ) : (
          <div>
            <strong className="text-green-800">
              No redundant calls detected this session
            </strong>
            <div className="mt-1 text-green-700">
              Excellent performance! Network efficiency: 100%
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
} 