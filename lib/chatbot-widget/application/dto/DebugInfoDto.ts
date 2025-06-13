export interface DebugInfoDto {
  // Real data from API response
  sessionId?: string;
  userMessageId?: string;
  botResponse?: string;
  botMessageId?: string;
  shouldCaptureLeadInfo?: boolean;
  suggestedNextActions?: string[];
  conversationMetrics?: {
    messageCount: number;
    sessionDuration: number;
    engagementScore: number;
    leadQualificationProgress: number;
  };
  processingTimeMs?: number;
  intentAnalysis?: any;
  journeyState?: any;
  
  // Structure expected by existing debug components
  requestData?: {
    model: string;
    messagesCount: number;
    temperature: number;
    maxTokens: number;
    timestamp: string;
    systemPrompt?: string;
    userMessage: string;
    fullPrompt?: string;
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
  
  // First API Call structure
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

  // Second API Call structure  
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
      }>;
      totalFunctionExecutionTime: number;
    };
    secondApiCall?: {
      contextFromFunctions: any;
      enhancedPrompt: string;
      additionalInstructions: string[];
    };
  };
} 