/**
 * PromptPriority Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for prompt section priority ordering
 * - Include validation for priority ranges and business rules
 * - Support comparison operations for sorting and conflict resolution
 * - Follow @golden-rule value object patterns exactly
 * - Keep business logic pure, no external dependencies
 */

import { BusinessRuleViolationError } from '../../errors/base/DomainErrorBase';

export class PromptPriority {
  private constructor(
    public readonly numericValue: number,
    public readonly label: string
  ) {
    this.validateInvariants();
  }

  /**
   * Create PromptPriority with validation
   * 
   * AI INSTRUCTIONS:
   * - Validate priority value and label constraints
   * - Use specific domain errors for violations
   * - Ensure immutability of created instance
   */
  static create(numericValue: number, label: string = ''): PromptPriority {
    const defaultLabel = label || PromptPriority.getDefaultLabel(numericValue);
    return new PromptPriority(numericValue, defaultLabel);
  }

  /**
   * Create predefined priority levels
   * 
   * AI INSTRUCTIONS:
   * - Provide factory methods for standard priority levels
   * - Ensure consistent priority values across system
   * - Support business rule implementation
   */
  static critical(): PromptPriority {
    return new PromptPriority(1000, 'Critical');
  }

  static high(): PromptPriority {
    return new PromptPriority(800, 'High');
  }

  static medium(): PromptPriority {
    return new PromptPriority(500, 'Medium');
  }

  static low(): PromptPriority {
    return new PromptPriority(200, 'Low');
  }

  static minimal(): PromptPriority {
    return new PromptPriority(100, 'Minimal');
  }

  /**
   * Create priority from numeric value with automatic labeling
   * 
   * AI INSTRUCTIONS:
   * - Support custom priority values while maintaining consistency
   * - Apply business rules for priority categorization
   * - Ensure proper validation and labeling
   */
  static fromNumeric(value: number): PromptPriority {
    return new PromptPriority(value, PromptPriority.getDefaultLabel(value));
  }

  /**
   * Compare priority levels
   * 
   * AI INSTRUCTIONS:
   * - Support sorting and conflict resolution operations
   * - Higher numeric value = higher priority
   * - Follow consistent comparison patterns
   */
  isHigherThan(other: PromptPriority): boolean {
    return this.numericValue > other.numericValue;
  }

  isLowerThan(other: PromptPriority): boolean {
    return this.numericValue < other.numericValue;
  }

  isEqualTo(other: PromptPriority): boolean {
    return this.numericValue === other.numericValue;
  }

  /**
   * Get priority category for business logic
   * 
   * AI INSTRUCTIONS:
   * - Categorize priorities for business rule application
   * - Support priority-based workflow decisions
   * - Use consistent categorization rules
   */
  get category(): PriorityCategory {
    if (this.numericValue >= 900) return PriorityCategory.CRITICAL;
    if (this.numericValue >= 700) return PriorityCategory.HIGH;
    if (this.numericValue >= 400) return PriorityCategory.MEDIUM;
    if (this.numericValue >= 150) return PriorityCategory.LOW;
    return PriorityCategory.MINIMAL;
  }

  /**
   * Check if priority is above threshold for business rules
   * 
   * AI INSTRUCTIONS:
   * - Support business rule evaluation based on priority
   * - Enable threshold-based decision making
   * - Consistent with system priority policies
   */
  isAboveThreshold(threshold: PromptPriority): boolean {
    return this.numericValue >= threshold.numericValue;
  }

  /**
   * Create adjusted priority with offset
   * 
   * AI INSTRUCTIONS:
   * - Return new immutable instance with adjusted priority
   * - Preserve label consistency with new value
   * - Validate adjusted value against constraints
   */
  adjustBy(offset: number): PromptPriority {
    const newValue = this.numericValue + offset;
    return new PromptPriority(newValue, PromptPriority.getDefaultLabel(newValue));
  }

  /**
   * Create priority with custom label
   * 
   * AI INSTRUCTIONS:
   * - Return new immutable instance with updated label
   * - Preserve numeric value unchanged
   * - Validate label constraints
   */
  withLabel(newLabel: string): PromptPriority {
    return new PromptPriority(this.numericValue, newLabel);
  }

  /**
   * Value object equality comparison
   * 
   * AI INSTRUCTIONS:
   * - Compare numeric values for equality
   * - Support Set and Map operations
   * - Follow value object equality patterns
   */
  equals(other: PromptPriority): boolean {
    return this.numericValue === other.numericValue;
  }

  /**
   * String representation for logging and debugging
   */
  toString(): string {
    return `${this.label} (${this.numericValue})`;
  }

  // AI: Get default label based on numeric value
  private static getDefaultLabel(numericValue: number): string {
    if (numericValue >= 900) return 'Critical';
    if (numericValue >= 700) return 'High';
    if (numericValue >= 400) return 'Medium';
    if (numericValue >= 150) return 'Low';
    return 'Minimal';
  }

  // AI: Validate business invariants for PromptPriority
  private validateInvariants(): void {
    if (!Number.isInteger(this.numericValue)) {
      throw new BusinessRuleViolationError(
        'PromptPriority numeric value must be an integer',
        { numericValue: this.numericValue }
      );
    }

    if (this.numericValue < 1 || this.numericValue > 1000) {
      throw new BusinessRuleViolationError(
        'PromptPriority numeric value must be between 1 and 1000',
        { numericValue: this.numericValue }
      );
    }

    if (!this.label || this.label.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'PromptPriority must have a valid label',
        { label: this.label, numericValue: this.numericValue }
      );
    }

    if (this.label.length > 20) {
      throw new BusinessRuleViolationError(
        'PromptPriority label cannot exceed 20 characters',
        { label: this.label, length: this.label.length }
      );
    }
  }
}

export enum PriorityCategory {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal'
} 