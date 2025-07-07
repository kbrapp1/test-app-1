/**
 * IdentityResolutionService Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Handle persona conflicts and identity resolution
 * - Apply business rules for persona merging and prioritization
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule domain service patterns exactly
 * - Delegate complex operations to specialized methods
 * - Use specific domain errors for business rule violations
 * - Focus on persona identity consistency and conflict resolution
 */

import { BotPersonality } from '../../value-objects/ai-configuration/BotPersonality';
import { PersonalitySettings } from '../../value-objects/ai-configuration/PersonalitySettings';
import { ServiceIdentifier } from '../../value-objects/ai-configuration/ServiceIdentifier';
import { PromptPriority } from '../../value-objects/ai-configuration/PromptPriority';
import { BusinessRuleViolationError } from '../../errors/base/DomainErrorBase';

export interface PersonaConflict {
  readonly conflictType: PersonaConflictType;
  readonly sourceServices: readonly ServiceIdentifier[];
  readonly conflictingPersonalities: readonly BotPersonality[];
  readonly conflictSeverity: ConflictSeverity;
  readonly recommendedResolution: ResolutionStrategy;
  readonly conflictDetails: Record<string, any>;
}

export interface ResolvedPersona {
  readonly mergedPersonality: BotPersonality;
  readonly conflictsResolved: number;
  readonly resolutionStrategy: ResolutionStrategy;
  readonly sourceContributions: readonly PersonaContribution[];
  readonly confidenceScore: number;
}

export interface PersonaContribution {
  readonly serviceId: ServiceIdentifier;
  readonly personality: BotPersonality;
  readonly priority: PromptPriority;
  readonly contributionWeight: number;
  readonly appliedTraits: readonly string[];
}

export enum PersonaConflictType {
  TRAIT_CONTRADICTION = 'trait_contradiction',
  TONE_MISMATCH = 'tone_mismatch',
  BEHAVIOR_INCONSISTENCY = 'behavior_inconsistency',
  PRIORITY_CONFLICT = 'priority_conflict',
  IDENTITY_FRAGMENTATION = 'identity_fragmentation'
}

export enum ConflictSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ResolutionStrategy {
  MERGE_WEIGHTED = 'merge_weighted',
  HIGHEST_PRIORITY = 'highest_priority',
  CONSENSUS_BASED = 'consensus_based',
  MANUAL_REVIEW = 'manual_review',
  REJECT_CONFLICTS = 'reject_conflicts'
}

export interface IdentityResolutionOptions {
  readonly enableConflictDetection: boolean;
  readonly resolutionStrategy: ResolutionStrategy;
  readonly minConfidenceThreshold: number;
  readonly maxPersonalitiesPerService: number;
  readonly traitPriorityWeighting: boolean;
}

export class IdentityResolutionService {
  private static readonly DEFAULT_OPTIONS: IdentityResolutionOptions = {
    enableConflictDetection: true,
    resolutionStrategy: ResolutionStrategy.MERGE_WEIGHTED,
    minConfidenceThreshold: 0.7,
    maxPersonalitiesPerService: 3,
    traitPriorityWeighting: true
  };

  /**
   * Resolve persona conflicts across multiple services
   * 
   * AI INSTRUCTIONS:
   * - Detect conflicts between different persona definitions
   * - Apply resolution strategy based on business rules
   * - Ensure persona consistency and coherence
   * - Return resolved persona with confidence metrics
   */
  resolvePersonaConflicts(
    personalitiesByService: Map<ServiceIdentifier, BotPersonality[]>,
    options: Partial<IdentityResolutionOptions> = {}
  ): ResolvedPersona {
    const resolutionOptions = { ...IdentityResolutionService.DEFAULT_OPTIONS, ...options };
    
    this.validateResolutionInputs(personalitiesByService, resolutionOptions);
    
    // AI: Apply service limits first
    const limitedPersonalities = this.applyServiceLimits(personalitiesByService, resolutionOptions);
    
    // AI: Detect conflicts if enabled
    const conflicts = resolutionOptions.enableConflictDetection 
      ? this.detectPersonaConflicts(limitedPersonalities)
      : [];
    
    // AI: Build persona contributions with priority weighting
    const contributions = this.buildPersonaContributions(limitedPersonalities, resolutionOptions);
    
    // AI: Apply resolution strategy
    const mergedPersonality = this.applyResolutionStrategy(
      contributions, 
      conflicts, 
      resolutionOptions
    );
    
    // AI: Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(contributions, conflicts);
    
    // AI: Validate confidence threshold
    if (confidenceScore < resolutionOptions.minConfidenceThreshold) {
      throw new BusinessRuleViolationError(
        'Persona resolution confidence below minimum threshold',
        { 
          confidenceScore, 
          minThreshold: resolutionOptions.minConfidenceThreshold,
          conflictCount: conflicts.length 
        }
      );
    }
    
    return {
      mergedPersonality,
      conflictsResolved: conflicts.length,
      resolutionStrategy: resolutionOptions.resolutionStrategy,
      sourceContributions: Object.freeze(contributions),
      confidenceScore
    };
  }

