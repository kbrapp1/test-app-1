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
import { DynamicPromptService } from '../../domain/services/ai-configuration/DynamicPromptService';
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

/**
 * Main Composition Root for Chatbot Widget Domain
 * 
 * AI INSTRUCTIONS:
 * - Central orchestration point for all chatbot widget dependencies
 * - Delegates to specialized composition services following DDD patterns
 * - Maintains clean separation between infrastructure and domain layers
 * - Provides unified interface for dependency access
 * - Supports testing through configurable client injection
 * - Keep under 250 lines by delegating to specialized services
 */
export class ChatbotWidgetCompositionRoot {

  // ===== REPOSITORY ACCESS METHODS =====
  
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

  // ===== INFRASTRUCTURE SERVICE ACCESS METHODS =====
  
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

  // ===== DOMAIN SERVICE ACCESS METHODS =====
  
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

  static getKnowledgeRetrievalService(chatbotConfig?: any) {
    return DomainServiceCompositionService.getKnowledgeRetrievalService(chatbotConfig);
  }

  static processAIFlowDecision(decision: any, currentState: any) {
    return DomainServiceCompositionService.processAIFlowDecision(decision, currentState);
  }

  static shouldTriggerLeadCapture(decision: any) {
    return DomainServiceCompositionService.shouldTriggerLeadCapture(decision);
  }

  // ===== APPLICATION SERVICE ACCESS METHODS =====
  
  static getLeadManagementService(): LeadManagementService {
    return ApplicationServiceCompositionService.getLeadManagementService();
  }

  // ===== USE CASE ACCESS METHODS =====
  
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase {
    return UseCaseCompositionService.getConfigureChatbotUseCase();
  }

  static async getProcessChatMessageUseCase(): Promise<ProcessChatMessageUseCase> {
    return UseCaseCompositionService.getProcessChatMessageUseCase();
  }

  static getCaptureLeadUseCase(): CaptureLeadUseCase {
    return UseCaseCompositionService.getCaptureLeadUseCase();
  }

  // ===== ERROR TRACKING SERVICE ACCESS METHODS =====
  
  static getErrorCategorizationService(): ErrorCategorizationDomainService {
    return ErrorTrackingCompositionService.getErrorCategorizationService();
  }

  static getErrorTrackingFacade(): ErrorTrackingFacade {
    return ErrorTrackingCompositionService.getErrorTrackingFacade();
  }

  // ===== AI CONFIGURATION SERVICE ACCESS METHODS =====
  
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

  static getDynamicPromptService(): DynamicPromptService {
    return AIConfigurationCompositionService.getDynamicPromptService();
  }

  // ===== CONFIGURATION AND TESTING METHODS =====
  
  static configureWithSupabaseClient(client: SupabaseClient): void {
    RepositoryCompositionService.configureWithSupabaseClient(client);
  }

  static resetForTesting(): void {
    // Reset all specialized composition services
    RepositoryCompositionService.reset();
    DomainServiceCompositionService.clearCache();
    ApplicationServiceCompositionService.reset();
    UseCaseCompositionService.reset();
    AIConfigurationCompositionService.reset();
    InfrastructureCompositionService.reset();
    ErrorTrackingCompositionService.reset();
  }
} 