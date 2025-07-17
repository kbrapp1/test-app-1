/**
 * Conversation Enhanced Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Enhance basic context analysis with intent classification and knowledge retrieval
 * - This service triggers the vector embeddings pipeline through knowledge retrieval
 * - Follow @golden-rule.mdc patterns exactly
 * - Keep under 200-250 lines
 * - Delegate to specialized services, no business logic here
 * - PERFORMANCE: Coordinate async operations efficiently
 */

import { ContextAnalysis } from '../../value-objects/message-processing/ContextAnalysis';
import { ChatMessage } from '../../entities/ChatMessage';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatSession } from '../../entities/ChatSession';
// Removed UserJourneyState import - using pure API-driven approach
import { IntentResult } from '../../value-objects/message-processing/IntentResult';
import { IIntentClassificationService } from '../interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService, KnowledgeRetrievalContext } from '../interfaces/IKnowledgeRetrievalService';

export class ConversationEnhancedAnalysisService {
  constructor(
    private intentClassificationService?: IIntentClassificationService,
    private knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {}

  // Enhance base analysis with intent classification and knowledge retrieval
  async enhanceAnalysis(
    baseAnalysis: ContextAnalysis,
    messages: ChatMessage[],
    chatbotConfig?: ChatbotConfig,
    session?: ChatSession,
    sharedLogFile?: string
  ): Promise<ContextAnalysis> {
    // Safety check: Filter out any non-ChatMessage objects
    const validMessages = messages.filter(m => m && typeof m.isFromUser === 'function');
    const userMessages = validMessages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return baseAnalysis;
    }

    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // PERFORMANCE OPTIMIZATION: Only run knowledge retrieval 
    // Intent classification is redundant - main API call already handles it
    const startTime = Date.now();
    
    const [relevantKnowledge] = await Promise.allSettled([
      // Only Step 1: Retrieve relevant knowledge if service is available
      // AI: This step triggers the vector embeddings pipeline
      this.knowledgeRetrievalService
        ? this.retrieveRelevantKnowledge(lastUserMessage, userMessages, undefined, sharedLogFile)
        : Promise.resolve(undefined)
    ]);

    const processingTime = Date.now() - startTime;
    // AI: Removed console.log - use proper logging service in production
    
    // Extract results from Promise.allSettled
    const knowledgeValue = relevantKnowledge.status === 'fulfilled' ? relevantKnowledge.value : undefined;

    // Create enhanced analysis with knowledge data only
    // Intent classification will be handled by the main API call
    return {
      ...baseAnalysis,
      intentResult: undefined, // No intent classification during pre-processing
      relevantKnowledge: knowledgeValue,
      knowledgeRetrievalThreshold: 0.15 // Pass the threshold used for knowledge retrieval
    };
  }

  // Retrieve relevant knowledge based on user query and intent
  private async retrieveRelevantKnowledge(
    message: ChatMessage,
    userMessages: ChatMessage[],
    intentResult?: IntentResult,
    sharedLogFile?: string
  ): Promise<Array<{ id: string; title: string; content: string; relevanceScore: number; }> | undefined> {
    if (!this.knowledgeRetrievalService) {
      return undefined;
    }

    try {
      const knowledgeContext: KnowledgeRetrievalContext = {
        userQuery: message.content,
        intentResult,
        conversationHistory: userMessages.slice(-3).map(m => m.content),
        maxResults: 5, // ✅ BEST PRACTICE: 5-10 results for better coverage
        minRelevanceScore: 0.15, // Slightly lower for initial retrieval
        sharedLogFile
      };

      // AI INSTRUCTIONS: This call triggers the complete vector embeddings pipeline:
      // 1. SimpleKnowledgeRetrievalService.searchKnowledge()
      // 2. Lazy initialization of OpenAI embeddings 
      // 3. Vector similarity search with comprehensive logging
      // 4. Knowledge relevance scoring and ranking
      const knowledgeResult = await this.knowledgeRetrievalService.searchKnowledge(knowledgeContext);
      
      return knowledgeResult.items.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        relevanceScore: item.relevanceScore
      }));
    } catch (error) {
      // Knowledge retrieval failed - continuing without knowledge
      return undefined;
    }
  }

  // Removed updateJourneyState method - using pure API-driven approach
  // Journey state tracking removed per user requirements
} 