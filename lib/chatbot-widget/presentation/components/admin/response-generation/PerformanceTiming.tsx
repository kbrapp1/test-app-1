import React from 'react';
import { PerformanceData } from '../../../types/response-generation';

interface PerformanceTimingProps {
  performance: PerformanceData;
  textColor: string;
}

export function PerformanceTiming({ performance, textColor }: PerformanceTimingProps) {
  return (
    <div className="border-t pt-2">
      <strong className={`text-sm ${textColor}`}>End-to-End Performance Timing:</strong>
      <div className="mt-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-3">
        <div className="space-y-3">
          {/* Total Time */}
          <div className="text-center">
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
              Total Response Time: {performance.componentTimings.total}ms
            </div>
            <div className="text-xs text-muted-foreground">
              From user message to final response delivery
            </div>
          </div>

          {/* Main Process Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <strong className="text-sm text-blue-800 dark:text-blue-200">Core AI Processing:</strong>
              <div className="space-y-1 text-xs">
                {performance.componentTimings.requestPreprocessing && (
                  <div className="flex justify-between">
                    <span>Request Preprocessing:</span>
                    <span className="font-mono">{performance.componentTimings.requestPreprocessing}ms</span>
                  </div>
                )}
                {performance.componentTimings.functionCallExecution && (
                  <div className="flex justify-between">
                    <span>API Call 1 (Function Calling):</span>
                    <span className="font-mono">{performance.componentTimings.functionCallExecution}ms</span>
                  </div>
                )}
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
                {performance.componentTimings.businessRuleProcessing && (
                  <div className="flex justify-between">
                    <span>Business Rules:</span>
                    <span className="font-mono">{performance.componentTimings.businessRuleProcessing}ms</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>API Call 2 (Response Gen):</span>
                  <span className="font-mono">{performance.componentTimings.responseGeneration}ms</span>
                </div>
                {performance.componentTimings.responsePostprocessing && (
                  <div className="flex justify-between">
                    <span>Response Postprocessing:</span>
                    <span className="font-mono">{performance.componentTimings.responsePostprocessing}ms</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <strong className="text-sm text-blue-800 dark:text-blue-200">Infrastructure:</strong>
              <div className="space-y-1 text-xs">
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
                <div className="flex justify-between">
                  <span>Total API Calls Made:</span>
                  <span className="font-mono">{performance.apiCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Queries:</span>
                  <span className="font-mono">{performance.dbQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hits:</span>
                  <span className="font-mono">{performance.cacheHits}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="border-t pt-2">
            <strong className="text-xs text-blue-800 dark:text-blue-200">Performance Insights:</strong>
            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
              {performance.componentTimings.total > 5000 && (
                <div className="text-orange-600">⚠ Response time exceeds 5 seconds - consider optimization</div>
              )}
              {performance.cacheHits > 0 && (
                <div className="text-green-600">✓ Cache optimization active ({performance.cacheHits} hits)</div>
              )}
              {performance.apiCalls > 2 && (
                <div className="text-yellow-600">⚡ Multiple API calls detected ({performance.apiCalls} total)</div>
              )}
              <div>
                <strong>Efficiency:</strong> {(performance.componentTimings.total / 1000).toFixed(2)}s total, 
                {performance.componentTimings.responseGeneration && (
                  <span> {((performance.componentTimings.responseGeneration / performance.componentTimings.total) * 100).toFixed(1)}% on final response generation</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 