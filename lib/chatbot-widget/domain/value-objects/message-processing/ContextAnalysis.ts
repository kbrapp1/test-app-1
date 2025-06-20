/**
 * Context Analysis Value Object
 * 
 * Domain value object representing conversation context analysis results.
 * Single responsibility: Encapsulate context analysis data and behavior.
 * 
 * AI INSTRUCTIONS:
 * - Engagement and sentiment now come from OpenAI API, not manual calculation
 * - Focus on data encapsulation and conversion utilities
 * - Remove manual scoring methods in favor of API-provided data
 */

import { IntentResult } from './IntentResult';
import { UserJourneyState } from '../session-management/UserJourneyState';

export interface ContextAnalysis {
  topics: string[];
  interests: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  engagementLevel: 'low' | 'medium' | 'high';
  userIntent: string; // Will be 'unknown' until OpenAI provides intentResult
  urgency: 'low' | 'medium' | 'high';
  conversationStage: 'greeting' | 'discovery' | 'qualification' | 'closing' | 'support';
  intentResult?: IntentResult; // OpenAI's sophisticated intent classification
  journeyState?: UserJourneyState;
  relevantKnowledge?: Array<{
    title: string;
    content: string;
    relevanceScore: number;
  }>;
}

export interface ConversationSummary {
  overview: string;
  keyTopics: string[];
  userNeeds: string[];
  painPoints: string[];
  nextSteps: string[];
  qualificationStatus: string;
}

export interface ContextWindowResult {
  messages: any[]; // ChatMessage type from entities
  summary?: string;
  tokenUsage: {
    messagesTokens: number;
    summaryTokens: number;
    totalTokens: number;
  };
  wasCompressed: boolean;
}

export class ContextAnalysisValueObject {
  constructor(
    public readonly topics: string[],
    public readonly interests: string[],
    public readonly sentiment: 'positive' | 'neutral' | 'negative',
    public readonly engagementLevel: 'low' | 'medium' | 'high',
    public readonly userIntent: string,
    public readonly urgency: 'low' | 'medium' | 'high',
    public readonly conversationStage: 'greeting' | 'discovery' | 'qualification' | 'closing' | 'support',
    public readonly intentResult?: IntentResult,
    public readonly journeyState?: UserJourneyState,
    public readonly relevantKnowledge?: Array<{
      title: string;
      content: string;
      relevanceScore: number;
    }>
  ) {}

  /**
   * Check if analysis indicates high engagement (based on API-provided data)
   */
  isHighlyEngaged(): boolean {
    return this.engagementLevel === 'high' && 
           this.sentiment === 'positive' && 
           this.topics.length > 2;
  }

  /**
   * Check if user is ready for qualification
   */
  isReadyForQualification(): boolean {
    return this.conversationStage === 'discovery' && 
           this.engagementLevel !== 'low' &&
           this.topics.length > 1;
  }

  /**
   * Create default context for empty conversations
   */
  static createDefault(): ContextAnalysisValueObject {
    return new ContextAnalysisValueObject(
      [], // topics
      [], // interests
      'neutral', // sentiment
      'low', // engagementLevel
      'unknown', // userIntent - no preliminary guessing, let OpenAI determine
      'low', // urgency
      'greeting' // conversationStage
    );
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): ContextAnalysis {
    return {
      topics: this.topics,
      interests: this.interests,
      sentiment: this.sentiment,
      engagementLevel: this.engagementLevel,
      userIntent: this.userIntent,
      urgency: this.urgency,
      conversationStage: this.conversationStage,
      intentResult: this.intentResult,
      journeyState: this.journeyState,
      relevantKnowledge: this.relevantKnowledge
    };
  }
} 