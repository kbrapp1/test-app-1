// Application services
import { LeadManagementService } from '../../application/services/LeadManagementService';
import { AiConversationService } from '../../application/services/AiConversationService';

// Application mappers
import { LeadMapper } from '../../application/mappers/LeadMapper';

// Infrastructure services
import { OpenAIProvider, OpenAIConfig } from '../providers/openai/OpenAIProvider';
import { IAIConversationService } from '../../domain/services/IAIConversationService';

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
      const conversationContextService = await DomainServiceCompositionService.getConversationContextService();

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
        RepositoryCompositionService.getLeadRepository(),
        RepositoryCompositionService.getChatSessionRepository(),
        RepositoryCompositionService.getChatMessageRepository(),
        DomainServiceCompositionService.getLeadScoringService(),
        new LeadMapper() // Create new instance since it's a static class
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
    this.aiConversationService = null;
  }
} 