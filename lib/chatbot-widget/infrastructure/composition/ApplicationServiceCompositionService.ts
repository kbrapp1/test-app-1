// Application services
import { LeadManagementService } from '../../application/services/lead-management/LeadManagementService';
import { LeadCaptureService } from '../../application/services/lead-management/LeadCaptureService';
import { LeadLifecycleService } from '../../application/services/lead-management/LeadLifecycleService';
import { LeadQueryService } from '../../application/services/lead-management/LeadQueryService';
import { AiConversationService } from '../../application/services/conversation-management/AiConversationService';
import { KnowledgeBaseFormApplicationService } from '../../application/services/KnowledgeBaseFormApplicationService';

// Application mappers
import { LeadMapper } from '../../application/mappers/LeadMapper';

// Infrastructure services
import { OpenAIProvider, OpenAIConfig } from '../providers/openai/OpenAIProvider';
import { IAIConversationService } from '../../domain/services/interfaces/IAIConversationService';

// Composition services
import { RepositoryCompositionService } from './RepositoryCompositionService';
import { DomainServiceCompositionService } from './DomainServiceCompositionService';
import { InfrastructureCompositionService } from './InfrastructureCompositionService';
import { AIConfigurationCompositionService } from './AIConfigurationCompositionService';

/**
 * Application Service Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure composition service for application layer service orchestration
 * - Manages application service singletons with proper dependency injection
 * - Coordinates OpenAI provider, lead management, and AI conversation services
 * - Handles service lifecycle, connection management, and health checks
 * - Follows DDD composition root patterns with clean dependency boundaries
 * - Provides reset capabilities for testing and service lifecycle management
 */
export class ApplicationServiceCompositionService {
  // Infrastructure singletons
  private static openAIProvider: OpenAIProvider | null = null;

  // Application service singletons
  private static leadManagementService: LeadManagementService | null = null;
  private static leadCaptureService: LeadCaptureService | null = null;
  private static leadLifecycleService: LeadLifecycleService | null = null;
  private static leadQueryService: LeadQueryService | null = null;
  private static aiConversationService: AiConversationService | null = null;
  private static knowledgeBaseFormApplicationService: KnowledgeBaseFormApplicationService | null = null;

  /** Get OpenAI Provider - manages singleton with connection lifecycle */
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

      this.openAIProvider = new OpenAIProvider(config, DomainServiceCompositionService.getDebugInformationService());
      await this.openAIProvider.connect();
      
      // Verify connection
      const isHealthy = await this.openAIProvider.healthCheck();
      if (!isHealthy) {
        // OpenAI provider health check failed, but continuing...
      }
    }

    return this.openAIProvider;
  }

  /** Get AI Conversation Service - orchestrates with OpenAI, prompts, and knowledge retrieval */
  static async getAiConversationService(): Promise<AiConversationService> {
    if (!this.aiConversationService) {
      const openAIProvider = await this.getOpenAIProvider();
      const simplePromptService = AIConfigurationCompositionService.getSimplePromptService();
      const intentService = await DomainServiceCompositionService.getIntentClassificationService();
      // AI INSTRUCTIONS: Following @golden-rule dependency injection patterns
      // Create a default knowledge retrieval service for AI conversation service
      const knowledgeRetrievalService = DomainServiceCompositionService.getKnowledgeRetrievalService(
        { id: 'default', organizationId: 'default' },
        InfrastructureCompositionService.getVectorKnowledgeRepository(),
        InfrastructureCompositionService.getEmbeddingService()
      );
      // ConversationSentimentService removed - using OpenAI API for sentiment analysis
      const leadExtractionService = DomainServiceCompositionService.getLeadExtractionService();

      this.aiConversationService = new AiConversationService(
        openAIProvider,
        simplePromptService,
        intentService,
        knowledgeRetrievalService, // Default service for AI conversation
        leadExtractionService
      );
    }
    return this.aiConversationService as AiConversationService;
  }

  /** Get Lead Capture Service */
  static getLeadCaptureService(): LeadCaptureService {
    if (!this.leadCaptureService) {
      this.leadCaptureService = new LeadCaptureService(
        RepositoryCompositionService.getLeadRepository(),
        RepositoryCompositionService.getChatSessionRepository(),
        new LeadMapper()
      );
    }
    return this.leadCaptureService;
  }

  /** Get Lead Lifecycle Service */
  static getLeadLifecycleService(): LeadLifecycleService {
    if (!this.leadLifecycleService) {
      this.leadLifecycleService = new LeadLifecycleService(
        RepositoryCompositionService.getLeadRepository()
      );
    }
    return this.leadLifecycleService;
  }

  /** Get Lead Query Service */
  static getLeadQueryService(): LeadQueryService {
    if (!this.leadQueryService) {
      this.leadQueryService = new LeadQueryService(
        RepositoryCompositionService.getLeadRepository(),
        new LeadMapper()
      );
    }
    return this.leadQueryService;
  }

  /** Get Lead Management Service */
  static getLeadManagementService(): LeadManagementService {
    if (!this.leadManagementService) {
      this.leadManagementService = new LeadManagementService(
        this.getLeadCaptureService(),
        this.getLeadLifecycleService(),
        this.getLeadQueryService()
      );
    }
    return this.leadManagementService;
  }

  /** Get AI Conversation Service as interface */
  static async getAiConversationServiceInterface(): Promise<IAIConversationService> {
    return await this.getAiConversationService() as IAIConversationService;
  }

  /** Get Knowledge Base Form Application Service */
  static getKnowledgeBaseFormApplicationService(): KnowledgeBaseFormApplicationService {
    if (!this.knowledgeBaseFormApplicationService) {
      const knowledgeFormService = DomainServiceCompositionService.getKnowledgeBaseFormService();
      const configRepository = RepositoryCompositionService.getChatbotConfigRepository();
      const vectorRepository = InfrastructureCompositionService.getVectorKnowledgeRepository();
      
      this.knowledgeBaseFormApplicationService = new KnowledgeBaseFormApplicationService(
        knowledgeFormService,
        configRepository,
        vectorRepository
      );
    }
    return this.knowledgeBaseFormApplicationService;
  }

  /** Reset all application service singletons */
  static reset(): void {
    this.openAIProvider = null;
    this.leadManagementService = null;
    this.leadCaptureService = null;
    this.leadLifecycleService = null;
    this.leadQueryService = null;
    this.aiConversationService = null;
    this.knowledgeBaseFormApplicationService = null;
  }
} 