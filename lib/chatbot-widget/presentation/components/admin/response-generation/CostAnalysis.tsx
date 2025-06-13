import React from 'react';
import { CostData, ResponseData } from '../../../types/response-generation';

interface CostAnalysisProps {
  costData: CostData;
  responseData: ResponseData;
  textColor: string;
}

export function CostAnalysis({ costData, responseData, textColor }: CostAnalysisProps) {
  return (
    <div className="border-t pt-2">
      <strong className={`text-sm ${textColor}`}>Token Usage & Cost Analysis:</strong>
      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
        <div><strong>Input Tokens:</strong> {responseData.usage.promptTokens}</div>
        <div><strong>Output Tokens:</strong> {responseData.usage.completionTokens}</div>
        <div><strong>Total Tokens:</strong> {responseData.usage.totalTokens}</div>
        <div><strong>Estimated Cost:</strong> ${costData.estimatedCost}</div>
      </div>

      {/* Detailed Cost Breakdown */}
      {costData.totalCostBreakdown && (
        <div className="mt-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-2">
          <strong className="text-sm text-green-800 dark:text-green-200">Cost Breakdown:</strong>
          <div className="grid grid-cols-3 gap-4 text-xs mt-1">
            <div>
              <strong>Input Cost:</strong> {typeof costData.totalCostBreakdown.inputCost === 'string' 
                ? costData.totalCostBreakdown.inputCost 
                : `$${costData.totalCostBreakdown.inputCost.toFixed(6)}`}
              {costData.inputCostPerToken && (
                <div className="text-muted-foreground">
                  (${costData.inputCostPerToken.toFixed(8)}/token)
                </div>
              )}
            </div>
            <div>
              <strong>Output Cost:</strong> {typeof costData.totalCostBreakdown.outputCost === 'string' 
                ? costData.totalCostBreakdown.outputCost 
                : `$${costData.totalCostBreakdown.outputCost.toFixed(6)}`}
              {costData.outputCostPerToken && (
                <div className="text-muted-foreground">
                  (${costData.outputCostPerToken.toFixed(8)}/token)
                </div>
              )}
            </div>
            <div>
              <strong>Total:</strong> {typeof costData.totalCostBreakdown.total === 'string' 
                ? costData.totalCostBreakdown.total 
                : `$${costData.totalCostBreakdown.total.toFixed(6)}`}
            </div>
          </div>
        </div>
      )}

      {/* Token Efficiency Metrics */}
      <div className="mt-2 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Input/Output Ratio:</strong> {(responseData.usage.promptTokens / responseData.usage.completionTokens).toFixed(2)}:1
          </div>
          <div>
            <strong>Cost per Character:</strong> ${(parseFloat(costData.estimatedCost) / responseData.responseLength).toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  );
} 