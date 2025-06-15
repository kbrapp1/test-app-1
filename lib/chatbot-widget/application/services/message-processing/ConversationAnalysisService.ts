/**
 * Conversation Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Analyze conversation context and generate enhanced insights
 * - Handle context window management and conversation analysis
 * - Keep under 200-250 lines
 * - Focus on analysis operations only
 * - Follow @golden-rule patterns exactly
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { ConversationContextWindow } from '../../../domain/value-objects/session-management/ConversationContextWindow';
import { ITokenCountingService } from '../../../domain/services/interfaces/ITokenCountingService';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ConversationContextManagementService } from '../conversation-management/ConversationContextManagementService';
import { SessionUpdateService } from '../configuration-management/SessionUpdateService';
import { WorkflowContext } from './MessageProcessingWorkflowService';

export interface MessageContext {
  session: ChatSession;
  config: any;
  userMessage: ChatMessage;
  contextResult: any;
}

export interface AnalysisResult {
  session: ChatSession;
  config: any;
  userMessage: ChatMessage;
  contextResult: any;
  enhancedContext: any;
}

export class ConversationAnalysisService {
  private readonly contextWindow: ConversationContextWindow;
  private readonly contextManagementService: ConversationContextManagementService;
  private readonly sessionUpdateService: SessionUpdateService;

  constructor(
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly tokenCountingService: ITokenCountingService,
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository
  ) {
    // Initialize context window with sensible defaults
    this.contextWindow = ConversationContextWindow.create({
      maxTokens: 12000, // Safe for most models
      systemPromptTokens: 500,
      responseReservedTokens: 3000,
      summaryTokens: 200
    });

    this.contextManagementService = new ConversationContextManagementService(
      conversationContextOrchestrator,
      tokenCountingService,
      sessionRepository,
      messageRepository
    );

    this.sessionUpdateService = new SessionUpdateService(sessionRepository);
  }

  async analyzeConversationContext(workflowContext: WorkflowContext): Promise<AnalysisResult> {
    const { session, config, userMessage } = workflowContext;

    // Get token-aware messages for context
    const contextResult = await this.contextManagementService.getTokenAwareContext(
      session.id, 
      userMessage, 
      this.contextWindow
    );

    // Enhanced context analysis
    const enhancedContext = await this.conversationContextOrchestrator.analyzeContextEnhanced(
      [...contextResult.messages, userMessage],
      config,
      session
    );

    // Update session with journey state if available
    let updatedSession = session;
    if (enhancedContext.journeyState) {
      updatedSession = this.sessionUpdateService.updateSessionWithJourneyState(
        session, 
        enhancedContext.journeyState
      );
    }

    return {
      session: updatedSession,
      config,
      userMessage,
      contextResult,
      enhancedContext
    };
  }

  getContextWindow(): ConversationContextWindow {
    return this.contextWindow;
  }

  async getTokenAwareContext(
    sessionId: string,
    userMessage: ChatMessage,
    contextWindow?: ConversationContextWindow
  ): Promise<any> {
    const window = contextWindow || this.contextWindow;
    return await this.contextManagementService.getTokenAwareContext(
      sessionId,
      userMessage,
      window
    );
  }

  async analyzeEnhancedContext(
    messages: ChatMessage[],
    config: any,
    session: ChatSession
  ): Promise<any> {
    return await this.conversationContextOrchestrator.analyzeContextEnhanced(
      messages,
      config,
      session
    );
  }
} 