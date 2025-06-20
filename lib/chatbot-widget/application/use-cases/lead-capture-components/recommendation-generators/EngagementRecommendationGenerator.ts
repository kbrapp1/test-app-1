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

    // Check engagement score for additional recommendations
    const engagementScore = session.contextData.engagementScore || 0;
    
    // Extended conversation check (substantial engagement)
    if (engagementScore >= 50) { // Indicates substantial conversation
      recommendations.push({
        type: 'immediate_follow_up',
        priority: 'medium',
        action: 'Reference detailed conversation in follow-up',
        reasoning: 'High engagement indicates meaningful conversation exchanges',
        timeline: 'Within 6 hours',
        category: 'sales_action'
      });
    }

    // High engagement check (immediate action needed)
    if (engagementScore >= 70) { // High engagement threshold
      recommendations.push({
        type: 'immediate_follow_up',
        priority: 'high',
        action: 'Capitalize on high engagement immediately',
        reasoning: 'API-detected high engagement indicates strong interest',
        timeline: 'Within 1 hour',
        category: 'sales_action'
      });
    }

    return recommendations;
  }

  /**
   * Get session duration from session data
   */
  private static calculateSessionDuration(session: ChatSession): number {
    // Use the session's built-in duration calculation method
    return session.getSessionDuration(); // Already implemented in ChatSession entity
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