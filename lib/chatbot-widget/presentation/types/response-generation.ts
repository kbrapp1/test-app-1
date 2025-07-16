export interface RequestData {
  model: string;
  messagesCount: number;
  temperature: number;
  maxTokens: number;
  timestamp: string;
  systemPrompt?: string;
  userMessage: string;
  fullPrompt?: string;
  requestHeaders?: Record<string, string>;
  requestPayload?: unknown;
  apiEndpoint?: string;
  requestSize?: number;
  userAgent?: string;
}

export interface ResponseData {
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
  responsePayload?: unknown;
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
}

export interface CostData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: string;
  model: string;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  totalCostBreakdown?: {
    inputCost: number | string;
    outputCost: number | string;
    total: number | string;
  };
}

export interface PerformanceData {
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
}

export interface ResponseGenerationSectionProps {
  requestData: RequestData;
  responseData: ResponseData;
  costData: CostData;
  performance?: PerformanceData;
  sectionNumber: number;
  title: string;
  businessLogic: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
} 