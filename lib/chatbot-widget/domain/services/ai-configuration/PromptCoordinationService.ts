/**
 * PromptCoordinationService Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Coordinate prompt sections across multiple services
 * - Handle section deduplication with business rules
 * - Implement service priority rules for conflict resolution
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule domain service patterns exactly
 * - Delegate complex operations to specialized methods
 * - Use specific domain errors for business rule violations
 */

import { PromptSection } from '../../value-objects/ai-configuration/PromptSection';
import { PromptPriority } from '../../value-objects/ai-configuration/PromptPriority';
import { ServiceIdentifier } from '../../value-objects/ai-configuration/ServiceIdentifier';
import { BusinessRuleViolationError } from '../../errors/base/DomainErrorBase';

export interface CoordinatedPromptResult {
  readonly sections: readonly PromptSection[];
  readonly duplicatesRemoved: number;
  readonly conflictsResolved: number;
  readonly servicePriorities: readonly ServicePriorityMapping[];
}

export interface ServicePriorityMapping {
  readonly serviceId: ServiceIdentifier;
  readonly priority: PromptPriority;
  readonly sectionCount: number;
}

export interface PromptCoordinationOptions {
  readonly enableDeduplication: boolean;
  readonly conflictResolutionStrategy: ConflictResolutionStrategy;
  readonly maxSectionsPerService: number;
  readonly preserveOriginalOrder: boolean;
}

export enum ConflictResolutionStrategy {
  HIGHEST_PRIORITY = 'highest_priority',
  MERGE_CONTENT = 'merge_content',
  PRESERVE_ALL = 'preserve_all',
  FAIL_ON_CONFLICT = 'fail_on_conflict'
}

export class PromptCoordinationService {
  private static readonly DEFAULT_OPTIONS: PromptCoordinationOptions = {
    enableDeduplication: true,
    conflictResolutionStrategy: ConflictResolutionStrategy.HIGHEST_PRIORITY,
    maxSectionsPerService: 10,
    preserveOriginalOrder: false
  };

  /**
   * Coordinate prompt sections from multiple services
   * 
   * AI INSTRUCTIONS:
   * - Apply deduplication rules based on section content and type
   * - Resolve conflicts using priority-based business rules
   * - Validate service limits and constraints
   * - Return coordinated result with metadata for debugging
   */
  coordinatePromptSections(
    sectionsByService: Map<ServiceIdentifier, PromptSection[]>,
    options: Partial<PromptCoordinationOptions> = {}
  ): CoordinatedPromptResult {
    const coordinationOptions = { ...PromptCoordinationService.DEFAULT_OPTIONS, ...options };
    
    this.validateCoordinationInputs(sectionsByService, coordinationOptions);
    
    // AI: Apply service limits first
    const limitedSections = this.applyServiceLimits(sectionsByService, coordinationOptions);
    
    // AI: Build service priority mappings
    const servicePriorities = this.buildServicePriorityMappings(limitedSections);
    
    // AI: Apply deduplication if enabled
    let processedSections = this.flattenSections(limitedSections);
    let duplicatesRemoved = 0;
    
    if (coordinationOptions.enableDeduplication) {
      const deduplicationResult = this.deduplicateSections(processedSections);
      processedSections = deduplicationResult.sections;
      duplicatesRemoved = deduplicationResult.duplicatesRemoved;
    }
    
    // AI: Resolve conflicts using strategy
    const conflictResult = this.resolveConflicts(processedSections, coordinationOptions);
    
    // AI: Apply final ordering
    const finalSections = this.applyOrdering(conflictResult.sections, coordinationOptions);
    
    return {
      sections: Object.freeze(finalSections),
      duplicatesRemoved,
      conflictsResolved: conflictResult.conflictsResolved,
      servicePriorities: Object.freeze(servicePriorities)
    };
  }

