/**
 * Message Sentiment Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Handle sentiment, engagement, and urgency analysis
 * - Focus on emotional and behavioral pattern detection
 * - Keep under 200 lines following @golden-rule patterns
 * - Use domain-specific scoring algorithms
 * - Maintain single responsibility for sentiment analysis
 */

import { ChatMessage } from '../../entities/ChatMessage';

export class MessageSentimentAnalysisService {
  /**
   * Analyze sentiment of user messages
   */
  analyzeSentiment(userMessages: ChatMessage[]): 'positive' | 'neutral' | 'negative' {
    if (userMessages.length === 0) return 'neutral';

    const positiveWords = [
      'great', 'good', 'excellent', 'amazing', 'love', 'like', 'perfect',
      'awesome', 'fantastic', 'wonderful', 'yes', 'definitely', 'absolutely'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'hate', 'dislike', 'awful', 'horrible', 'no',
      'never', 'disappointed', 'frustrated', 'angry', 'problem', 'issue'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate engagement level
   */
  calculateEngagementLevel(
    userMessages: ChatMessage[],
    totalMessages: number
  ): 'low' | 'medium' | 'high' {
    if (userMessages.length === 0) return 'low';

    const avgMessageLength = userMessages.reduce((sum, msg) => 
      sum + msg.content.length, 0) / userMessages.length;
    
    const responseRate = userMessages.length / (totalMessages / 2);
    
    // High engagement: long messages, high response rate
    if (avgMessageLength > 50 && responseRate > 0.8 && userMessages.length > 5) {
      return 'high';
    }
    
    // Medium engagement: decent length and response rate
    if (avgMessageLength > 20 && responseRate > 0.5 && userMessages.length > 2) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Assess urgency level
   */
  assessUrgency(userMessages: ChatMessage[]): 'low' | 'medium' | 'high' {
    const urgencyKeywords = {
      high: ['urgent', 'asap', 'immediately', 'now', 'today', 'emergency'],
      medium: ['soon', 'quickly', 'fast', 'this week', 'this month'],
      low: ['eventually', 'later', 'sometime', 'future', 'considering'],
    };

    let urgencyScore = 0;
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      urgencyKeywords.high.forEach(keyword => {
        if (content.includes(keyword)) urgencyScore += 3;
      });
      
      urgencyKeywords.medium.forEach(keyword => {
        if (content.includes(keyword)) urgencyScore += 2;
      });
      
      urgencyKeywords.low.forEach(keyword => {
        if (content.includes(keyword)) urgencyScore -= 1;
      });
    });

    if (urgencyScore >= 5) return 'high';
    if (urgencyScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate sentiment score (numerical representation)
   */
  calculateSentimentScore(userMessages: ChatMessage[]): number {
    if (userMessages.length === 0) return 0.5; // Neutral

    const sentiment = this.analyzeSentiment(userMessages);
    
    switch (sentiment) {
      case 'positive': return 0.8;
      case 'negative': return 0.2;
      default: return 0.5;
    }
  }

  /**
   * Calculate engagement score (numerical representation)
   */
  calculateEngagementScore(
    userMessages: ChatMessage[],
    totalMessages: number
  ): number {
    if (userMessages.length === 0) return 0;

    const engagement = this.calculateEngagementLevel(userMessages, totalMessages);
    
    switch (engagement) {
      case 'high': return 0.9;
      case 'medium': return 0.6;
      default: return 0.3;
    }
  }

  /**
   * Calculate urgency score (numerical representation)
   */
  calculateUrgencyScore(userMessages: ChatMessage[]): number {
    const urgency = this.assessUrgency(userMessages);
    
    switch (urgency) {
      case 'high': return 0.9;
      case 'medium': return 0.6;
      default: return 0.3;
    }
  }

  /**
   * Comprehensive sentiment analysis
   */
  analyzeSentimentMetrics(
    userMessages: ChatMessage[],
    totalMessages: number
  ): {
    sentiment: 'positive' | 'neutral' | 'negative';
    sentimentScore: number;
    engagement: 'low' | 'medium' | 'high';
    engagementScore: number;
    urgency: 'low' | 'medium' | 'high';
    urgencyScore: number;
  } {
    return {
      sentiment: this.analyzeSentiment(userMessages),
      sentimentScore: this.calculateSentimentScore(userMessages),
      engagement: this.calculateEngagementLevel(userMessages, totalMessages),
      engagementScore: this.calculateEngagementScore(userMessages, totalMessages),
      urgency: this.assessUrgency(userMessages),
      urgencyScore: this.calculateUrgencyScore(userMessages)
    };
  }
} 