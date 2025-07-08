/**
 * Process Chat Message Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate complete chat message processing workflow
 * - Delegate complex logic to specialized services
 * - Handle input validation and error transformation
 * - Maintain clean separation between application and domain layers
 * - Keep focused on single responsibility - message processing coordination
 * - Use domain events for cross-aggregate communication
 */

import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IAIConversationService } from '../../domain/services/interfaces/IAIConversationService';
import { ConversationContextOrchestrator } from '../../domain/services/conversation/ConversationContextOrchestrator';
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';
import { MessageProcessingWorkflowService } from '../services/message-processing/MessageProcessingWorkflowService';
import { ChatMessageProcessingService } from '../services/message-processing/ChatMessageProcessingService';
import { ConversationContextManagementService } from '../services/conversation-management/ConversationContextManagementService';
import { SessionUpdateService } from '../services/configuration-management/SessionUpdateService';
import { ProcessChatMessageWorkflowOrchestrator } from '../services/ProcessChatMessageWorkflowOrchestrator';
import { ProcessChatMessageRequest, ProcessChatMessageRequestValidator } from '../dto/ProcessChatMessageRequest';
import { ProcessChatMessageResult } from '../dto/ProcessChatMessageResult';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { 
  OrganizationRequiredError, 
  MessageValidationError,
  DomainError,
  ErrorSeverity 
} from '../../domain/errors/ChatMessageProcessingErrors';
import { PerformanceProfiler } from '../../../performance-profiler';

export class ProcessChatMessageUseCase {
  private readonly workflowOrchestrator: ProcessChatMessageWorkflowOrchestrator;

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
    // AI: Initialize specialized services
    const workflowService = new MessageProcessingWorkflowService(
      sessionRepository,
      messageRepository,
      chatbotConfigRepository,
      aiConversationService,
      debugInformationService
    );

    const errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
    
    const processingService = new ChatMessageProcessingService(
      aiConversationService,
      messageRepository,
      conversationContextOrchestrator,
      errorTrackingService,
      intentClassificationService,
      knowledgeRetrievalService
    );

    const contextManagementService = new ConversationContextManagementService(
      conversationContextOrchestrator,
      tokenCountingService,
      sessionRepository,
      messageRepository
    );

    // AI: Create workflow orchestrator with all dependencies
    this.workflowOrchestrator = new ProcessChatMessageWorkflowOrchestrator(
      workflowService,
      processingService,
      contextManagementService
    );
  }

  async execute(request: ProcessChatMessageRequest): Promise<ProcessChatMessageResult> {
    // AI: Clear performance profiler for fresh metrics
    PerformanceProfiler.clear();
    
    try {
      // AI: Validate input using dedicated validator
      const validatedRequest = this.validateRequest(request);
      
      // AI: Delegate to workflow orchestrator
      return await this.workflowOrchestrator.orchestrate(validatedRequest);
      
    } catch (error) {
      // AI: Transform domain errors for presentation layer
      throw this.transformError(error);
    }
  }

  private validateRequest(request: ProcessChatMessageRequest): ProcessChatMessageRequest {
    try {
      // AI: Validate organization ID first (critical requirement)
      if (!request.organizationId?.trim()) {
        throw new OrganizationRequiredError({ request });
      }

      // AI: Use validator for comprehensive validation
      return ProcessChatMessageRequestValidator.validate(request);
      
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      // AI: Transform validation errors to domain errors
      throw new MessageValidationError(
        'request',
        error instanceof Error ? error.message : String(error),
        { request }
      );
    }
  }

  private transformError(error: unknown): Error {
    // AI: Transform domain errors for presentation layer
    if (error instanceof DomainError) {
      // Keep domain errors as-is for proper error handling
      return error;
    }
    
    // AI: Wrap unexpected errors
    return new Error(
      error instanceof Error ? error.message : 'An unexpected error occurred during message processing'
    );
  }
} 