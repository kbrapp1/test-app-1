// Conversation Context Orchestrator
// Single responsibility: Orchestrate conversation context operations
// Delegates to specialized services for different concerns

import { ChatMessage } from '../../entities/ChatMessage';
import { ChatSession } from '../../entities/ChatSession';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ConversationContextWindow } from '../../value-objects/session-management/ConversationContextWindow';
import { ITokenCountingService } from '../interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../interfaces/IKnowledgeRetrievalService';

// Import specialized services
import { ContextWindowManagementService } from './ContextWindowManagementService';
import { ContextAnalysisService, ApiAnalysisData } from './ContextAnalysisService';
import { ConversationSummaryService } from './ConversationSummaryService';
import { EnhancedAnalysisCoordinatorService } from './EnhancedAnalysisCoordinatorService';
import { ConversationSessionUpdateService } from './ConversationSessionUpdateService';
import { ContextWindowService } from '../utilities/ContextWindowService';

// Import value objects and interfaces
import {
  ContextAnalysis,
  ContextWindowResult,
  ConversationSummary
} from '../../value-objects/message-processing/ContextAnalysis';

interface LoggingContext {
  logEntry: (message: string) => void;
}

export class ConversationContextOrchestrator {
  private contextWindowManagementService: ContextWindowManagementService;
  private contextAnalysisService: ContextAnalysisService;
  private conversationSummaryService: ConversationSummaryService;
  private enhancedAnalysisCoordinatorService: EnhancedAnalysisCoordinatorService;
  private sessionUpdateService: ConversationSessionUpdateService;
  private contextWindowService: ContextWindowService;

  constructor(
    tokenCountingService: ITokenCountingService,
    intentClassificationService?: IIntentClassificationService,
    knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    // Initialize specialized services
    this.contextWindowManagementService = new ContextWindowManagementService(tokenCountingService);
    this.contextAnalysisService = new ContextAnalysisService();
    this.conversationSummaryService = new ConversationSummaryService();
    this.enhancedAnalysisCoordinatorService = new EnhancedAnalysisCoordinatorService(
      intentClassificationService,
      knowledgeRetrievalService
    );
    this.sessionUpdateService = new ConversationSessionUpdateService();
    this.contextWindowService = new ContextWindowService(tokenCountingService);
  }

  // ===== CONTEXT WINDOW OPERATIONS =====
  async getMessagesForContextWindow(
    messages: ChatMessage[],
    contextWindow: ConversationContextWindow,
    existingSummary?: string,
    loggingContext?: LoggingContext
  ): Promise<ContextWindowResult> {
    return this.contextWindowManagementService.getMessagesForContextWindow(
      messages,
      contextWindow,
      existingSummary,
      loggingContext
    );
  }

  async createAISummary(messages: ChatMessage[], maxTokens: number = 200): Promise<string> {
    return this.contextWindowService.createAISummary(messages, maxTokens);
  }

  // ===== CONTEXT ANALYSIS OPERATIONS =====
  analyzeContext(
    messages: ChatMessage[], 
    session?: ChatSession,
    apiAnalysisData?: ApiAnalysisData
  ): ContextAnalysis {
    return this.contextAnalysisService.analyzeContext(messages, session, apiAnalysisData);
  }

  async analyzeContextEnhanced(
    messages: ChatMessage[], 
    config: ChatbotConfig,
    session?: ChatSession,
    sharedLogFile?: string
  ): Promise<{ 
    intentAnalysis?: { intent?: string; confidence?: number; entities?: Record<string, unknown> }; 
    relevantKnowledge?: Array<{ id: string; title: string; content: string; relevanceScore: number }> 
  } | ContextAnalysis> {
    return this.enhancedAnalysisCoordinatorService.analyzeContextEnhanced(
      messages,
      config,
      session,
      sharedLogFile
    );
  }

  // ===== CONVERSATION SUMMARY OPERATIONS =====
  generateConversationSummary(
    messages: ChatMessage[],
    session: ChatSession,
    apiAnalysisData?: ApiAnalysisData
  ): ConversationSummary {
    return this.conversationSummaryService.generateConversationSummary(
      messages,
      session,
      apiAnalysisData
    );
  }

  // ===== SESSION UPDATE OPERATIONS =====
  updateSessionContext(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    apiAnalysisData?: ApiAnalysisData
  ): ChatSession {
    const analysis = this.contextAnalysisService.analyzeContext(
      [...allMessages, message], 
      session, 
      apiAnalysisData
    );
    
    const updatedSession = this.sessionUpdateService.updateSessionContext(
      session, 
      message, 
      allMessages, 
      analysis, 
      apiAnalysisData
    );
    
    return updatedSession.updateActivity();
  }

  // ===== UTILITY METHODS =====
  hasEnhancedCapabilities(): boolean {
    return this.enhancedAnalysisCoordinatorService.hasEnhancedCapabilities();
  }
}

// Re-export the ApiAnalysisData interface for backward compatibility
export type { ApiAnalysisData } from './ContextAnalysisService';