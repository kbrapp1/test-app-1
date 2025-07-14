/**
 * API Call Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: API call debug information
 * - Handle request/response data and performance metrics
 * - Keep under 200-250 lines
 * - Focus on API debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface ApiCallDebugDto {
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
    requestPayload?: Record<string, unknown>;
    fullRequestPayload?: Record<string, unknown>;
    apiEndpoint?: string;
    requestSize?: number;
    userAgent?: string;
    functionsProvided?: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>;
    enhancedContext?: Record<string, unknown>;
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
    responsePayload?: Record<string, unknown>;
    responseSize?: number;
    statusCode?: number;
    rateLimitInfo?: {
      remaining: number;
      resetTime: string;
      limit: number;
    };
    functionCallsExecuted?: Array<{
      name: string;
      arguments: Record<string, unknown>;
      result: unknown;
      executionTime: number;
      success: boolean;
      error?: string;
    }>;
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
  
  performanceMetrics?: {
    networkLatency?: number;
    serverProcessingTime?: number;
    totalRoundTripTime?: number;
    retryAttempts?: number;
    cacheHit?: boolean;
  };
} 