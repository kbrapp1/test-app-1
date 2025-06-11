import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Repository implementations
import { ChatbotConfigSupabaseRepository } from '../persistence/supabase/ChatbotConfigSupabaseRepository';
import { ChatSessionSupabaseRepository } from '../persistence/supabase/ChatSessionSupabaseRepository';
import { ChatMessageSupabaseRepository } from '../persistence/supabase/ChatMessageSupabaseRepository';
import { LeadSupabaseRepository } from '../persistence/supabase/LeadSupabaseRepository';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

// Domain services
import { LeadScoringService } from '../../domain/services/LeadScoringService';
import { ConversationContextService } from '../../domain/services/ConversationContextService';

// Application services
import { LeadManagementService } from '../../application/services/LeadManagementService';

// Application mappers
import { LeadMapper } from '../../application/mappers/LeadMapper';

// Application use cases
import { ConfigureChatbotUseCase } from '../../application/use-cases/ConfigureChatbotUseCase';
import { ProcessChatMessageUseCase } from '../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../application/use-cases/CaptureLeadUseCase';

/**
 * Composition Root for Chatbot Widget Domain
 * Wires all dependencies using dependency injection
 * Follows singleton pattern for repository management
 */
export class ChatbotWidgetCompositionRoot {
  private static supabaseClient: SupabaseClient | null = null;

  // Repository singletons
  private static chatbotConfigRepository: IChatbotConfigRepository | null = null;
  private static chatSessionRepository: IChatSessionRepository | null = null;
  private static chatMessageRepository: IChatMessageRepository | null = null;
  private static leadRepository: ILeadRepository | null = null;

  // Service singletons
  private static leadScoringService: LeadScoringService | null = null;
  private static conversationContextService: ConversationContextService | null = null;

  // Application service singletons
  private static leadManagementService: LeadManagementService | null = null;

  // Use case singletons
  private static configureChatbotUseCase: ConfigureChatbotUseCase | null = null;
  private static processChatMessageUseCase: ProcessChatMessageUseCase | null = null;
  private static captureLeadUseCase: CaptureLeadUseCase | null = null;

  /**
   * Get or create Supabase client
   */
  private static getSupabaseClient(): SupabaseClient {
    if (!this.supabaseClient) {
      this.supabaseClient = createClient();
    }
    return this.supabaseClient;
  }

  /**
   * Get ChatbotConfig Repository
   */
  static getChatbotConfigRepository(): IChatbotConfigRepository {
    if (!this.chatbotConfigRepository) {
      this.chatbotConfigRepository = new ChatbotConfigSupabaseRepository(
        this.getSupabaseClient()
      );
    }
    return this.chatbotConfigRepository;
  }

  /**
   * Get ChatSession Repository
   */
  static getChatSessionRepository(): IChatSessionRepository {
    if (!this.chatSessionRepository) {
      this.chatSessionRepository = new ChatSessionSupabaseRepository(
        this.getSupabaseClient()
      );
    }
    return this.chatSessionRepository;
  }

  /**
   * Get ChatMessage Repository
   */
  static getChatMessageRepository(): IChatMessageRepository {
    if (!this.chatMessageRepository) {
      this.chatMessageRepository = new ChatMessageSupabaseRepository(
        this.getSupabaseClient()
      );
    }
    return this.chatMessageRepository;
  }

  /**
   * Get Lead Repository
   */
  static getLeadRepository(): ILeadRepository {
    if (!this.leadRepository) {
      this.leadRepository = new LeadSupabaseRepository(
        this.getSupabaseClient()
      );
    }
    return this.leadRepository;
  }

  /**
   * Get Lead Scoring Service
   */
  static getLeadScoringService(): LeadScoringService {
    if (!this.leadScoringService) {
      this.leadScoringService = new LeadScoringService();
    }
    return this.leadScoringService;
  }

  /**
   * Get Conversation Context Service
   */
  static getConversationContextService(): ConversationContextService {
    if (!this.conversationContextService) {
      this.conversationContextService = new ConversationContextService();
    }
    return this.conversationContextService;
  }

  /**
   * Get Lead Management Service (Application Service)
   */
  static getLeadManagementService(): LeadManagementService {
    if (!this.leadManagementService) {
      this.leadManagementService = new LeadManagementService(
        this.getLeadRepository(),
        this.getChatSessionRepository(),
        this.getChatMessageRepository(),
        this.getLeadScoringService(),
        new LeadMapper() // Create new instance since it's a static class
      );
    }
    return this.leadManagementService;
  }

  /**
   * Reset all singletons (useful for testing)
   */
  static reset(): void {
    this.supabaseClient = null;
    this.chatbotConfigRepository = null;
    this.chatSessionRepository = null;
    this.chatMessageRepository = null;
    this.leadRepository = null;
    this.leadScoringService = null;
    this.conversationContextService = null;
    this.leadManagementService = null;
    this.configureChatbotUseCase = null;
    this.processChatMessageUseCase = null;
    this.captureLeadUseCase = null;
  }

  /**
   * Get Configure Chatbot Use Case
   */
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase {
    if (!this.configureChatbotUseCase) {
      this.configureChatbotUseCase = new ConfigureChatbotUseCase(
        this.getChatbotConfigRepository()
      );
    }
    return this.configureChatbotUseCase;
  }

  /**
   * Get Process Chat Message Use Case
   * Note: AI Conversation Service not yet implemented in composition root
   */
  static getProcessChatMessageUseCase(): ProcessChatMessageUseCase {
    if (!this.processChatMessageUseCase) {
      // TODO: Implement AI Conversation Service in composition root
      throw new Error('ProcessChatMessageUseCase requires AI Conversation Service - not yet implemented');
    }
    return this.processChatMessageUseCase;
  }

  /**
   * Get Capture Lead Use Case
   */
  static getCaptureLeadUseCase(): CaptureLeadUseCase {
    if (!this.captureLeadUseCase) {
      this.captureLeadUseCase = new CaptureLeadUseCase(
        this.getChatSessionRepository(),
        this.getLeadRepository(),
        this.getChatbotConfigRepository(),
        this.getLeadScoringService()
      );
    }
    return this.captureLeadUseCase;
  }

  /**
   * Configure with custom Supabase client (useful for testing)
   */
  static configureWithSupabaseClient(client: SupabaseClient): void {
    this.supabaseClient = client;
    // Reset repositories to force recreation with new client
    this.chatbotConfigRepository = null;
    this.chatSessionRepository = null;
    this.chatMessageRepository = null;
    this.leadRepository = null;
  }
} 