/**
 * Request Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Request processing debug information
 * - Handle request data and processing details
 * - Keep under 200-250 lines
 * - Focus on request debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface RequestDebugDto {
  model: string;
  messagesCount: number;
  temperature: number;
  maxTokens: number;
  timestamp: string;
  systemPrompt?: string;
  userMessage: string;
  fullPrompt?: string;
  
  requestMetadata?: {
    requestHeaders?: Record<string, string>;
    requestPayload?: unknown;
    fullRequestPayload?: unknown;
    apiEndpoint?: string;
    requestSize?: number;
    userAgent?: string;
    requestId?: string;
    correlationId?: string;
  };
  
  processingDetails?: {
    startTime: string;
    endTime: string;
    processingTimeMs: number;
    queueTime?: number;
    validationTime?: number;
    preprocessingTime?: number;
  };
  
  contextInformation?: {
    conversationHistory?: unknown[];
    userProfile?: Record<string, unknown>;
    sessionContext?: Record<string, unknown>;
    businessRules?: string[];
    appliedFilters?: string[];
  };
} 