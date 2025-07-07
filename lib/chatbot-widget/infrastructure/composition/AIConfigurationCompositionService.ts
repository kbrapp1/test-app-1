import { DynamicPromptService } from '../../domain/services/ai-configuration/DynamicPromptService';
import { ConversationAnalysisService } from '../../domain/services/ai-configuration/ConversationAnalysisService';
import { PersonaGenerationService } from '../../domain/services/ai-configuration/PersonaGenerationService';
import { KnowledgeBaseService } from '../../domain/services/ai-configuration/KnowledgeBaseService';
import { BusinessGuidanceService } from '../../domain/services/ai-configuration/BusinessGuidanceService';
import { AdaptiveContextService } from '../../domain/services/ai-configuration/AdaptiveContextService';
import { PromptCoordinationService } from '../../domain/services/ai-configuration/PromptCoordinationService';
import { IdentityResolutionService } from '../../domain/services/ai-configuration/IdentityResolutionService';
import { ContentDeduplicationService } from '../../domain/services/ai-configuration/ContentDeduplicationService';
import { PromptTemplateEngine } from '../providers/templating/PromptTemplateEngine';

/**
 * AI Configuration Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Manage AI configuration service dependencies and wiring
 * - Maintain single responsibility for AI service composition
 * - Follow singleton pattern for consistent service instances
 * - Keep under 250 lines following @golden-rule patterns
 * - Delegate complex wiring to separate methods
 * - Support testing through reset functionality
 */
export class AIConfigurationCompositionService {
  // AI configuration service singletons
  private static dynamicPromptService: DynamicPromptService | null = null;
  private static conversationAnalysisService: ConversationAnalysisService | null = null;
  private static personaGenerationService: PersonaGenerationService | null = null;
  private static knowledgeBaseService: KnowledgeBaseService | null = null;
  private static businessGuidanceService: BusinessGuidanceService | null = null;
  private static adaptiveContextService: AdaptiveContextService | null = null;
  private static promptCoordinationService: PromptCoordinationService | null = null;
  private static identityResolutionService: IdentityResolutionService | null = null;
  private static contentDeduplicationService: ContentDeduplicationService | null = null;
  private static promptTemplateEngine: PromptTemplateEngine | null = null;

  // Get conversation analysis service singleton
  static getConversationAnalysisService(): ConversationAnalysisService {
    if (!this.conversationAnalysisService) {
      this.conversationAnalysisService = new ConversationAnalysisService();
    }
    return this.conversationAnalysisService;
  }

  // Get persona generation service singleton
  static getPersonaGenerationService(): PersonaGenerationService {
    if (!this.personaGenerationService) {
      this.personaGenerationService = new PersonaGenerationService();
    }
    return this.personaGenerationService;
  }

  // Get knowledge base service singleton
  static getKnowledgeBaseService(): KnowledgeBaseService {
    if (!this.knowledgeBaseService) {
      this.knowledgeBaseService = new KnowledgeBaseService();
    }
    return this.knowledgeBaseService;
  }

  // Get business guidance service singleton
  static getBusinessGuidanceService(): BusinessGuidanceService {
    if (!this.businessGuidanceService) {
      this.businessGuidanceService = new BusinessGuidanceService();
    }
    return this.businessGuidanceService;
  }

  // Get adaptive context service singleton
  static getAdaptiveContextService(): AdaptiveContextService {
    if (!this.adaptiveContextService) {
      this.adaptiveContextService = new AdaptiveContextService();
    }
    return this.adaptiveContextService;
  }

  // Get prompt coordination service singleton
  static getPromptCoordinationService(): PromptCoordinationService {
    if (!this.promptCoordinationService) {
      this.promptCoordinationService = new PromptCoordinationService();
    }
    return this.promptCoordinationService;
  }

  // Get identity resolution service singleton
  static getIdentityResolutionService(): IdentityResolutionService {
    if (!this.identityResolutionService) {
      this.identityResolutionService = new IdentityResolutionService();
    }
    return this.identityResolutionService;
  }

  // Get content deduplication service singleton
  static getContentDeduplicationService(): ContentDeduplicationService {
    if (!this.contentDeduplicationService) {
      this.contentDeduplicationService = new ContentDeduplicationService();
    }
    return this.contentDeduplicationService;
  }

  // Get prompt template engine singleton
  static getPromptTemplateEngine(): PromptTemplateEngine {
    if (!this.promptTemplateEngine) {
      this.promptTemplateEngine = new PromptTemplateEngine();
    }
    return this.promptTemplateEngine;
  }

  // Get dynamic prompt service with all dependencies wired
  static getDynamicPromptService(): DynamicPromptService {
    if (!this.dynamicPromptService) {
      this.dynamicPromptService = this.createDynamicPromptService();
    }
    return this.dynamicPromptService;
  }

  // Create dynamic prompt service with proper dependency injection
  private static createDynamicPromptService(): DynamicPromptService {
    const conversationAnalysisService = this.getConversationAnalysisService();
    const personaGenerationService = this.getPersonaGenerationService();
    const knowledgeBaseService = this.getKnowledgeBaseService();
    const businessGuidanceService = this.getBusinessGuidanceService();
    const adaptiveContextService = this.getAdaptiveContextService();
    const promptTemplateEngine = this.getPromptTemplateEngine();
    const promptCoordinationService = this.getPromptCoordinationService();
    const identityResolutionService = this.getIdentityResolutionService();
    const contentDeduplicationService = this.getContentDeduplicationService();
    
    return new DynamicPromptService(
      conversationAnalysisService,
      personaGenerationService,
      knowledgeBaseService,
      businessGuidanceService,
      adaptiveContextService,
      promptTemplateEngine,
      promptCoordinationService,
      identityResolutionService,
      contentDeduplicationService
    );
  }

  // Reset all AI configuration services for testing
  static reset(): void {
    this.dynamicPromptService = null;
    this.conversationAnalysisService = null;
    this.personaGenerationService = null;
    this.knowledgeBaseService = null;
    this.businessGuidanceService = null;
    this.adaptiveContextService = null;
    this.promptCoordinationService = null;
    this.identityResolutionService = null;
    this.contentDeduplicationService = null;
    this.promptTemplateEngine = null;
  }
} 