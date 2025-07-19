/**
 * Workflow Context Builder
 * 
 * AI INSTRUCTIONS:
 * - Handles workflow initialization, validation, and context setup
 * - Manages session loading, configuration validation, and user message creation
 * - Maintains DDD principle: Application coordination without business logic
 * - Preserves all organizationId security variables and validation patterns
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../../domain/repositories/IChatbotConfigRepository';
import { IDebugInformationService } from '../../../domain/services/interfaces/IDebugInformationService';
import { ProcessMessageRequest, WorkflowContext } from './WorkflowTypes';

export class WorkflowContextBuilder {
  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly debugInformationService?: IDebugInformationService
  ) {}

  /**
   * Initialize workflow context with validation and setup
   */
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

  /**
   * Load and validate chat session
   */
  private async loadAndValidateSession(sessionId: string): Promise<ChatSession> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error(`Chat session ${sessionId} not found`);
    }
    return session;
  }

  /**
   * Load chatbot configuration
   */
  private async loadChatbotConfig(configId: string): Promise<ChatbotConfig> {
    const config = await this.chatbotConfigRepository.findById(configId);
    if (!config) {
      throw new Error(`Chatbot configuration not found for config ${configId}`);
    }
    return config;
  }

  /**
   * Validate operating hours business rules
   */
  private validateOperatingHours(config: ChatbotConfig): void {
    if (!config.isWithinOperatingHours()) {
      throw new Error('Chatbot is currently outside operating hours');
    }
  }

  /**
   * Create and save user message
   */
  private async createUserMessage(
    session: ChatSession,
    request: ProcessMessageRequest,
    sharedLogFile: string
  ): Promise<ChatMessage> {
    const userMessage = ChatMessage.createUserMessage(
      session.id,
      request.userMessage,
      'text' // Default input method
    );

    // Save the initial user message immediately - no blocking API calls
    const savedUserMessage = await this.messageRepository.save(userMessage, sharedLogFile);

    // AI INSTRUCTIONS: Sentiment, urgency, and engagement analysis is now extracted 
    // from the main API response in ChatMessageProcessingService.generateAIResponse()
    // This eliminates 3 redundant API calls and 2.8s delay while preserving all data
    
    return savedUserMessage;
  }

  /**
   * Initialize debug session if debug service available
   */
  private initializeDebugSession(sessionId: string, userMessageId: string): void {
    if (this.debugInformationService) {
      this.debugInformationService.initializeSession(sessionId, userMessageId, 'temp');
    }
  }
}