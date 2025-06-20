// Application services
import { LeadManagementService } from '../../application/services/lead-management/LeadManagementService';
import { LeadCaptureService } from '../../application/services/lead-management/LeadCaptureService';
import { LeadLifecycleService } from '../../application/services/lead-management/LeadLifecycleService';
import { LeadQueryService } from '../../application/services/lead-management/LeadQueryService';
import { AiConversationService } from '../../application/services/conversation-management/AiConversationService';

// Application mappers
import { LeadMapper } from '../../application/mappers/LeadMapper';

// Infrastructure services
import { OpenAIProvider, OpenAIConfig } from '../providers/openai/OpenAIProvider';
import { IAIConversationService } from '../../domain/services/interfaces/IAIConversationService';

// Composition services
import { RepositoryCompositionService } from './RepositoryCompositionService';
import { DomainServiceCompositionService } from './DomainServiceCompositionService';

/**
 * Application Service Composition Service
 * Infrastructure Service: Manages application service creation and lifecycle
 * Following DDD principles: Single responsibility for application service management
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

  /**
   * Get AI Conversation Service
   */
  static async getAiConversationService(): Promise<AiConversationService> {
    if (!this.aiConversationService) {
      const openAIProvider = await this.getOpenAIProvider();
      const dynamicPromptService = DomainServiceCompositionService.getDynamicPromptService();
      const intentService = await DomainServiceCompositionService.getIntentClassificationService();
      const knowledgeRetrievalService = DomainServiceCompositionService.getKnowledgeRetrievalService({});
      // ConversationSentimentService removed - using OpenAI API for sentiment analysis
      const leadExtractionService = DomainServiceCompositionService.getLeadExtractionService();

      this.aiConversationService = new AiConversationService(
        openAIProvider,
        dynamicPromptService,
        intentService,
        knowledgeRetrievalService,
        leadExtractionService
      );
    }
    return this.aiConversationService as AiConversationService;
  }

  /**
   * Get Lead Capture Service
   */
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

  /**
   * Get Lead Lifecycle Service
   */
  static getLeadLifecycleService(): LeadLifecycleService {
    if (!this.leadLifecycleService) {
      this.leadLifecycleService = new LeadLifecycleService(
        RepositoryCompositionService.getLeadRepository()
      );
    }
    return this.leadLifecycleService;
  }

  /**
   * Get Lead Query Service
   */
  static getLeadQueryService(): LeadQueryService {
    if (!this.leadQueryService) {
      this.leadQueryService = new LeadQueryService(
        RepositoryCompositionService.getLeadRepository(),
        new LeadMapper()
      );
    }
    return this.leadQueryService;
  }

  /**
   * Get Lead Management Service (Application Service)
   */
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

  /**
   * Get AI Conversation Service as interface
   */
  static async getAiConversationServiceInterface(): Promise<IAIConversationService> {
    return await this.getAiConversationService() as IAIConversationService;
  }

  /**
   * Reset all application service singletons
   */
  static reset(): void {
    this.openAIProvider = null;
    this.leadManagementService = null;
    this.leadCaptureService = null;
    this.leadLifecycleService = null;
    this.leadQueryService = null;
    this.aiConversationService = null;
  }
} 