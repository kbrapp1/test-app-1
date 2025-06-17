/**
 * Process Chat Message Use Case
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate chat message processing workflow
 * - Delegate specialized operations to focused services
 * - Keep under 200-250 lines by extracting workflow services
 * - Use composition pattern for complex operations
 * - Follow @golden-rule patterns exactly
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IAIConversationService } from '../../domain/services/interfaces/IAIConversationService';
import { ConversationContextOrchestrator } from '../../domain/services/conversation/ConversationContextOrchestrator';
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';

import { 
  MessageProcessingWorkflowService,
  ConversationAnalysisService,
  ChatMessageProcessingService
} from '../services/message-processing';
import { ProcessMessageRequest } from '../services/conversation-management/MessageProcessingService';
import { ConversationMetrics } from '../services/conversation-management/ConversationMetricsService';

export interface ProcessMessageResult {
  chatSession: ChatSession;
  userMessage: ChatMessage;
  botResponse: ChatMessage;
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: string[];
  conversationMetrics: ConversationMetrics;
  intentAnalysis?: {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    category: string;
  };
  journeyState?: {
    stage: string;
    confidence: number;
    isSalesReady: boolean;
    recommendedActions: string[];
  };
  relevantKnowledge?: Array<{
    title: string;
    content: string;
    relevanceScore: number;
  }>;
}

export class ProcessChatMessageUseCase {
  private readonly workflowService: MessageProcessingWorkflowService;
  private readonly analysisService: ConversationAnalysisService;
  private readonly processingService: ChatMessageProcessingService;

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly aiConversationService: IAIConversationService,
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly tokenCountingService: ITokenCountingService,
    private readonly intentClassificationService?: IIntentClassificationService,
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService,
    private readonly debugInformationService?: IDebugInformationService
  ) {
    this.workflowService = new MessageProcessingWorkflowService(
      sessionRepository,
      messageRepository,
      chatbotConfigRepository,
      debugInformationService
    );

    this.analysisService = new ConversationAnalysisService(
      conversationContextOrchestrator,
      tokenCountingService,
      sessionRepository,
      messageRepository,
      intentClassificationService
    );

    this.processingService = new ChatMessageProcessingService(
      aiConversationService,
      messageRepository,
      conversationContextOrchestrator,
      intentClassificationService,
      knowledgeRetrievalService
    );
  }

  async execute(request: ProcessMessageRequest): Promise<ProcessMessageResult> {
    const startTime = Date.now();
    
    // 1. Initialize workflow and validate prerequisites
    const workflowContext = await this.workflowService.initializeWorkflow(request);
    
    // 2. Process user message and update session
    const messageContext = await this.processingService.processUserMessage(
      workflowContext,
      request
    );

    // 3. Analyze conversation context and generate enhanced context
    const analysisResult = await this.analysisService.analyzeConversationContext(
      messageContext
    );

    // 4. Generate AI response with enhanced context
    const responseResult = await this.processingService.generateAIResponse(
      analysisResult
    );

    // 5. Finalize workflow and calculate metrics
    const finalResult = await this.workflowService.finalizeWorkflow(
      responseResult,
      startTime
    );

    return this.buildProcessMessageResult(finalResult);
  }

  private buildProcessMessageResult(finalResult: any): ProcessMessageResult {
    return {
      chatSession: finalResult.session,
      userMessage: finalResult.userMessage,
      botResponse: finalResult.botMessage,
      shouldCaptureLeadInfo: finalResult.shouldCaptureLeadInfo,
      suggestedNextActions: finalResult.suggestedNextActions,
      conversationMetrics: finalResult.conversationMetrics,
      intentAnalysis: finalResult.intentAnalysis,
      journeyState: finalResult.journeyState,
      relevantKnowledge: finalResult.relevantKnowledge
    };
  }
} 