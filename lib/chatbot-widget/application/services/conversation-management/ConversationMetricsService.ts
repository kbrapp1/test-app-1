/**
 * Conversation Metrics Service
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Remove manual engagement calculation
 * - Use session's existing engagement score (comes from API data)
 * - Single responsibility: Calculate conversation metrics from session data
 * - Follow @golden-rule patterns exactly
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { AIResponse as _AIResponse } from '../../../domain/services/interfaces/IAIConversationService';

export interface ConversationMetrics {
  messageCount: number;
  sessionDuration: number;
  engagementScore: number;
  leadQualificationProgress: number;
}

export class ConversationMetricsService {
  /** Calculate comprehensive conversation metrics using existing session data */
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
      engagementScore: session.contextData.engagementScore, // Uses API-provided score
      leadQualificationProgress: Math.min(leadQualificationProgress, 100)
    };
  }
} 