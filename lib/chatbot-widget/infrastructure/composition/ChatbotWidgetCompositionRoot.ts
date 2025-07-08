import { SupabaseClient } from '@supabase/supabase-js';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';

// Domain service interfaces
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';
import { IChatbotLoggingService } from '../../domain/services/interfaces/IChatbotLoggingService';

// Application services
import { LeadManagementService } from '../../application/services/lead-management/LeadManagementService';
import { WebsiteKnowledgeApplicationService } from '../../application/services/WebsiteKnowledgeApplicationService';
import { VectorKnowledgeApplicationService } from '../../application/services/VectorKnowledgeApplicationService';
import { ErrorTrackingFacade } from '../../application/services/ErrorTrackingFacade';

// Application use cases
import { ProcessChatMessageUseCase } from '../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../application/use-cases/CaptureLeadUseCase';
import { ConfigureChatbotUseCase } from '../../application/use-cases/ConfigureChatbotUseCase';
import { CrawlAndStoreWebsiteUseCase } from '../../application/use-cases/CrawlAndStoreWebsiteUseCase';
import { DeduplicateWebsiteContentUseCase } from '../../application/use-cases/DeduplicateWebsiteContentUseCase';

// Infrastructure providers
import { OpenAIProvider } from '../providers/openai/OpenAIProvider';
import { OpenAIEmbeddingService } from '../providers/openai/services/OpenAIEmbeddingService';

// Domain services
import { UrlNormalizationService } from '../../domain/services/UrlNormalizationService';
import { ContentDeduplicationService } from '../../domain/services/ContentDeduplicationService';
import { ErrorCategorizationDomainService } from '../../domain/services/ErrorCategorizationDomainService';
import { SimplePromptService } from '../../domain/services/ai-configuration/SimplePromptService';
import { ConversationAnalysisService } from '../../domain/services/ai-configuration/ConversationAnalysisService';
import { PersonaGenerationService } from '../../domain/services/ai-configuration/PersonaGenerationService';
import { KnowledgeBaseService } from '../../domain/services/ai-configuration/KnowledgeBaseService';
import { BusinessGuidanceService } from '../../domain/services/ai-configuration/BusinessGuidanceService';
import { AdaptiveContextService } from '../../domain/services/ai-configuration/AdaptiveContextService';

// Specialized composition services
import { RepositoryCompositionService } from './RepositoryCompositionService';
import { DomainServiceCompositionService } from './DomainServiceCompositionService';
import { ApplicationServiceCompositionService } from './ApplicationServiceCompositionService';
import { UseCaseCompositionService } from './UseCaseCompositionService';
import { AIConfigurationCompositionService } from './AIConfigurationCompositionService';
import { InfrastructureCompositionService } from './InfrastructureCompositionService';
import { ErrorTrackingCompositionService } from './ErrorTrackingCompositionService';
import { AppStartupService } from '../startup/AppStartupService';

/**
 * AI Instructions: Main Composition Root for Chatbot Widget Domain
 * - Central orchestration point for all chatbot widget dependencies
 * - Delegates to specialized composition services following DDD patterns
 * - Maintains clean separation between infrastructure and domain layers
 * - Provides unified interface for dependency access and testing support
 */
export class ChatbotWidgetCompositionRoot {
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

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

  static processAIFlowDecision(decision: any, currentState: any) {
    return DomainServiceCompositionService.processAIFlowDecision(decision, currentState);
  }

  static shouldTriggerLeadCapture(decision: any) {
    return DomainServiceCompositionService.shouldTriggerLeadCapture(decision);
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

  // Use cases
  
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase {
    return UseCaseCompositionService.getConfigureChatbotUseCase();
  }

  static async getProcessChatMessageUseCase(): Promise<ProcessChatMessageUseCase> {
    // Ensure cache warming and critical services are initialized
    await this.ensureInitialized();
    return UseCaseCompositionService.getProcessChatMessageUseCase();
  }

  // Pre-initialize critical services to avoid cold start delays
  private static async preInitializeServices(): Promise<void> {
    // Pre-cache the most expensive dynamic imports
    await Promise.all([
      // Pre-load tiktoken
      import('tiktoken').catch(() => {}),
      // Pre-load ConversationContextOrchestrator  
      import('../../domain/services/conversation/ConversationContextOrchestrator').catch(() => {}),
      // Pre-load logging service
      import('../providers/logging/ChatbotFileLoggingService').catch(() => {})
    ]);
  }

  static getCaptureLeadUseCase(): CaptureLeadUseCase {
    return UseCaseCompositionService.getCaptureLeadUseCase();
  }

  // Knowledge base services
  
  static getKnowledgeBaseFormApplicationService() {
    return ApplicationServiceCompositionService.getKnowledgeBaseFormApplicationService();
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

  // Configuration and testing
  
  static configureWithSupabaseClient(client: SupabaseClient): void {
    RepositoryCompositionService.configureWithSupabaseClient(client);
  }

  static resetForTesting(): void {
    RepositoryCompositionService.reset();
    DomainServiceCompositionService.clearCache();
    ApplicationServiceCompositionService.reset();
    UseCaseCompositionService.reset();
    AIConfigurationCompositionService.reset();
    InfrastructureCompositionService.reset();
    ErrorTrackingCompositionService.reset();
    
    // Reset initialization flag to allow fresh pre-initialization
    this.isInitialized = false;
  }

  // Health checks and monitoring

  static async healthCheck() {
    return DomainServiceCompositionService.healthCheck();
  }

  static getServiceStatistics() {
    return DomainServiceCompositionService.getServiceStatistics();
  }

  static getCacheStatistics() {
    return DomainServiceCompositionService.getCacheStatistics();
  }

  static async warmKnowledgeCache(
    chatbotConfigs: Array<{ id: string; organizationId: string; lastUpdated?: Date }>
  ) {
    const vectorRepository = this.getVectorKnowledgeRepository();
    const embeddingService = this.getEmbeddingService();
    return DomainServiceCompositionService.warmKnowledgeCache(
      chatbotConfigs, 
      vectorRepository, 
      embeddingService
    );
  }

  /**
   * Ensure application startup and cache warming
   * AI: Call this before any chatbot operations to ensure cache is ready
   */
  private static async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform lazy initialization for serverless environment
   * AI: Trigger cache warming and wait for completion to ensure cache is ready
   */
  private static async performInitialization(): Promise<void> {
    try {
      // Pre-initialize critical services first to avoid cold starts
      await this.preInitializeServices();
      
      // Wait for cache warming to complete before proceeding
      // AI: This ensures the cache is ready before any user requests
      await AppStartupService.initialize();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Composition root initialization failed:', error);
      // Don't throw - allow app to continue even if cache warming fails
      this.isInitialized = true;
    }
  }
} 