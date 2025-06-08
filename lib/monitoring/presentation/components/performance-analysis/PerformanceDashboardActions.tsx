'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface PerformanceDashboardActionsProps {
  onReset: () => void;
  onFullReset: () => void;
  showFullResetConfirm: boolean;
  lastUpdateTime: number;
}

const PerformanceDashboardActionsComponent: React.FC<PerformanceDashboardActionsProps> = ({
  onReset,
  onFullReset,
  showFullResetConfirm,
  lastUpdateTime
}) => {
  // Memoize formatted update time string
  const updatedTimeString = useMemo(() => new Date(lastUpdateTime).toLocaleTimeString(), [lastUpdateTime]);
  return (
    <div className="flex justify-between pt-2 border-t border-gray-200">
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-7 px-2 text-xs"
          title="Reset frontend metrics. Network & architectural issues persist."
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Reset
        </Button>
        
        <Button
          variant={showFullResetConfirm ? "destructive" : "outline"}
          size="sm"
          onClick={onFullReset}
          className="h-7 px-2 text-xs"
          title={showFullResetConfirm ? "Click again to confirm full reset" : "Reset everything including network data"}
        >
          {showFullResetConfirm ? (
            <>
              <RefreshCw className="w-3 h-3 mr-1" />
              Confirm?
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3 mr-1" />
              All
            </>
          )}
        </Button>
      </div>
      
      <div className="text-xs text-gray-500">
        <div>Updated: {updatedTimeString}</div>
      </div>
    </div>
  );
};

// Wrap component in React.memo for performance
export const PerformanceDashboardActions = React.memo(PerformanceDashboardActionsComponent);
PerformanceDashboardActions.displayName = 'PerformanceDashboardActions'; 