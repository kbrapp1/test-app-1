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
import { ConversationMetricsService } from '../conversation-management/ConversationMetricsService';
import { LeadCaptureDecisionService } from '../lead-management/LeadCaptureDecisionService';
import { SessionUpdateService } from '../configuration-management/SessionUpdateService';

export interface ProcessMessageRequest {
  userMessage: string;
  sessionId: string;
  organizationId?: string;
  metadata?: any;
}

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
  callToAction?: {
    type: string;
    message: string;
    priority: string;
  };
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

  async initializeWorkflow(request: ProcessMessageRequest, sharedLogFile: string): Promise<WorkflowContext> {
    // Load and validate session
    const session = await this.loadAndValidateSession(request.sessionId);

    // Load chatbot configuration
    const config = await this.loadChatbotConfig(session.chatbotConfigId);

    // Validate operating hours
    this.validateOperatingHours(config);

    // Create user message
    const userMessage = await this.createUserMessage(session, request, sharedLogFile);

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
    startTime: number,
    sharedLogFile: string
  ): Promise<WorkflowFinalResult> {
    const { session, userMessage, botMessage, allMessages, config, enhancedContext } = responseResult;

    // Save updated session
    const finalSession = await this.sessionUpdateService.saveSession(session, sharedLogFile);

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
      relevantKnowledge: enhancedContext?.relevantKnowledge,
      callToAction: enhancedContext?.callToAction
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

  private async createUserMessage(session: ChatSession, request: ProcessMessageRequest, sharedLogFile: string): Promise<ChatMessage> {
    const userMessage = ChatMessage.createUserMessage(
      session.id,
      request.userMessage,
      'text' // Default input method
    );

    // Always use shared log file for consistency
    return await this.messageRepository.save(userMessage, sharedLogFile);
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
    // Handle unified API response structure (consistent data contract)
    if (enhancedContext?.unifiedAnalysis) {
      const analysis = enhancedContext.unifiedAnalysis;
      return {
        intent: analysis.primaryIntent || 'unknown',
        confidence: analysis.primaryConfidence || 0,
        entities: analysis.entities || {},
        category: 'general' // Unified API doesn't provide category - use default
      };
    }

    // No intent analysis available
    return undefined;
  }

  private buildJourneyState(enhancedContext: any): any {
    // Handle unified API lead score structure (consistent data contract)
    if (enhancedContext?.leadScore) {
      const leadScore = enhancedContext.leadScore;
      return {
        stage: this.mapLeadScoreToStage(leadScore.totalScore),
        confidence: leadScore.totalScore / 100, // Convert 0-100 to 0-1 confidence
        isSalesReady: leadScore.qualificationStatus?.readyForSales || false,
        recommendedActions: leadScore.qualificationStatus?.nextSteps || []
      };
    }

    // No journey state available
    return undefined;
  }

  private mapLeadScoreToStage(totalScore: number): string {
    if (totalScore >= 80) return 'qualified-ready';
    if (totalScore >= 70) return 'qualified';
    if (totalScore >= 50) return 'interested';
    if (totalScore >= 30) return 'engaged';
    return 'initial';
  }
} 