import { SessionContext, PageView, SessionMetrics } from '../value-objects/ChatSessionTypes';

/**
 * Session Engagement Service
 * Domain Service: Pure business logic for engagement calculations
 * Following DDD principles: Single responsibility for engagement logic
 */
export class SessionEngagementService {
  
  /**
   * Calculate engagement score based on session activity
   */
  static calculateEngagementScore(
    contextData: SessionContext,
    sessionDuration: number,
    messageCount: number = 0
  ): number {
    let score = 0;

    // Base engagement from existing score
    score += contextData.engagementScore * 0.4;

    // Page view engagement (up to 20 points)
    const pageViewScore = Math.min(contextData.pageViews.length * 2, 20);
    score += pageViewScore;

    // Topic diversity (up to 15 points)
    const topicScore = Math.min(contextData.topics.length * 3, 15);
    score += topicScore;

    // Interest diversity (up to 10 points)
    const interestScore = Math.min(contextData.interests.length * 2, 10);
    score += interestScore;

    // Session duration bonus (up to 15 points)
    const durationMinutes = sessionDuration / (1000 * 60);
    const durationScore = Math.min(durationMinutes * 0.5, 15);
    score += durationScore;

    // Message interaction bonus (up to 20 points)
    const messageScore = Math.min(messageCount * 2, 20);
    score += messageScore;

    // Contact info bonus (up to 20 points)
    if (contextData.email || contextData.phone) {
      score += 20;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Update engagement score with clamping
   */
  static clampEngagementScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate session metrics
   */
  static calculateSessionMetrics(
    contextData: SessionContext,
    startedAt: Date,
    endedAt?: Date
  ): SessionMetrics {
    const endTime = endedAt || new Date();
    const duration = endTime.getTime() - startedAt.getTime();

    return {
      duration,
      pageViewCount: contextData.pageViews.length,
      topicCount: contextData.topics.length,
      interestCount: contextData.interests.length,
      hasContactInfo: !!(contextData.email || contextData.phone)
    };
  }

  /**
   * Check if session is expired based on last activity
   */
  static isSessionExpired(lastActivityAt: Date, timeoutMinutes: number): boolean {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = new Date().getTime();
    return now - lastActivityAt.getTime() > timeoutMs;
  }

  /**
   * Create page view object
   */
  static createPageView(url: string, title: string, timeOnPage: number = 0): PageView {
    return {
      url,
      title,
      timestamp: new Date(),
      timeOnPage
    };
  }

  /**
   * Check if topic already exists in context
   */
  static hasTopicInContext(contextData: SessionContext, topic: string): boolean {
    return contextData.topics.includes(topic);
  }

  /**
   * Check if interest already exists in context
   */
  static hasInterestInContext(contextData: SessionContext, interest: string): boolean {
    return contextData.interests.includes(interest);
  }
} 