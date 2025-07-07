/**
 * ServiceIdentifier Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for identifying services in prompt coordination
 * - Include validation for service identifier format
 * - Support equality comparison and serialization
 * - Follow @golden-rule value object patterns exactly
 * - Keep business logic pure, no external dependencies
 */

import { BusinessRuleViolationError } from '../../errors/base/DomainErrorBase';

export class ServiceIdentifier {
  private constructor(public readonly value: string) {
    this.validateInvariants();
  }

  /**
   * Create ServiceIdentifier with validation
   * 
   * AI INSTRUCTIONS:
   * - Validate service identifier format and constraints
   * - Use specific domain errors for violations
   * - Ensure immutability of created instance
   */
  static create(value: string): ServiceIdentifier {
    return new ServiceIdentifier(value);
  }

  /**
   * Create ServiceIdentifier from known service types
   * 
   * AI INSTRUCTIONS:
   * - Provide factory methods for common service types
   * - Ensure consistent naming conventions
   * - Support service discovery and coordination
   */
  static forPersonaGeneration(): ServiceIdentifier {
    return new ServiceIdentifier('persona-generation');
  }

  static forKnowledgeBase(): ServiceIdentifier {
    return new ServiceIdentifier('knowledge-base');
  }

  static forDynamicPrompt(): ServiceIdentifier {
    return new ServiceIdentifier('dynamic-prompt');
  }

  static forPromptCoordination(): ServiceIdentifier {
    return new ServiceIdentifier('prompt-coordination');
  }

  static forIdentityResolution(): ServiceIdentifier {
    return new ServiceIdentifier('identity-resolution');
  }

  static forContentDeduplication(): ServiceIdentifier {
    return new ServiceIdentifier('content-deduplication');
  }

  /**
   * Check if this service has higher priority than another
   * 
   * AI INSTRUCTIONS:
   * - Apply business rules for service priority ordering
   * - Support conflict resolution workflows
   * - Use consistent priority rules across system
   */
  hasHigherPriorityThan(other: ServiceIdentifier): boolean {
    const priorityOrder = [
      'prompt-coordination',      // Highest priority - orchestrates others
      'identity-resolution',      // High priority - resolves conflicts
      'content-deduplication',    // High priority - removes duplicates
      'persona-generation',       // Medium priority - core business logic
      'knowledge-base',          // Medium priority - core content
      'dynamic-prompt'           // Lower priority - dynamic content
    ];

    const thisPriority = priorityOrder.indexOf(this.value);
    const otherPriority = priorityOrder.indexOf(other.value);

    // AI: Unknown services get lowest priority
    const thisIndex = thisPriority === -1 ? priorityOrder.length : thisPriority;
    const otherIndex = otherPriority === -1 ? priorityOrder.length : otherPriority;

    return thisIndex < otherIndex; // Lower index = higher priority
  }

  /**
   * Get service category for grouping and organization
   * 
   * AI INSTRUCTIONS:
   * - Categorize services for business logic and UI grouping
   * - Support service discovery and management
   * - Use consistent categorization rules
   */
  get category(): ServiceCategory {
    switch (this.value) {
      case 'prompt-coordination':
      case 'identity-resolution':
      case 'content-deduplication':
        return ServiceCategory.COORDINATION;
      
      case 'persona-generation':
      case 'dynamic-prompt':
        return ServiceCategory.GENERATION;
      
      case 'knowledge-base':
        return ServiceCategory.CONTENT;
      
      default:
        return ServiceCategory.UNKNOWN;
    }
  }

  /**
   * Value object equality comparison
   * 
   * AI INSTRUCTIONS:
   * - Compare values for equality
   * - Support Set and Map operations
   * - Follow value object equality patterns
   */
  equals(other: ServiceIdentifier): boolean {
    return this.value === other.value;
  }

  /**
   * String representation for logging and debugging
   */
  toString(): string {
    return this.value;
  }

  // AI: Validate business invariants for ServiceIdentifier
  private validateInvariants(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'ServiceIdentifier must have a valid value',
        { value: this.value }
      );
    }

    if (this.value.length > 50) {
      throw new BusinessRuleViolationError(
        'ServiceIdentifier cannot exceed 50 characters',
        { value: this.value, length: this.value.length }
      );
    }

    if (!/^[a-z0-9-]+$/.test(this.value)) {
      throw new BusinessRuleViolationError(
        'ServiceIdentifier must contain only lowercase letters, numbers, and hyphens',
        { value: this.value }
      );
    }

    if (this.value.startsWith('-') || this.value.endsWith('-')) {
      throw new BusinessRuleViolationError(
        'ServiceIdentifier cannot start or end with hyphens',
        { value: this.value }
      );
    }
  }
}

export enum ServiceCategory {
  COORDINATION = 'coordination',
  GENERATION = 'generation',
  CONTENT = 'content',
  UNKNOWN = 'unknown'
} 