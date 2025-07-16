/**
 * ProcessChatMessageResult DTO
 * 
 * AI INSTRUCTIONS:
 * - Immutable result structure for message processing responses
 * - Use builder pattern for complex result construction
 * - Include all necessary data for presentation layer
 * - Provide type-safe field validation
 * - Never expose domain entities directly - use DTOs
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ConversationMetrics } from '../services/conversation-management/ConversationMetricsService';

export interface ProcessChatMessageResult {
  readonly chatSession: ChatSession;
  readonly userMessage: ChatMessage;
  readonly botResponse: ChatMessage;
  readonly shouldCaptureLeadInfo: boolean;
  readonly suggestedNextActions: readonly string[];
  readonly conversationMetrics: ConversationMetrics;
  readonly intentAnalysis?: {
    readonly intent: string;
    readonly confidence: number;
    readonly entities: Record<string, unknown>;
    readonly category: string;
  };
  readonly journeyState?: {
    readonly stage: string;
    readonly confidence: number;
    readonly isSalesReady: boolean;
    readonly recommendedActions: readonly string[];
  };
  readonly relevantKnowledge?: ReadonlyArray<{
    readonly title: string;
    readonly content: string;
    readonly relevanceScore: number;
  }>;
  readonly callToAction?: {
    readonly type: string;
    readonly message: string;
    readonly priority: string;
  };
}

export class ProcessChatMessageResultBuilder {
  /**
   * AI INSTRUCTIONS:
   * - Builder pattern for constructing complex result objects
   * - Validate required fields before building
   * - Ensure immutable result structure
   * - Provide fluent interface for easy construction
   */
  
  private result: {
    chatSession?: ChatSession;
    userMessage?: ChatMessage;
    botResponse?: ChatMessage;
    shouldCaptureLeadInfo?: boolean;
    suggestedNextActions?: readonly string[];
    conversationMetrics?: ConversationMetrics;
    intentAnalysis?: ProcessChatMessageResult['intentAnalysis'];
    journeyState?: ProcessChatMessageResult['journeyState'];
    relevantKnowledge?: ProcessChatMessageResult['relevantKnowledge'];
    callToAction?: ProcessChatMessageResult['callToAction'];
  } = {};
  
  withChatSession(session: ChatSession): this {
    this.result.chatSession = session;
    return this;
  }
  
  withUserMessage(message: ChatMessage): this {
    this.result.userMessage = message;
    return this;
  }
  
  withBotResponse(message: ChatMessage): this {
    this.result.botResponse = message;
    return this;
  }
  
  withLeadCapture(shouldCapture: boolean): this {
    this.result.shouldCaptureLeadInfo = shouldCapture;
    return this;
  }
  
  withSuggestedActions(actions: string[]): this {
    this.result.suggestedNextActions = Object.freeze([...actions]); // AI: Immutable array
    return this;
  }
  
  withConversationMetrics(metrics: ConversationMetrics): this {
    this.result.conversationMetrics = metrics;
    return this;
  }
  
  withIntentAnalysis(analysis: ProcessChatMessageResult['intentAnalysis']): this {
    this.result.intentAnalysis = analysis;
    return this;
  }
  
  withJourneyState(state: ProcessChatMessageResult['journeyState']): this {
    this.result.journeyState = state;
    return this;
  }
  
  withRelevantKnowledge(knowledge: ProcessChatMessageResult['relevantKnowledge']): this {
    this.result.relevantKnowledge = knowledge;
    return this;
  }
  
  withCallToAction(cta: ProcessChatMessageResult['callToAction']): this {
    this.result.callToAction = cta;
    return this;
  }
  
  build(): ProcessChatMessageResult {
    // AI: Validate required fields
    if (!this.result.chatSession) {
      throw new Error('Chat session is required');
    }
    if (!this.result.userMessage) {
      throw new Error('User message is required');
    }
    if (!this.result.botResponse) {
      throw new Error('Bot response is required');
    }
    if (this.result.shouldCaptureLeadInfo === undefined) {
      throw new Error('Lead capture flag is required');
    }
    if (!this.result.suggestedNextActions) {
      throw new Error('Suggested next actions are required');
    }
    if (!this.result.conversationMetrics) {
      throw new Error('Conversation metrics are required');
    }
    
    return Object.freeze(this.result as ProcessChatMessageResult); // AI: Immutable result
  }
} 