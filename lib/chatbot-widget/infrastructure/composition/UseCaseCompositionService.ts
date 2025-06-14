// Application use cases
import { ConfigureChatbotUseCase } from '../../application/use-cases/ConfigureChatbotUseCase';
import { ProcessChatMessageUseCase } from '../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../application/use-cases/CaptureLeadUseCase';

// Domain service interfaces
import { IAIConversationService } from '../../domain/services/IAIConversationService';

// Composition services
import { RepositoryCompositionService } from './RepositoryCompositionService';
import { DomainServiceCompositionService } from './DomainServiceCompositionService';
import { ApplicationServiceCompositionService } from './ApplicationServiceCompositionService';

/**
 * Use Case Composition Service
 * Infrastructure Service: Manages use case creation and lifecycle
 * Following DDD principles: Single responsibility for use case management
 */
export class UseCaseCompositionService {
  // Use case singletons
  private static configureChatbotUseCase: ConfigureChatbotUseCase | null = null;
  private static processChatMessageUseCase: ProcessChatMessageUseCase | null = null;
  private static captureLeadUseCase: CaptureLeadUseCase | null = null;

  /**
   * Get Configure Chatbot Use Case
   */
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase {
    if (!this.configureChatbotUseCase) {
      this.configureChatbotUseCase = new ConfigureChatbotUseCase(
        RepositoryCompositionService.getChatbotConfigRepository()
      );
    }
    return this.configureChatbotUseCase;
  }

  /**
   * Get Process Chat Message Use Case
   * Now properly wired with AI Conversation Service and Token Counting
   */
  static async getProcessChatMessageUseCase(): Promise<ProcessChatMessageUseCase> {
    if (!this.processChatMessageUseCase) {
      const chatSessionRepository = RepositoryCompositionService.getChatSessionRepository();
      const chatMessageRepository = RepositoryCompositionService.getChatMessageRepository();
      const chatbotConfigRepository = RepositoryCompositionService.getChatbotConfigRepository();
      const aiConversationService = await ApplicationServiceCompositionService.getAiConversationServiceInterface();
      const conversationContextService = await DomainServiceCompositionService.getConversationContextService();
      const tokenCountingService = DomainServiceCompositionService.getTokenCountingService();
      const intentClassificationService = await DomainServiceCompositionService.getIntentClassificationService();

      this.processChatMessageUseCase = new ProcessChatMessageUseCase(
        chatSessionRepository,
        chatMessageRepository,
        chatbotConfigRepository,
        aiConversationService as IAIConversationService,
        conversationContextService,
        tokenCountingService,
        intentClassificationService,
        undefined, // knowledgeRetrievalService is passed per-request in the use case
        DomainServiceCompositionService.getDebugInformationService()
      );
    }
    return this.processChatMessageUseCase;
  }

  /**
   * Get Capture Lead Use Case
   */
  static getCaptureLeadUseCase(): CaptureLeadUseCase {
    if (!this.captureLeadUseCase) {
      this.captureLeadUseCase = new CaptureLeadUseCase(
        RepositoryCompositionService.getChatSessionRepository(),
        RepositoryCompositionService.getLeadRepository(),
        RepositoryCompositionService.getChatbotConfigRepository(),
        DomainServiceCompositionService.getLeadScoringService()
      );
    }
    return this.captureLeadUseCase;
  }

  /**
   * Reset all use case singletons
   */
  static reset(): void {
    this.configureChatbotUseCase = null;
    this.processChatMessageUseCase = null;
    this.captureLeadUseCase = null;
  }
} 