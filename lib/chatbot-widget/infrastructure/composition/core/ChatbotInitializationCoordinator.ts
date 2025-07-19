// Domain types for conversation flow
import { AIConversationFlowDecision, ConversationFlowState } from '../../../domain/services/conversation-management/ConversationFlowService';

// Application use cases
import { ProcessChatMessageUseCase } from '../../../application/use-cases/ProcessChatMessageUseCase';

// Specialized composition services
import { DomainServiceCompositionService } from '../DomainServiceCompositionService';
import { UseCaseCompositionService } from '../UseCaseCompositionService';
import { AppStartupService } from '../../startup/AppStartupService';
import { ChatbotServiceAccessCoordinator } from './ChatbotServiceAccessCoordinator';

/**
 * Initialization Coordinator for Chatbot Widget Domain
 * - Handles application startup and critical service initialization
 * - Manages cache warming and performance optimization
 * - Provides health checks and monitoring capabilities
 * - Ensures proper initialization order for serverless environments
 */
export class ChatbotInitializationCoordinator {
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

  // Conversation flow processing
  
  static processAIFlowDecision(decision: AIConversationFlowDecision, currentState: ConversationFlowState) {
    return DomainServiceCompositionService.processAIFlowDecision(decision, currentState);
  }

  static shouldTriggerLeadCapture(decision: AIConversationFlowDecision) {
    return DomainServiceCompositionService.shouldTriggerLeadCapture(decision);
  }

  // Critical use case with initialization requirement
  
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
      import('../../../domain/services/conversation/ConversationContextOrchestrator').catch(() => {}),
      // Pre-load logging service
      import('../../providers/logging/ChatbotFileLoggingService').catch(() => {})
    ]);
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
    const vectorRepository = ChatbotServiceAccessCoordinator.getVectorKnowledgeRepository();
    const embeddingService = ChatbotServiceAccessCoordinator.getEmbeddingService();
    return DomainServiceCompositionService.warmKnowledgeCache(
      chatbotConfigs, 
      vectorRepository, 
      embeddingService
    );
  }

  /**
   * Ensure application startup and cache warming
   * Call this before any chatbot operations to ensure cache is ready
   */
  static async ensureInitialized(): Promise<void> {
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
   * Trigger cache warming and wait for completion to ensure cache is ready
   */
  private static async performInitialization(): Promise<void> {
    try {
      // Pre-initialize critical services first to avoid cold starts
      await this.preInitializeServices();
      
      // Wait for cache warming to complete before proceeding
      // This ensures the cache is ready before any user requests
      await AppStartupService.initialize();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Composition root initialization failed:', error);
      // Don't throw - allow app to continue even if cache warming fails
      this.isInitialized = true;
    }
  }

  /**
   * Reset initialization state for testing environments
   */
  static resetInitialization(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}