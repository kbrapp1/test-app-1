import React from 'react';
import { Badge } from '@/components/ui/badge';

interface LeadScoring {
  currentScore: number;
  maxPossibleScore: number;
  qualificationThreshold: number;
  isQualified: boolean;
  scoreBreakdown: Array<{
    entityType: string;
    points: number;
    reason: string;
  }>;
  previousScore: number;
  scoreChange: number;
}

interface LeadScoringSectionProps {
  leadScoring?: LeadScoring;
}

export function LeadScoringSection({ leadScoring }: LeadScoringSectionProps) {
  if (!leadScoring) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-800 dark:text-orange-200">
        <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">7</span>
        Lead Scoring & Qualification Assessment
      </h4>
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
          <div className="text-sm">
            <strong>Business Logic:</strong> Calculate lead qualification score based on extracted entities and conversation context. This determines lead prioritization for the sales team.
          </div>
          <div className="border-t pt-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <strong>Lead Score:</strong>
                <Badge variant={leadScoring.isQualified ? "default" : "secondary"}>
                  {leadScoring.currentScore}/{leadScoring.maxPossibleScore}
                </Badge>
              </div>
              <div><strong>Qualification Status:</strong> 
                <span className={`ml-1 font-medium ${leadScoring.isQualified ? 'text-green-600' : 'text-orange-600'}`}>
                  {leadScoring.isQualified ? '✅ Qualified' : '⏳ Developing'}
                </span>
              </div>
              <div><strong>Qualification Threshold:</strong> {leadScoring.qualificationThreshold} points</div>
              <div><strong>Score Change:</strong> 
                <span className={`ml-1 font-medium ${leadScoring.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {leadScoring.scoreChange >= 0 ? '+' : ''}{leadScoring.scoreChange} points
                </span>
              </div>
            </div>
          </div>
          <div className="border-t pt-2">
            <strong className="text-sm">Scoring Breakdown & Business Rules:</strong>
            <div className="mt-2 space-y-2">
              {leadScoring.scoreBreakdown.map((item, idx) => (
                <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.entityType}</span>
                    <span className="text-green-600 font-mono">+{item.points} pts</span>
                  </div>
                  <div className="text-muted-foreground mt-1">{item.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 