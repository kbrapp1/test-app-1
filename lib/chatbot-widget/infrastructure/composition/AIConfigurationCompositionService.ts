import { DynamicPromptService } from '../../domain/services/ai-configuration/DynamicPromptService';
import { ConversationAnalysisService } from '../../domain/services/ai-configuration/ConversationAnalysisService';
import { PersonaGenerationService } from '../../domain/services/ai-configuration/PersonaGenerationService';
import { KnowledgeBaseService } from '../../domain/services/ai-configuration/KnowledgeBaseService';
import { BusinessGuidanceService } from '../../domain/services/ai-configuration/BusinessGuidanceService';
import { AdaptiveContextService } from '../../domain/services/ai-configuration/AdaptiveContextService';

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

  /**
   * Get conversation analysis service singleton
   */
  static getConversationAnalysisService(): ConversationAnalysisService {
    if (!this.conversationAnalysisService) {
      this.conversationAnalysisService = new ConversationAnalysisService();
    }
    return this.conversationAnalysisService;
  }

  /**
   * Get persona generation service singleton
   */
  static getPersonaGenerationService(): PersonaGenerationService {
    if (!this.personaGenerationService) {
      this.personaGenerationService = new PersonaGenerationService();
    }
    return this.personaGenerationService;
  }

  /**
   * Get knowledge base service singleton
   */
  static getKnowledgeBaseService(): KnowledgeBaseService {
    if (!this.knowledgeBaseService) {
      this.knowledgeBaseService = new KnowledgeBaseService();
    }
    return this.knowledgeBaseService;
  }

  /**
   * Get business guidance service singleton
   */
  static getBusinessGuidanceService(): BusinessGuidanceService {
    if (!this.businessGuidanceService) {
      this.businessGuidanceService = new BusinessGuidanceService();
    }
    return this.businessGuidanceService;
  }

  /**
   * Get adaptive context service singleton
   */
  static getAdaptiveContextService(): AdaptiveContextService {
    if (!this.adaptiveContextService) {
      this.adaptiveContextService = new AdaptiveContextService();
    }
    return this.adaptiveContextService;
  }

  /**
   * Get dynamic prompt service with all dependencies wired
   */
  static getDynamicPromptService(): DynamicPromptService {
    if (!this.dynamicPromptService) {
      this.dynamicPromptService = this.createDynamicPromptService();
    }
    return this.dynamicPromptService;
  }

  /**
   * Create dynamic prompt service with proper dependency injection
   */
  private static createDynamicPromptService(): DynamicPromptService {
    const conversationAnalysisService = this.getConversationAnalysisService();
    const personaGenerationService = this.getPersonaGenerationService();
    const knowledgeBaseService = this.getKnowledgeBaseService();
    const businessGuidanceService = this.getBusinessGuidanceService();
    const adaptiveContextService = this.getAdaptiveContextService();
    
    return new DynamicPromptService(
      conversationAnalysisService,
      personaGenerationService,
      knowledgeBaseService,
      businessGuidanceService,
      adaptiveContextService
    );
  }

  /**
   * Reset all AI configuration services for testing
   */
  static reset(): void {
    this.dynamicPromptService = null;
    this.conversationAnalysisService = null;
    this.personaGenerationService = null;
    this.knowledgeBaseService = null;
    this.businessGuidanceService = null;
    this.adaptiveContextService = null;
  }
} 