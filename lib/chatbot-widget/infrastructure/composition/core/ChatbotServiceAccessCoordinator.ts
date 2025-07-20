// import { SupabaseClient } from '@supabase/supabase-js';

// Repository interfaces
import { IChatbotConfigRepository } from '../../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { IVectorKnowledgeRepository } from '../../../domain/repositories/IVectorKnowledgeRepository';

// Domain service interfaces
import { IChatbotLoggingService } from '../../../domain/services/interfaces/IChatbotLoggingService';

// Application services
import { LeadManagementService } from '../../../application/services/lead-management/LeadManagementService';
import { WebsiteKnowledgeApplicationService } from '../../../application/services/WebsiteKnowledgeApplicationService';
import { VectorKnowledgeApplicationService } from '../../../application/services/VectorKnowledgeApplicationService';
import { ErrorTrackingFacade } from '../../../application/services/ErrorTrackingFacade';

// Application use cases
// import { ProcessChatMessageUseCase } from '../../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../../application/use-cases/CaptureLeadUseCase';
import { ConfigureChatbotUseCase } from '../../../application/use-cases/ConfigureChatbotUseCase';
import { CrawlAndStoreWebsiteUseCase } from '../../../application/use-cases/CrawlAndStoreWebsiteUseCase';
import { DeduplicateWebsiteContentUseCase } from '../../../application/use-cases/DeduplicateWebsiteContentUseCase';

// Infrastructure providers
import { OpenAIProvider } from '../../providers/openai/OpenAIProvider';
import { OpenAIEmbeddingService } from '../../providers/openai/services/OpenAIEmbeddingService';

// Domain services
import { UrlNormalizationService } from '../../../domain/services/UrlNormalizationService';
import { ContentDeduplicationService } from '../../../domain/services/ContentDeduplicationService';
import { ErrorCategorizationDomainService } from '../../../domain/services/ErrorCategorizationDomainService';

// AI Configuration services
import { SimplePromptService } from '../../../domain/services/ai-configuration/SimplePromptService';
import { ConversationAnalysisService } from '../../../domain/services/ai-configuration/ConversationAnalysisService';
import { PersonaGenerationService } from '../../../domain/services/ai-configuration/PersonaGenerationService';
import { KnowledgeBaseService } from '../../../domain/services/ai-configuration/KnowledgeBaseService';
import { BusinessGuidanceService } from '../../../domain/services/ai-configuration/BusinessGuidanceService';
import { AdaptiveContextService } from '../../../domain/services/ai-configuration/AdaptiveContextService';

// Specialized composition services
import { RepositoryCompositionService } from '../RepositoryCompositionService';
import { DomainServiceCompositionService } from '../DomainServiceCompositionService';
import { ApplicationServiceCompositionService } from '../ApplicationServiceCompositionService';
import { UseCaseCompositionService } from '../UseCaseCompositionService';
import { AIConfigurationCompositionService } from '../AIConfigurationCompositionService';
import { InfrastructureCompositionService } from '../InfrastructureCompositionService';
import { ErrorTrackingCompositionService } from '../ErrorTrackingCompositionService';

/**
 * Service Access Coordinator for Chatbot Widget Domain
 * - Provides unified access to all domain services following DDD patterns
 * - Delegates to specialized composition services for clean separation
 * - Maintains consistent service access patterns across the domain
 */
