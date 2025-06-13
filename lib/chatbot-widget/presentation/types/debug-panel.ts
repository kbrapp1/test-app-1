// DEPRECATED: Legacy ApiDebugInfo interface - now using DebugInfoDto from application layer
// This interface is obsolete and will be removed
export interface ApiDebugInfo {
  // First API Call - Intent Classification with Function Calling
  firstApiCall?: {
    requestData: {
      model: string;
      messagesCount: number;
      temperature: number;
      maxTokens: number;
      timestamp: string;
      systemPrompt?: string;
      userMessage: string;
      fullPrompt?: string;
      requestHeaders?: Record<string, string>;
      requestPayload?: any;
      fullRequestPayload?: any;
      apiEndpoint?: string;
      requestSize?: number;
      userAgent?: string;
      functionsProvided?: Array<{
        name: string;
        description: string;
        parameters: any;
      }>;
    };
    responseData: {
      id: string;
      model: string;
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
      responseLength: number;
      processingTime: number;
      fullResponse?: string;
      responseHeaders?: Record<string, string>;
      responsePayload?: any;
      responseSize?: number;
      statusCode?: number;
      rateLimitInfo?: {
        remaining: number;
        resetTime: string;
        limit: number;
      };
      functionCallsExecuted?: Array<{
        name: string;
        arguments: any;
        result: any;
        executionTime: number;
        success: boolean;
        error?: string;
      }>;
    };
    costData: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      estimatedCost: string;
      model: string;
      inputCostPerToken?: number;
      outputCostPerToken?: number;
      totalCostBreakdown?: {
        inputCost: number;
        outputCost: number;
        total: number;
      };
    };
  };

  // Second API Call - Response Generation with Enhanced Context
  secondApiCall?: {
    requestData: {
      model: string;
      messagesCount: number;
      temperature: number;
      maxTokens: number;
      timestamp: string;
      systemPrompt?: string;
      userMessage: string;
      fullPrompt?: string;
      requestHeaders?: Record<string, string>;
      requestPayload?: any;
      fullRequestPayload?: any;
      apiEndpoint?: string;
      requestSize?: number;
      userAgent?: string;
      enhancedContext?: any;
      additionalInstructions?: string[];
    };
    responseData: {
      id: string;
      model: string;
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
      responseLength: number;
      processingTime: number;
      fullResponse?: string;
      responseHeaders?: Record<string, string>;
      responsePayload?: any;
      responseSize?: number;
      statusCode?: number;
      rateLimitInfo?: {
        remaining: number;
        resetTime: string;
        limit: number;
      };
      streamingDetails?: {
        firstTokenTime: number;
        tokensPerSecond: number;
        totalChunks: number;
      };
    };
    costData: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      estimatedCost: string;
      model: string;
      inputCostPerToken?: number;
      outputCostPerToken?: number;
      totalCostBreakdown?: {
        inputCost: number;
        outputCost: number;
        total: number;
      };
    };
  };

  // Legacy fields for backward compatibility (will be deprecated)
  requestData?: {
    model: string;
    messagesCount: number;
    temperature: number;
    maxTokens: number;
    timestamp: string;
    systemPrompt?: string;
    userMessage: string;
    fullPrompt?: string;
    requestHeaders?: Record<string, string>;
    requestPayload?: any;
    fullRequestPayload?: any;
    apiEndpoint?: string;
    requestSize?: number;
    userAgent?: string;
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
    fullResponse?: string;
    responseHeaders?: Record<string, string>;
    responsePayload?: any;
    responseSize?: number;
    statusCode?: number;
    rateLimitInfo?: {
      remaining: number;
      resetTime: string;
      limit: number;
    };
    streamingDetails?: {
      firstTokenTime: number;
      tokensPerSecond: number;
      totalChunks: number;
    };
  };
  costData?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: string;
    model: string;
    inputCostPerToken?: number;
    outputCostPerToken?: number;
    totalCostBreakdown?: {
      inputCost: number;
      outputCost: number;
      total: number;
    };
  };
  functionCalls?: {
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
    secondApiCall?: {
      contextFromFunctions: any;
      enhancedPrompt: string;
      additionalInstructions: string[];
    };
  };
  intentClassification?: {
    detectedIntent: string;
    confidence: number;
    alternativeIntents: Array<{ intent: string; confidence: number }>;
    category: 'sales' | 'support' | 'qualification' | 'general';
    threshold: number;
    isAmbiguous: boolean;
    rawClassificationResult?: any;
    processingTime?: number;
    modelUsed?: string;
  };
  entityExtraction?: {
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
  };
  leadScoring?: {
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
  };
  journeyProgression?: {
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
  };
  businessRules?: {
    rulesTriggered: Array<{
      ruleName: string;
      condition: string;
      action: string;
      result: 'success' | 'failed' | 'skipped';
      ruleId: string;
      priority: number;
      executionTime: number;
      inputData?: any;
      outputData?: any;
      errorDetails?: string;
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
      behaviorId: string;
      executionTime?: number;
      result?: any;
      nextScheduledExecution?: string;
    }>;
    totalRulesEvaluated?: number;
    ruleEngineVersion?: string;
    processingTime?: number;
  };
  performance?: {
    componentTimings: {
      intentClassification: number;
      entityExtraction: number;
      leadScoring: number;
      responseGeneration: number;
      total: number;
      requestPreprocessing?: number;
      functionCallExecution?: number;
      businessRuleProcessing?: number;
      responsePostprocessing?: number;
      databaseOperations?: number;
      externalApiCalls?: number;
    };
    cacheHits: number;
    dbQueries: number;
    apiCalls: number;
    memoryUsage?: {
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    networkMetrics?: {
      totalBytesIn: number;
      totalBytesOut: number;
      averageLatency: number;
    };
    systemHealth?: {
      cpuUsage: number;
      memoryUsage: number;
      activeConnections: number;
      queueDepth: number;
    };
  };
  debugTrace?: {
    traceId: string;
    spanId: string;
    events: Array<{
      timestamp: string;
      event: string;
      data?: any;
      duration?: number;
    }>;
    errors?: Array<{
      timestamp: string;
      error: string;
      stack?: string;
      context?: any;
    }>;
  };
  environmentInfo?: {
    nodeVersion: string;
    environment: 'development' | 'staging' | 'production';
    region: string;
    instanceId: string;
    deploymentVersion: string;
  };
}

import { DebugInfoDto } from '../../application/dto/DebugInfoDto';

export interface ChatApiDebugPanelProps {
  apiDebugInfo: DebugInfoDto | null;
} 