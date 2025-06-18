import { SupabaseClient } from '@supabase/supabase-js';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

  // Domain service interfaces
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';

// Application services
import { LeadManagementService } from '../../application/services/lead-management/LeadManagementService';

// Application use cases
import { ProcessChatMessageUseCase } from '../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../application/use-cases/CaptureLeadUseCase';
import { ConfigureChatbotUseCase } from '../../application/use-cases/ConfigureChatbotUseCase';

// Composition services
import { RepositoryCompositionService } from './RepositoryCompositionService';
import { DomainServiceCompositionService } from './DomainServiceCompositionService';
import { ApplicationServiceCompositionService } from './ApplicationServiceCompositionService';
import { UseCaseCompositionService } from './UseCaseCompositionService';

/**
 * Composition Root for Chatbot Widget Domain
 * Orchestrates focused composition services following DDD principles
 * Following @golden-rule.mdc: Single responsibility for high-level coordination
 */
export class ChatbotWidgetCompositionRoot {

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

  // Domain service access methods
  static async getIntentClassificationService(chatbotConfig?: any): Promise<IIntentClassificationService> {
    return DomainServiceCompositionService.getIntentClassificationService(chatbotConfig);
  }

  static getKnowledgeRetrievalService(chatbotConfig: any): IKnowledgeRetrievalService {
    return DomainServiceCompositionService.getKnowledgeRetrievalService(chatbotConfig);
  }

  static getDebugInformationService(): IDebugInformationService {
    return DomainServiceCompositionService.getDebugInformationService();
  }

  // New focused domain service access methods
  static getConversationIntentService() {
    return DomainServiceCompositionService.getConversationIntentService();
  }

  static getConversationSentimentService() {
    return DomainServiceCompositionService.getConversationSentimentService();
  }

  static getLeadExtractionService() {
    return DomainServiceCompositionService.getLeadExtractionService();
  }

  // Message processing services (new refactored structure)
  static getMessageAnalysisOrchestrator() {
    return DomainServiceCompositionService.getMessageAnalysisOrchestrator();
  }

  static getMessageContentAnalysisService() {
    return DomainServiceCompositionService.getMessageContentAnalysisService();
  }

  static getMessageSentimentAnalysisService() {
    return DomainServiceCompositionService.getMessageSentimentAnalysisService();
  }

  // Conversation context services (new refactored structure)
  static async getConversationContextOrchestrator(): Promise<any> {
    return DomainServiceCompositionService.getConversationContextOrchestrator();
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

  static reset(): void {
    RepositoryCompositionService.reset();
    DomainServiceCompositionService.reset();
    ApplicationServiceCompositionService.reset();
    UseCaseCompositionService.reset();
  }
} 