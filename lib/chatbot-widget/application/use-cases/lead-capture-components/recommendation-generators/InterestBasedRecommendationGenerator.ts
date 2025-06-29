/**
 * Interest-Based Recommendation Generator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate interest and preference based recommendations
 * - Delegate specialized analysis to domain services
 * - Handle recommendation workflow coordination only
 * - Use domain-specific errors with proper context
 * - Stay under 200 lines following @golden-rule patterns
 */

import { Lead } from '../../../../domain/entities/Lead';
import { ChatSession } from '../../../../domain/entities/ChatSession';
import { LeadRecommendation } from '../../../../domain/value-objects/lead-management/LeadRecommendation';
import { BusinessRuleViolationError } from '../../../../domain/errors/BusinessRuleViolationError';

export class InterestBasedRecommendationGenerator {
  /**
   * Generate recommendations based on identified interests
   */
  static generateRecommendations(lead: Lead, session: ChatSession): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    const interests = lead.qualificationData.interests;

    if (interests.length === 0) {
      recommendations.push(this.getNoInterestsRecommendation());
      return recommendations;
    }

    // General interest-based recommendations
    recommendations.push(this.getInterestFocusRecommendation(interests));

    // Check for high-intent interests
    const highIntentInterests = this.identifyHighIntentInterests(interests);
    if (highIntentInterests.length > 0) {
      recommendations.push(...this.getHighIntentRecommendations(highIntentInterests));
    }

    // Check for specific interest categories
    recommendations.push(...this.getCategorySpecificRecommendations(interests));

    // Check for interest depth
    if (interests.length > 3) {
      recommendations.push(this.getMultipleInterestsRecommendation());
    }