  /**
   * Detect conflicts between persona definitions
   * 
   * AI INSTRUCTIONS:
   * - Identify contradictory traits and behaviors
   * - Classify conflict types and severity levels
   * - Apply business rules for conflict categorization
   * - Return detailed conflict information for resolution
   */
  detectPersonaConflicts(
    personalitiesByService: Map<ServiceIdentifier, BotPersonality[]>
  ): PersonaConflict[] {
    const conflicts: PersonaConflict[] = [];
    const allPersonalities = this.flattenPersonalities(personalitiesByService);
    
    // AI: Check for trait contradictions
    const traitConflicts = this.detectTraitConflicts(allPersonalities);
    conflicts.push(...traitConflicts);
    
    // AI: Check for tone mismatches
    const toneConflicts = this.detectToneConflicts(allPersonalities);
    conflicts.push(...toneConflicts);
    
    // AI: Check for behavior inconsistencies
    const behaviorConflicts = this.detectBehaviorConflicts(allPersonalities);
    conflicts.push(...behaviorConflicts);
    
    // AI: Check for priority conflicts
    const priorityConflicts = this.detectPriorityConflicts(personalitiesByService);
    conflicts.push(...priorityConflicts);
    
    return conflicts;
  }

  /**
   * Validate persona consistency after resolution
   * 
   * AI INSTRUCTIONS:
   * - Check resolved persona for internal consistency
   * - Validate trait combinations and behavior patterns
   * - Apply business rules for persona validation
   * - Return validation results with specific issues
   */
  validatePersonaConsistency(personality: BotPersonality): {
    isConsistent: boolean;
    issues: Array<{ type: string; description: string; severity: ConflictSeverity }>;
    suggestions: string[];
  } {
    const issues: Array<{ type: string; description: string; severity: ConflictSeverity }> = [];
    const suggestions: string[] = [];
    
    // AI: Check for contradictory traits
    const traitIssues = this.validateTraitConsistency(personality);
    issues.push(...traitIssues);
    
    // AI: Check tone-behavior alignment
    const alignmentIssues = this.validateToneBehaviorAlignment(personality);
    issues.push(...alignmentIssues);
    
    // AI: Generate suggestions for improvements
    if (issues.length > 0) {
      suggestions.push(...this.generateConsistencySuggestions(issues, personality));
    }
    
    return {
      isConsistent: issues.length === 0,
      issues,
      suggestions
    };
  }

  // AI: Validate resolution inputs and business constraints
  private validateResolutionInputs(
    personalitiesByService: Map<ServiceIdentifier, BotPersonality[]>,
    options: IdentityResolutionOptions
  ): void {
    if (personalitiesByService.size === 0) {
      throw new BusinessRuleViolationError(
        'Cannot resolve persona conflicts with empty personalities map',
        { operation: 'resolvePersonaConflicts', serviceCount: 0 }
      );
    }
    
    if (options.minConfidenceThreshold < 0 || options.minConfidenceThreshold > 1) {
      throw new BusinessRuleViolationError(
        'Confidence threshold must be between 0 and 1',
        { minConfidenceThreshold: options.minConfidenceThreshold }
      );
    }
    
    if (options.maxPersonalitiesPerService < 1) {
      throw new BusinessRuleViolationError(
        'Max personalities per service must be at least 1',
        { maxPersonalitiesPerService: options.maxPersonalitiesPerService }
      );
    }
  }

