import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../../supabase/server';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';

// Domain service interfaces
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';

// Application services
import { LeadManagementService } from '../../application/services/lead-management/LeadManagementService';
import { WebsiteKnowledgeApplicationService } from '../../application/services/WebsiteKnowledgeApplicationService';
import { VectorKnowledgeApplicationService } from '../../application/services/VectorKnowledgeApplicationService';

// Application use cases
import { ProcessChatMessageUseCase } from '../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../application/use-cases/CaptureLeadUseCase';
import { ConfigureChatbotUseCase } from '../../application/use-cases/ConfigureChatbotUseCase';

// Infrastructure services
import { SupabaseVectorKnowledgeRepository } from '../persistence/supabase/SupabaseVectorKnowledgeRepository';
import { OpenAIEmbeddingService } from '../providers/openai/services/OpenAIEmbeddingService';
import { WebsiteCrawlerService } from '../providers/knowledge-services/WebsiteCrawlerService';

// Infrastructure providers
import { OpenAIProvider } from '../providers/openai/OpenAIProvider';

// Internal composition services
import { RepositoryCompositionService } from './RepositoryCompositionService';
import { DomainServiceCompositionService } from './DomainServiceCompositionService';
import { ApplicationServiceCompositionService } from './ApplicationServiceCompositionService';
import { UseCaseCompositionService } from './UseCaseCompositionService';

// Import centralized logging service
import { IChatbotLoggingService } from '../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotFileLoggingService } from '../providers/logging/ChatbotFileLoggingService';

/**
 * Main Composition Root for Chatbot Widget Domain
 * 
 * AI INSTRUCTIONS:
 * - Central dependency injection container for the chatbot widget domain
 * - Manages singleton instances and proper dependency wiring
 * - Uses unified vector table for knowledge storage and retrieval
 * - Provides clean separation between infrastructure and domain layers
 * - Supports testing through configurable client injection
 */
export class ChatbotWidgetCompositionRoot {
  // Infrastructure singletons
  private static vectorKnowledgeRepository: IVectorKnowledgeRepository | null = null;
  private static embeddingService: OpenAIEmbeddingService | null = null;
  private static openAIProvider: OpenAIProvider | null = null;
  private static websiteCrawlerService: WebsiteCrawlerService | null = null;
  private static vectorKnowledgeApplicationService: VectorKnowledgeApplicationService | null = null;
  private static websiteKnowledgeApplicationService: WebsiteKnowledgeApplicationService | null = null;

  // Singleton instances
  private static loggingService: IChatbotLoggingService | null = null;

  // Repository access methods
  static getChatbotConfigRepository(): IChatbotConfigRepository {
    return RepositoryCompositionService.getChatbotConfigRepository();
  }

  static getChatSessionRepository(): IChatSessionRepository {
    return RepositoryCompositionService.getChatSessionRepository();
  }

  static getChatMessageRepository(): IChatMessageRepository {
    return RepositoryCompositionService.getChatMessageRepository();
  }

  static getLeadRepository(): ILeadRepository {
    return RepositoryCompositionService.getLeadRepository();
  }

  static getVectorKnowledgeRepository(): IVectorKnowledgeRepository {
    if (!this.vectorKnowledgeRepository) {
      const supabase = createClient();
      this.vectorKnowledgeRepository = new SupabaseVectorKnowledgeRepository(supabase);
    }
    return this.vectorKnowledgeRepository;
  }

  // Vector and AI service methods
  static getOpenAIProvider(): OpenAIProvider {
    if (!this.openAIProvider) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required for AI operations');
      }
      