export class ChatbotServiceAccessCoordinator {
  // Repository access
  
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
    return InfrastructureCompositionService.getVectorKnowledgeRepository();
  }

  // Infrastructure services
  
  static getOpenAIProvider(): OpenAIProvider {
    return InfrastructureCompositionService.getOpenAIProvider();
  }

  static getEmbeddingService(): OpenAIEmbeddingService {
    return InfrastructureCompositionService.getEmbeddingService();
  }

  static getCrawlAndStoreWebsiteUseCase(): CrawlAndStoreWebsiteUseCase {
    return InfrastructureCompositionService.getCrawlAndStoreWebsiteUseCase();
  }

  static getVectorKnowledgeApplicationService(): VectorKnowledgeApplicationService {
    return InfrastructureCompositionService.getVectorKnowledgeApplicationService();
  }

  static getWebsiteKnowledgeApplicationService(): WebsiteKnowledgeApplicationService {
    return InfrastructureCompositionService.getWebsiteKnowledgeApplicationService();
  }

  static getUrlNormalizationService(): UrlNormalizationService {
    return InfrastructureCompositionService.getUrlNormalizationService();
  }

  static getContentDeduplicationService(): ContentDeduplicationService {
    return InfrastructureCompositionService.getContentDeduplicationService();
  }

  static getDeduplicateWebsiteContentUseCase(): DeduplicateWebsiteContentUseCase {
    return InfrastructureCompositionService.getDeduplicateWebsiteContentUseCase();
  }

  static getLoggingService(): IChatbotLoggingService {
    return InfrastructureCompositionService.getLoggingService();
  }

  // Domain services
  
  static getSessionContextService() {
    return DomainServiceCompositionService.getSessionContextService();
  }

  static getSessionStateService() {
    return DomainServiceCompositionService.getSessionStateService();
  }

  static getContextWindowService() {
    return DomainServiceCompositionService.getContextWindowService();
  }

  static getChatSessionValidationService() {
    return DomainServiceCompositionService.getChatSessionValidationService();
  }

  static getSessionLeadQualificationService() {
    return DomainServiceCompositionService.getSessionLeadQualificationService();
  }

  static getEntityAccumulationService() {
    return DomainServiceCompositionService.getEntityAccumulationService();
  }

  static getDebugInformationService() {
    return DomainServiceCompositionService.getDebugInformationService();
  }

  static getKnowledgeRetrievalService(
    chatbotConfig: { id: string; organizationId: string; lastUpdated?: Date }
  ) {
    const vectorRepository = this.getVectorKnowledgeRepository();
    const embeddingService = this.getEmbeddingService();
    return DomainServiceCompositionService.getKnowledgeRetrievalService(
      chatbotConfig, 
      vectorRepository, 
      embeddingService
    );
  }

  static getTokenCountingService() {
    return DomainServiceCompositionService.getTokenCountingService();
  }

  static async getIntentClassificationService() {
    return DomainServiceCompositionService.getIntentClassificationService();
  }

  static getLeadExtractionService() {
    return DomainServiceCompositionService.getLeadExtractionService();
  }

  static getKnowledgeBaseFormService() {
    return DomainServiceCompositionService.getKnowledgeBaseFormService();
  }

  // Application services
  
  static getLeadManagementService(): LeadManagementService {
    return ApplicationServiceCompositionService.getLeadManagementService();
  }

  static getKnowledgeBaseFormApplicationService() {
    return ApplicationServiceCompositionService.getKnowledgeBaseFormApplicationService();
  }

  // Use cases
  
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase {
    return UseCaseCompositionService.getConfigureChatbotUseCase();
  }

  static getCaptureLeadUseCase(): CaptureLeadUseCase {
    return UseCaseCompositionService.getCaptureLeadUseCase();
  }

  // Error tracking
  
  static getErrorCategorizationService(): ErrorCategorizationDomainService {
    return ErrorTrackingCompositionService.getErrorCategorizationService();
  }

  static getErrorTrackingFacade(): ErrorTrackingFacade {
    return ErrorTrackingCompositionService.getErrorTrackingFacade();
  }

  // AI configuration
  
  static getConversationAnalysisService(): ConversationAnalysisService {
    return AIConfigurationCompositionService.getConversationAnalysisService();
  }

  static getPersonaGenerationService(): PersonaGenerationService {
    return AIConfigurationCompositionService.getPersonaGenerationService();
  }

  static getKnowledgeBaseService(): KnowledgeBaseService {
    return AIConfigurationCompositionService.getKnowledgeBaseService();
  }

  static getBusinessGuidanceService(): BusinessGuidanceService {
    return AIConfigurationCompositionService.getBusinessGuidanceService();
  }

  static getAdaptiveContextService(): AdaptiveContextService {
    return AIConfigurationCompositionService.getAdaptiveContextService();
  }

  static getSimplePromptService(): SimplePromptService {
    return AIConfigurationCompositionService.getSimplePromptService();
  }
}