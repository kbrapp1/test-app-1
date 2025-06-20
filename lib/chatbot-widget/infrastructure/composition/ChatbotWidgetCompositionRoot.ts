import { SupabaseClient } from '@supabase/supabase-js';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

// Domain service interfaces
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';

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
 * 
 * AI INSTRUCTIONS:
 * - Following @golden-rule.mdc DDD composition root patterns
 * - Removed deprecated services (replaced by OpenAI API)
 * - Clean separation of concerns with focused composition services
 * - Single responsibility for high-level coordination
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