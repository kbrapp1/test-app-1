/**
 * Engagement Recommendation Generator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate recommendations based on engagement patterns
 * - Analyze engagement levels and session behavior
 * - Provide actionable steps for engagement optimization
 * - Return structured recommendation data
 * - Stay under 200-250 lines
 * - Follow @golden-rule patterns exactly
 */

import { Lead } from '../../../../domain/entities/Lead';
import { ChatSession } from '../../../../domain/entities/ChatSession';
import { LeadRecommendation } from '../LeadRecommendationEngine';

export class EngagementRecommendationGenerator {
  /**
   * Generate recommendations based on engagement patterns
   */
  static generateRecommendations(lead: Lead, session: ChatSession): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    // Analyze engagement level
    const engagementLevel = lead.qualificationData.engagementLevel;
    
    switch (engagementLevel) {
      case 'high':
        recommendations.push(...this.getHighEngagementRecommendations());
        break;
      case 'medium':
        recommendations.push(...this.getMediumEngagementRecommendations());
        break;
      case 'low':
        recommendations.push(...this.getLowEngagementRecommendations());
        break;
    }

    // Add session-specific engagement recommendations
    recommendations.push(...this.getSessionEngagementRecommendations(session));

    return recommendations;
  }

  /**
   * Get recommendations for high engagement leads
   */
  private static getHighEngagementRecommendations(): LeadRecommendation[] {
    return [
      {
        type: 'immediate_follow_up',
        priority: 'high',
        action: 'Strike while engagement is high - immediate contact',
        reasoning: 'High engagement indicates active interest',
        timeline: 'Within 4 hours',
        category: 'sales_action'
      },
      {
        type: 'content_delivery',
        priority: 'high',
        action: 'Send high-value content immediately',
        reasoning: 'Engaged leads are receptive to valuable information',
        timeline: 'Within 2 hours',
        category: 'marketing_action'
      },
      {
        type: 'immediate_follow_up',
        priority: 'medium',
        action: 'Prepare for potential objections',
        reasoning: 'High engagement may lead to detailed questions',
        timeline: 'Before contact',
        category: 'sales_action'
      }
    ];
  }

  /**
   * Get recommendations for medium engagement leads
   */
  private static getMediumEngagementRecommendations(): LeadRecommendation[] {
    return [
      {
        type: 'nurture_campaign',
        priority: 'medium',
        action: 'Add to engagement-building sequence',
        reasoning: 'Medium engagement can be improved with targeted content',
        timeline: 'Within 24 hours',
        category: 'marketing_action'
      },
      {
        type: 'content_delivery',
        priority: 'medium',
        action: 'Send educational content to build interest',
        reasoning: 'Educational content can increase engagement',
        timeline: 'Within 2 days',
        category: 'marketing_action'
      },
      {
        type: 'qualification',
        priority: 'medium',
        action: 'Ask engagement-building questions',
        reasoning: 'Interactive questions can boost engagement',
        timeline: 'Within 1 week',
        category: 'qualification_improvement'
      }
    ];
  }

  /**
   * Get recommendations for low engagement leads
   */
  private static getLowEngagementRecommendations(): LeadRecommendation[] {
    return [
      {
        type: 'qualification',
        priority: 'medium',
        action: 'Re-engage with targeted qualification questions',
        reasoning: 'Low engagement may indicate unclear value proposition',
        timeline: 'Within 3 days',
        category: 'qualification_improvement'
      },
      {
        type: 'content_delivery',
        priority: 'low',
        action: 'Send problem-focused content',
        reasoning: 'Address pain points to rekindle interest',
        timeline: 'Within 1 week',
        category: 'marketing_action'
      },
      {
        type: 'nurture_campaign',
        priority: 'low',
        action: 'Add to re-engagement campaign',
        reasoning: 'Systematic re-engagement may improve interest',
        timeline: 'Within 2 weeks',
        category: 'marketing_action'
      }
    ];
  }

  /**
   * Get session-specific engagement recommendations
   */
  private static getSessionEngagementRecommendations(session: ChatSession): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    // Check session duration
    const sessionDuration = this.calculateSessionDuration(session);
    if (sessionDuration > 300) { // 5 minutes
      recommendations.push({
        type: 'immediate_follow_up',
        priority: 'high',
        action: 'Follow up on extended conversation',
        reasoning: 'Long session indicates serious interest',
        timeline: 'Within 2 hours',
        category: 'sales_action'
      });
    }

    // Check message count (approximated from engagement data)
    const messageCount = session.contextData.engagementScore > 50 ? 12 : 5; // Approximation
    if (messageCount > 10) {
      recommendations.push({
        type: 'immediate_follow_up',
        priority: 'medium',
        action: 'Reference detailed conversation in follow-up',
        reasoning: 'Multiple messages show engagement depth',
        timeline: 'Within 6 hours',
        category: 'sales_action'
      });
    }

    // Check for specific engagement signals
    if (this.hasHighEngagementSignals(session)) {
      recommendations.push({
        type: 'immediate_follow_up',
        priority: 'high',
        action: 'Capitalize on engagement signals immediately',
        reasoning: 'Strong engagement signals detected in conversation',
        timeline: 'Within 1 hour',
        category: 'sales_action'
      });
    }

    return recommendations;
  }

  /**
   * Calculate session duration in seconds
   */
  private static calculateSessionDuration(session: ChatSession): number {
    // This would need to be implemented based on session timestamps
    // For now, return a placeholder
    return session.contextData.engagementScore * 10; // Rough approximation
  }

  /**
   * Check for high engagement signals in session
   */
  private static hasHighEngagementSignals(session: ChatSession): boolean {
    const highEngagementKeywords = [
      'pricing', 'cost', 'demo', 'trial', 'when can we start',
      'how much', 'budget', 'timeline', 'implementation'
    ];

    const conversationText = session.contextData.conversationSummary?.toLowerCase() || '';
    
    return highEngagementKeywords.some(keyword => 
      conversationText.includes(keyword)
    );
  }

  /**
   * Get engagement score based on session data
   */
  static calculateEngagementScore(session: ChatSession): number {
    let score = 0;

    // Base engagement from context
    score += session.contextData.engagementScore || 0;

    // Message count factor (approximated from engagement data)
    const messageCount = session.contextData.engagementScore > 70 ? 16 : 
                         session.contextData.engagementScore > 50 ? 12 : 6;
    if (messageCount > 15) score += 20;
    else if (messageCount > 10) score += 15;
    else if (messageCount > 5) score += 10;

    // High-intent keywords
    if (this.hasHighEngagementSignals(session)) {
      score += 25;
    }

    // Session duration factor (approximated)
    const duration = this.calculateSessionDuration(session);
    if (duration > 600) score += 15; // 10+ minutes
    else if (duration > 300) score += 10; // 5+ minutes

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Determine engagement level from score
   */
  static getEngagementLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get engagement improvement suggestions
   */
  static getEngagementImprovementSuggestions(
    currentLevel: 'high' | 'medium' | 'low'
  ): string[] {
    switch (currentLevel) {
      case 'high':
        return [
          'Maintain momentum with immediate follow-up',
          'Provide detailed product information',
          'Schedule demo or consultation'
        ];
      case 'medium':
        return [
          'Send targeted educational content',
          'Ask engaging qualification questions',
          'Share relevant case studies'
        ];
      case 'low':
        return [
          'Identify and address pain points',
          'Simplify value proposition',
          'Use interactive content formats'
        ];
      default:
        return [];
    }
  }
} 