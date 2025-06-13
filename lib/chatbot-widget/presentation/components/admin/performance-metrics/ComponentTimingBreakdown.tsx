import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Performance } from '../../../types/performance-metrics';

interface ComponentTimingBreakdownProps {
  performance: Performance;
}

export function ComponentTimingBreakdown({ performance }: ComponentTimingBreakdownProps) {
  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-orange-700 dark:text-orange-300">Component Timing Breakdown:</strong>
      <div className="mt-2 space-y-2">
        {/* Core Components */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Intent Classification:</span>
            <span className="font-mono">{performance.componentTimings.intentClassification}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Entity Extraction:</span>
            <span className="font-mono">{performance.componentTimings.entityExtraction}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Lead Scoring:</span>
            <span className="font-mono">{performance.componentTimings.leadScoring}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Response Generation:</span>
            <span className="font-mono">{performance.componentTimings.responseGeneration}ms</span>
          </div>
        </div>

        {/* Extended Timing Details */}
        {(performance.componentTimings.requestPreprocessing || 
          performance.componentTimings.functionCallExecution || 
          performance.componentTimings.businessRuleProcessing ||
          performance.componentTimings.responsePostprocessing ||
          performance.componentTimings.databaseOperations ||
          performance.componentTimings.externalApiCalls) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
            <strong className="text-xs text-orange-700 dark:text-orange-300">Extended Timing Details:</strong>
            <div className="grid grid-cols-2 gap-2 text-xs mt-1">
              {performance.componentTimings.requestPreprocessing && (
                <div className="flex justify-between">
                  <span>Request Preprocessing:</span>
                  <span className="font-mono">{performance.componentTimings.requestPreprocessing}ms</span>
                </div>
              )}
              {performance.componentTimings.functionCallExecution && (
                <div className="flex justify-between">
                  <span>Function Call Execution:</span>
                  <span className="font-mono">{performance.componentTimings.functionCallExecution}ms</span>
                </div>
              )}
              {performance.componentTimings.businessRuleProcessing && (
                <div className="flex justify-between">
                  <span>Business Rule Processing:</span>
                  <span className="font-mono">{performance.componentTimings.businessRuleProcessing}ms</span>
                </div>
              )}
              {performance.componentTimings.responsePostprocessing && (
                <div className="flex justify-between">
                  <span>Response Postprocessing:</span>
                  <span className="font-mono">{performance.componentTimings.responsePostprocessing}ms</span>
                </div>
              )}
              {performance.componentTimings.databaseOperations && (
                <div className="flex justify-between">
                  <span>Database Operations:</span>
                  <span className="font-mono">{performance.componentTimings.databaseOperations}ms</span>
                </div>
              )}
              {performance.componentTimings.externalApiCalls && (
                <div className="flex justify-between">
                  <span>External API Calls:</span>
                  <span className="font-mono">{performance.componentTimings.externalApiCalls}ms</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total Processing Time */}
        <div className="border-t pt-2">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Processing Time:</span>
            <Badge variant={performance.componentTimings.total < 1000 ? "default" : performance.componentTimings.total < 3000 ? "secondary" : "destructive"}>
              {performance.componentTimings.total}ms
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
} 