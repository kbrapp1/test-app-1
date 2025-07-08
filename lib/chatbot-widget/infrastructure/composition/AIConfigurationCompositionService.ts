import { SimplePromptService } from '../../domain/services/ai-configuration/SimplePromptService';
import { ConversationAnalysisService } from '../../domain/services/ai-configuration/ConversationAnalysisService';
import { PersonaGenerationService } from '../../domain/services/ai-configuration/PersonaGenerationService';
import { KnowledgeBaseService } from '../../domain/services/ai-configuration/KnowledgeBaseService';
import { BusinessGuidanceService } from '../../domain/services/ai-configuration/BusinessGuidanceService';
import { AdaptiveContextService } from '../../domain/services/ai-configuration/AdaptiveContextService';

/** AI Configuration Composition Service */
export class AIConfigurationCompositionService {
  // AI configuration service singletons
  private static simplePromptService: SimplePromptService | null = null;
  private static conversationAnalysisService: ConversationAnalysisService | null = null;
  private static personaGenerationService: PersonaGenerationService | null = null;
  private static knowledgeBaseService: KnowledgeBaseService | null = null;
  private static businessGuidanceService: BusinessGuidanceService | null = null;
  private static adaptiveContextService: AdaptiveContextService | null = null;

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

  // Get simple prompt service with core dependencies (high performance)
  static getSimplePromptService(): SimplePromptService {
    if (!this.simplePromptService) {
      this.simplePromptService = this.createSimplePromptService();
    }
    return this.simplePromptService;
  }

  // Create simple prompt service with core dependencies (high performance)
  private static createSimplePromptService(): SimplePromptService {
    const personaGenerationService = this.getPersonaGenerationService();
    const knowledgeBaseService = this.getKnowledgeBaseService();
    const businessGuidanceService = this.getBusinessGuidanceService();
    const adaptiveContextService = this.getAdaptiveContextService();
    
    return new SimplePromptService(
      personaGenerationService,
      knowledgeBaseService,
      businessGuidanceService,
      adaptiveContextService
    );
  }

  // Reset all AI configuration services for testing
  static reset(): void {
    this.simplePromptService = null;
    this.conversationAnalysisService = null;
    this.personaGenerationService = null;
    this.knowledgeBaseService = null;
    this.businessGuidanceService = null;
    this.adaptiveContextService = null;
  }
} 