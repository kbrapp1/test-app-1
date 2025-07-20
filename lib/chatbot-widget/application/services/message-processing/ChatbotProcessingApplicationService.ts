/**
 * Chatbot Processing Application Service
 * 
 * Application Layer: Orchestrates chatbot interaction processing workflow.
 * Coordinates between domain services, infrastructure services, and logging.
 * Extracted from OpenAIChatbotProcessingService following DDD patterns.
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ExtractedEntities } from '../../../domain/value-objects/message-processing/IntentResult';
import { IntentMappingDomainService } from '../../../domain/services/ai-configuration/IntentMappingDomainService';

// Processing context for complete interaction
export interface ProcessingContext {
  messageHistory: ChatMessage[];
  sessionId: string;
  organizationId?: string; // SECURITY: Never remove - required for tenant isolation
  userData?: Record<string, unknown>;
  systemPrompt?: string;
  sharedLogFile?: string;
}

// Complete chatbot processing result
export interface ChatbotProcessingResult {
  analysis: {
    primaryIntent: string;
    primaryConfidence: number;
    entities: ExtractedEntities;
    personaInference?: unknown;
    corrections?: Record<string, unknown>;
    sentiment?: string;
    sentimentConfidence?: number;
    emotionalTone?: string;
    reasoning: string;
  };
  conversationFlow: {
    shouldCaptureLeadNow: boolean;
    shouldAskQualificationQuestions: boolean;
    shouldEscalateToHuman: boolean;
    nextBestAction: string;
    conversationPhase: string;
    engagementLevel: string;
  };
  leadScore?: number;
  response: {
    content: string;
    tone: string;
    callToAction?: string;
    shouldTriggerLeadCapture: boolean;
    personalization?: string;
  };
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// OpenAI function call arguments interface
export interface FunctionCallArguments {
  intent?: string;
  lead_data?: Record<string, unknown>;
  response?: {
    content?: string;
    capture_contact?: boolean;
    next_question?: string;
  };
}

// SessionLogger interface for logging coordination
export interface SessionLogger {
  logApiCall: (callType: string, requestData: unknown, responseData: unknown, processingTime: number) => void;
  logMessage: (message: string, level?: string) => void;
  logError: (error: Error | string, context?: Record<string, unknown>) => void;
  flush: () => Promise<void>;
}

// LoggingService interface for session management
export interface LoggingService {
  createSessionLogger: (sessionId: string, logFile: string, metadata: Record<string, unknown>) => SessionLogger;
}

export class ChatbotProcessingApplicationService {
  private readonly intentMappingService: IntentMappingDomainService;
  private static readonly LOGGING_CACHE_KEY = 'ChatbotProcessingApplicationService_loggingServiceCache';

  constructor() {
    this.intentMappingService = new IntentMappingDomainService();
  }

  /**
   * Coordinates complete chatbot interaction processing workflow
   * Orchestrates logging, domain services, and infrastructure services
   */
  async orchestrateChatbotProcessing(
    message: string,
    context: ProcessingContext,
    openAIApiCall: (message: string, context: ProcessingContext, logger: SessionLogger) => Promise<{
      functionArgs: FunctionCallArguments;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      model: string;
    }>
  ): Promise<ChatbotProcessingResult> {
    
    // SECURITY: Preserve organizationId for tenant isolation
    if (context.organizationId) {
      // Use organizationId for validation/logging context
    }

    // Initialize logging coordination
    const sessionLogger = await this.initializeSessionLogger(context);
    
    try {
      sessionLogger.logMessage('🚀 Starting chatbot processing orchestration');
      
      // Coordinate with infrastructure service for OpenAI API call
      const apiResult = await openAIApiCall(message, context, sessionLogger);
      
      // Use domain service for business logic processing
      const processedResult = this.processWithDomainLogic(apiResult, sessionLogger);
      
      sessionLogger.logMessage('✨ Chatbot processing orchestration completed successfully');
      
      // Ensure all logs are written before returning
      await sessionLogger.flush();
      return processedResult;
      
    } catch (error) {
      sessionLogger.logError(error as Error, { context: 'Chatbot processing orchestration failed' });
      
      // Ensure all logs are written before throwing
      await sessionLogger.flush();
      throw error;
    }
  }

  /**
   * Process API result using domain services
   */
  private processWithDomainLogic(
    apiResult: {
      functionArgs: FunctionCallArguments;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      model: string;
    },
    sessionLogger: SessionLogger
  ): ChatbotProcessingResult {
    
    const { functionArgs, usage, model } = apiResult;
    
    sessionLogger.logMessage('🔧 Processing with domain logic: ' + JSON.stringify(functionArgs));

    // Use domain service for intent validation and mapping
    const intent = functionArgs.intent || 'inquiry';
    const isValidIntent = this.intentMappingService.validateIntent(intent);
    const finalIntent = isValidIntent ? intent : 'unknown';
    
    // Apply domain business rules
    const conversationPhase = this.intentMappingService.mapIntentToPhase(finalIntent);
    const engagementLevel = this.intentMappingService.mapIntentToEngagement(finalIntent);
    const primaryConfidence = this.intentMappingService.calculateDefaultConfidence(finalIntent);
    const entities = this.intentMappingService.mapFunctionCallEntitiesToExpectedFormat(functionArgs.lead_data || {});
    
    // Determine next action using domain logic
    const shouldCaptureContact = functionArgs.response?.capture_contact || false;
    const nextBestAction = this.intentMappingService.determineNextBestAction(finalIntent, shouldCaptureContact);
    
    // Build result using domain-processed data
    const result: ChatbotProcessingResult = {
      analysis: {
        primaryIntent: finalIntent,
        primaryConfidence,
        entities,
        reasoning: `Intent: ${finalIntent}, Lead data extracted, Confidence: ${primaryConfidence}`
      },
      conversationFlow: {
        shouldCaptureLeadNow: shouldCaptureContact,
        shouldAskQualificationQuestions: functionArgs.response?.next_question ? true : false,
        shouldEscalateToHuman: false, // Default for current implementation
        nextBestAction,
        conversationPhase,
        engagementLevel
      },
      response: {
        content: functionArgs.response?.content || '',
        tone: 'professional', // Default tone
        shouldTriggerLeadCapture: shouldCaptureContact
      },
      usage,
      model
    };
    
    sessionLogger.logMessage('✨ Domain processing completed: ' + JSON.stringify(result));
    return result;
  }

  /**
   * Initialize session logger with caching for performance
   */
  private async initializeSessionLogger(context: ProcessingContext): Promise<SessionLogger> {
    // Cache the logging service import to avoid repeated dynamic imports
    if (!(globalThis as Record<string, unknown>)[ChatbotProcessingApplicationService.LOGGING_CACHE_KEY]) {
      (globalThis as Record<string, unknown>)[ChatbotProcessingApplicationService.LOGGING_CACHE_KEY] = 
        await import('../../../infrastructure/providers/logging/ChatbotFileLoggingService');
    }
    
    const LoggingServiceClass = (globalThis as Record<string, unknown>)[ChatbotProcessingApplicationService.LOGGING_CACHE_KEY] as {
      ChatbotFileLoggingService: new () => LoggingService;
    };
    
    const loggingService = new LoggingServiceClass.ChatbotFileLoggingService();
    
    return loggingService.createSessionLogger(
      context.sessionId,
      context.sharedLogFile || `chatbot-${new Date().toISOString().split('T')[0]}.log`,
      { operation: 'chatbot-processing-orchestration' }
    );
  }
}