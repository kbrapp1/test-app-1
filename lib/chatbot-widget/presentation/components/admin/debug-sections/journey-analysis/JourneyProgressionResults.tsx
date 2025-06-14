import React from 'react';
import { Badge } from '@/components/ui/badge';

interface JourneySignal {
  type: string;
  strength: number;
  description: string;
}

interface NextStage {
  stage: string;
  probability: number;
  requirements: string[];
}

interface StageAnalysis {
  indicators: string[];
  signals: JourneySignal[];
  nextPossibleStages: NextStage[];
}

interface JourneyProgression {
  currentStage: string;
  previousStage: string;
  stageConfidence: number;
  transitionReason: string;
  engagementCategory: 'actively_engaged' | 'sales_ready' | 'general';
  progressionPath: string[];
  stageAnalysis?: StageAnalysis;
  processingTime?: number;
}

interface JourneyProgressionResultsProps {
  journeyProgression: JourneyProgression;
}

export function JourneyProgressionResults({ journeyProgression }: JourneyProgressionResultsProps) {
  return (
    <div className="border-t pt-2">
      <strong className="text-sm text-green-700 dark:text-green-300">Journey Progression Results:</strong>
      
      <JourneyMetrics journeyProgression={journeyProgression} />
      
      {journeyProgression.progressionPath.length > 0 && (
        <ProgressionPath path={journeyProgression.progressionPath} />
      )}
      
      {journeyProgression.stageAnalysis && (
        <StageAnalysisDetails analysis={journeyProgression.stageAnalysis} />
      )}
    </div>
  );
}

function JourneyMetrics({ journeyProgression }: { journeyProgression: JourneyProgression }) {
  const hasStageTransition = journeyProgression.currentStage !== journeyProgression.previousStage;
  
  return (
    <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
      <div>
        <strong>Current Stage:</strong> 
        <Badge variant="default" className="ml-1">
          {journeyProgression.currentStage}
        </Badge>
        {hasStageTransition && (
          <span className="ml-1 text-green-600 text-xs">📈 Advanced</span>
        )}
      </div>
      
      <div>
        <strong>Stage Confidence:</strong> 
        <span className={`ml-1 font-medium ${
          journeyProgression.stageConfidence >= 0.8 ? 'text-green-600' :
          journeyProgression.stageConfidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {(journeyProgression.stageConfidence * 100).toFixed(1)}%
        </span>
      </div>
      
      <div>
        <strong>Engagement Level:</strong>
        <Badge 
          variant={
            journeyProgression.engagementCategory === 'sales_ready' ? 'default' :
            journeyProgression.engagementCategory === 'actively_engaged' ? 'secondary' : 'outline'
          } 
          className="ml-1"
        >
          {journeyProgression.engagementCategory.replace('_', ' ')}
        </Badge>
      </div>
      
      {journeyProgression.processingTime && (
        <div><strong>Processing Time:</strong> {journeyProgression.processingTime}ms</div>
      )}
      
      {hasStageTransition && (
        <div className="col-span-2 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 p-2 rounded">
          <strong>Stage Transition:</strong> {journeyProgression.previousStage} → {journeyProgression.currentStage}
          <br />
          <strong>Reason:</strong> {journeyProgression.transitionReason}
        </div>
      )}
    </div>
  );
}

function ProgressionPath({ path }: { path: string[] }) {
  return (
    <div className="mt-2">
      <strong className="text-xs">Customer Journey Path:</strong>
      <div className="mt-1 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
        {path.map((stage, idx) => (
          <React.Fragment key={idx}>
            <Badge 
              variant={idx === path.length - 1 ? "default" : "outline"} 
              className="text-xs"
            >
              {stage}
            </Badge>
            {idx < path.length - 1 && (
              <span className="text-gray-400">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function StageAnalysisDetails({ analysis }: { analysis: StageAnalysis }) {
  return (
    <div className="mt-2">
      <strong className="text-xs">Stage Analysis:</strong>
      <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2 space-y-2">
        
        {analysis.indicators.length > 0 && (
          <StageIndicators indicators={analysis.indicators} />
        )}
        
        {analysis.signals.length > 0 && (
          <JourneySignals signals={analysis.signals} />
        )}
        
        {analysis.nextPossibleStages.length > 0 && (
          <NextStagesPrediction stages={analysis.nextPossibleStages} />
        )}
      </div>
    </div>
  );
}

function StageIndicators({ indicators }: { indicators: string[] }) {
  return (
    <div>
      <strong className="text-xs">Stage Indicators:</strong>
      <div className="flex flex-wrap gap-1 mt-1">
        {indicators.map((indicator, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">
            {indicator}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function JourneySignals({ signals }: { signals: JourneySignal[] }) {
  return (
    <div>
      <strong className="text-xs">Journey Signals:</strong>
      <div className="space-y-1 mt-1">
        {signals.map((signal, idx) => (
          <div key={idx} className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
            <div className="flex justify-between items-center">
              <div>
                <Badge variant="secondary" className="text-xs mr-1">
                  {signal.type}
                </Badge>
                <span>{signal.description}</span>
              </div>
              <SignalStrengthIndicator strength={signal.strength} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalStrengthIndicator({ strength }: { strength: number }) {
  const strengthPercentage = strength * 100;
  const strengthColor = strength >= 0.8 ? 'text-green-600' : 
                       strength >= 0.6 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs font-medium ${strengthColor}`}>
        {strengthPercentage.toFixed(0)}%
      </span>
      <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${
            strength >= 0.8 ? 'bg-green-500' : 
            strength >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(strengthPercentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function NextStagesPrediction({ stages }: { stages: NextStage[] }) {
  return (
    <div>
      <strong className="text-xs">Predicted Next Stages:</strong>
      <div className="space-y-1 mt-1">
        {stages.map((stage, idx) => (
          <div key={idx} className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {stage.stage}
                </Badge>
                <span className="text-blue-600 font-medium">
                  {(stage.probability * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            {stage.requirements.length > 0 && (
              <div className="text-muted-foreground">
                <strong>Requirements:</strong>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {stage.requirements.map((req, reqIdx) => (
                    <li key={reqIdx} className="text-xs">{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 