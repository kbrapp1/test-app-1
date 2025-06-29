import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { IVectorRepository } from '../../domain/repositories/IVectorRepository';
import { IKnowledgeItemRepository } from '../../domain/repositories/IKnowledgeItemRepository';

// Domain service interfaces
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';

// Application services
import { LeadManagementService } from '../../application/services/lead-management/LeadManagementService';
import { VectorManagementService } from '../../application/services/VectorManagementService';
import { WebsiteKnowledgeApplicationService } from '../../application/services/WebsiteKnowledgeApplicationService';

// Application use cases
import { ProcessChatMessageUseCase } from '../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../application/use-cases/CaptureLeadUseCase';
import { ConfigureChatbotUseCase } from '../../application/use-cases/ConfigureChatbotUseCase';

// Infrastructure services
import { SupabaseVectorRepository } from '../persistence/supabase/SupabaseVectorRepository';
import { SupabaseKnowledgeItemRepository } from '../persistence/supabase/SupabaseKnowledgeItemRepository';
import { OpenAIEmbeddingService } from '../providers/openai/services/OpenAIEmbeddingService';
import { WebsiteCrawlerService } from '../providers/knowledge-services/WebsiteCrawlerService';
import { EnhancedKnowledgeRetrievalService } from '../providers/knowledge-services/EnhancedKnowledgeRetrievalService';
import { OpenAIProvider } from '../providers/openai/OpenAIProvider';

// Composition services
import { RepositoryCompositionService } from './RepositoryCompositionService';
import { DomainServiceCompositionService } from './DomainServiceCompositionService';
import { ApplicationServiceCompositionService } from './ApplicationServiceCompositionService';
import { UseCaseCompositionService } from './UseCaseCompositionService';

/**
 * Composition Root for Chatbot Widget Domain
 * 
 * AI INSTRUCTIONS:
 * - Following @golden-rule.mdc DDD composition root patterns
 * - Single composition root for entire chatbot widget bounded context
 * - Clean separation of concerns with focused service management
 * - Eliminates circular dependencies by consolidating all services
 * - Single responsibility for high-level coordination
 */
export class ChatbotWidgetCompositionRoot {
  // Vector-related singletons
  private static vectorRepository: IVectorRepository | null = null;
  private static knowledgeItemRepository: IKnowledgeItemRepository | null = null;
  private static embeddingService: OpenAIEmbeddingService | null = null;
  private static openAIProvider: OpenAIProvider | null = null;
  private static websiteCrawlerService: WebsiteCrawlerService | null = null;
  private static enhancedKnowledgeRetrievalService: EnhancedKnowledgeRetrievalService | null = null;
  private static vectorManagementService: VectorManagementService | null = null;
  private static websiteKnowledgeApplicationService: WebsiteKnowledgeApplicationService | null = null;

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

  static getVectorRepository(): IVectorRepository {
    if (!this.vectorRepository) {
      const supabase = createClient();
      this.vectorRepository = new SupabaseVectorRepository(supabase);
    }
    return this.vectorRepository;
  }

  static getKnowledgeItemRepository(): IKnowledgeItemRepository {
    if (!this.knowledgeItemRepository) {
      const supabase = createClient();
      this.knowledgeItemRepository = new SupabaseKnowledgeItemRepository(supabase);
    }
    return this.knowledgeItemRepository;
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
      const knowledgeItemRepository = this.getKnowledgeItemRepository();
      const embeddingService = this.getEmbeddingService();
      this.websiteCrawlerService = new WebsiteCrawlerService(
        openAIProvider,
        knowledgeItemRepository,
        embeddingService
      );
    }
    return this.websiteCrawlerService;
  }

  static getEnhancedKnowledgeRetrievalService(): EnhancedKnowledgeRetrievalService {
    if (!this.enhancedKnowledgeRetrievalService) {
      const knowledgeItemRepository = this.getKnowledgeItemRepository();
      const embeddingService = this.getEmbeddingService();
      const vectorManagementService = this.getVectorManagementService();
      this.enhancedKnowledgeRetrievalService = new EnhancedKnowledgeRetrievalService(
        knowledgeItemRepository,
        embeddingService,
        vectorManagementService
      );
    }
    return this.enhancedKnowledgeRetrievalService;
  }

  static getVectorManagementService(): VectorManagementService {
    if (!this.vectorManagementService) {
      const vectorRepository = this.getVectorRepository();
      const embeddingService = this.getEmbeddingService();
      this.vectorManagementService = new VectorManagementService(
        vectorRepository,
        embeddingService
      );
    }
    return this.vectorManagementService;
  }

  static getWebsiteKnowledgeApplicationService(): WebsiteKnowledgeApplicationService {
    if (!this.websiteKnowledgeApplicationService) {
      const websiteCrawlerService = this.getWebsiteCrawlerService();
      const vectorManagementService = this.getVectorManagementService();
      this.websiteKnowledgeApplicationService = new WebsiteKnowledgeApplicationService(
        websiteCrawlerService,
        vectorManagementService
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
    // Reset vector-related singletons
    this.vectorRepository = null;
    this.embeddingService = null;
    this.openAIProvider = null;
    this.websiteCrawlerService = null;
    this.enhancedKnowledgeRetrievalService = null;
    this.vectorManagementService = null;
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
} 