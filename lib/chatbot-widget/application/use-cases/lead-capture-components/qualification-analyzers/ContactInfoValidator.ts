import { Lead } from '../../../../domain/entities/Lead';

/**
 * ContactInfoValidator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Validate lead contact information completeness
 * - Apply business rules for minimum contact requirements
 * - Keep under 100 lines, focused on contact validation only
 * - Use pure functions with no side effects
 * - Follow @golden-rule patterns exactly
 */

export class ContactInfoValidator {
  /**
   * Check if lead has minimum required contact information
   */
  static hasMinimumContactInfo(lead: Lead): boolean {
    const hasEmail = this.hasValidEmail(lead);
    const hasPhone = this.hasValidPhone(lead);
    
    // At least one contact method required
    return hasEmail || hasPhone;
  }

  /**
   * Check if lead has valid email address
   */
  static hasValidEmail(lead: Lead): boolean {
    return Boolean(
      lead.contactInfo.email && 
      lead.contactInfo.email.trim().length > 0 &&
      this.isValidEmailFormat(lead.contactInfo.email)
    );
  }

  /**
   * Check if lead has valid phone number
   */
  static hasValidPhone(lead: Lead): boolean {
    return Boolean(
      lead.contactInfo.phone && 
      lead.contactInfo.phone.trim().length > 0 &&
      this.isValidPhoneFormat(lead.contactInfo.phone)
    );
  }

  /**
   * Check if lead has complete contact information
   */
  static hasCompleteContactInfo(lead: Lead): boolean {
    return this.hasValidName(lead) && 
           this.hasValidEmail(lead) && 
           this.hasValidPhone(lead);
  }

  /**
   * Check if lead has valid name
   */
  static hasValidName(lead: Lead): boolean {
    return Boolean(
      lead.contactInfo.name && 
      lead.contactInfo.name.trim().length > 0
    );
  }

  /**
   * Get contact info completeness score (0-100)
   */
  static getContactInfoCompleteness(lead: Lead): number {
    let score = 0;
    const maxScore = 100;
    
    if (this.hasValidName(lead)) score += 25;
    if (this.hasValidEmail(lead)) score += 40;
    if (this.hasValidPhone(lead)) score += 35;
    
    return Math.min(score, maxScore);
  }

  /**
   * Identify missing contact information
   */
  static getMissingContactInfo(lead: Lead): string[] {
    const missing: string[] = [];
    
    if (!this.hasValidName(lead)) {
      missing.push('name');
    }
    if (!this.hasValidEmail(lead)) {
      missing.push('email');
    }
    if (!this.hasValidPhone(lead)) {
      missing.push('phone');
    }
    
    return missing;
  }

  /**
   * Basic email format validation
   */
  private static isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Basic phone format validation
   */
  private static isValidPhoneFormat(phone: string): boolean {
    // Remove all non-digit characters and check length
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10; // Minimum 10 digits for valid phone
  }
} 