/**
 * Message Analysis Orchestrator
 * 
 * AI INSTRUCTIONS:
 * - Main orchestrator for all message analysis operations
 * - Coordinate content and sentiment analysis services (intent now handled by OpenAI)
 * - Keep under 200 lines following @golden-rule patterns
 * - Delegate all analysis to specialized services
 * - Maintain single responsibility for coordination
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { MessageContentAnalysisService } from './MessageContentAnalysisService';
import { MessageSentimentAnalysisService } from './MessageSentimentAnalysisService';
// Removed: MessageIntentAnalysisService - using OpenAI intent classification only

export class MessageAnalysisOrchestrator {
  private readonly contentAnalysisService: MessageContentAnalysisService;
  private readonly sentimentAnalysisService: MessageSentimentAnalysisService;
  // Removed: intentAnalysisService

  constructor() {
    this.contentAnalysisService = new MessageContentAnalysisService();
    this.sentimentAnalysisService = new MessageSentimentAnalysisService();
    // Removed: this.intentAnalysisService = new MessageIntentAnalysisService();
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
   * Comprehensive message analysis (removed intent analysis)
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
  } {
    return {
      content: this.contentAnalysisService.extractContentPatterns(userMessages),
      sentiment: this.sentimentAnalysisService.analyzeSentimentMetrics(userMessages, totalMessages)
    };
  }

  /**
   * Quick analysis for basic operations (removed intent analysis)
   */
  analyzeBasic(userMessages: ChatMessage[], totalMessages: number): {
    topics: string[];
    interests: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    engagementLevel: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
  } {
    return {
      topics: this.extractTopics(userMessages),
      interests: this.extractInterests(userMessages),
      sentiment: this.analyzeSentiment(userMessages),
      engagementLevel: this.calculateEngagementLevel(userMessages, totalMessages),
      urgency: this.assessUrgency(userMessages)
    };
  }
} 