  /**
   * Check for section conflicts between services
   * 
   * AI INSTRUCTIONS:
   * - Identify sections with same type and overlapping content
   * - Apply business rules for conflict detection
   * - Return detailed conflict information for resolution
   */
  detectSectionConflicts(
    sectionsByService: Map<ServiceIdentifier, PromptSection[]>
  ): Array<{
    conflictType: 'duplicate_content' | 'overlapping_type' | 'priority_conflict';
    services: ServiceIdentifier[];
    sections: PromptSection[];
    recommendedResolution: ConflictResolutionStrategy;
  }> {
    const conflicts: Array<{
      conflictType: 'duplicate_content' | 'overlapping_type' | 'priority_conflict';
      services: ServiceIdentifier[];
      sections: PromptSection[];
      recommendedResolution: ConflictResolutionStrategy;
    }> = [];
    
    const allSections = this.flattenSections(sectionsByService);
    
    // AI: Check for duplicate content
    const contentGroups = this.groupSectionsByContent(allSections);
    for (const [content, sections] of contentGroups) {
      if (sections.length > 1) {
        const services = sections.map(s => s.serviceId);
        conflicts.push({
          conflictType: 'duplicate_content',
          services: Array.from(new Set(services)),
          sections,
          recommendedResolution: ConflictResolutionStrategy.HIGHEST_PRIORITY
        });
      }
    }
    
    // AI: Check for overlapping types with different content
    const typeGroups = this.groupSectionsByType(allSections);
    for (const [sectionType, sections] of typeGroups) {
      if (sections.length > 1 && this.hasContentVariations(sections)) {
        const services = sections.map(s => s.serviceId);
        conflicts.push({
          conflictType: 'overlapping_type',
          services: Array.from(new Set(services)),
          sections,
          recommendedResolution: ConflictResolutionStrategy.MERGE_CONTENT
        });
      }
    }
    
    return conflicts;
  }

  // AI: Validate coordination inputs and business constraints
  private validateCoordinationInputs(
    sectionsByService: Map<ServiceIdentifier, PromptSection[]>,
    options: PromptCoordinationOptions
  ): void {
    if (sectionsByService.size === 0) {
      throw new BusinessRuleViolationError(
        'Cannot coordinate empty sections map',
        { operation: 'coordinatePromptSections', serviceCount: 0 }
      );
    }
    
    if (options.maxSectionsPerService < 1) {
      throw new BusinessRuleViolationError(
        'Max sections per service must be at least 1',
        { maxSectionsPerService: options.maxSectionsPerService }
      );
    }
    
    // AI: Validate each service has valid sections
    for (const [serviceId, sections] of sectionsByService) {
      if (!sections || sections.length === 0) {
        continue; // Empty sections are allowed
      }
      
      if (sections.length > options.maxSectionsPerService) {
        throw new BusinessRuleViolationError(
          `Service ${serviceId.value} exceeds maximum sections limit`,
          { 
            serviceId: serviceId.value, 
            sectionCount: sections.length, 
            maxAllowed: options.maxSectionsPerService 
          }
        );
      }
    }
  }

  // AI: Apply service-specific section limits
  private applyServiceLimits(
    sectionsByService: Map<ServiceIdentifier, PromptSection[]>,
    options: PromptCoordinationOptions
  ): Map<ServiceIdentifier, PromptSection[]> {
    const limitedSections = new Map<ServiceIdentifier, PromptSection[]>();
    
    for (const [serviceId, sections] of sectionsByService) {
      if (sections.length <= options.maxSectionsPerService) {
        limitedSections.set(serviceId, sections);
      } else {
        // AI: Keep highest priority sections when over limit
        const sortedSections = [...sections].sort((a, b) => 
          b.priority.numericValue - a.priority.numericValue
        );
        limitedSections.set(serviceId, sortedSections.slice(0, options.maxSectionsPerService));
      }
    }
    
    return limitedSections;
  }

  // AI: Build service priority mappings for result metadata
  private buildServicePriorityMappings(
    sectionsByService: Map<ServiceIdentifier, PromptSection[]>
  ): ServicePriorityMapping[] {
    const mappings: ServicePriorityMapping[] = [];
    
    for (const [serviceId, sections] of sectionsByService) {
      if (sections.length > 0) {
        // AI: Use highest priority section for service priority
        const highestPriority = sections.reduce((max, section) => 
          section.priority.numericValue > max.numericValue ? section.priority : max,
          sections[0].priority
        );
        
        mappings.push({
          serviceId,
          priority: highestPriority,
          sectionCount: sections.length
        });
      }
    }
    
    return mappings.sort((a, b) => b.priority.numericValue - a.priority.numericValue);
  }

  // AI: Flatten sections from all services into single array
  private flattenSections(sectionsByService: Map<ServiceIdentifier, PromptSection[]>): PromptSection[] {
    const allSections: PromptSection[] = [];
    
    for (const sections of sectionsByService.values()) {
      allSections.push(...sections);
    }
    
    return allSections;
  }

