/**
 * Lead Scoring Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead scoring debug information
 * - Handle scoring calculations and qualification analysis
 * - Keep under 200-250 lines
 * - Focus on lead scoring debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface LeadScoringDebugDto {
  currentScore: number;
  maxPossibleScore: number;
  qualificationThreshold: number;
  isQualified: boolean;
  previousScore: number;
  scoreChange: number;
  
  scoreBreakdown: Array<{
    entityType: string;
    points: number;
    reason: string;
    weight: number;
    category: string;
    ruleId: string;
    confidence?: number;
  }>;
  
  scoringRules?: Array<{
    ruleId: string;
    condition: string;
    points: number;
    triggered: boolean;
    evaluationTime?: number;
    ruleCategory?: string;
  }>;
  
  qualificationAnalysis?: {
    qualificationProbability: number;
    missingQualificationCriteria?: string[];
    strengthAreas?: string[];
    improvementAreas?: string[];
    nextBestActions?: string[];
  };
  
  scoringMetrics?: {
    processingTime?: number;
    rulesEvaluated: number;
    rulesTriggered: number;
    averageRuleConfidence?: number;
    scoringAccuracy?: number;
  };
  
  historicalContext?: {
    scoreHistory?: Array<{
      timestamp: string;
      score: number;
      trigger: string;
    }>;
    scoreTrend?: 'increasing' | 'decreasing' | 'stable';
    peakScore?: number;
    averageScore?: number;
  };
} 