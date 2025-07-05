import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import { ConversationAnalysisService } from './ConversationAnalysisService';
import { PersonaGenerationService } from './PersonaGenerationService';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { BusinessGuidanceService } from './BusinessGuidanceService';
import { AdaptiveContextService } from './AdaptiveContextService';

/**
 * Dynamic Prompt Application Service - 2025 RAG-Optimized with Vector-First Architecture
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate domain services for prompt generation
 * - Maintain single responsibility for prompt coordination
 * - No business logic - delegate to domain services
 * - Follow @golden-rule patterns exactly
 * - Uses minimal base prompts + vector search for specific content
 * - Maintains business context even during casual conversation
 * - Implements conversation-aware context prediction
 * - Maintains 500-800 token target through RAG optimization (60% reduction)
 * - Vector search handles FAQs, product catalogs, and detailed content
 */
export class DynamicPromptService {
  
  constructor(
    private conversationAnalysisService: ConversationAnalysisService,
    private personaGenerationService: PersonaGenerationService,
    private knowledgeBaseService: KnowledgeBaseService,
    private businessGuidanceService: BusinessGuidanceService,
    private adaptiveContextService: AdaptiveContextService
  ) {}

  /**
   * Generate system prompt with 2025 semantic intent classification
   */
  generateSystemPrompt(
    chatbotConfig: ChatbotConfig, 
    session: ChatSession,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    leadScore?: number,
    qualificationStatus?: string,
    intentData?: any
  ): string {
    // Analyze conversation using extracted entities and intent (no re-processing)
    const analysis = this.conversationAnalysisService.analyzeConversationContext(
      session, 
      conversationHistory, 
      entityData,
      intentData,
      leadScore
    );

    // Core persona prompt (conversation-aware sizing)
    let prompt = this.personaGenerationService.generateContextAwarePersona(chatbotConfig, analysis);
    
    // Semantic context injection based on extracted intent
    prompt += this.injectSemanticContext(chatbotConfig, session, analysis, entityData);
    
    // Business guidance injection based on lead qualification
    prompt += this.businessGuidanceService.generateBusinessGuidance(analysis, leadScore);
    
    // Adaptive real-time context
    prompt += this.adaptiveContextService.generateAdaptiveContext(session, analysis, chatbotConfig);
    
    return prompt;
  }

  /**
   * Minimal knowledge base injection (2025 RAG best practice)
   */
  private injectSemanticContext(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    analysis: any,
    entityData?: any
  ): string {
    // Include minimal knowledge base - vector search handles specific content
    return this.knowledgeBaseService.buildMinimalKnowledgeBase(chatbotConfig.knowledgeBase);
  }
} 