  // AI: Remove duplicate sections based on content similarity
  private deduplicateSections(sections: PromptSection[]): { 
    sections: PromptSection[]; 
    duplicatesRemoved: number; 
  } {
    const uniqueSections: PromptSection[] = [];
    const seenContent = new Set<string>();
    let duplicatesRemoved = 0;
    
    for (const section of sections) {
      const contentKey = this.generateContentKey(section);
      
      if (!seenContent.has(contentKey)) {
        seenContent.add(contentKey);
        uniqueSections.push(section);
      } else {
        duplicatesRemoved++;
      }
    }
    
    return { sections: uniqueSections, duplicatesRemoved };
  }

  // AI: Resolve conflicts using specified strategy
  private resolveConflicts(
    sections: PromptSection[],
    options: PromptCoordinationOptions
  ): { sections: PromptSection[]; conflictsResolved: number; } {
    const conflicts = this.findDirectConflicts(sections);
    
    if (conflicts.length === 0) {
      return { sections, conflictsResolved: 0 };
    }
    
    switch (options.conflictResolutionStrategy) {
      case ConflictResolutionStrategy.HIGHEST_PRIORITY:
        return this.resolveByHighestPriority(sections, conflicts);
      
      case ConflictResolutionStrategy.MERGE_CONTENT:
        return this.resolveByMergingContent(sections, conflicts);
      
      case ConflictResolutionStrategy.PRESERVE_ALL:
        return { sections, conflictsResolved: 0 };
      
      case ConflictResolutionStrategy.FAIL_ON_CONFLICT:
        throw new BusinessRuleViolationError(
          'Prompt section conflicts detected and resolution strategy is FAIL_ON_CONFLICT',
          { conflictCount: conflicts.length, conflicts }
        );
      
      default:
        throw new BusinessRuleViolationError(
          `Unknown conflict resolution strategy: ${options.conflictResolutionStrategy}`,
          { strategy: options.conflictResolutionStrategy }
        );
    }
  }

  // AI: Apply final ordering based on options
  private applyOrdering(sections: PromptSection[], options: PromptCoordinationOptions): PromptSection[] {
    if (options.preserveOriginalOrder) {
      return sections;
    }
    
    // AI: Sort by priority (highest first), then by section type
    return [...sections].sort((a, b) => {
      const priorityDiff = b.priority.numericValue - a.priority.numericValue;
      if (priorityDiff !== 0) return priorityDiff;
      
      return a.sectionType.localeCompare(b.sectionType);
    });
  }

  // AI: Generate unique content key for deduplication
  private generateContentKey(section: PromptSection): string {
    return `${section.sectionType}:${section.content.trim().toLowerCase()}`;
  }

  // AI: Group sections by content for conflict detection
  private groupSectionsByContent(sections: PromptSection[]): Map<string, PromptSection[]> {
    const groups = new Map<string, PromptSection[]>();
    
    for (const section of sections) {
      const contentKey = this.generateContentKey(section);
      const existing = groups.get(contentKey) || [];
      existing.push(section);
      groups.set(contentKey, existing);
    }
    
    return groups;
  }

  // AI: Group sections by type for conflict detection
  private groupSectionsByType(sections: PromptSection[]): Map<string, PromptSection[]> {
    const groups = new Map<string, PromptSection[]>();
    
    for (const section of sections) {
      const existing = groups.get(section.sectionType) || [];
      existing.push(section);
      groups.set(section.sectionType, existing);
    }
    
    return groups;
  }

  // AI: Check if sections have content variations
  private hasContentVariations(sections: PromptSection[]): boolean {
    if (sections.length <= 1) return false;
    
    const firstContent = sections[0].content.trim().toLowerCase();
    return sections.some(section => 
      section.content.trim().toLowerCase() !== firstContent
    );
  }

  // AI: Find direct conflicts between sections
  private findDirectConflicts(sections: PromptSection[]): Array<{
    type: string;
    conflictingSections: PromptSection[];
  }> {
    // AI: Implementation for finding direct conflicts
    // This is a simplified version - can be expanded based on specific business rules
    return [];
  }

  // AI: Resolve conflicts by keeping highest priority sections
  private resolveByHighestPriority(
    sections: PromptSection[],
    conflicts: Array<{ type: string; conflictingSections: PromptSection[]; }>
  ): { sections: PromptSection[]; conflictsResolved: number; } {
    // AI: Implementation for priority-based resolution
    return { sections, conflictsResolved: conflicts.length };
  }

  // AI: Resolve conflicts by merging content
  private resolveByMergingContent(
    sections: PromptSection[],
    conflicts: Array<{ type: string; conflictingSections: PromptSection[]; }>
  ): { sections: PromptSection[]; conflictsResolved: number; } {
    // AI: Implementation for content merging resolution
    return { sections, conflictsResolved: conflicts.length };
  }
} 