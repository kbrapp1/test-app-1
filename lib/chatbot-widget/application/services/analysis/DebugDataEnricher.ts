import { ProcessingDebugInfo } from '../../../domain/services/interfaces/IDebugInformationService';
import { EntityCategorizationService } from './EntityCategorizationService';

// Types for better type safety
interface IntentAnalysisData {
  intent?: string;
  confidence?: number;
  entities?: Record<string, unknown>;
}

interface JourneyStateData {
  stage?: string;
  phase?: string;
  progress?: number;
  confidence?: number;
}

interface ConversationMetricsData {
  messageCount: number;
  sessionDuration: number;
  engagementScore: number;
  leadQualificationProgress: number;
}

/**
 * Service responsible for enriching debug data with derived information
 * Following DDD principles: Single responsibility for data enrichment
 */
export class DebugDataEnricher {
  static buildEntityExtraction(intentAnalysis: IntentAnalysisData, domainDebugInfo: ProcessingDebugInfo) {
    const entities = intentAnalysis.entities || {};
    return {
      extractedEntities: Object.entries(entities).map(([type, value]) => ({
        type,
        value: String(value),
        confidence: 0.9,
        category: EntityCategorizationService.getEntityCategory(type),
        sourceText: String(value),
        normalizedValue: String(value)
      })),
      totalEntitiesFound: Object.keys(entities).length,
      extractionMode: 'comprehensive' as const,
      rawExtractionResult: entities,
      processingTime: domainDebugInfo.firstApiCall ? 
        parseInt(domainDebugInfo.firstApiCall.responseData.processingTime.replace('ms', '')) : 0,
      patternsMatched: Object.keys(entities)
    };
  }

  static buildLeadScoring(conversationMetrics: ConversationMetricsData) {
    const currentScore = conversationMetrics.engagementScore || 0;
    const previousScore = 0; // First message in a new session starts from 0
    const scoreChange = currentScore - previousScore;
    
    return {
      currentScore,
      maxPossibleScore: 100,
      qualificationThreshold: 70,
      isQualified: currentScore >= 70,
      scoreBreakdown: [
        {
          entityType: 'engagement',
          points: currentScore,
          reason: 'User engagement level',
          weight: 1.0,
          category: 'behavioral',
          ruleId: 'engagement_001'
        }
      ],
      previousScore,
      scoreChange,
      processingTime: 0
    };
  }

  static buildJourneyProgression(journeyState: JourneyStateData) {
    const currentStage = journeyState.stage || 'discovery';
    const stageConfidence = journeyState.confidence || 0;
    return {
      currentStage,
      previousStage: 'initial',
      stageConfidence,
      transitionReason: 'User engagement patterns indicate progression',
      engagementCategory: (stageConfidence > 0.8 ? 'sales_ready' : 
                         stageConfidence > 0.5 ? 'actively_engaged' : 'general') as 'actively_engaged' | 'sales_ready' | 'general',
      progressionPath: ['initial', currentStage],
      stageAnalysis: {
        indicators: ['User asking questions', 'Showing interest'],
        signals: [
          {
            type: 'engagement',
            strength: stageConfidence,
            description: 'User interaction level'
          }
        ],
        nextPossibleStages: [
          {
            stage: 'qualification',
            probability: 0.7,
            requirements: ['Contact information', 'Budget discussion']
          }
        ]
      },
      processingTime: 0
    };
  }

  static buildBusinessRules(shouldCaptureLeadInfo: boolean | undefined) {
    return {
      rulesTriggered: [
        {
          ruleName: 'Intent Classification',
          condition: 'User message received',
          action: 'Classify intent using OpenAI',
          result: 'success' as 'success' | 'failed' | 'skipped'
        },
        {
          ruleName: 'Response Generation',
          condition: 'Intent classified',
          action: 'Generate contextual response',
          result: 'success' as 'success' | 'failed' | 'skipped'
        }
      ],
      thresholds: {
        intentConfidence: 0.7,
        stageTransition: 0.8,
        personaInference: 0.6
      },
      automatedBehaviors: [
        {
          behavior: 'Lead Capture Trigger',
          triggered: shouldCaptureLeadInfo || false,
          reason: shouldCaptureLeadInfo ? 'High engagement detected' : 'Engagement threshold not met'
        }
      ]
    };
  }
} 