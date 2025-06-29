/**
 * Company-Based Recommendation Generator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate company and business context recommendations
 * - Delegate specialized analysis to domain services
 * - Handle recommendation workflow coordination only
 * - Use domain-specific errors with proper context
 * - Stay under 200 lines following @golden-rule patterns
 */

import { Lead } from '../../../../domain/entities/Lead';
import { ChatSession } from '../../../../domain/entities/ChatSession';
import { LeadRecommendation } from '../../../../domain/value-objects/lead-management/LeadRecommendation';
import { BusinessRuleViolationError } from '../../../../domain/errors/BusinessRuleViolationError';

export class CompanyBasedRecommendationGenerator {
  /**
   * Generate recommendations based on company information
   */
  static generateRecommendations(lead: Lead, session: ChatSession): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    const company = lead.contactInfo.company?.trim();

    if (!company || company.length === 0) {
      recommendations.push(this.getNoCompanyRecommendation());
      return recommendations;
    }

    // Core company-based recommendations
    recommendations.push(...this.getCoreCompanyRecommendations());

    // Company size-based recommendations
    recommendations.push(...this.getCompanySizeRecommendations(company));

    // Industry-specific recommendations
    recommendations.push(...this.getIndustryRecommendations(company));

    return recommendations;
  }

  /**
   * Get recommendation when no company is identified
   */
  private static getNoCompanyRecommendation(): LeadRecommendation {
    return {
      type: 'data_capture',
      priority: 'low',
      action: 'Identify company affiliation if B2B prospect',
      reasoning: 'Company information enables account-based approach',
      timeline: 'Within 1 week',
      category: 'data_improvement'
    };
  }

  /**
   * Get core company-based recommendations
   */
  private static getCoreCompanyRecommendations(): LeadRecommendation[] {
    return [
      {
        type: 'research',
        priority: 'medium',
        action: 'Research company for account-based approach',
        reasoning: 'B2B lead with company information',
        timeline: 'Before first contact',
        category: 'sales_action'
      },
      {
        type: 'content_delivery',
        priority: 'medium',
        action: 'Prepare company-specific value proposition',
        reasoning: 'Personalized approach increases conversion',
        timeline: 'Within 1 day',
        category: 'sales_action'
      }
    ];
  }

  /**
   * Get recommendations based on company size indicators
   */
  private static getCompanySizeRecommendations(company: string): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    if (this.isLargeCompany(company)) {
      recommendations.push({
        type: 'immediate_follow_up',
        priority: 'high',
        action: 'Prioritize enterprise-level engagement',
        reasoning: 'Large company indicates high-value opportunity',
        timeline: 'Within 4 hours',
        category: 'sales_action'
      });
    }

    return recommendations;
  }

  /**
   * Get industry-specific recommendations
   */
  private static getIndustryRecommendations(company: string): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    if (this.isTechCompany(company)) {
      recommendations.push({
        type: 'content_delivery',
        priority: 'medium',
        action: 'Emphasize technical capabilities and integrations',
        reasoning: 'Tech companies value technical depth',
        timeline: 'Within 1 day',
        category: 'marketing_action'
      });
    }

    if (this.isFinancialCompany(company)) {
      recommendations.push({
        type: 'content_delivery',
        priority: 'high',
        action: 'Provide security and compliance documentation',
        reasoning: 'Financial companies require strict compliance',
        timeline: 'Within 1 day',
        category: 'marketing_action'
      });
    }

    return recommendations;
  }

  /**
   * Check if company appears to be large enterprise
   */
  private static isLargeCompany(company: string): boolean {
    const largeCompanyIndicators = [
      'inc', 'corp', 'corporation', 'ltd', 'limited', 'group',
      'international', 'global', 'worldwide', 'enterprise'
    ];

    const companyLower = company.toLowerCase();
    return largeCompanyIndicators.some(indicator => 
      companyLower.includes(indicator)
    ) || company.length > 20;
  }

  /**
   * Check if company is in tech industry
   */
  private static isTechCompany(company: string): boolean {
    const techIndicators = [
      'tech', 'software', 'systems', 'solutions', 'digital',
      'data', 'cloud', 'ai', 'analytics', 'platform'
    ];

    const companyLower = company.toLowerCase();
    return techIndicators.some(indicator => 
      companyLower.includes(indicator)
    );
  }

  /**
   * Check if company is in financial industry
   */
  private static isFinancialCompany(company: string): boolean {
    const financialIndicators = [
      'bank', 'financial', 'finance', 'capital', 'investment',
      'insurance', 'credit', 'fund', 'wealth', 'asset'
    ];

    const companyLower = company.toLowerCase();
    return financialIndicators.some(indicator => 
      companyLower.includes(indicator)
    );
  }

  /**
   * Get company priority score
   */
  static getCompanyPriorityScore(company: string): number {
    if (!company || company.trim().length === 0) return 0;

    let score = 20; // Base score for having company

    if (this.isLargeCompany(company)) score += 30;
    if (this.isTechCompany(company)) score += 15;
    if (this.isFinancialCompany(company)) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Get recommended research areas
   */
  static getRecommendedResearchAreas(company: string): string[] {
    const areas = ['Company size and structure', 'Recent news and developments'];

    if (this.isLargeCompany(company)) {
      areas.push('Enterprise decision-making process', 'Existing vendor relationships');
    }

    if (this.isTechCompany(company)) {
      areas.push('Technology stack', 'Development practices');
    }

    if (this.isFinancialCompany(company)) {
      areas.push('Regulatory requirements', 'Compliance frameworks');
    }

    return areas;
  }
} 