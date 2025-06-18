/**
 * System Prompt Builder Service
 * 
 * Application service for building enhanced system prompts with context.
 * Single responsibility: Handle system prompt construction with intent and knowledge context.
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { IAIConversationService } from '../../../domain/services/interfaces/IAIConversationService';

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
    title: string;
    content: string;
    relevanceScore: number;
  }>;
  entityContextPrompt?: string;
}

export class SystemPromptBuilderService {
  constructor(
    private readonly aiConversationService: IAIConversationService
  ) {}

  /**
   * Build enhanced system prompt with knowledge context (removed preliminary intent)
   */
  buildEnhancedSystemPrompt(
    config: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[],
    enhancedContext: EnhancedContext
  ): string {
    // Start with base system prompt
    let systemPrompt = this.aiConversationService.buildSystemPrompt(config, session, messageHistory);

    // Removed preliminary intent context - let OpenAI handle intent classification
    // No longer adding: CURRENT USER INTENT, INTENT CATEGORY, etc.

    // Add journey state context if available (journey is based on conversation state, not preliminary intent)
    if (enhancedContext.journeyState) {
      const journey = enhancedContext.journeyState;
      systemPrompt += `\n\nUSER JOURNEY STAGE: ${journey.stage} (confidence: ${journey.confidence.toFixed(2)})`;
      
      if (journey.isSalesReady()) {
        systemPrompt += `\nNOTE: User is sales-ready. Focus on closing and next steps.`;
      }

      const recommendedActions = journey.getRecommendedActions();
      if (recommendedActions.length > 0) {
        systemPrompt += `\nRECOMMENDED ACTIONS: ${recommendedActions.join(', ')}`;
      }
    }

    // Add accumulated entity context if available
    if (enhancedContext.entityContextPrompt) {
      systemPrompt += `\n\n${enhancedContext.entityContextPrompt}`;
      systemPrompt += `\nUse this accumulated entity information to provide contextual responses. `;
      systemPrompt += `Reference specific entities mentioned previously in the conversation.`;
    }

    // Add relevant knowledge context if available
    if (enhancedContext.relevantKnowledge && enhancedContext.relevantKnowledge.length > 0) {
      systemPrompt += `\n\nRELEVANT KNOWLEDGE:`;
      enhancedContext.relevantKnowledge.forEach((knowledge, index) => {
        systemPrompt += `\n${index + 1}. ${knowledge.title} (relevance: ${knowledge.relevanceScore.toFixed(2)})`;
        systemPrompt += `\n   ${knowledge.content.substring(0, 200)}${knowledge.content.length > 200 ? '...' : ''}`;
      });
      systemPrompt += `\n\nUse this knowledge to provide accurate, helpful responses. Reference specific information when relevant.`;
    }

    return systemPrompt;
  }
} 