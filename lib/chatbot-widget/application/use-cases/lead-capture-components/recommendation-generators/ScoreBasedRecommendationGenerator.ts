/**
 * Score-Based Recommendation Generator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate recommendations based on lead score
 * - Apply business rules for score-based follow-up strategies
 * - Use domain knowledge for score thresholds and actions
 * - Return structured recommendation data
 * - Stay under 200-250 lines
 * - Follow @golden-rule patterns exactly
 */

import { LeadRecommendation, RecommendationType, RecommendationPriority, RecommendationCategory } from '../LeadRecommendationEngine';

export class ScoreBasedRecommendationGenerator {
  /**
   * Generate recommendations based on lead score
   */
  static generateRecommendations(leadScore: number): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    if (leadScore >= 80) {
      recommendations.push(...this.getHighScoreRecommendations());
    } else if (leadScore >= 50) {
      recommendations.push(...this.getMediumScoreRecommendations());
    } else {
      recommendations.push(...this.getLowScoreRecommendations());
    }

    return recommendations;
  }

  /**
   * Get recommendations for high-scoring leads (80+)
   */
  private static getHighScoreRecommendations(): LeadRecommendation[] {
    return [
      {
        type: 'immediate_follow_up',
        priority: 'high',
        action: 'Schedule demo or sales call within 24 hours',
        reasoning: 'High lead score indicates strong buying intent',
        timeline: 'Within 24 hours',
        category: 'sales_action'
      },
      {
        type: 'immediate_follow_up',
        priority: 'high',
        action: 'Assign to senior sales representative',
        reasoning: 'High-quality lead requires experienced handling',
        timeline: 'Immediate',
        category: 'sales_action'
      },
      {
        type: 'research',
        priority: 'medium',
        action: 'Prepare personalized value proposition',
        reasoning: 'High-intent leads deserve customized approach',
        timeline: 'Before first contact',
        category: 'sales_action'
      }
    ];
  }

  /**
   * Get recommendations for medium-scoring leads (50-79)
   */
  private static getMediumScoreRecommendations(): LeadRecommendation[] {
    return [
      {
        type: 'nurture_campaign',
        priority: 'medium',
        action: 'Add to targeted email nurture sequence',
        reasoning: 'Moderate score suggests potential with proper nurturing',
        timeline: 'Within 48 hours',
        category: 'marketing_action'
      },
      {
        type: 'content_delivery',
        priority: 'medium',
        action: 'Send personalized content based on interests',
        reasoning: 'Educational content can increase engagement',
        timeline: 'Within 1 week',
        category: 'marketing_action'
      },
      {
        type: 'qualification',
        priority: 'medium',
        action: 'Send additional qualification questions',
        reasoning: 'More data could improve lead scoring',
        timeline: 'Within 3 days',
        category: 'qualification_improvement'
      }
    ];
  }

  /**
   * Get recommendations for low-scoring leads (<50)
   */
  private static getLowScoreRecommendations(): LeadRecommendation[] {
    return [
      {
        type: 'nurture_campaign',
        priority: 'low',
        action: 'Add to general newsletter campaign',
        reasoning: 'Low score requires long-term nurturing approach',
        timeline: 'Within 1 week',
        category: 'marketing_action'
      },
      {
        type: 'qualification',
        priority: 'low',
        action: 'Re-qualify with targeted questions',
        reasoning: 'Low score may indicate incomplete qualification',
        timeline: 'Within 2 weeks',
        category: 'qualification_improvement'
      }
    ];
  }

  /**
   * Get score threshold information for business rules
   */
  static getScoreThresholds(): {
    high: number;
    medium: number;
    low: number;
  } {
    return {
      high: 80,
      medium: 50,
      low: 0
    };
  }

  /**
   * Determine score category for a given score
   */
  static getScoreCategory(score: number): 'high' | 'medium' | 'low' {
    const thresholds = this.getScoreThresholds();
    
    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Get expected conversion rate by score range
   */
  static getExpectedConversionRate(score: number): number {
    const category = this.getScoreCategory(score);
    
    switch (category) {
      case 'high': return 0.35; // 35% conversion rate
      case 'medium': return 0.15; // 15% conversion rate
      case 'low': return 0.05; // 5% conversion rate
      default: return 0.05;
    }
  }
} 