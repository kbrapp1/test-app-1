import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ScoringRule {
  ruleId: string;
  condition: string;
  points: number;
  triggered: boolean;
}

interface ScoreBreakdownItem {
  entityType: string;
  points: number;
  reason: string;
  weight: number;
  category: string;
  ruleId: string;
}

interface LeadScoring {
  currentScore: number;
  maxPossibleScore: number;
  qualificationThreshold: number;
  isQualified: boolean;
  scoreBreakdown: ScoreBreakdownItem[];
  previousScore: number;
  scoreChange: number;
  scoringRules?: ScoringRule[];
  processingTime?: number;
}

interface LeadScoringResultsProps {
  leadScoring: LeadScoring;
}

export function LeadScoringResults({ leadScoring }: LeadScoringResultsProps) {
  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-green-700 dark:text-green-300">Lead Scoring Results:</strong>
      
      <LeadScoreMetrics leadScoring={leadScoring} />
      
      {leadScoring.scoreBreakdown.length > 0 && (
        <ScoreBreakdown breakdown={leadScoring.scoreBreakdown} />
      )}
      
      {leadScoring.scoringRules && leadScoring.scoringRules.length > 0 && (
        <ScoringRules rules={leadScoring.scoringRules} />
      )}
      
      {leadScoring.scoreChange !== 0 && (
        <ScoreChangeIndicator 
          previousScore={leadScoring.previousScore}
          currentScore={leadScoring.currentScore}
          scoreChange={leadScoring.scoreChange}
        />
      )}
    </div>
  );
}

function LeadScoreMetrics({ leadScoring }: { leadScoring: LeadScoring }) {
  const scorePercentage = (leadScoring.currentScore / leadScoring.maxPossibleScore) * 100;
  const qualificationPercentage = (leadScoring.qualificationThreshold / leadScoring.maxPossibleScore) * 100;
  
  return (
    <div className="mt-1 space-y-2">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <strong>Lead Score:</strong>
          <Badge variant={leadScoring.isQualified ? "default" : "secondary"}>
            {leadScoring.currentScore}/{leadScoring.maxPossibleScore}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({scorePercentage.toFixed(1)}%)
          </span>
        </div>
        
        <div>
          <strong>Qualification Status:</strong> 
          <span className={`ml-1 font-medium ${leadScoring.isQualified ? 'text-green-600' : 'text-orange-600'}`}>
            {leadScoring.isQualified ? '✅ Qualified' : '⏳ Developing'}
          </span>
        </div>
        
        <div>
          <strong>Qualification Threshold:</strong> 
          <span className="ml-1">
            {leadScoring.qualificationThreshold}/{leadScoring.maxPossibleScore}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            ({qualificationPercentage.toFixed(1)}%)
          </span>
        </div>
        
        {leadScoring.processingTime && (
          <div><strong>Processing Time:</strong> {leadScoring.processingTime}ms</div>
        )}
      </div>
      
      {/* Visual progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="relative h-2 rounded-full">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              leadScoring.isQualified ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(scorePercentage, 100)}%` }}
          />
          {/* Qualification threshold line */}
          <div 
            className="absolute top-0 w-0.5 h-2 bg-orange-500"
            style={{ left: `${Math.min(qualificationPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ScoreBreakdown({ breakdown }: { breakdown: ScoreBreakdownItem[] }) {
  const breakdownByCategory = breakdown.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ScoreBreakdownItem[]>);

  return (
    <div className="mt-2">
      <strong className="text-xs">Score Breakdown by Category:</strong>
      <div className="mt-1 space-y-2">
        {Object.entries(breakdownByCategory).map(([category, items]) => (
          <div key={category} className="bg-gray-50 dark:bg-gray-800 rounded p-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {category.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {items.reduce((sum, item) => sum + item.points, 0)} points
              </span>
            </div>
            
            <div className="space-y-1">
              {items.map((item, idx) => (
                <div key={idx} className="text-xs bg-white dark:bg-gray-900 p-1 rounded flex justify-between">
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400">{item.entityType}:</strong>
                    <span className="ml-1">{item.reason}</span>
                    {item.weight !== 1 && (
                      <span className="text-muted-foreground ml-1">(weight: {item.weight})</span>
                    )}
                  </div>
                  <span className="text-green-600 font-medium">+{item.points}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringRules({ rules }: { rules: ScoringRule[] }) {
  const triggeredRules = rules.filter(rule => rule.triggered);
  const availableRules = rules.filter(rule => !rule.triggered);
  
  return (
    <div className="mt-2">
      <strong className="text-xs">Scoring Rules Applied:</strong>
      
      {triggeredRules.length > 0 && (
        <div className="mt-1">
          <div className="text-xs text-green-700 dark:text-green-300 mb-1">✅ Triggered Rules:</div>
          <div className="space-y-1">
            {triggeredRules.map((rule, idx) => (
              <div key={idx} className="text-xs bg-green-50 dark:bg-green-950/20 p-1 rounded flex justify-between">
                <span>
                  <Badge variant="default" className="mr-1 text-xs">
                    {rule.ruleId}
                  </Badge>
                  {rule.condition}
                </span>
                <span className="text-green-600 font-medium">+{rule.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {availableRules.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">⏳ Available Rules:</div>
          <div className="space-y-1">
            {availableRules.map((rule, idx) => (
              <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded flex justify-between">
                <span>
                  <Badge variant="secondary" className="mr-1 text-xs">
                    {rule.ruleId}
                  </Badge>
                  {rule.condition}
                </span>
                <span className="text-gray-500">+{rule.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreChangeIndicator({ 
  previousScore, 
  currentScore, 
  scoreChange 
}: { 
  previousScore: number; 
  currentScore: number; 
  scoreChange: number; 
}) {
  const isIncrease = scoreChange > 0;
  const isDecrease = scoreChange < 0;
  
  return (
    <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
      <div className="text-xs">
        <strong>Score Change:</strong>
        <div className="flex items-center gap-2 mt-1">
          <span>{previousScore}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">{currentScore}</span>
          <span className={`font-medium ${
            isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-gray-600'
          }`}>
            ({isIncrease ? '+' : ''}{scoreChange})
          </span>
          {isIncrease && <span className="text-green-600">📈</span>}
          {isDecrease && <span className="text-red-600">📉</span>}
        </div>
      </div>
    </div>
  );
} 