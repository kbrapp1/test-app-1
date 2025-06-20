import { ScoringFactors, ScoringCriteria } from '../../value-objects/lead-management/LeadScoreTypes';

/**
 * Lead Score Validation Service
 * Domain Service: Pure business logic for validating scoring inputs
 * Following DDD principles: Single responsibility for validation
 */
export class LeadScoreValidationService {
  
  /**
   * Validate scoring factors for calculation
   */
  static validateScoringFactors(factors: ScoringFactors): void {
    if (typeof factors.answeredQuestionsCount !== 'number' || factors.answeredQuestionsCount < 0) {
      throw new Error('answeredQuestionsCount must be a non-negative number');
    }

    if (typeof factors.totalQuestionsCount !== 'number' || factors.totalQuestionsCount < 0) {
      throw new Error('totalQuestionsCount must be a non-negative number');
    }

    if (factors.answeredQuestionsCount > factors.totalQuestionsCount) {
      throw new Error('answeredQuestionsCount cannot exceed totalQuestionsCount');
    }

    if (typeof factors.engagementScore !== 'number' || factors.engagementScore < 0 || factors.engagementScore > 100) {
      throw new Error('engagementScore must be a number between 0 and 100');
    }

    if (typeof factors.conversationLength !== 'number' || factors.conversationLength < 0) {
      throw new Error('conversationLength must be a non-negative number');
    }

    if (typeof factors.sessionDuration !== 'number' || factors.sessionDuration < 0) {
      throw new Error('sessionDuration must be a non-negative number');
    }

    // Validate boolean fields
    this.validateBooleanField(factors.hasContactInfo, 'hasContactInfo');
    this.validateBooleanField(factors.hasBudgetInfo, 'hasBudgetInfo');
    this.validateBooleanField(factors.hasTimelineInfo, 'hasTimelineInfo');
    this.validateBooleanField(factors.hasIndustryInfo, 'hasIndustryInfo');
    this.validateBooleanField(factors.hasCompanySizeInfo, 'hasCompanySizeInfo');
  }

  /**
   * Validate scoring criteria weights
   */
  static validateScoringCriteria(criteria: ScoringCriteria): void {
    const weights = [
      criteria.questionAnswerWeight,
      criteria.engagementWeight,
      criteria.contactInfoWeight,
      criteria.budgetTimelineWeight,
      criteria.industryCompanySizeWeight
    ];

    weights.forEach((weight, index) => {
      if (typeof weight !== 'number' || weight < 0 || weight > 1) {
        throw new Error(`Weight at index ${index} must be a number between 0 and 1`);
      }
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) { // Allow for floating point precision
      throw new Error(`Total weights must sum to 1, got ${totalWeight}`);
    }
  }

  /**
   * Validate LeadScore constructor parameters
   */
  static validateLeadScoreParams(score: number, qualificationLevel: any, breakdown: any, calculatedAt: Date): void {
    const MIN_SCORE = 0;
    const MAX_SCORE = 100;
    
    if (typeof score !== 'number' || score < MIN_SCORE || score > MAX_SCORE) {
      throw new Error(`Score must be a number between ${MIN_SCORE} and ${MAX_SCORE}`);
    }

    if (!this.isValidQualificationLevel(qualificationLevel)) {
      throw new Error(`Invalid qualification level: ${qualificationLevel}`);
    }

    if (!breakdown) {
      throw new Error('Score breakdown is required');
    }

    if (!(calculatedAt instanceof Date)) {
      throw new Error('calculatedAt must be a Date');
    }
  }

  /**
   * Check if qualification level is valid
   */
  private static isValidQualificationLevel(level: any): boolean {
    const validLevels = ['not_qualified', 'qualified', 'highly_qualified', 'disqualified'];
    return validLevels.includes(level);
  }

  /**
   * Validate boolean field
   */
  private static validateBooleanField(value: any, fieldName: string): void {
    if (typeof value !== 'boolean') {
      throw new Error(`${fieldName} must be a boolean`);
    }
  }
} 