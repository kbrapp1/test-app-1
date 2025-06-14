/**
 * Conversation Metrics Service
 * 
 * Application service for calculating conversation metrics and engagement scores.
 * Single responsibility: Handle metrics calculation and conversation analysis.
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { AIResponse } from '../../domain/services/IAIConversationService';

export interface ConversationMetrics {
  messageCount: number;
  sessionDuration: number; // minutes
  engagementScore: number; // 0-100
  leadQualificationProgress: number; // 0-100
}

export class ConversationMetricsService {
  /**
   * Calculate engagement score for this interaction
   */
  calculateEngagementScore(userMessage: string, aiResponse: AIResponse): number {
    let score = 0;

    // Message length indicates engagement
    if (userMessage.length > 50) score += 10;
    if (userMessage.length > 100) score += 10;

    // Questions indicate engagement
    if (userMessage.includes('?')) score += 15;

    // AI confidence in response
    score += Math.round(aiResponse.confidence * 20); // Convert 0-1 to 0-20

    // Specific keywords that indicate interest
    const interestKeywords = ['interested', 'price', 'cost', 'buy', 'purchase', 'demo', 'trial'];
    const hasInterestKeywords = interestKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    if (hasInterestKeywords) score += 25;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate comprehensive conversation metrics
   */
  async calculateConversationMetrics(
    session: ChatSession, 
    allMessages: ChatMessage[]
  ): Promise<ConversationMetrics> {
    const sessionDuration = session.getSessionDuration();

    // Calculate lead qualification progress
    const totalQuestions = session.leadQualificationState.answeredQuestions.length;
    const maxPossibleQuestions = 5; // Typical number of qualification questions
    const leadQualificationProgress = Math.round((totalQuestions / maxPossibleQuestions) * 100);

    return {
      messageCount: allMessages.length,
      sessionDuration,
      engagementScore: session.contextData.engagementScore,
      leadQualificationProgress: Math.min(leadQualificationProgress, 100)
    };
  }
} 