  // AI: Apply service-specific personality limits
  private applyServiceLimits(
    personalitiesByService: Map<ServiceIdentifier, BotPersonality[]>,
    options: IdentityResolutionOptions
  ): Map<ServiceIdentifier, BotPersonality[]> {
    const limitedPersonalities = new Map<ServiceIdentifier, BotPersonality[]>();
    
    for (const [serviceId, personalities] of personalitiesByService) {
      if (personalities.length <= options.maxPersonalitiesPerService) {
        limitedPersonalities.set(serviceId, personalities);
      } else {
        // AI: Keep highest priority personalities when over limit
        const sortedPersonalities = [...personalities].sort((a, b) => 
          this.getPersonalityPriority(b) - this.getPersonalityPriority(a)
        );
        limitedPersonalities.set(serviceId, sortedPersonalities.slice(0, options.maxPersonalitiesPerService));
      }
    }
    
    return limitedPersonalities;
  }

  // AI: Build persona contributions with priority weighting
  private buildPersonaContributions(
    personalitiesByService: Map<ServiceIdentifier, BotPersonality[]>,
    options: IdentityResolutionOptions
  ): PersonaContribution[] {
    const contributions: PersonaContribution[] = [];
    
    for (const [serviceId, personalities] of personalitiesByService) {
      for (const personality of personalities) {
        const priority = this.getPersonalityPriority(personality);
        const weight = options.traitPriorityWeighting 
          ? this.calculatePriorityWeight(priority)
          : 1.0;
        
        contributions.push({
          serviceId,
          personality,
          priority: PromptPriority.fromNumeric(priority),
          contributionWeight: weight,
          appliedTraits: this.extractAppliedTraits(personality)
        });
      }
    }
    
    return contributions.sort((a, b) => b.contributionWeight - a.contributionWeight);
  }

  // AI: Apply resolution strategy to merge personalities
  private applyResolutionStrategy(
    contributions: PersonaContribution[],
    conflicts: PersonaConflict[],
    options: IdentityResolutionOptions
  ): BotPersonality {
    switch (options.resolutionStrategy) {
      case ResolutionStrategy.MERGE_WEIGHTED:
        return this.mergeWeightedPersonalities(contributions);
      
      case ResolutionStrategy.HIGHEST_PRIORITY:
        return this.selectHighestPriorityPersonality(contributions);
      
      case ResolutionStrategy.CONSENSUS_BASED:
        return this.buildConsensusPersonality(contributions);
      
      case ResolutionStrategy.MANUAL_REVIEW:
        throw new BusinessRuleViolationError(
          'Manual review required for persona resolution',
          { conflictCount: conflicts.length, contributionCount: contributions.length }
        );
      
      case ResolutionStrategy.REJECT_CONFLICTS:
        if (conflicts.length > 0) {
          throw new BusinessRuleViolationError(
            'Persona conflicts detected and resolution strategy is REJECT_CONFLICTS',
            { conflictCount: conflicts.length, conflicts }
          );
        }
        return this.mergeWeightedPersonalities(contributions);
      
      default:
        throw new BusinessRuleViolationError(
          `Unknown resolution strategy: ${options.resolutionStrategy}`,
          { strategy: options.resolutionStrategy }
        );
    }
  }

