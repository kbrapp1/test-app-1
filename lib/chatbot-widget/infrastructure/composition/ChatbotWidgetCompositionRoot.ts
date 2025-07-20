import { SupabaseClient } from '@supabase/supabase-js';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { IVectorKnowledgeQueryRepository } from '../../domain/repositories/IVectorKnowledgeQueryRepository';
import { IVectorKnowledgeCommandRepository } from '../../domain/repositories/IVectorKnowledgeCommandRepository';
import { IVectorKnowledgeAnalyticsRepository } from '../../domain/repositories/IVectorKnowledgeAnalyticsRepository';

// Domain service interfaces
import { IChatbotLoggingService } from '../../domain/services/interfaces/IChatbotLoggingService';

// Domain types for conversation flow
import { AIConversationFlowDecision, ConversationFlowState } from '../../domain/services/conversation-management/ConversationFlowService';

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

// Specialized coordination services
import { ChatbotServiceAccessCoordinator } from './core/ChatbotServiceAccessCoordinator';
import { ChatbotInitializationCoordinator } from './core/ChatbotInitializationCoordinator';
import { ChatbotTestingCoordinator } from './core/ChatbotTestingCoordinator';

// Main Composition Root for Chatbot Widget Domain
// Delegates to specialized coordinators following DDD patterns
export class ChatbotWidgetCompositionRoot {
  // Repository access delegates to service coordinator
  
  static getChatbotConfigRepository(): IChatbotConfigRepository {
    return ChatbotServiceAccessCoordinator.getChatbotConfigRepository();
  }

  static getChatSessionRepository(): IChatSessionRepository {
    return ChatbotServiceAccessCoordinator.getChatSessionRepository();
  }

  static getChatMessageRepository(): IChatMessageRepository {
    return ChatbotServiceAccessCoordinator.getChatMessageRepository();
  }

  static getLeadRepository(): ILeadRepository {
    return ChatbotServiceAccessCoordinator.getLeadRepository();
  }

  static getVectorKnowledgeRepository(): IVectorKnowledgeRepository {
    return ChatbotServiceAccessCoordinator.getVectorKnowledgeRepository();
  }

  // CQRS Vector Knowledge Repositories for advanced usage
  static getVectorKnowledgeQueryRepository(): IVectorKnowledgeQueryRepository {
    return ChatbotServiceAccessCoordinator.getVectorKnowledgeQueryRepository();
  }

  static getVectorKnowledgeCommandRepository(): IVectorKnowledgeCommandRepository {
    return ChatbotServiceAccessCoordinator.getVectorKnowledgeCommandRepository();
  }

  static getVectorKnowledgeAnalyticsRepository(): IVectorKnowledgeAnalyticsRepository {
    return ChatbotServiceAccessCoordinator.getVectorKnowledgeAnalyticsRepository();
  }

  // Infrastructure services - delegate to service access coordinator
  
  static getOpenAIProvider(): OpenAIProvider {
    return ChatbotServiceAccessCoordinator.getOpenAIProvider();
  }

  static getEmbeddingService(): OpenAIEmbeddingService {
    return ChatbotServiceAccessCoordinator.getEmbeddingService();
  }

  static getCrawlAndStoreWebsiteUseCase(): CrawlAndStoreWebsiteUseCase {
    return ChatbotServiceAccessCoordinator.getCrawlAndStoreWebsiteUseCase();
  }

  static getVectorKnowledgeApplicationService(): VectorKnowledgeApplicationService {
    return ChatbotServiceAccessCoordinator.getVectorKnowledgeApplicationService();
  }

  static getWebsiteKnowledgeApplicationService(): WebsiteKnowledgeApplicationService {
    return ChatbotServiceAccessCoordinator.getWebsiteKnowledgeApplicationService();
  }

  static getUrlNormalizationService(): UrlNormalizationService {
    return ChatbotServiceAccessCoordinator.getUrlNormalizationService();
  }

  static getContentDeduplicationService(): ContentDeduplicationService {
    return ChatbotServiceAccessCoordinator.getContentDeduplicationService();
  }

  static getDeduplicateWebsiteContentUseCase(): DeduplicateWebsiteContentUseCase {
    return ChatbotServiceAccessCoordinator.getDeduplicateWebsiteContentUseCase();
  }

  static getLoggingService(): IChatbotLoggingService {
    return ChatbotServiceAccessCoordinator.getLoggingService();
  }

  // Domain services - delegate to service access coordinator
  
  static getSessionContextService() {
    return ChatbotServiceAccessCoordinator.getSessionContextService();
  }

  static getSessionStateService() {
    return ChatbotServiceAccessCoordinator.getSessionStateService();
  }

  static getContextWindowService() {
    return ChatbotServiceAccessCoordinator.getContextWindowService();
  }

