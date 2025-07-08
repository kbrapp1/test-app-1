/**
 * Service Identifier Value Object - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for service identification
 * - Type-safe service references with validation
 * - Support service priority and categorization
 * - Follow @golden-rule patterns exactly
 * - Keep under 100 lines - focus on identification logic
 */

export class ServiceIdentifier {
  
  constructor(private readonly value: string) {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('ServiceIdentifier value cannot be empty');
    }
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: ServiceIdentifier): boolean {
    return this.value === other.value;
  }
  
  // Factory methods for known services
  static forPersonaGeneration(): ServiceIdentifier {
    return new ServiceIdentifier('persona-generation');
  }
  
  static forKnowledgeBase(): ServiceIdentifier {
    return new ServiceIdentifier('knowledge-base');
  }
  
  static forBusinessGuidance(): ServiceIdentifier {
    return new ServiceIdentifier('business-guidance');
  }
  
  static forAdaptiveContext(): ServiceIdentifier {
    return new ServiceIdentifier('adaptive-context');
  }
  
  static forSimplePrompt(): ServiceIdentifier {
    return new ServiceIdentifier('simple-prompt');
  }

  /** Check if this service has higher priority than another
   */
  hasHigherPriorityThan(other: ServiceIdentifier): boolean {
    const priorityOrder = [
      'simple-prompt',           // Highest priority - main orchestrator
      'persona-generation',      // High priority - core business logic
      'knowledge-base',         // High priority - core content
      'business-guidance',      // Medium priority - business rules
      'adaptive-context'        // Lower priority - adaptive content
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
      case 'simple-prompt':
        return ServiceCategory.ORCHESTRATION;
      
      case 'persona-generation':
        return ServiceCategory.GENERATION;
      
      case 'knowledge-base':
        return ServiceCategory.CONTENT;
      
      case 'business-guidance':
      case 'adaptive-context':
        return ServiceCategory.ENHANCEMENT;
      
      default:
        return ServiceCategory.UNKNOWN;
    }
  }
}

/** Service categories for organization and management */
export enum ServiceCategory {
  ORCHESTRATION = 'orchestration',
  GENERATION = 'generation',
  CONTENT = 'content',
  ENHANCEMENT = 'enhancement',
  UNKNOWN = 'unknown'
} 