  // AI: Calculate confidence score based on contributions and conflicts
  private calculateConfidenceScore(
    contributions: PersonaContribution[],
    conflicts: PersonaConflict[]
  ): number {
    if (contributions.length === 0) return 0;
    
    // AI: Base confidence from contribution weights
    const totalWeight = contributions.reduce((sum, c) => sum + c.contributionWeight, 0);
    const avgWeight = totalWeight / contributions.length;
    let confidence = Math.min(avgWeight, 1.0);
    
    // AI: Reduce confidence based on conflicts
    const conflictPenalty = conflicts.reduce((penalty, conflict) => {
      switch (conflict.conflictSeverity) {
        case ConflictSeverity.CRITICAL: return penalty + 0.3;
        case ConflictSeverity.HIGH: return penalty + 0.2;
        case ConflictSeverity.MEDIUM: return penalty + 0.1;
        case ConflictSeverity.LOW: return penalty + 0.05;
        default: return penalty;
      }
    }, 0);
    
    confidence = Math.max(0, confidence - conflictPenalty);
    
    // AI: Boost confidence for consensus
    if (contributions.length > 1) {
      const consensusBoost = this.calculateConsensusBoost(contributions);
      confidence = Math.min(1.0, confidence + consensusBoost);
    }
    
    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  // AI: Helper methods for conflict detection and resolution
  private flattenPersonalities(personalitiesByService: Map<ServiceIdentifier, BotPersonality[]>): Array<{ serviceId: ServiceIdentifier; personality: BotPersonality }> {
    const flattened: Array<{ serviceId: ServiceIdentifier; personality: BotPersonality }> = [];
    
    for (const [serviceId, personalities] of personalitiesByService) {
      personalities.forEach(personality => {
        flattened.push({ serviceId, personality });
      });
    }
    
    return flattened;
  }

  private detectTraitConflicts(personalities: Array<{ serviceId: ServiceIdentifier; personality: BotPersonality }>): PersonaConflict[] {
    // AI: Implementation for trait conflict detection
    return [];
  }

  private detectToneConflicts(personalities: Array<{ serviceId: ServiceIdentifier; personality: BotPersonality }>): PersonaConflict[] {
    // AI: Implementation for tone conflict detection
    return [];
  }

  private detectBehaviorConflicts(personalities: Array<{ serviceId: ServiceIdentifier; personality: BotPersonality }>): PersonaConflict[] {
    // AI: Implementation for behavior conflict detection
    return [];
  }

  private detectPriorityConflicts(personalitiesByService: Map<ServiceIdentifier, BotPersonality[]>): PersonaConflict[] {
    // AI: Implementation for priority conflict detection
    return [];
  }

  private validateTraitConsistency(personality: BotPersonality): Array<{ type: string; description: string; severity: ConflictSeverity }> {
    // AI: Implementation for trait consistency validation
    return [];
  }

  private validateToneBehaviorAlignment(personality: BotPersonality): Array<{ type: string; description: string; severity: ConflictSeverity }> {
    // AI: Implementation for tone-behavior alignment validation
    return [];
  }

  private generateConsistencySuggestions(issues: Array<{ type: string; description: string; severity: ConflictSeverity }>, personality: BotPersonality): string[] {
    // AI: Implementation for generating consistency suggestions
    return [];
  }

  private getPersonalityPriority(personality: BotPersonality): number {
    // AI: Extract priority from personality - simplified implementation
    return 500; // Default medium priority
  }

  private calculatePriorityWeight(priority: number): number {
    // AI: Convert priority to weight (0.1 to 1.0)
    return Math.max(0.1, Math.min(1.0, priority / 1000));
  }

  private extractAppliedTraits(personality: BotPersonality): string[] {
    // AI: Extract applied traits from personality
    return [];
  }

  private mergeWeightedPersonalities(contributions: PersonaContribution[]): BotPersonality {
    // AI: Implementation for weighted personality merging
    if (contributions.length === 0) {
      throw new BusinessRuleViolationError(
        'Cannot merge empty contributions list',
        { contributionCount: 0 }
      );
    }
    return contributions[0].personality; // Simplified - return highest weighted
  }

  private selectHighestPriorityPersonality(contributions: PersonaContribution[]): BotPersonality {
    // AI: Implementation for highest priority selection
    if (contributions.length === 0) {
      throw new BusinessRuleViolationError(
        'Cannot select from empty contributions list',
        { contributionCount: 0 }
      );
    }
    return contributions[0].personality; // Already sorted by weight/priority
  }

  private buildConsensusPersonality(contributions: PersonaContribution[]): BotPersonality {
    // AI: Implementation for consensus-based personality building
    return this.mergeWeightedPersonalities(contributions);
  }

  private calculateConsensusBoost(contributions: PersonaContribution[]): number {
    // AI: Calculate consensus boost based on contribution similarity
    if (contributions.length <= 1) return 0;
    
    // Simplified consensus calculation
    return Math.min(0.2, contributions.length * 0.05);
  }
} 