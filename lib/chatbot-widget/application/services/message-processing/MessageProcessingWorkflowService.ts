/**
 * Message Processing Workflow Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Coordinate message processing workflow steps
 * - Handle workflow initialization and finalization
 * - Keep under 200-250 lines
 * - Focus on workflow coordination only
 * - Follow @golden-rule patterns exactly
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../../domain/repositories/IChatbotConfigRepository';
import { IDebugInformationService } from '../../../domain/services/interfaces/IDebugInformationService';
import { ProcessMessageRequest } from '../conversation-management/MessageProcessingService';
import { ConversationMetricsService } from '../conversation-management/ConversationMetricsService';
import { LeadCaptureDecisionService } from '../lead-management/LeadCaptureDecisionService';
import { SessionUpdateService } from '../configuration-management/SessionUpdateService';

export interface WorkflowContext {
  session: ChatSession;
  config: ChatbotConfig;
  userMessage: ChatMessage;
}

export interface WorkflowFinalResult {
  session: ChatSession;
  userMessage: ChatMessage;
  botMessage: ChatMessage;
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: string[];
  conversationMetrics: any;
  intentAnalysis?: any;
  journeyState?: any;
  relevantKnowledge?: any;
}

export class MessageProcessingWorkflowService {
  private readonly conversationMetricsService: ConversationMetricsService;
  private readonly leadCaptureDecisionService: LeadCaptureDecisionService;
  private readonly sessionUpdateService: SessionUpdateService;

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly debugInformationService?: IDebugInformationService
  ) {
    this.conversationMetricsService = new ConversationMetricsService();
    this.leadCaptureDecisionService = new LeadCaptureDecisionService();
    this.sessionUpdateService = new SessionUpdateService(sessionRepository);
  }

  async initializeWorkflow(request: ProcessMessageRequest): Promise<WorkflowContext> {
    // Load and validate session
    const session = await this.loadAndValidateSession(request.sessionId);

    // Load chatbot configuration
    const config = await this.loadChatbotConfig(session.chatbotConfigId);

    // Validate operating hours
    this.validateOperatingHours(config);

    // Create user message
    const userMessage = await this.createUserMessage(session, request);

    // Initialize debug session
    this.initializeDebugSession(session.id, userMessage.id);

    return {
      session: session.updateActivity(),
      config,
      userMessage
    };
  }

  async finalizeWorkflow(
    responseResult: any,
    startTime: number
  ): Promise<WorkflowFinalResult> {
    const { session, userMessage, botMessage, allMessages, config, enhancedContext } = responseResult;

    // Save updated session
    const finalSession = await this.sessionUpdateService.saveSession(session);

    // Calculate metrics and determine actions
    const shouldCaptureLeadInfo = this.leadCaptureDecisionService.shouldTriggerLeadCapture(finalSession, config);
    const conversationMetrics = await this.conversationMetricsService.calculateConversationMetrics(finalSession, allMessages);
    const suggestedNextActions = this.leadCaptureDecisionService.generateSuggestedActions(
      finalSession,
      config,
      shouldCaptureLeadInfo
    );

    // Update debug session with processing time
    const totalProcessingTime = Date.now() - startTime;
    this.updateDebugProcessingTime(finalSession.id, totalProcessingTime);

    return {
      session: finalSession,
      userMessage,
      botMessage,
      shouldCaptureLeadInfo,
      suggestedNextActions,
      conversationMetrics,
      intentAnalysis: this.buildIntentAnalysis(enhancedContext),
      journeyState: this.buildJourneyState(enhancedContext),
      relevantKnowledge: enhancedContext?.relevantKnowledge
    };
  }

  private async loadAndValidateSession(sessionId: string): Promise<ChatSession> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error(`Chat session ${sessionId} not found`);
    }
    return session;
  }

  private async loadChatbotConfig(configId: string): Promise<ChatbotConfig> {
    const config = await this.chatbotConfigRepository.findById(configId);
    if (!config) {
      throw new Error(`Chatbot configuration not found for config ${configId}`);
    }
    return config;
  }

  private validateOperatingHours(config: ChatbotConfig): void {
    if (!config.isWithinOperatingHours()) {
      throw new Error('Chatbot is currently outside operating hours');
    }
  }

  private async createUserMessage(session: ChatSession, request: ProcessMessageRequest): Promise<ChatMessage> {
    const userMessage = ChatMessage.createUserMessage(
      session.id,
      request.userMessage,
      'text' // Default input method
    );

    return await this.messageRepository.save(userMessage);
  }

  private initializeDebugSession(sessionId: string, userMessageId: string): void {
    if (this.debugInformationService) {
      this.debugInformationService.initializeSession(sessionId, userMessageId, 'temp');
    }
  }

  private updateDebugProcessingTime(sessionId: string, processingTime: number): void {
    if (this.debugInformationService) {
      this.debugInformationService.updateProcessingTime(sessionId, processingTime);
    }
  }

  private buildIntentAnalysis(enhancedContext: any): any {
    if (!enhancedContext?.intentResult) return undefined;

    return {
      intent: enhancedContext.intentResult.intent,
      confidence: enhancedContext.intentResult.confidence,
      entities: enhancedContext.intentResult.entities,
      category: enhancedContext.intentResult.getCategory()
    };
  }

  private buildJourneyState(enhancedContext: any): any {
    if (!enhancedContext?.journeyState) return undefined;

    return {
      stage: enhancedContext.journeyState.stage,
      confidence: enhancedContext.journeyState.confidence,
      isSalesReady: enhancedContext.journeyState.isSalesReady(),
      recommendedActions: enhancedContext.journeyState.getRecommendedActions()
    };
  }
} 