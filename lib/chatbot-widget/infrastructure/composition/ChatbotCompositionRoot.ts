/**
 * Chatbot Widget Composition Root
 * 
 * Dependency injection container for the chatbot widget module.
 * Wires all dependencies and provides access to application services.
 * 
 * Pattern: Singleton for dependency management
 */

// Domain Dependencies
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { IAIConversationService, ConversationContext, AIResponse, LeadCaptureRequest } from '../../domain/services/IAIConversationService';
import { ConversationContextService } from '../../domain/services/ConversationContextService';
import { LeadScoringService } from '../../domain/services/LeadScoringService';

// Infrastructure Dependencies
import { ChatbotConfigSupabaseRepository } from '../persistence/supabase/ChatbotConfigSupabaseRepository';
import { ChatSessionSupabaseRepository } from '../persistence/supabase/ChatSessionSupabaseRepository';
import { ChatMessageSupabaseRepository } from '../persistence/supabase/ChatMessageSupabaseRepository';
import { LeadSupabaseRepository } from '../persistence/supabase/LeadSupabaseRepository';

// Application Dependencies
import { ChatbotConfigService } from '../../application/services/ChatbotConfigService';
import { ChatSessionService } from '../../application/services/ChatSessionService';
import { LeadManagementService } from '../../application/services/LeadManagementService';
import { LeadMapper } from '../../application/mappers/LeadMapper';

// Use Cases
import { ConfigureChatbotUseCase } from '../../application/use-cases/ConfigureChatbotUseCase';
import { ProcessChatMessageUseCase } from '../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../application/use-cases/CaptureLeadUseCase';

// Command Handlers
import { CreateChatbotConfigHandler } from '../../application/commands/handlers/CreateChatbotConfigHandler';
import { UpdateKnowledgeBaseHandler } from '../../application/commands/handlers/UpdateKnowledgeBaseHandler';
import { SendMessageHandler } from '../../application/commands/handlers/SendMessageHandler';

// Query Handlers
import { GetChatHistoryQueryHandler } from '../../application/queries/GetChatHistoryQueryHandler';
import { GetLeadsQueryHandler } from '../../application/queries/GetLeadsQueryHandler';

export class ChatbotCompositionRoot {
  // Repositories
  private static _chatbotConfigRepository: IChatbotConfigRepository | null = null;
  private static _chatSessionRepository: IChatSessionRepository | null = null;
  private static _chatMessageRepository: IChatMessageRepository | null = null;
  private static _leadRepository: ILeadRepository | null = null;

  // Domain Services
  private static _conversationContextService: ConversationContextService | null = null;
  private static _leadScoringService: LeadScoringService | null = null;
  private static _aiConversationService: IAIConversationService | null = null;

  // Application Services
  private static _chatbotConfigService: ChatbotConfigService | null = null;
  private static _chatSessionService: ChatSessionService | null = null;
  private static _leadManagementService: LeadManagementService | null = null;

  // Use Cases
  private static _configureChatbotUseCase: ConfigureChatbotUseCase | null = null;
  private static _processChatMessageUseCase: ProcessChatMessageUseCase | null = null;
  private static _captureLeadUseCase: CaptureLeadUseCase | null = null;

  // Command Handlers
  private static _createChatbotConfigHandler: CreateChatbotConfigHandler | null = null;
  private static _updateKnowledgeBaseHandler: UpdateKnowledgeBaseHandler | null = null;
  private static _sendMessageHandler: SendMessageHandler | null = null;

  // Query Handlers
  private static _getChatHistoryQueryHandler: GetChatHistoryQueryHandler | null = null;
  private static _getLeadsQueryHandler: GetLeadsQueryHandler | null = null;

  // Repository Getters
  static getChatbotConfigRepository(): IChatbotConfigRepository {
    if (!this._chatbotConfigRepository) {
      this._chatbotConfigRepository = new ChatbotConfigSupabaseRepository();
    }
    return this._chatbotConfigRepository;
  }

  static getChatSessionRepository(): IChatSessionRepository {
    if (!this._chatSessionRepository) {
      this._chatSessionRepository = new ChatSessionSupabaseRepository();
    }
    return this._chatSessionRepository;
  }

  static getChatMessageRepository(): IChatMessageRepository {
    if (!this._chatMessageRepository) {
      this._chatMessageRepository = new ChatMessageSupabaseRepository();
    }
    return this._chatMessageRepository;
  }

  static getLeadRepository(): ILeadRepository {
    if (!this._leadRepository) {
      this._leadRepository = new LeadSupabaseRepository();
    }
    return this._leadRepository;
  }

  // Domain Service Getters
  static getConversationContextService(): ConversationContextService {
    if (!this._conversationContextService) {
      this._conversationContextService = new ConversationContextService();
    }
    return this._conversationContextService;
  }

