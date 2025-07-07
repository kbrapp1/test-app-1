// Specialized composition services
import { InfrastructureServiceCompositionService } from './core/InfrastructureServiceCompositionService';
import { KnowledgeServiceCompositionService } from './core/KnowledgeServiceCompositionService';
import { CoreDomainServiceCompositionService } from './core/CoreDomainServiceCompositionService';
import { ConversationFlowCompositionService } from './core/ConversationFlowCompositionService';

// Domain types
import { AIConversationFlowDecision } from '../../domain/services/conversation-management/ConversationFlowService';

/**
 * Domain Service Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Clean, forward-only implementation following @golden-rule patterns
 * - No backward compatibility - break existing code that doesn't follow patterns
 * - Delegates to specialized composition services under 250 lines each
 * - Single responsibility: Orchestrate domain service access through delegation
 * - Force consumers to use proper dependency injection patterns
 * - Never exceed 250 lines - keep focused on delegation only
 */
export class DomainServiceCompositionService {

  // ===== INFRASTRUCTURE SERVICES =====
  
  static getTokenCountingService() {
    return InfrastructureServiceCompositionService.getTokenCountingService();
  }

  static async getIntentClassificationService() {
    return InfrastructureServiceCompositionService.getIntentClassificationService();
  }

  static getDebugInformationService() {
    return InfrastructureServiceCompositionService.getDebugInformationService();
  }

  // ===== KNOWLEDGE SERVICES =====
  
  static getKnowledgeRetrievalService(
    chatbotConfig: { id: string; organizationId: string; lastUpdated?: Date }, 
    vectorRepository: any, 
    embeddingService: any
  ) {
    return KnowledgeServiceCompositionService.getKnowledgeRetrievalService(
      chatbotConfig, 
      vectorRepository, 
      embeddingService
    );
  }

  static clearKnowledgeCache(chatbotConfigId?: string) {
    return KnowledgeServiceCompositionService.clearKnowledgeCache(chatbotConfigId);
  }

  static async warmKnowledgeCache(
    chatbotConfigs: Array<{ id: string; organizationId: string; lastUpdated?: Date }>, 
    vectorRepository: any, 
    embeddingService: any
  ) {
    return KnowledgeServiceCompositionService.warmKnowledgeCache(
      chatbotConfigs, 
      vectorRepository, 
      embeddingService
    );
  }

  static getCacheStatistics() {
    return KnowledgeServiceCompositionService.getCacheStatistics();
  }

  // ===== CORE DOMAIN SERVICES =====

  static getSessionContextService() {
    return CoreDomainServiceCompositionService.getSessionContextService();
  }

  static getSessionStateService() {
    return CoreDomainServiceCompositionService.getSessionStateService();
  }

  static getContextWindowService() {
    return CoreDomainServiceCompositionService.getContextWindowService();
  }

  static getLeadExtractionService() {
    return CoreDomainServiceCompositionService.getLeadExtractionService();
  }

  static getKnowledgeBaseFormService() {
    return CoreDomainServiceCompositionService.getKnowledgeBaseFormService();
  }

  static getChatSessionValidationService() {
    return CoreDomainServiceCompositionService.getChatSessionValidationService();
  }

  static getSessionLeadQualificationService() {
    return CoreDomainServiceCompositionService.getSessionLeadQualificationService();
  }

  static getEntityAccumulationService() {
    return CoreDomainServiceCompositionService.getEntityAccumulationService();
  }

  // ===== CONTENT PROCESSING SERVICES =====

  static getUserContentSanitizationService() {
    return CoreDomainServiceCompositionService.getUserContentSanitizationService();
  }

  static getContentValidationService() {
    return CoreDomainServiceCompositionService.getContentValidationService();
  }

  static getContentLengthValidationService() {
    return CoreDomainServiceCompositionService.getContentLengthValidationService();
  }

  static getContentTypeValidationService() {
    return CoreDomainServiceCompositionService.getContentTypeValidationService();
  }

  // ===== CONVERSATION FLOW SERVICES =====

  static processAIFlowDecision(decision: AIConversationFlowDecision, currentState: any) {
    return ConversationFlowCompositionService.processAIFlowDecision(decision, currentState);
  }

  static shouldTriggerLeadCapture(decision: AIConversationFlowDecision) {
    return ConversationFlowCompositionService.shouldTriggerLeadCapture(decision);
  }

  static getNextBestAction(decision: AIConversationFlowDecision) {
    return ConversationFlowCompositionService.getNextBestAction(decision);
  }

  static calculateReadinessScore(flowDecision: AIConversationFlowDecision) {
    return ConversationFlowCompositionService.calculateReadinessScore(flowDecision);
  }

  static getReadinessIndicators(flowDecision: AIConversationFlowDecision) {
    return ConversationFlowCompositionService.getReadinessIndicators(flowDecision);
  }

  static validateFlowDecision(decision: any) {
    return ConversationFlowCompositionService.validateFlowDecision(decision);
  }

  static batchProcessFlowDecisions(decisions: AIConversationFlowDecision[], currentStates: any[]) {
    return ConversationFlowCompositionService.batchProcessFlowDecisions(decisions, currentStates);
  }

  // ===== CACHE MANAGEMENT =====

  static clearCache(): void {
    InfrastructureServiceCompositionService.clearCache();
    KnowledgeServiceCompositionService.clearCache();
    CoreDomainServiceCompositionService.clearCache();
  }

  // ===== HEALTH CHECKS =====

  static async healthCheck() {
    const [infrastructure, knowledge, domain, flow] = await Promise.all([
      InfrastructureServiceCompositionService.healthCheck(),
      Promise.resolve({ knowledgeCache: KnowledgeServiceCompositionService.getCacheStatistics() }),
      CoreDomainServiceCompositionService.healthCheck(),
      ConversationFlowCompositionService.healthCheck()
    ]);

    return {
      infrastructure,
      knowledge,
      domain,
      flow,
      overall: infrastructure.overall && domain.overall && flow.overall
    };
  }

  // ===== SERVICE STATISTICS =====

  static getServiceStatistics() {
    return {
      infrastructure: InfrastructureServiceCompositionService.getServiceStatistics(),
      domain: CoreDomainServiceCompositionService.getServiceStatistics(),
      knowledge: KnowledgeServiceCompositionService.getCacheStatistics()
    };
  }
}