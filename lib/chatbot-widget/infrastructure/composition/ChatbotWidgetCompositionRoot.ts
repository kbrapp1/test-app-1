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
import { DynamicPromptService } from '../../domain/services/DynamicPromptService';
import { IAIConversationService } from '../../domain/services/IAIConversationService';
import { ITokenCountingService } from '../../domain/services/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/IKnowledgeRetrievalService';

// Infrastructure services
import { OpenAIProvider, OpenAIConfig } from '../providers/openai/OpenAIProvider';
import { OpenAITokenCountingService } from '../providers/openai/OpenAITokenCountingService';
import { OpenAIIntentClassificationService } from '../providers/openai/OpenAIIntentClassificationService';
import { SimpleKnowledgeRetrievalService } from '../providers/SimpleKnowledgeRetrievalService';
import { DebugInformationService } from '../services/DebugInformationService';
import { IDebugInformationService } from '../../domain/services/IDebugInformationService';

// Application services
import { LeadManagementService } from '../../application/services/LeadManagementService';
import { AiConversationService } from '../../application/services/AiConversationService';

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

  // Infrastructure singletons
  private static openAIProvider: OpenAIProvider | null = null;

  // Service singletons
  private static leadScoringService: LeadScoringService | null = null;
  private static conversationContextService: ConversationContextService | null = null;
  private static dynamicPromptService: DynamicPromptService | null = null;
  private static aiConversationService: AiConversationService | null = null;
  private static tokenCountingService: ITokenCountingService | null = null;
  private static intentClassificationService: IIntentClassificationService | null = null;
  private static knowledgeRetrievalService: IKnowledgeRetrievalService | null = null;
  private static debugInformationService: IDebugInformationService | null = null;

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
   * Get OpenAI Provider
   */
  static async getOpenAIProvider(): Promise<OpenAIProvider> {
    if (!this.openAIProvider) {
      const config: OpenAIConfig = {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000,
      };

      if (!config.apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required for chatbot functionality');
      }

      this.openAIProvider = new OpenAIProvider(config, this.getDebugInformationService());
      await this.openAIProvider.connect();
      
      // Verify connection
      const isHealthy = await this.openAIProvider.healthCheck();
      if (!isHealthy) {
        console.warn('Chatbot: OpenAI provider health check failed, but continuing...');
      }
    }

    return this.openAIProvider;
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
   * Get Token Counting Service
   */
  static getTokenCountingService(): ITokenCountingService {
    if (!this.tokenCountingService) {
      this.tokenCountingService = new OpenAITokenCountingService();
    }
    return this.tokenCountingService;
  }

  /**
   * Get Intent Classification Service with dynamic configuration
   */
  static async getIntentClassificationService(chatbotConfig?: any): Promise<IIntentClassificationService> {
    // For now, create a new instance each time to use the latest config
    // In production, you might want to cache based on config hash
    const aiConfig = chatbotConfig?.aiConfiguration;
    
    const config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: aiConfig?.openaiModel || 'gpt-4o-mini',
      temperature: aiConfig?.openaiTemperature || 0.3,
      maxTokens: 500 // Use fixed value for intent classification
    };

    if (!config.apiKey) {
      console.warn('OPENAI_API_KEY not found, intent classification will be limited');
    }

    return new OpenAIIntentClassificationService(config, this.getDebugInformationService());
  }

  /**
   * Get Knowledge Retrieval Service
   */
  static getKnowledgeRetrievalService(chatbotConfig: any): IKnowledgeRetrievalService {
    // Create a new instance for each chatbot config to ensure proper knowledge base
    return new SimpleKnowledgeRetrievalService(chatbotConfig);
  }

  /**
   * Get Conversation Context Service
   */
  static async getConversationContextService(): Promise<ConversationContextService> {
    if (!this.conversationContextService) {
      const tokenCountingService = this.getTokenCountingService();
      const intentClassificationService = await this.getIntentClassificationService();
      
      this.conversationContextService = new ConversationContextService(
        tokenCountingService,
        intentClassificationService
        // Note: knowledgeRetrievalService is passed per-request since it depends on chatbot config
      );
    }
    return this.conversationContextService;
  }

  /**
   * Get Dynamic Prompt Service
   */
  static getDynamicPromptService(): DynamicPromptService {
    if (!this.dynamicPromptService) {
      this.dynamicPromptService = new DynamicPromptService();
    }
    return this.dynamicPromptService;
  }

  /**
   * Get AI Conversation Service
   */
  static async getAiConversationService(): Promise<AiConversationService> {
    if (!this.aiConversationService) {
      const openAIProvider = await this.getOpenAIProvider();
      const dynamicPromptService = this.getDynamicPromptService();
      const conversationContextService = await this.getConversationContextService();

      this.aiConversationService = new AiConversationService(
        openAIProvider,
        dynamicPromptService,
        conversationContextService
      );
    }
    return this.aiConversationService as AiConversationService;
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
   * Get Debug Information Service
   */
  static getDebugInformationService(): IDebugInformationService {
    if (!this.debugInformationService) {
      this.debugInformationService = new DebugInformationService();
    }
    return this.debugInformationService;
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
    this.debugInformationService = null;
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
   * Now properly wired with AI Conversation Service and Token Counting
   */
  static async getProcessChatMessageUseCase(): Promise<ProcessChatMessageUseCase> {
    if (!this.processChatMessageUseCase) {
      const chatSessionRepository = this.getChatSessionRepository();
      const chatMessageRepository = this.getChatMessageRepository();
      const chatbotConfigRepository = this.getChatbotConfigRepository();
      const aiConversationService = await this.getAiConversationService();
      const conversationContextService = await this.getConversationContextService();
      const tokenCountingService = this.getTokenCountingService();
      const intentClassificationService = await this.getIntentClassificationService();

      this.processChatMessageUseCase = new ProcessChatMessageUseCase(
        chatSessionRepository,
        chatMessageRepository,
        chatbotConfigRepository,
        aiConversationService as IAIConversationService,
        conversationContextService,
        tokenCountingService,
        intentClassificationService,
        undefined, // knowledgeRetrievalService is passed per-request in the use case
        this.getDebugInformationService()
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