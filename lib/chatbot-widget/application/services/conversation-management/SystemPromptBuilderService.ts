/**
 * System Prompt Builder Service
 * 
 * Application service for building enhanced system prompts with context.
 * Single responsibility: Handle system prompt construction with intent and knowledge context.
 * LOGGING: Comprehensive knowledge base integration pipeline logging
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { IAIConversationService } from '../../../domain/services/interfaces/IAIConversationService';
import { IChatbotLoggingService, ISessionLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { DynamicPromptService } from '../../../domain/services/ai-configuration/DynamicPromptService';

export interface EnhancedContext {
  intentResult?: {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    getCategory(): string;
    isSalesIntent(): boolean;
    isSupportIntent(): boolean;
  };
  journeyState?: {
    stage: string;
    confidence: number;
    isSalesReady(): boolean;
    getRecommendedActions(): string[];
  };
  relevantKnowledge?: Array<{
    id: string;
    title: string;
    content: string;
    relevanceScore: number;
  }>;
  entityContextPrompt?: string;
  sharedLogFile?: string;
  knowledgeRetrievalThreshold?: number;
}

export class SystemPromptBuilderService {
  private readonly loggingService: IChatbotLoggingService;

  constructor(
    private readonly aiConversationService: IAIConversationService,
    private readonly dynamicPromptService: DynamicPromptService
  ) {
    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }



  /**
   * Build enhanced system prompt with knowledge context (removed preliminary intent)
   */
  buildEnhancedSystemPrompt(
    config: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[],
    enhancedContext: EnhancedContext
  ): string {
    // Create session logger with context - shared log file is required
    if (!enhancedContext.sharedLogFile) {
      throw new Error('SharedLogFile is required for system prompt building - all logging must be conversation-specific');
    }
    const logger = this.loggingService.createSessionLogger(
      session.id,
      enhancedContext.sharedLogFile,
      {
        sessionId: session.id,
        operation: 'system-prompt-building'
      }
    );
    
    logger.logRaw('📝 =====================================');
    logger.logRaw('📝 SYSTEM PROMPT BUILDER - KNOWLEDGE INTEGRATION');
    logger.logRaw('📝 =====================================');
    
    // Start with base system prompt
    const basePromptStart = Date.now();
    let systemPrompt = this.aiConversationService.buildSystemPrompt(config, session, messageHistory, logger) || '';
    const basePromptDuration = Date.now() - basePromptStart;
    
    logger.logMessage(`Base system prompt generated in ${basePromptDuration}ms`);
    logger.logMessage(`Base prompt length: ${systemPrompt?.length || 0} characters`);

    // Removed preliminary intent context - let OpenAI handle intent classification
    // No longer adding: CURRENT USER INTENT, INTENT CATEGORY, etc.

    // Add journey state context if available (journey is based on conversation state, not preliminary intent)
    if (enhancedContext.journeyState) {
      logger.logHeader('🗺️  JOURNEY STATE INTEGRATION:');
      const journey = enhancedContext.journeyState;
      systemPrompt += `\n\nUSER JOURNEY STAGE: ${journey.stage} (confidence: ${journey.confidence.toFixed(2)})`;
      
      logger.logMessage(`Journey stage: ${journey.stage}`);
      logger.logMessage(`Journey confidence: ${journey.confidence.toFixed(2)}`);
      
      if (journey.isSalesReady()) {
        systemPrompt += `\nNOTE: User is sales-ready. Focus on closing and next steps.`;
        logger.logMessage('User is sales-ready - enabling closing focus');
      }

      const recommendedActions = journey.getRecommendedActions();
      if (recommendedActions.length > 0) {
        systemPrompt += `\nRECOMMENDED ACTIONS: ${recommendedActions.join(', ')}`;
        logger.logMessage(`Recommended actions: ${recommendedActions.join(', ')}`);
      }
    } else {
      logger.logMessage('🗺️  No journey state available');
    }

    // Add accumulated entity context if available
    if (enhancedContext.entityContextPrompt) {
      logger.logHeader('🏷️  ENTITY CONTEXT INTEGRATION:');
      const entityPromptLength = enhancedContext.entityContextPrompt.length;
      systemPrompt += `\n\n${enhancedContext.entityContextPrompt}`;
      systemPrompt += `\nUse this accumulated entity information to provide contextual responses. `;
      systemPrompt += `Reference specific entities mentioned previously in the conversation.`;
      
      logger.logMessage(`Entity context injected: ${entityPromptLength} characters`);
      logger.logMessage('Entity-aware responses enabled');
    } else {
      logger.logMessage('🏷️  No entity context available');
    }

    // Add relevant knowledge context if available
    if (enhancedContext.relevantKnowledge && enhancedContext.relevantKnowledge.length > 0) {
      logger.logHeader('🧠 SEMANTIC KNOWLEDGE INTEGRATION:');
      logger.logMessage(`Retrieved knowledge items: ${enhancedContext.relevantKnowledge.length}`);
      
      const threshold = enhancedContext.knowledgeRetrievalThreshold ?? 0.15;
      logger.logMessage(`Minimum relevance score required: ${threshold} (threshold for injection)`);
      
      // Log knowledge details for debugging
      let totalKnowledgeCharacters = 0;
      enhancedContext.relevantKnowledge.forEach((knowledge, index) => {
        totalKnowledgeCharacters += knowledge.content.length;
        
        logger.logMessage(`${index + 1}. "${knowledge.title}"`);
        logger.logMessage(`    Database ID: ${knowledge.id}`);
        logger.logMessage(`    Relevance score: ${knowledge.relevanceScore.toFixed(3)}`);
        logger.logMessage(`    Content length: ${knowledge.content.length} chars`);
        logger.logMessage(`    Preview: ${knowledge.content.substring(0, 100)}...`);
      });
      
      logger.logMessage('📊 KNOWLEDGE INTEGRATION SUMMARY:');
      logger.logMessage(`Total knowledge items: ${enhancedContext.relevantKnowledge.length}`);
      logger.logMessage(`Total knowledge content: ${totalKnowledgeCharacters} characters`);
      logger.logMessage(`Average relevance score: ${(enhancedContext.relevantKnowledge.reduce((sum, item) => sum + item.relevanceScore, 0) / enhancedContext.relevantKnowledge.length).toFixed(3)}`);
      
      // Use DynamicPromptService coordination to integrate knowledge with deduplication
      logger.logMessage('🔧 Coordinating system prompt with knowledge integration...');
      systemPrompt = this.dynamicPromptService.coordinateFinalSystemPrompt(
        systemPrompt,
        enhancedContext.relevantKnowledge,
        logger
      );
      
      logger.logMessage('✅ Semantic knowledge successfully integrated and coordinated');
    } else {
      logger.logMessage('🧠 KNOWLEDGE INTEGRATION: No relevant knowledge found');
      logger.logMessage('Proceeding with base system prompt only');
    }

    const finalPromptLength = systemPrompt.length;
    logger.logMessage('📊 FINAL SYSTEM PROMPT STATS:');
    logger.logMessage(`Total prompt length: ${finalPromptLength} characters`);
    logger.logMessage(`Estimated tokens: ~${Math.ceil(finalPromptLength / 4)}`);
    logger.logMessage(`Knowledge integration: ${enhancedContext.relevantKnowledge?.length || 0} items`);
    logger.logMessage(`Entity context: ${enhancedContext.entityContextPrompt ? 'YES' : 'NO'}`);
    logger.logMessage(`Journey context: ${enhancedContext.journeyState ? 'YES' : 'NO'}`);
    
    // Log the complete system prompt in human-readable format
    logger.logRaw('📜 =====================================');
    logger.logRaw('📜 COMPLETE SYSTEM PROMPT (HUMAN READABLE)');
    logger.logRaw('📜 =====================================');
    
    // Split the prompt into readable sections and log each line
    const promptLines = systemPrompt.split('\n');
    promptLines.forEach((line) => {
      // Log all lines to preserve knowledge item spacing
      logger.logRaw(line);
    });
    
    logger.logRaw('📜 ===== END OF SYSTEM PROMPT =====');
    logger.logMessage('✅ SYSTEM PROMPT BUILDING COMPLETED');
    logger.logRaw('📝 =====================================');

    return systemPrompt;
  }
} 