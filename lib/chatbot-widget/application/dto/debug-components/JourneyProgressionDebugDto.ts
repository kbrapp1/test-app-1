/**
 * Journey Progression Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Journey progression debug information
 * - Handle stage transitions and progression analysis
 * - Keep under 200-250 lines
 * - Focus on journey debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface JourneyProgressionDebugDto {
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
      confidence?: number;
    }>;
    nextPossibleStages: Array<{
      stage: string;
      probability: number;
      requirements: string[];
      estimatedTime?: string;
    }>;
  };
  
  transitionMetrics?: {
    processingTime?: number;
    transitionProbability: number;
    stageStability: number;
    regressionRisk?: number;
    progressionVelocity?: number;
  };
  
  behavioralAnalysis?: {
    userEngagementLevel: 'low' | 'medium' | 'high';
    interactionPatterns?: string[];
    responseQuality?: number;
    intentConsistency?: number;
    topicFocus?: string[];
  };
  
  predictionData?: {
    nextStageEta?: string;
    conversionProbability?: number;
    churnRisk?: number;
    recommendedActions?: string[];
    interventionSuggestions?: string[];
  };
  
  historicalContext?: {
    stageHistory: Array<{
      stage: string;
      timestamp: string;
      duration: number;
      exitReason?: string;
    }>;
    averageStageTime?: Record<string, number>;
    commonProgressionPaths?: string[][];
  };
} 