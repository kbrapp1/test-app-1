/**
 * Analysis Results Panel Component
 * 
 * Single responsibility: Display redundancy analysis results
 */

import React from 'react';
import type { CallAnalysis } from '@/lib/utils/network-monitor';

interface AnalysisResultsPanelProps {
  analysis: CallAnalysis;
}

export function AnalysisResultsPanel({ analysis }: AnalysisResultsPanelProps) {
  return (
    <div className="mb-4 p-3 bg-yellow-50 rounded border">
      <h4 className="font-medium text-yellow-800 mb-2">Redundancy Analysis</h4>
      
      <div className="text-sm text-yellow-700">
        <div>Total Calls: {analysis.totalCalls}</div>
        <div>Redundant Calls: {analysis.redundantCalls.length}</div>
        
        {analysis.redundantCalls.length > 0 && (
          <div className="mt-2">
            <div className="font-medium text-red-600">🚨 Redundant Calls Found:</div>
            {analysis.redundantCalls.map((redundant, i) => (
              <div key={i} className="ml-2 text-xs">
                • {redundant.method} {redundant.url}
              </div>
            ))}
          </div>
        )}

        {analysis.timeAnalysis.rapidFireCalls.length > 0 && (
          <div className="mt-2">
            <div className="font-medium text-orange-600">⚡ Rapid Fire Calls:</div>
            {analysis.timeAnalysis.rapidFireCalls.map((rapidGroup, i) => (
              <div key={i} className="ml-2 text-xs">
                • {rapidGroup.length} calls to {rapidGroup[0]?.url} 
              </div>
            ))}
          </div>
        )}

        {analysis.redundantCalls.length === 0 && analysis.timeAnalysis.rapidFireCalls.length === 0 && (
          <div className="text-green-600 font-medium">✅ No redundancy detected!</div>
        )}
      </div>
    </div>
  );
} 