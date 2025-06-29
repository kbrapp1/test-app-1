/**
 * Lead Recommendation Value Object
 * 
 * AI INSTRUCTIONS:
 * - Domain value object representing business recommendations for leads
 * - Immutable data structure with validation and business methods
 * - Keep business logic pure, no external dependencies
 * - Use domain-specific error types for validation
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: Represent lead recommendation concepts
 */

import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError';

export interface LeadRecommendation {
  readonly type: RecommendationType;
  readonly priority: RecommendationPriority;
  readonly action: string;
  readonly reasoning: string;
  readonly timeline: string;
  readonly category: RecommendationCategory;
}

export type RecommendationType = 
  | 'immediate_follow_up'
  | 'nurture_campaign'
  | 'content_delivery'
  | 'data_capture'
  | 'qualification'
  | 'research'
  | 'disqualify';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export type RecommendationCategory = 
  | 'sales_action'
  | 'marketing_action'
  | 'data_improvement'
  | 'qualification_improvement';

/**
 * Lead Recommendation Value Object with validation and business methods
 */
export class LeadRecommendationValueObject {
  private constructor(
    private readonly _type: RecommendationType,
    private readonly _priority: RecommendationPriority,
    private readonly _action: string,
    private readonly _reasoning: string,
    private readonly _timeline: string,
    private readonly _category: RecommendationCategory
  ) {
    this.validateRecommendation();
  }

  static create(props: LeadRecommendation): LeadRecommendationValueObject {
    return new LeadRecommendationValueObject(
      props.type,
      props.priority,
      props.action,
      props.reasoning,
      props.timeline,
      props.category
    );
  }

  // Getters for immutable access
  get type(): RecommendationType { return this._type; }
  get priority(): RecommendationPriority { return this._priority; }
  get action(): string { return this._action; }
  get reasoning(): string { return this._reasoning; }
  get timeline(): string { return this._timeline; }
  get category(): RecommendationCategory { return this._category; }

  /**
   * Check if recommendation is urgent (requires immediate action)
   */
  isUrgent(): boolean {
    return this._priority === 'high' && 
           (this._timeline.toLowerCase().includes('immediate') ||
            this._timeline.toLowerCase().includes('hour'));
  }

  /**
   * Check if recommendation is sales-focused
   */
  isSalesAction(): boolean {
    return this._category === 'sales_action';
  }

  /**
   * Check if recommendation is marketing-focused
   */
  isMarketingAction(): boolean {
    return this._category === 'marketing_action';
  }

  /**
   * Get urgency score for prioritization
   */
  getUrgencyScore(): number {
    const timelineLower = this._timeline.toLowerCase();
    
    if (timelineLower.includes('immediate')) return 100;
    if (timelineLower.includes('hour')) return 80;
    if (timelineLower.includes('day')) return 60;
    if (timelineLower.includes('week')) return 40;
    
    return 20; // Default
  }

  /**
   * Convert to plain object interface
   */
  toPlainObject(): LeadRecommendation {
    return {
      type: this._type,
      priority: this._priority,
      action: this._action,
      reasoning: this._reasoning,
      timeline: this._timeline,
      category: this._category
    };
  }

  /**
   * Validate recommendation data
   */
  private validateRecommendation(): void {
    if (!this._action || this._action.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Recommendation action cannot be empty',
        { 
          type: this._type,
          action: this._action 
        }
      );
    }

    if (!this._reasoning || this._reasoning.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Recommendation reasoning cannot be empty',
        { 
          type: this._type,
          reasoning: this._reasoning 
        }
      );
    }

    if (!this._timeline || this._timeline.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Recommendation timeline cannot be empty',
        { 
          type: this._type,
          timeline: this._timeline 
        }
      );
    }

    if (this._action.length > 200) {
      throw new BusinessRuleViolationError(
        'Recommendation action too long',
        { 
          type: this._type,
          actionLength: this._action.length,
          maxLength: 200
        }
      );
    }
  }

  /**
   * Check if two recommendations are equal
   */
  equals(other: LeadRecommendationValueObject): boolean {
    return this._type === other._type &&
           this._priority === other._priority &&
           this._action === other._action &&
           this._reasoning === other._reasoning &&
           this._timeline === other._timeline &&
           this._category === other._category;
  }
} 