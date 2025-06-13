import React from 'react';
import { DebugInfoDto } from '../../../../application/dto/DebugInfoDto';

interface LeadScoringProgressionStepProps {
  leadScoring?: DebugInfoDto['leadScoring'];
  journeyProgression?: DebugInfoDto['journeyProgression'];
}

export function LeadScoringProgressionStep({ 
  leadScoring, 
  journeyProgression 
}: LeadScoringProgressionStepProps) {
  return (
    <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-800 dark:text-purple-200">
        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
        Lead Scoring & Journey Progression Analysis
      </h4>
      <div className="space-y-2">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border">
          <div className="text-sm">
            <strong>Business Logic:</strong> System calculates lead qualification score and determines user journey stage based on extracted entities and intent classification.
          </div>
          {leadScoring && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <strong>Lead Score:</strong> {leadScoring.currentScore}/{leadScoring.maxPossibleScore}
              </div>
              <div>
                <strong>Qualification Status:</strong> {leadScoring.isQualified ? '✅ Qualified' : '⏳ Developing'}
              </div>
              <div>
                <strong>Score Change:</strong> +{leadScoring.scoreChange}
              </div>
              <div>
                <strong>Processing Time:</strong> {leadScoring.processingTime}ms
              </div>
            </div>
          )}
          {journeyProgression && (
            <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
              <strong className="text-xs">Journey Analysis:</strong>
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <strong>Current Stage:</strong> {journeyProgression.currentStage}
                </div>
                <div>
                  <strong>Confidence:</strong> {(journeyProgression.stageConfidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 