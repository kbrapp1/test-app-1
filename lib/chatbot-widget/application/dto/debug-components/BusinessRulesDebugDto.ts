/**
 * Business Rules Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Business rules debug information
 * - Handle rule execution and automated behavior analysis
 * - Keep under 200-250 lines
 * - Focus on business rules debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface BusinessRulesDebugDto {
  rulesTriggered: Array<{
    ruleName: string;
    condition: string;
    action: string;
    result: 'success' | 'failed' | 'skipped';
    executionTime?: number;
    priority?: number;
    category?: string;
  }>;
  
  thresholds: {
    intentConfidence: number;
    stageTransition: number;
    personaInference: number;
    leadQualification?: number;
    escalationTrigger?: number;
  };
  
  automatedBehaviors: Array<{
    behavior: string;
    triggered: boolean;
    reason: string;
    impact?: string;
    confidence?: number;
  }>;
  
  ruleEvaluation?: {
    totalRulesEvaluated: number;
    rulesTriggered: number;
    rulesFailed: number;
    rulesSkipped: number;
    averageExecutionTime?: number;
    totalExecutionTime?: number;
  };
  
  conditionalLogic?: {
    conditionsEvaluated: Array<{
      condition: string;
      result: boolean;
      evaluationTime?: number;
      variables?: Record<string, any>;
    }>;
    logicalOperators?: Array<{
      operator: 'AND' | 'OR' | 'NOT';
      operands: string[];
      result: boolean;
    }>;
  };
  
  ruleConflicts?: Array<{
    conflictType: 'priority' | 'contradiction' | 'dependency';
    involvedRules: string[];
    resolution: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  
  performanceMetrics?: {
    ruleEngineLatency: number;
    memoryUsage?: number;
    cacheHitRate?: number;
    optimizationSuggestions?: string[];
  };
} 