  static getChatSessionValidationService() {
    return ChatbotServiceAccessCoordinator.getChatSessionValidationService();
  }

  static getSessionLeadQualificationService() {
    return ChatbotServiceAccessCoordinator.getSessionLeadQualificationService();
  }

  static getEntityAccumulationService() {
    return ChatbotServiceAccessCoordinator.getEntityAccumulationService();
  }

  static getDebugInformationService() {
    return ChatbotServiceAccessCoordinator.getDebugInformationService();
  }

  static getKnowledgeRetrievalService(
    chatbotConfig: { id: string; organizationId: string; lastUpdated?: Date }
  ) {
    return ChatbotServiceAccessCoordinator.getKnowledgeRetrievalService(chatbotConfig);
  }

  static getTokenCountingService() {
    return ChatbotServiceAccessCoordinator.getTokenCountingService();
  }

  static async getIntentClassificationService() {
    return ChatbotServiceAccessCoordinator.getIntentClassificationService();
  }

  static getLeadExtractionService() {
    return ChatbotServiceAccessCoordinator.getLeadExtractionService();
  }

  static getKnowledgeBaseFormService() {
    return ChatbotServiceAccessCoordinator.getKnowledgeBaseFormService();
  }

  // Application services - delegate to service access coordinator
  
  static getLeadManagementService(): LeadManagementService {
    return ChatbotServiceAccessCoordinator.getLeadManagementService();
  }

  static getKnowledgeBaseFormApplicationService() {
    return ChatbotServiceAccessCoordinator.getKnowledgeBaseFormApplicationService();
  }

  // Use cases - delegate to service access coordinator
  
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase {
    return ChatbotServiceAccessCoordinator.getConfigureChatbotUseCase();
  }

  static getCaptureLeadUseCase(): CaptureLeadUseCase {
    return ChatbotServiceAccessCoordinator.getCaptureLeadUseCase();
  }

  // Error tracking - delegate to service access coordinator
  
  static getErrorCategorizationService(): ErrorCategorizationDomainService {
    return ChatbotServiceAccessCoordinator.getErrorCategorizationService();
  }

  static getErrorTrackingFacade(): ErrorTrackingFacade {
    return ChatbotServiceAccessCoordinator.getErrorTrackingFacade();
  }

  // AI configuration - delegate to service access coordinator
  
  static getConversationAnalysisService(): ConversationAnalysisService {
    return ChatbotServiceAccessCoordinator.getConversationAnalysisService();
  }

  static getPersonaGenerationService(): PersonaGenerationService {
    return ChatbotServiceAccessCoordinator.getPersonaGenerationService();
  }

  static getKnowledgeBaseService(): KnowledgeBaseService {
    return ChatbotServiceAccessCoordinator.getKnowledgeBaseService();
  }

  static getBusinessGuidanceService(): BusinessGuidanceService {
    return ChatbotServiceAccessCoordinator.getBusinessGuidanceService();
  }

  static getAdaptiveContextService(): AdaptiveContextService {
    return ChatbotServiceAccessCoordinator.getAdaptiveContextService();
  }

  static getSimplePromptService(): SimplePromptService {
    return ChatbotServiceAccessCoordinator.getSimplePromptService();
  }

  // Initialization and flow processing - delegate to initialization coordinator
  
  static processAIFlowDecision(decision: AIConversationFlowDecision, currentState: ConversationFlowState) {
    return ChatbotInitializationCoordinator.processAIFlowDecision(decision, currentState);
  }

  static shouldTriggerLeadCapture(decision: AIConversationFlowDecision) {
    return ChatbotInitializationCoordinator.shouldTriggerLeadCapture(decision);
  }

  static async getProcessChatMessageUseCase(): Promise<ProcessChatMessageUseCase> {
    return ChatbotInitializationCoordinator.getProcessChatMessageUseCase();
  }

  // Health checks and monitoring - delegate to initialization coordinator

  static async healthCheck() {
    return ChatbotInitializationCoordinator.healthCheck();
  }

  static getServiceStatistics() {
    return ChatbotInitializationCoordinator.getServiceStatistics();
  }

  static getCacheStatistics() {
    return ChatbotInitializationCoordinator.getCacheStatistics();
  }

  static async warmKnowledgeCache(
    chatbotConfigs: Array<{ id: string; organizationId: string; lastUpdated?: Date }>
  ) {
    return ChatbotInitializationCoordinator.warmKnowledgeCache(chatbotConfigs);
  }

  // Configuration and testing - delegate to testing coordinator
  
  static configureWithSupabaseClient(client: SupabaseClient): void {
    ChatbotTestingCoordinator.configureWithSupabaseClient(client);
  }

  static resetForTesting(): void {
    ChatbotTestingCoordinator.resetForTesting();
  }
} 