    return recommendations;
  }

  /**
   * Get recommendation when no interests are identified
   */
  private static getNoInterestsRecommendation(): LeadRecommendation {
    return {
      type: 'qualification',
      priority: 'medium',
      action: 'Discover lead interests through targeted questions',
      reasoning: 'No specific interests identified - need more discovery',
      timeline: 'Next interaction',
      category: 'qualification_improvement'
    };
  }

  /**
   * Get general interest focus recommendation
   */
  private static getInterestFocusRecommendation(interests: string[]): LeadRecommendation {
    return {
      type: 'content_delivery',
      priority: 'medium',
      action: `Focus on interests: ${interests.slice(0, 3).join(', ')}`,
      reasoning: 'Identified interests provide personalization opportunities',
      timeline: 'Within 2 days',
      category: 'marketing_action'
    };
  }

  /**
   * Identify high-intent interests
   */
  private static identifyHighIntentInterests(interests: string[]): string[] {
    const highIntentKeywords = [
      'pricing', 'cost', 'demo', 'trial', 'purchase', 'buy',
      'implementation', 'timeline', 'budget', 'contract',
      'when can we start', 'how much', 'quote'
    ];

    return interests.filter(interest =>
      highIntentKeywords.some(keyword =>
        interest.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Get recommendations for high-intent interests
   */
  private static getHighIntentRecommendations(highIntentInterests: string[]): LeadRecommendation[] {
    return [
      {
        type: 'immediate_follow_up',
        priority: 'high',
        action: 'Address buying intent immediately',
        reasoning: `High-intent interests detected: ${highIntentInterests.join(', ')}`,
        timeline: 'Within 2 hours',
        category: 'sales_action'
      },
      {
        type: 'content_delivery',
        priority: 'high',
        action: 'Send pricing and product information',
        reasoning: 'Lead showing purchase intent',
        timeline: 'Within 4 hours',
        category: 'sales_action'
      }
    ];
  }

  /**
   * Get category-specific recommendations
   */
  private static getCategorySpecificRecommendations(interests: string[]): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    // Technical interests
    if (this.hasTechnicalInterests(interests)) {
      recommendations.push({
        type: 'content_delivery',
        priority: 'medium',
        action: 'Send technical documentation and specs',
        reasoning: 'Technical interests indicate need for detailed information',
        timeline: 'Within 1 day',
        category: 'marketing_action'
      });
    }

    // Business interests
    if (this.hasBusinessInterests(interests)) {
      recommendations.push({
        type: 'content_delivery',
        priority: 'medium',
        action: 'Share ROI and business case studies',
        reasoning: 'Business interests suggest focus on value proposition',
        timeline: 'Within 1 day',
        category: 'marketing_action'
      });
    }

    // Security interests
    if (this.hasSecurityInterests(interests)) {
      recommendations.push({
        type: 'content_delivery',
        priority: 'medium',
        action: 'Provide security and compliance information',
        reasoning: 'Security interests require specialized content',
        timeline: 'Within 1 day',
        category: 'marketing_action'
      });
    }

    // Integration interests
    if (this.hasIntegrationInterests(interests)) {
      recommendations.push({
        type: 'immediate_follow_up',
        priority: 'medium',
        action: 'Discuss integration requirements',
        reasoning: 'Integration interests suggest active evaluation',
        timeline: 'Within 1 day',
        category: 'sales_action'
      });
    }

    return recommendations;
  }

  /**
   * Get recommendation for multiple interests
   */
  private static getMultipleInterestsRecommendation(): LeadRecommendation {
    return {
      type: 'immediate_follow_up',
      priority: 'medium',
      action: 'Prioritize interests in follow-up conversation',
      reasoning: 'Multiple interests indicate serious evaluation',
      timeline: 'Within 1 day',
      category: 'sales_action'
    };
  }

  /**
   * Check for technical interests
   */
  private static hasTechnicalInterests(interests: string[]): boolean {
    const technicalKeywords = [
      'api', 'integration', 'technical', 'development', 'architecture',
      'performance', 'scalability', 'database', 'infrastructure'
    ];

    return interests.some(interest =>
      technicalKeywords.some(keyword =>
        interest.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Check for business interests
   */
  private static hasBusinessInterests(interests: string[]): boolean {
    const businessKeywords = [
      'roi', 'business case', 'efficiency', 'productivity', 'cost savings',
      'revenue', 'growth', 'strategy', 'competitive advantage'
    ];

    return interests.some(interest =>
      businessKeywords.some(keyword =>
        interest.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Check for security interests
   */
  private static hasSecurityInterests(interests: string[]): boolean {
    const securityKeywords = [
      'security', 'compliance', 'privacy', 'gdpr', 'encryption',
      'authentication', 'authorization', 'audit', 'certification'
    ];

    return interests.some(interest =>
      securityKeywords.some(keyword =>
        interest.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Check for integration interests
   */
  private static hasIntegrationInterests(interests: string[]): boolean {
    const integrationKeywords = [
      'integration', 'connect', 'sync', 'import', 'export',
      'api', 'webhook', 'third party', 'existing system'
    ];

    return interests.some(interest =>
      integrationKeywords.some(keyword =>
        interest.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Get interest priority score
   */
  static getInterestPriorityScore(interests: string[]): number {
    let score = 0;

    // Base score for having interests
    score += interests.length * 10;

    // Bonus for high-intent interests
    const highIntentCount = this.identifyHighIntentInterests(interests).length;
    score += highIntentCount * 25;

    // Bonus for specific categories
    if (this.hasTechnicalInterests(interests)) score += 15;
    if (this.hasBusinessInterests(interests)) score += 20;
    if (this.hasSecurityInterests(interests)) score += 10;
    if (this.hasIntegrationInterests(interests)) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Get recommended content types based on interests
   */
  static getRecommendedContentTypes(interests: string[]): string[] {
    const contentTypes: string[] = [];

    if (this.hasTechnicalInterests(interests)) {
      contentTypes.push('Technical Documentation', 'API Guides', 'Architecture Diagrams');
    }

    if (this.hasBusinessInterests(interests)) {
      contentTypes.push('ROI Calculator', 'Case Studies', 'Business Whitepapers');
    }

    if (this.hasSecurityInterests(interests)) {
      contentTypes.push('Security Compliance Guide', 'Privacy Documentation');
    }

    if (this.hasIntegrationInterests(interests)) {
      contentTypes.push('Integration Guides', 'API Documentation');
    }

    if (this.identifyHighIntentInterests(interests).length > 0) {
      contentTypes.push('Pricing Information', 'Product Demo', 'Trial Access');
    }

    return contentTypes.length > 0 ? contentTypes : ['General Product Information'];
  }
} 