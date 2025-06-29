/**
 * Contact Info Recommendation Generator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate contact information related recommendations
 * - Delegate specialized analysis to domain services
 * - Handle recommendation workflow coordination only
 * - Use domain-specific errors with proper context
 * - Stay under 200 lines following @golden-rule patterns
 */

import { Lead } from '../../../../domain/entities/Lead';
import { LeadRecommendation } from '../../../../domain/value-objects/lead-management/LeadRecommendation';
import { BusinessRuleViolationError } from '../../../../domain/errors/BusinessRuleViolationError';

export class ContactInfoRecommendationGenerator {
  /**
   * Generate recommendations based on contact information completeness
   */
  static generateRecommendations(lead: Lead): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    // Check for missing email
    if (this.isMissingEmail(lead)) {
      recommendations.push(this.getEmailCaptureRecommendation());
    }

    // Check for missing phone
    if (this.isMissingPhone(lead)) {
      recommendations.push(this.getPhoneCaptureRecommendation());
    }

    // Check for missing name
    if (this.isMissingName(lead)) {
      recommendations.push(this.getNameCaptureRecommendation());
    }

    // Check for missing company
    if (this.isMissingCompany(lead)) {
      recommendations.push(this.getCompanyCaptureRecommendation());
    }

    // Check for data quality issues
    recommendations.push(...this.getDataQualityRecommendations(lead));

    return recommendations;
  }

  /**
   * Check if email is missing or invalid
   */
  private static isMissingEmail(lead: Lead): boolean {
    return !lead.contactInfo.email || 
           lead.contactInfo.email.trim().length === 0 ||
           !this.isValidEmail(lead.contactInfo.email);
  }

  /**
   * Check if phone is missing
   */
  private static isMissingPhone(lead: Lead): boolean {
    return !lead.contactInfo.phone || 
           lead.contactInfo.phone.trim().length === 0;
  }

  /**
   * Check if name is missing
   */
  private static isMissingName(lead: Lead): boolean {
    return !lead.contactInfo.name || 
           lead.contactInfo.name.trim().length === 0;
  }

  /**
   * Check if company is missing
   */
  private static isMissingCompany(lead: Lead): boolean {
    return !lead.contactInfo.company || 
           lead.contactInfo.company.trim().length === 0;
  }

  /**
   * Generate email capture recommendation
   */
  private static getEmailCaptureRecommendation(): LeadRecommendation {
    return {
      type: 'data_capture',
      priority: 'high',
      action: 'Attempt to capture email address in follow-up',
      reasoning: 'Email is essential for effective lead nurturing',
      timeline: 'Next interaction',
      category: 'data_improvement'
    };
  }

  /**
   * Generate phone capture recommendation
   */
  private static getPhoneCaptureRecommendation(): LeadRecommendation {
    return {
      type: 'data_capture',
      priority: 'medium',
      action: 'Consider phone capture campaign',
      reasoning: 'Phone contact enables direct sales conversations',
      timeline: 'Within 1 week',
      category: 'data_improvement'
    };
  }

  /**
   * Generate name capture recommendation
   */
  private static getNameCaptureRecommendation(): LeadRecommendation {
    return {
      type: 'data_capture',
      priority: 'medium',
      action: 'Capture lead name for personalization',
      reasoning: 'Name enables personalized communication',
      timeline: 'Next interaction',
      category: 'data_improvement'
    };
  }

  /**
   * Generate company capture recommendation
   */
  private static getCompanyCaptureRecommendation(): LeadRecommendation {
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
   * Generate data quality improvement recommendations
   */
  private static getDataQualityRecommendations(lead: Lead): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    // Check email validity
    if (lead.contactInfo.email && !this.isValidEmail(lead.contactInfo.email)) {
      recommendations.push({
        type: 'data_capture',
        priority: 'high',
        action: 'Verify and correct email address',
        reasoning: 'Invalid email format detected',
        timeline: 'Immediate',
        category: 'data_improvement'
      });
    }

    // Check for incomplete names
    if (lead.contactInfo.name && this.isIncompleteeName(lead.contactInfo.name)) {
      recommendations.push({
        type: 'data_capture',
        priority: 'medium',
        action: 'Capture full name for better personalization',
        reasoning: 'Only partial name available',
        timeline: 'Next interaction',
        category: 'data_improvement'
      });
    }

    return recommendations;
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if name appears incomplete (single word, etc.)
   */
  private static isIncompleteeName(name: string): boolean {
    const trimmedName = name.trim();
    return trimmedName.split(' ').length === 1 && trimmedName.length > 0;
  }

  /**
   * Get contact completeness score (0-100)
   */
  static getContactCompletenessScore(lead: Lead): number {
    let score = 0;
    let maxScore = 0;

    // Email (40 points - most important)
    maxScore += 40;
    if (lead.contactInfo.email && this.isValidEmail(lead.contactInfo.email)) {
      score += 40;
    }

    // Phone (25 points)
    maxScore += 25;
    if (lead.contactInfo.phone && lead.contactInfo.phone.trim().length > 0) {
      score += 25;
    }

    // Name (25 points)
    maxScore += 25;
    if (lead.contactInfo.name && lead.contactInfo.name.trim().length > 0) {
      score += 25;
      // Bonus for complete name
      if (!this.isIncompleteeName(lead.contactInfo.name)) {
        score += 5;
        maxScore += 5;
      }
    }

    // Company (10 points)
    maxScore += 10;
    if (lead.contactInfo.company && lead.contactInfo.company.trim().length > 0) {
      score += 10;
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Get missing contact fields
   */
  static getMissingContactFields(lead: Lead): string[] {
    const missing: string[] = [];

    if (this.isMissingEmail(lead)) missing.push('email');
    if (this.isMissingPhone(lead)) missing.push('phone');
    if (this.isMissingName(lead)) missing.push('name');
    if (this.isMissingCompany(lead)) missing.push('company');

    return missing;
  }
} 