      this.openAIProvider = new OpenAIProvider({
        apiKey,
        model: 'gpt-3.5-turbo',
        temperature: 0.1,
        maxTokens: 50
      });
    }
    return this.openAIProvider;
  }

  static getEmbeddingService(): OpenAIEmbeddingService {
    if (!this.embeddingService) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required for vector embeddings');
      }
      
      const maxUserQueryCacheSize = process.env.USER_QUERY_CACHE_SIZE 
        ? parseInt(process.env.USER_QUERY_CACHE_SIZE) 
        : 1000;
         
      this.embeddingService = new OpenAIEmbeddingService(apiKey, undefined, maxUserQueryCacheSize);
    }
    return this.embeddingService;
  }

  static getWebsiteCrawlerService(): WebsiteCrawlerService {
    if (!this.websiteCrawlerService) {
      const openAIProvider = this.getOpenAIProvider();
      const vectorKnowledgeRepository = this.getVectorKnowledgeRepository();
      const embeddingService = this.getEmbeddingService();
      this.websiteCrawlerService = new WebsiteCrawlerService(
        openAIProvider,
        vectorKnowledgeRepository,
        embeddingService
      );
    }
    return this.websiteCrawlerService;
  }

  static getVectorKnowledgeApplicationService(): VectorKnowledgeApplicationService {
    if (!this.vectorKnowledgeApplicationService) {
      const vectorKnowledgeRepository = this.getVectorKnowledgeRepository();
      const embeddingService = this.getEmbeddingService();
      this.vectorKnowledgeApplicationService = new VectorKnowledgeApplicationService(
        vectorKnowledgeRepository,
        embeddingService
      );
    }
    return this.vectorKnowledgeApplicationService;
  }

  static getWebsiteKnowledgeApplicationService(): WebsiteKnowledgeApplicationService {
    if (!this.websiteKnowledgeApplicationService) {
      const websiteCrawlerService = this.getWebsiteCrawlerService();
      this.websiteKnowledgeApplicationService = new WebsiteKnowledgeApplicationService(
        websiteCrawlerService
      );
    }
    return this.websiteKnowledgeApplicationService;
  }

  // Domain service access methods - API-driven services only
  // Conversation context services
  static getConversationContextOrchestrator() {
    return DomainServiceCompositionService.getConversationContextOrchestrator();
  }

  static getConversationSessionUpdateService() {
    return DomainServiceCompositionService.getConversationSessionUpdateService();
  }

  static getSessionContextService() {
    return DomainServiceCompositionService.getSessionContextService();
  }

  static getSessionStateService() {
    return DomainServiceCompositionService.getSessionStateService();
  }

  static getContextWindowService(tokenCountingService: ITokenCountingService) {
    return DomainServiceCompositionService.getContextWindowService(tokenCountingService);
  }

  // Static validation services
  static getChatSessionValidationService() {
    return DomainServiceCompositionService.getChatSessionValidationService();
  }

  static getSessionLeadQualificationService() {
    return DomainServiceCompositionService.getSessionLeadQualificationService();
  }

  static getEntityAccumulationService() {
    return DomainServiceCompositionService.getEntityAccumulationService();
  }

  // Debug and utility services
  static getDebugInformationService() {
    return DomainServiceCompositionService.getDebugInformationService();
  }

  // Knowledge retrieval service access method
  static getKnowledgeRetrievalService(chatbotConfig?: any) {
    return DomainServiceCompositionService.getKnowledgeRetrievalService(chatbotConfig);
  }

  // Application service access methods
  static getLeadManagementService(): LeadManagementService {
    return ApplicationServiceCompositionService.getLeadManagementService();
  }

  // Use case access methods
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase {
    return UseCaseCompositionService.getConfigureChatbotUseCase();
  }

  static async getProcessChatMessageUseCase(): Promise<ProcessChatMessageUseCase> {
    return UseCaseCompositionService.getProcessChatMessageUseCase();
  }

  static getCaptureLeadUseCase(): CaptureLeadUseCase {
    return UseCaseCompositionService.getCaptureLeadUseCase();
  }

  // Configuration and testing methods
  static configureWithSupabaseClient(client: SupabaseClient): void {
    RepositoryCompositionService.configureWithSupabaseClient(client);
  }

  static resetForTesting(): void {
    // Reset infrastructure singletons
    this.vectorKnowledgeRepository = null;
    this.embeddingService = null;
    this.openAIProvider = null;
    this.websiteCrawlerService = null;
    this.vectorKnowledgeApplicationService = null;
    this.websiteKnowledgeApplicationService = null;
    
    // Reset composition services
    RepositoryCompositionService.reset();
    DomainServiceCompositionService.clearCache();
    ApplicationServiceCompositionService.reset();
    UseCaseCompositionService.reset();
  }

  // ConversationFlowService is now handled through static methods in DomainServiceCompositionService
  static processAIFlowDecision(decision: any, currentState: any) {
    return DomainServiceCompositionService.processAIFlowDecision(decision, currentState);
  }

  static shouldTriggerLeadCapture(decision: any) {
    return DomainServiceCompositionService.shouldTriggerLeadCapture(decision);
  }

  /**
   * Get centralized logging service
   * 
   * AI INSTRUCTIONS:
   * - Singleton pattern for consistent logging across domain
   * - Return same instance for correlation and performance
   * - Handle environment configuration automatically
   */
  static getLoggingService(): IChatbotLoggingService {
    if (!this.loggingService) {
      this.loggingService = new ChatbotFileLoggingService();
    }
    return this.loggingService;
  }
} 