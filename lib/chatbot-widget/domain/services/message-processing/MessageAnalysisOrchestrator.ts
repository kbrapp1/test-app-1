/**
 * Message Analysis Orchestrator
 * 
 * AI INSTRUCTIONS:
 * - Main orchestrator for all message analysis operations
 * - Coordinate content, sentiment, and intent analysis services
 * - Keep under 200 lines following @golden-rule patterns
 * - Delegate all analysis to specialized services
 * - Maintain single responsibility for coordination
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { MessageContentAnalysisService } from './MessageContentAnalysisService';
import { MessageSentimentAnalysisService } from './MessageSentimentAnalysisService';
import { MessageIntentAnalysisService } from './MessageIntentAnalysisService';

export class MessageAnalysisOrchestrator {
  private readonly contentAnalysisService: MessageContentAnalysisService;
  private readonly sentimentAnalysisService: MessageSentimentAnalysisService;
  private readonly intentAnalysisService: MessageIntentAnalysisService;

  constructor() {
    this.contentAnalysisService = new MessageContentAnalysisService();
    this.sentimentAnalysisService = new MessageSentimentAnalysisService();
    this.intentAnalysisService = new MessageIntentAnalysisService();
  }

  /**
   * Extract topics from user messages
   */
  extractTopics(userMessages: ChatMessage[]): string[] {
    return this.contentAnalysisService.extractTopics(userMessages);
  }

  /**
   * Extract interests from user messages
   */
  extractInterests(userMessages: ChatMessage[]): string[] {
    return this.contentAnalysisService.extractInterests(userMessages);
  }

  /**
   * Extract user needs from messages
   */
  extractUserNeeds(userMessages: ChatMessage[]): string[] {
    return this.contentAnalysisService.extractUserNeeds(userMessages);
  }

  /**
   * Extract pain points from messages
   */
  extractPainPoints(userMessages: ChatMessage[]): string[] {
    return this.contentAnalysisService.extractPainPoints(userMessages);
  }

  /**
   * Analyze sentiment of user messages
   */
  analyzeSentiment(userMessages: ChatMessage[]): 'positive' | 'neutral' | 'negative' {
    return this.sentimentAnalysisService.analyzeSentiment(userMessages);
  }

  /**
   * Calculate engagement level
   */
  calculateEngagementLevel(
    userMessages: ChatMessage[],
    totalMessages: number
  ): 'low' | 'medium' | 'high' {
    return this.sentimentAnalysisService.calculateEngagementLevel(userMessages, totalMessages);
  }

  /**
   * Assess urgency level
   */
  assessUrgency(userMessages: ChatMessage[]): 'low' | 'medium' | 'high' {
    return this.sentimentAnalysisService.assessUrgency(userMessages);
  }

  /**
   * Detect user intent
   */
  detectUserIntent(userMessages: ChatMessage[]): string {
    return this.intentAnalysisService.detectUserIntent(userMessages);
  }

  /**
   * Comprehensive message analysis
   */
  analyzeMessagesComprehensive(
    userMessages: ChatMessage[],
    totalMessages: number
  ): {
    content: {
      topics: string[];
      interests: string[];
      needs: string[];
      painPoints: string[];
    };
    sentiment: {
      sentiment: 'positive' | 'neutral' | 'negative';
      sentimentScore: number;
      engagement: 'low' | 'medium' | 'high';
      engagementScore: number;
      urgency: 'low' | 'medium' | 'high';
      urgencyScore: number;
    };
    intent: {
      primaryIntent: string;
      confidence: number;
      category: 'sales' | 'support' | 'information' | 'technical';
      allIntents: Array<{ intent: string; confidence: number; keywords: string[] }>;
    };
  } {
    return {
      content: this.contentAnalysisService.extractContentPatterns(userMessages),
      sentiment: this.sentimentAnalysisService.analyzeSentimentMetrics(userMessages, totalMessages),
      intent: this.intentAnalysisService.analyzeIntentComprehensive(userMessages)
    };
  }

  /**
   * Quick analysis for basic operations (maintains backward compatibility)
   */
  analyzeBasic(userMessages: ChatMessage[], totalMessages: number): {
    topics: string[];
    interests: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    engagementLevel: 'low' | 'medium' | 'high';
    userIntent: string;
    urgency: 'low' | 'medium' | 'high';
  } {
    return {
      topics: this.extractTopics(userMessages),
      interests: this.extractInterests(userMessages),
      sentiment: this.analyzeSentiment(userMessages),
      engagementLevel: this.calculateEngagementLevel(userMessages, totalMessages),
      userIntent: this.detectUserIntent(userMessages),
      urgency: this.assessUrgency(userMessages)
    };
  }
} 