  static getLeadScoringService(): LeadScoringService {
    if (!this._leadScoringService) {
      this._leadScoringService = new LeadScoringService();
    }
    return this._leadScoringService;
  }

  static getAIConversationService(): IAIConversationService {
    if (!this._aiConversationService) {
      // Placeholder implementation - needs real AI service
      this._aiConversationService = {
        async generateResponse(): Promise<AIResponse> {
          throw new Error('AI Conversation Service not implemented yet');
        },
        buildSystemPrompt(): string {
          throw new Error('AI Conversation Service not implemented yet');
        },
        async shouldTriggerLeadCapture(): Promise<boolean> {
          throw new Error('AI Conversation Service not implemented yet');
        },
        async extractLeadInformation(): Promise<Partial<LeadCaptureRequest>> {
          throw new Error('AI Conversation Service not implemented yet');
        },
        async detectIntent(): Promise<string> {
          throw new Error('AI Conversation Service not implemented yet');
        },
        async analyzeSentiment(): Promise<'positive' | 'neutral' | 'negative'> {
          throw new Error('AI Conversation Service not implemented yet');
        }
      };
    }
    return this._aiConversationService;
  }

  // Application Service Getters
  static getChatbotConfigService(): ChatbotConfigService {
    if (!this._chatbotConfigService) {
      this._chatbotConfigService = new ChatbotConfigService();
    }
    return this._chatbotConfigService;
  }

  static getChatSessionService(): ChatSessionService {
    if (!this._chatSessionService) {
      this._chatSessionService = new ChatSessionService();
    }
    return this._chatSessionService;
  }

  static getLeadManagementService(): LeadManagementService {
    if (!this._leadManagementService) {
      const leadMapper = new LeadMapper();
      this._leadManagementService = new LeadManagementService(
        this.getLeadRepository(),
        this.getChatSessionRepository(),
        this.getChatMessageRepository(),
        this.getLeadScoringService(),
        leadMapper
      );
    }
    return this._leadManagementService;
  }

  // Use Case Getters
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase {
    if (!this._configureChatbotUseCase) {
      this._configureChatbotUseCase = new ConfigureChatbotUseCase(
        this.getChatbotConfigRepository()
      );
    }
    return this._configureChatbotUseCase;
  }

  static getProcessChatMessageUseCase(): ProcessChatMessageUseCase {
    if (!this._processChatMessageUseCase) {
      this._processChatMessageUseCase = new ProcessChatMessageUseCase(
        this.getChatSessionRepository(),
        this.getChatMessageRepository(),
        this.getChatbotConfigRepository(),
        this.getAIConversationService(),
        this.getConversationContextService()
      );
    }
    return this._processChatMessageUseCase;
  }

  static getCaptureLeadUseCase(): CaptureLeadUseCase {
    if (!this._captureLeadUseCase) {
      this._captureLeadUseCase = new CaptureLeadUseCase(
        this.getChatSessionRepository(),
        this.getLeadRepository(),
        this.getChatbotConfigRepository(),
        this.getLeadScoringService()
      );
    }
    return this._captureLeadUseCase;
  }

  // Command Handler Getters
  static getCreateChatbotConfigHandler(): CreateChatbotConfigHandler {
    if (!this._createChatbotConfigHandler) {
      this._createChatbotConfigHandler = new CreateChatbotConfigHandler(
        this.getConfigureChatbotUseCase()
      );
    }
    return this._createChatbotConfigHandler;
  }

  static getUpdateKnowledgeBaseHandler(): UpdateKnowledgeBaseHandler {
    if (!this._updateKnowledgeBaseHandler) {
      this._updateKnowledgeBaseHandler = new UpdateKnowledgeBaseHandler(
        this.getConfigureChatbotUseCase()
      );
    }
    return this._updateKnowledgeBaseHandler;
  }

  static getSendMessageHandler(): SendMessageHandler {
    if (!this._sendMessageHandler) {
      this._sendMessageHandler = new SendMessageHandler(
        this.getProcessChatMessageUseCase()
      );
    }
    return this._sendMessageHandler;
  }

  // Query Handler Getters
  static getChatHistoryQueryHandler(): GetChatHistoryQueryHandler {
    if (!this._getChatHistoryQueryHandler) {
      this._getChatHistoryQueryHandler = new GetChatHistoryQueryHandler(
        this.getChatSessionRepository(),
        this.getChatMessageRepository(),
        this.getLeadRepository()
      );
    }
    return this._getChatHistoryQueryHandler;
  }

  static getLeadsQueryHandler(): GetLeadsQueryHandler {
    if (!this._getLeadsQueryHandler) {
      this._getLeadsQueryHandler = new GetLeadsQueryHandler(
        this.getLeadRepository()
      );
    }
    return this._getLeadsQueryHandler;
  }
} 