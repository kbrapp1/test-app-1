import React from 'react';
import { FunctionCallDetails } from './function-analysis/FunctionCallDetails';
import { IntentClassificationResults } from './intent-analysis/IntentClassificationResults';
import { EntityExtractionResults } from './entity-analysis/EntityExtractionResults';
import { LeadScoringResults } from './lead-analysis/LeadScoringResults';
import { JourneyProgressionResults } from './journey-analysis/JourneyProgressionResults';

// Shared type definitions for the main coordinator
interface IntentClassification {
  detectedIntent: string;
  confidence: number;
  alternativeIntents: Array<{ intent: string; confidence: number }>;
  category: 'sales' | 'support' | 'qualification' | 'general';
  threshold: number;
  isAmbiguous: boolean;
  rawClassificationResult?: any;
  processingTime?: number;
  modelUsed?: string;
}

interface EntityExtraction {
  extractedEntities: Array<{
    type: string;
    value: string;
    confidence: number;
    category: 'core_business' | 'advanced' | 'contact';
    sourceText?: string;
    position?: { start: number; end: number };
    normalizedValue?: string;
  }>;
  totalEntitiesFound: number;
  extractionMode: 'basic' | 'comprehensive' | 'custom';
  rawExtractionResult?: any;
  processingTime?: number;
  patternsMatched?: string[];
}

interface LeadScoring {
  currentScore: number;
  maxPossibleScore: number;
  qualificationThreshold: number;
  isQualified: boolean;
  scoreBreakdown: Array<{
    entityType: string;
    points: number;
    reason: string;
    weight: number;
    category: string;
    ruleId: string;
  }>;
  previousScore: number;
  scoreChange: number;
  scoringRules?: Array<{
    ruleId: string;
    condition: string;
    points: number;
    triggered: boolean;
  }>;
  processingTime?: number;
}

interface JourneyProgression {
  currentStage: string;
  previousStage: string;
  stageConfidence: number;
  transitionReason: string;
  engagementCategory: 'actively_engaged' | 'sales_ready' | 'general';
  progressionPath: string[];
  stageAnalysis?: {
    indicators: string[];
    signals: Array<{
      type: string;
      strength: number;
      description: string;
    }>;
    nextPossibleStages: Array<{
      stage: string;
      probability: number;
      requirements: string[];
    }>;
  };
  processingTime?: number;
}

interface FunctionCalls {
  firstApiCall?: {
    functions: Array<{
      name: string;
      description: string;
      parameters: any;
    }>;
    functionCallsMade: Array<{
      name: string;
      arguments: any;
      result: any;
      executionTime: number;
      success: boolean;
      error?: string;
    }>;
    totalFunctionExecutionTime: number;
  };
}

interface IntentAnalysisSectionProps {
  intentClassification?: IntentClassification;
  entityExtraction?: EntityExtraction;
  leadScoring?: LeadScoring;
  journeyProgression?: JourneyProgression;
  functionCalls?: FunctionCalls;
}

/**
 * Intent Analysis Section - Coordinator Component
 * 
 * Following DDD Presentation Layer patterns:
 * - Single Responsibility: Coordinates analysis result display
 * - Composition over complexity: Uses focused sub-components
 * - Under 200-250 lines: Delegates to specialized components
 * - Clean Architecture: No business logic, only UI coordination
 */
export function IntentAnalysisSection({ 
  intentClassification, 
  entityExtraction, 
  leadScoring, 
  journeyProgression,
  functionCalls
}: IntentAnalysisSectionProps) {
  return (
    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <SectionHeader />
      
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
          <BusinessLogicExplanation />
          
          {functionCalls?.firstApiCall && (
            <FunctionCallDetails firstApiCall={functionCalls.firstApiCall} />
          )}
          
          {intentClassification && (
            <IntentClassificationResults intentClassification={intentClassification} />
          )}
          
          {entityExtraction && (
            <EntityExtractionResults entityExtraction={entityExtraction} />
          )}
          
          {leadScoring && (
            <LeadScoringResults leadScoring={leadScoring} />
          )}
          
          {journeyProgression && (
            <JourneyProgressionResults journeyProgression={journeyProgression} />
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800 dark:text-green-200">
      <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
        4
      </span>
      Intent Classification & Entity Extraction Results
    </h4>
  );
}

function BusinessLogicExplanation() {
  return (
    <div className="text-sm">
      <strong>Business Logic:</strong> The system makes its first OpenAI API call using function calling to analyze the user's message. This call produces intent classification, entity extraction, lead scoring, and journey progression analysis. This is the "intelligence gathering" API call.
    </div>
  );
} 