/**
 * Debug Panel Types
 * 
 * Presentation layer types for debug panel components.
 * Following DDD principles: Presentation layer defines UI-specific contracts.
 * 
 * Note: The large ApiDebugInfo interface has been moved to DebugInfoDto 
 * in the application layer following proper DDD layer separation.
 */

import { DebugInfoDto } from '../../application/dto/DebugInfoDto';

/**
 * Props for the main debug panel component
 */
export interface ChatApiDebugPanelProps {
  apiDebugInfo: DebugInfoDto | null;
}

/**
 * Debug step component props for consistent step rendering
 */
export interface DebugStepProps {
  stepNumber: number;
  title: string;
  isActive?: boolean;
  isCompleted?: boolean;
  children: React.ReactNode;
}

/**
 * Debug section component props for consistent section rendering
 */
export interface DebugSectionProps {
  sectionNumber: number;
  title: string;
  businessLogic: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
  children: React.ReactNode;
}

/** Performance metrics display props */
export interface PerformanceMetricsProps {
  processingTimeMs?: number;
  componentTimings?: {
    intentClassification?: number;
    entityExtraction?: number;
    leadScoring?: number;
    responseGeneration?: number;
    total?: number;
  };
  cacheHits?: number;
  dbQueries?: number;
  apiCalls?: number;
}

/** Cost analysis display props */
export interface CostAnalysisProps {
  costData?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: string;
    model: string;
    totalCostBreakdown?: {
      inputCost: number;
      outputCost: number;
      total: number;
    };
  };
}

/** API call details display props */
export interface ApiCallDetailsProps {
  requestData?: {
    model: string;
    messagesCount: number;
    temperature: number;
    maxTokens: number;
    timestamp: string;
    userMessage: string;
    apiEndpoint?: string;
    requestSize?: number;
  };
  responseData?: {
    id: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    responseLength: number;
    processingTime: number;
    statusCode?: number;
  };
}

/** Function call execution display props */
export interface FunctionCallsProps {
  functionCalls?: {
    functions?: Array<{
      name: string;
      description: string;
      parameters: any;
    }>;
    functionCallsMade?: Array<{
      name: string;
      arguments: any;
      result: any;
      executionTime: number;
      success: boolean;
      error?: string;
    }>;
    totalFunctionExecutionTime?: number;
  };
}

/** Business rules execution display props */
export interface BusinessRulesProps {
  businessRules?: {
    rulesTriggered: Array<{
      ruleName: string;
      condition: string;
      action: string;
      result: 'success' | 'failed' | 'skipped';
    }>;
    thresholds: {
      intentConfidence: number;
      stageTransition: number;
      personaInference: number;
    };
    automatedBehaviors: Array<{
      behavior: string;
      triggered: boolean;
      reason: string;
    }>;
  };
}

/** Debug panel theme configuration */
export interface DebugPanelTheme {
  primary: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  secondary: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  success: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  warning: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  error: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
}

/** Debug panel configuration */
export interface DebugPanelConfig {
  showPerformanceMetrics: boolean;
  showCostAnalysis: boolean;
  showFunctionCalls: boolean;
  showBusinessRules: boolean;
  showRawData: boolean;
  maxDisplayItems: number;
  theme: DebugPanelTheme;
} 