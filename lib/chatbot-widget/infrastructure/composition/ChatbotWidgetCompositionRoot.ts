import { SupabaseClient } from '@supabase/supabase-js';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

  // Domain service interfaces
import { IKnowledgeRetrievalService } from '../../domain/services/IKnowledgeRetrievalService';
import { IIntentClassificationService } from '../../domain/services/IIntentClassificationService';
import { IDebugInformationService } from '../../domain/services/IDebugInformationService';

// Application services
import { LeadManagementService } from '../../application/services/LeadManagementService';

// Application use cases
import { ConfigureChatbotUseCase } from '../../application/use-cases/ConfigureChatbotUseCase';
import { ProcessChatMessageUseCase } from '../../application/use-cases/ProcessChatMessageUseCase';
import { CaptureLeadUseCase } from '../../application/use-cases/CaptureLeadUseCase';

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