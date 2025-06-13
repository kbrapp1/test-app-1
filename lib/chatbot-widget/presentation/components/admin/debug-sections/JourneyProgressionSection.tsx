import React from 'react';
import { Badge } from '@/components/ui/badge';

interface JourneyProgression {
  currentStage: string;
  previousStage: string;
  stageConfidence: number;
  transitionReason: string;
  engagementCategory: 'actively_engaged' | 'sales_ready' | 'general';
  progressionPath: string[];
}

interface JourneyProgressionSectionProps {
  journeyProgression?: JourneyProgression;
}

export function JourneyProgressionSection({ journeyProgression }: JourneyProgressionSectionProps) {
  if (!journeyProgression) return null;

  return (
    <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-teal-800 dark:text-teal-200">
        <span className="bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</span>
        Customer Journey Progression
      </h4>
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
          <div className="text-sm">
            <strong>Business Logic:</strong> Track the customer's position in the sales funnel based on conversation analysis. This determines conversation personalization and automated behaviors.
          </div>
          <div className="border-t pt-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Current Stage:</strong> 
                <span className="ml-1 font-medium text-teal-700 dark:text-teal-300">{journeyProgression.currentStage}</span>
              </div>
              <div><strong>Stage Confidence:</strong> {(journeyProgression.stageConfidence * 100).toFixed(1)}%</div>
              <div><strong>Previous Stage:</strong> {journeyProgression.previousStage}</div>
              <div><strong>Engagement Level:</strong> 
                <span className="ml-1 font-medium">{journeyProgression.engagementCategory.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <div className="border-t pt-2">
            <strong className="text-sm">Customer Journey Path:</strong>
            <div className="mt-2 flex flex-wrap gap-2">
              {journeyProgression.progressionPath.map((stage, idx) => (
                <Badge key={idx} variant={idx === journeyProgression.progressionPath.length - 1 ? 'default' : 'secondary'}>
                  {stage}
                </Badge>
              ))}
            </div>
          </div>
          <div className="border-t pt-2">
            <strong className="text-sm">Transition Reason:</strong>
            <div className="text-muted-foreground text-sm mt-1">{journeyProgression.transitionReason}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 