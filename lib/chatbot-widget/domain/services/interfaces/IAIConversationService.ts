/**
 * AI Conversation Service Interface
 * 
 * Domain service interface for AI-powered conversation capabilities.
 * Following DDD principles: Domain layer defines contracts that
 * infrastructure layer implements.
 */

import { ChatMessage } from '../entities/ChatMessage';
import { ChatSession } from '../entities/ChatSession';
import { ChatbotConfig } from '../entities/ChatbotConfig';

export interface ConversationContext {
  chatbotConfig: ChatbotConfig;
  session: ChatSession;
  messageHistory: ChatMessage[];
  systemPrompt: string;
  conversationSummary?: string;
}

export interface AIResponse {
  content: string;
  confidence: number;
  intentDetected?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  processingTimeMs: number;
  metadata: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    errorCode?: string;
    errorMessage?: string;
  };
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface LeadCaptureRequest {
  sessionId: string;
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  qualificationData: Record<string, any>;
}

export interface IAIConversationService {
  /**
   * Generate AI response to user message
   */
  generateResponse(
    userMessage: string,
    context: ConversationContext
  ): Promise<AIResponse>;

  /**
   * Generate system prompt from chatbot configuration and context
   */
  buildSystemPrompt(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[]
  ): string;

  /**
   * Detect if user message should trigger lead capture
   */
  shouldTriggerLeadCapture(
    userMessage: string,
    context: ConversationContext
  ): Promise<boolean>;

  /**
   * Extract lead information from conversation
   */
  extractLeadInformation(
    messageHistory: ChatMessage[],
    context: ConversationContext
  ): Promise<Partial<LeadCaptureRequest>>;

  /**
   * Determine conversation intent
   */
  detectIntent(
    userMessage: string,
    context: ConversationContext
  ): Promise<string>;

  /**
   * Analyze conversation sentiment
   */
  analyzeSentiment(userMessage: string): Promise<'positive' | 'neutral' | 'negative'>;
} 