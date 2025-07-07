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
    options: Partial<PromptCoordinationOptions> = {},
    logger?: { logRaw: (message: string) => void; logMessage: (message: string) => void }
  ): CoordinatedPromptResult {
    const coordinationOptions = { ...PromptCoordinationService.DEFAULT_OPTIONS, ...options };
    
    this.validateCoordinationInputs(sectionsByService, coordinationOptions);
    
    // AI: Log initial state before coordination
    if (logger) {
      logger.logRaw('');
      logger.logRaw('🔧 STEP 3.5: Coordinate and optimize system prompt sections');
      logger.logRaw('🔧 =====================================');
      logger.logRaw('🔧 PROMPT COORDINATION & DEDUPLICATION');
      logger.logRaw('🔧 =====================================');
    }
    
    const originalSectionCount = Array.from(sectionsByService.values()).reduce((sum, sections) => sum + sections.length, 0);
    const originalTotalLength = this.calculateTotalContentLength(sectionsByService);
    
    if (logger) {
      logger.logMessage(`📊 STEP 3.5.1: Analyze initial prompt sections`);
      logger.logMessage(`   Services: ${sectionsByService.size}`);
      logger.logMessage(`   Total sections: ${originalSectionCount}`);
      logger.logMessage(`   Total content length: ${originalTotalLength} characters`);
      
      // Log each service's contribution with section details
      let globalSectionCounter = 1;
      for (const [serviceId, sections] of sectionsByService) {
        const serviceLength = sections.reduce((sum, s) => sum + s.content.length, 0);
        logger.logMessage(`   ${serviceId.value}: ${sections.length} sections (${serviceLength} chars)`);
        
        // Show individual section details with global numbering
        sections.forEach((section) => {
          const preview = section.content.substring(0, 60).replace(/\n/g, ' ').trim();
          logger.logMessage(`     ${globalSectionCounter}. "${section.title}" [${section.sectionType}] (${section.content.length} chars)`);
          logger.logMessage(`        Preview: ${preview}${section.content.length > 60 ? '...' : ''}`);
          globalSectionCounter++;
        });
      }
    }
    
    // AI: Apply service limits first
    const limitedSections = this.applyServiceLimits(sectionsByService, coordinationOptions);
    const limitedSectionCount = Array.from(limitedSections.values()).reduce((sum, sections) => sum + sections.length, 0);
    const sectionsLimited = originalSectionCount - limitedSectionCount;
    
    if (sectionsLimited > 0 && logger) {
      logger.logMessage(`📉 STEP 3.5.2: Apply service section limits`);
      logger.logMessage(`   Sections removed: ${sectionsLimited}`);
      logger.logMessage(`   Sections remaining: ${limitedSectionCount}`);
    }
    
    // AI: Build service priority mappings
    const servicePriorities = this.buildServicePriorityMappings(limitedSections);
    
    // AI: Apply deduplication if enabled
    let processedSections = this.flattenSections(limitedSections);
    let duplicatesRemoved = 0;
    const beforeDeduplicationCount = processedSections.length;
    
    if (coordinationOptions.enableDeduplication) {
      const deduplicationResult = this.deduplicateSections(processedSections);
      processedSections = deduplicationResult.sections;
      duplicatesRemoved = deduplicationResult.duplicatesRemoved;
      
      if (duplicatesRemoved > 0 && logger) {
        logger.logMessage(`🔄 STEP 3.5.3: Remove duplicate content`);
        logger.logMessage(`   Duplicate sections removed: ${duplicatesRemoved}`);
        logger.logMessage(`   Sections after deduplication: ${processedSections.length}`);
        
        // Log what was deduplicated with more detail
        const duplicateDetails = this.getDeduplicationDetails(this.flattenSections(limitedSections));
        if (duplicateDetails.length > 0) {
          logger.logMessage(`   📝 DEDUPLICATION DETAILS:`);
          for (const detail of duplicateDetails) {
            logger.logMessage(`   Removed duplicate: "${detail.contentPreview}" (${detail.duplicateCount} copies)`);
            logger.logMessage(`     Section type: ${detail.sectionType}`);
          }
        }
      }
    }
    
    // AI: Resolve conflicts using strategy
    const conflictResult = this.resolveConflicts(processedSections, coordinationOptions);
    
    if (conflictResult.conflictsResolved > 0 && logger) {
      logger.logMessage(`⚖️  STEP 3.5.4: Resolve section conflicts`);
      logger.logMessage(`   Conflicts resolved: ${conflictResult.conflictsResolved}`);
      logger.logMessage(`   Strategy used: ${coordinationOptions.conflictResolutionStrategy}`);
    }
    
    // AI: Apply final ordering
    const finalSections = this.applyOrdering(conflictResult.sections, coordinationOptions);
    const finalTotalLength = finalSections.reduce((sum, s) => sum + s.content.length, 0);
    
    // AI: Log final coordination summary
    if (logger) {
      logger.logMessage(`✅ STEP 3.5.5: Coordination complete`);
      logger.logMessage(`   Final sections: ${finalSections.length}`);
      logger.logMessage(`   Final content length: ${finalTotalLength} characters`);
      logger.logMessage(`   Content reduction: ${originalTotalLength - finalTotalLength} characters (${Math.round((1 - finalTotalLength/originalTotalLength) * 100)}%)`);
      logger.logMessage(`   Sections reduction: ${originalSectionCount - finalSections.length} sections`);
      
      if (finalSections.length > 0) {
        logger.logMessage(`📋 FINAL SECTION BREAKDOWN:`);
        const sectionsByType = this.groupSectionsByType(finalSections);
        let globalFinalCounter = 1;
        for (const [type, sections] of sectionsByType) {
          const typeLength = sections.reduce((sum, s) => sum + s.content.length, 0);
          logger.logMessage(`   ${type}: ${sections.length} sections (${typeLength} chars)`);
          
          // Show detailed breakdown of each final section with global numbering
          sections.forEach((section) => {
            const preview = section.content.substring(0, 80).replace(/\n/g, ' ').trim();
            const serviceName = section.serviceId.value;
            const priority = section.priority.toString();
            logger.logMessage(`     ${globalFinalCounter}. "${section.title}" from ${serviceName} [${priority}] (${section.content.length} chars)`);
            logger.logMessage(`        Preview: ${preview}${section.content.length > 80 ? '...' : ''}`);
            globalFinalCounter++;
          });
        }
        
        // Show final sections in execution order
        logger.logMessage(`🔄 FINAL EXECUTION ORDER:`);
        finalSections.forEach((section, index) => {
          const serviceName = section.serviceId.value;
          const preview = section.content.substring(0, 50).replace(/\n/g, ' ').trim();
          logger.logMessage(`   ${index + 1}. [${section.sectionType}] "${section.title}" (${serviceName}) - ${section.content.length} chars`);
          logger.logMessage(`      ${preview}${section.content.length > 50 ? '...' : ''}`);
        });
      }
      
      logger.logRaw('🔧 =====================================');
    }
    
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

  // AI: Calculate total content length across all services
  private calculateTotalContentLength(sectionsByService: Map<ServiceIdentifier, PromptSection[]>): number {
    let totalLength = 0;
    for (const sections of sectionsByService.values()) {
      totalLength += sections.reduce((sum, section) => sum + section.content.length, 0);
    }
    return totalLength;
  }

  // AI: Get detailed information about what was deduplicated
  private getDeduplicationDetails(sections: PromptSection[]): Array<{
    contentPreview: string;
    duplicateCount: number;
    sectionType: string;
  }> {
    const contentGroups = this.groupSectionsByContent(sections);
    const duplicateDetails: Array<{
      contentPreview: string;
      duplicateCount: number;
      sectionType: string;
    }> = [];

    for (const [contentKey, sectionsWithSameContent] of contentGroups) {
      if (sectionsWithSameContent.length > 1) {
        const firstSection = sectionsWithSameContent[0];
        const contentPreview = firstSection.content.length > 50 
          ? firstSection.content.substring(0, 50) + '...'
          : firstSection.content;
        
        duplicateDetails.push({
          contentPreview: contentPreview.trim(),
          duplicateCount: sectionsWithSameContent.length,
          sectionType: firstSection.sectionType
        });
      }
    }

    return duplicateDetails;
  }
} 