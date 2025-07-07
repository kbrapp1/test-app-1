/**
 * AI Conversation Service Interface
 * 
 * Domain service interface for AI-powered conversation capabilities.
 * Following DDD principles: Domain layer defines contracts that
 * infrastructure layer implements.
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';

export interface ConversationContext {
  chatbotConfig: ChatbotConfig;
  session: ChatSession;
  messageHistory: ChatMessage[];
  systemPrompt: string;
  conversationSummary?: string;
  sharedLogFile?: string;
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
    messageHistory: ChatMessage[],
    logger?: { logRaw: (message: string) => void; logMessage: (message: string) => void }
  ): string;

  /**
   * Analyze sentiment of user message
   */
  analyzeSentiment(userMessage: string): Promise<'positive' | 'neutral' | 'negative'>;

  /**
   * Analyze urgency of user message
   */
  analyzeUrgency(userMessage: string, organizationId?: string): Promise<'low' | 'medium' | 'high'>;

  /**
   * Analyze engagement level of user message
   */
  analyzeEngagement(userMessage: string, conversationHistory?: ChatMessage[], organizationId?: string): Promise<'low' | 'medium' | 'high'>;

  /**
   * Extract lead information from conversation
   */
  extractLeadInformation(
    messageHistory: ChatMessage[],
    context: ConversationContext
  ): Promise<Partial<LeadCaptureRequest>>;
} 