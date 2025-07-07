/**
 * ContentDeduplicationService Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Remove duplicate content sections with business rules
 * - Apply content prioritization and similarity detection
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule domain service patterns exactly
 * - Delegate complex operations to specialized methods
 * - Use specific domain errors for business rule violations
 * - Focus on content quality and relevance optimization
 */

import { PromptSection } from '../../value-objects/ai-configuration/PromptSection';
import { ServiceIdentifier } from '../../value-objects/ai-configuration/ServiceIdentifier';
import { PromptPriority } from '../../value-objects/ai-configuration/PromptPriority';
import { BusinessRuleViolationError } from '../../errors/base/DomainErrorBase';

export interface DuplicateContent {
  readonly duplicateType: DuplicateType;
  readonly originalSection: PromptSection;
  readonly duplicateSections: readonly PromptSection[];
  readonly similarityScore: number;
  readonly recommendedAction: DeduplicationAction;
  readonly preservationReason?: string;
}

export interface DeduplicationResult {
  readonly uniqueSections: readonly PromptSection[];
  readonly duplicatesRemoved: number;
  readonly duplicatesFound: readonly DuplicateContent[];
  readonly totalContentReduction: number;
  readonly qualityScore: number;
}

export interface ContentSimilarity {
  readonly section1: PromptSection;
  readonly section2: PromptSection;
  readonly similarityScore: number;
  readonly similarityFactors: readonly SimilarityFactor[];
  readonly isSignificantSimilarity: boolean;
}

export interface SimilarityFactor {
  readonly factorType: SimilarityFactorType;
  readonly weight: number;
  readonly contribution: number;
  readonly details: Record<string, any>;
}

export enum DuplicateType {
  EXACT_MATCH = 'exact_match',
  NEAR_DUPLICATE = 'near_duplicate',
  SEMANTIC_DUPLICATE = 'semantic_duplicate',
  PARTIAL_OVERLAP = 'partial_overlap',
  REDUNDANT_CONTENT = 'redundant_content'
}

export enum DeduplicationAction {
  REMOVE_DUPLICATE = 'remove_duplicate',
  MERGE_CONTENT = 'merge_content',
  PRESERVE_BOTH = 'preserve_both',
  MANUAL_REVIEW = 'manual_review',
  PRIORITIZE_HIGHER = 'prioritize_higher'
}

export enum SimilarityFactorType {
  LEXICAL = 'lexical',
  SEMANTIC = 'semantic',
  STRUCTURAL = 'structural',
  CONTEXTUAL = 'contextual',
  FUNCTIONAL = 'functional'
}

export interface ContentDeduplicationOptions {
  readonly enableSemanticAnalysis: boolean;
  readonly similarityThreshold: number;
  readonly preserveHighPriority: boolean;
  readonly mergeCompatibleContent: boolean;
  readonly maxContentReduction: number;
  readonly qualityOptimization: boolean;
}

export class ContentDeduplicationService {
  private static readonly DEFAULT_OPTIONS: ContentDeduplicationOptions = {
    enableSemanticAnalysis: true,
    similarityThreshold: 0.85,
    preserveHighPriority: true,
    mergeCompatibleContent: true,
    maxContentReduction: 0.5, // Max 50% content reduction
    qualityOptimization: true
  };

  /**
   * Deduplicate content sections with business rules
   * 
   * AI INSTRUCTIONS:
   * - Detect duplicate and similar content across sections
   * - Apply deduplication strategy based on business rules
   * - Preserve content quality and relevance
   * - Return optimized sections with deduplication metrics
   */
  deduplicateContent(
    sections: readonly PromptSection[],
    options: Partial<ContentDeduplicationOptions> = {}
  ): DeduplicationResult {
    const deduplicationOptions = { ...ContentDeduplicationService.DEFAULT_OPTIONS, ...options };
    
    this.validateDeduplicationInputs(sections, deduplicationOptions);
    
    // AI: Find all duplicate content
    const duplicates = this.findDuplicateContent(sections, deduplicationOptions);
    
    // AI: Apply deduplication strategy
    const uniqueSections = this.applyDeduplicationStrategy(sections, duplicates, deduplicationOptions);
    
    // AI: Calculate metrics
    const duplicatesRemoved = sections.length - uniqueSections.length;
    const totalContentReduction = this.calculateContentReduction(sections, uniqueSections);
    const qualityScore = this.calculateQualityScore(uniqueSections, duplicates, deduplicationOptions);
    
    // AI: Validate content reduction limits
    if (totalContentReduction > deduplicationOptions.maxContentReduction) {
      throw new BusinessRuleViolationError(
        'Content reduction exceeds maximum allowed threshold',
        { 
          totalReduction: totalContentReduction,
          maxAllowed: deduplicationOptions.maxContentReduction,
          duplicatesRemoved 
        }
      );
    }
    
    return {
      uniqueSections: Object.freeze(uniqueSections),
      duplicatesRemoved,
      duplicatesFound: Object.freeze(duplicates),
      totalContentReduction,
      qualityScore
    };
  }

  /**
   * Analyze content similarity between sections
   * 
   * AI INSTRUCTIONS:
   * - Calculate similarity scores using multiple factors
   * - Apply business rules for similarity categorization
   * - Return detailed similarity analysis for decision making
   * - Support both lexical and semantic similarity detection
   */
  analyzeContentSimilarity(
    section1: PromptSection,
    section2: PromptSection,
    options: Partial<ContentDeduplicationOptions> = {}
  ): ContentSimilarity {
    const analysisOptions = { ...ContentDeduplicationService.DEFAULT_OPTIONS, ...options };
    
    // AI: Calculate similarity factors
    const similarityFactors = this.calculateSimilarityFactors(section1, section2, analysisOptions);
    
    // AI: Compute overall similarity score
    const similarityScore = this.computeOverallSimilarity(similarityFactors);
    
    // AI: Determine if similarity is significant
    const isSignificantSimilarity = similarityScore >= analysisOptions.similarityThreshold;
    
    return {
      section1,
      section2,
      similarityScore,
      similarityFactors: Object.freeze(similarityFactors),
      isSignificantSimilarity
    };
  }

  /**
   * Optimize content quality through deduplication
   * 
   * AI INSTRUCTIONS:
   * - Focus on preserving highest quality content
   * - Remove redundant and low-value sections
   * - Apply business rules for quality assessment
   * - Return quality-optimized content with metrics
   */
  optimizeContentQuality(
    sections: readonly PromptSection[],
    targetQualityScore: number = 0.8
  ): {
    optimizedSections: readonly PromptSection[];
    qualityImprovement: number;
    removedSections: readonly PromptSection[];
    optimizationActions: readonly string[];
  } {
    if (targetQualityScore < 0 || targetQualityScore > 1) {
      throw new BusinessRuleViolationError(
        'Target quality score must be between 0 and 1',
        { targetQualityScore }
      );
    }
    
    const optimizationActions: string[] = [];
    let currentSections = [...sections];
    
    // AI: Remove exact duplicates first
    const deduplicationResult = this.deduplicateContent(currentSections, {
      similarityThreshold: 1.0, // Exact matches only
      qualityOptimization: true
    });
    
    currentSections = [...deduplicationResult.uniqueSections];
    optimizationActions.push(`Removed ${deduplicationResult.duplicatesRemoved} exact duplicates`);
    
    // AI: Remove low-quality sections
    const qualityFiltered = this.filterLowQualitySections(currentSections);
    if (qualityFiltered.length < currentSections.length) {
      optimizationActions.push(`Filtered ${currentSections.length - qualityFiltered.length} low-quality sections`);
      currentSections = qualityFiltered;
    }
    
    // AI: Apply progressive similarity reduction if needed
    let currentQuality = this.calculateQualityScore(currentSections, [], ContentDeduplicationService.DEFAULT_OPTIONS);
    let similarityThreshold = 0.95;
    
    while (currentQuality < targetQualityScore && similarityThreshold > 0.7) {
      const progressiveResult = this.deduplicateContent(currentSections, {
        similarityThreshold,
        qualityOptimization: true
      });
      
      if (progressiveResult.uniqueSections.length < currentSections.length) {
        currentSections = [...progressiveResult.uniqueSections];
        optimizationActions.push(`Applied similarity threshold ${similarityThreshold}, removed ${progressiveResult.duplicatesRemoved} sections`);
      }
      
      currentQuality = progressiveResult.qualityScore;
      similarityThreshold -= 0.05;
    }
    
    const initialQuality = this.calculateQualityScore(sections, [], ContentDeduplicationService.DEFAULT_OPTIONS);
    const qualityImprovement = currentQuality - initialQuality;
    
    const removedSections = sections.filter(original => 
      !currentSections.some(current => current.equals(original))
    );
    
    return {
      optimizedSections: Object.freeze(currentSections),
      qualityImprovement,
      removedSections: Object.freeze(removedSections),
      optimizationActions: Object.freeze(optimizationActions)
    };
  }

  // AI: Validate deduplication inputs and business constraints
  private validateDeduplicationInputs(
    sections: readonly PromptSection[],
    options: ContentDeduplicationOptions
  ): void {
    if (sections.length === 0) {
      throw new BusinessRuleViolationError(
        'Cannot deduplicate empty sections array',
        { operation: 'deduplicateContent', sectionCount: 0 }
      );
    }
    
    if (options.similarityThreshold < 0 || options.similarityThreshold > 1) {
      throw new BusinessRuleViolationError(
        'Similarity threshold must be between 0 and 1',
        { similarityThreshold: options.similarityThreshold }
      );
    }
    
    if (options.maxContentReduction < 0 || options.maxContentReduction > 1) {
      throw new BusinessRuleViolationError(
        'Max content reduction must be between 0 and 1',
        { maxContentReduction: options.maxContentReduction }
      );
    }
  }

  // AI: Find duplicate content using multiple detection methods
  private findDuplicateContent(
    sections: readonly PromptSection[],
    options: ContentDeduplicationOptions
  ): DuplicateContent[] {
    const duplicates: DuplicateContent[] = [];
    const processedSections = new Set<string>();
    
    for (let i = 0; i < sections.length; i++) {
      const currentSection = sections[i];
      
      if (processedSections.has(currentSection.sectionId)) {
        continue; // Already processed as part of a duplicate group
      }
      
      const duplicateGroup: PromptSection[] = [];
      
      // AI: Find all sections similar to current section
      for (let j = i + 1; j < sections.length; j++) {
        const compareSection = sections[j];
        
        if (processedSections.has(compareSection.sectionId)) {
          continue;
        }
        
        const similarity = this.analyzeContentSimilarity(currentSection, compareSection, options);
        
        if (similarity.isSignificantSimilarity) {
          duplicateGroup.push(compareSection);
          processedSections.add(compareSection.sectionId);
        }
      }
      
      // AI: Create duplicate entry if duplicates found
      if (duplicateGroup.length > 0) {
        const duplicateType = this.classifyDuplicateType(currentSection, duplicateGroup);
        const recommendedAction = this.determineDeduplicationAction(currentSection, duplicateGroup, options);
        
        duplicates.push({
          duplicateType,
          originalSection: currentSection,
          duplicateSections: Object.freeze(duplicateGroup),
          similarityScore: this.calculateGroupSimilarity(currentSection, duplicateGroup),
          recommendedAction,
          preservationReason: this.getPreservationReason(currentSection, duplicateGroup, options)
        });
        
        processedSections.add(currentSection.sectionId);
      }
    }
    
    return duplicates;
  }

  // AI: Apply deduplication strategy based on business rules
  private applyDeduplicationStrategy(
    sections: readonly PromptSection[],
    duplicates: readonly DuplicateContent[],
    options: ContentDeduplicationOptions
  ): PromptSection[] {
    const uniqueSections: PromptSection[] = [];
    const sectionsToRemove = new Set<string>();
    
    // AI: Process each duplicate group
    for (const duplicate of duplicates) {
      switch (duplicate.recommendedAction) {
        case DeduplicationAction.REMOVE_DUPLICATE:
          // AI: Mark duplicate sections for removal
          duplicate.duplicateSections.forEach(section => {
            sectionsToRemove.add(section.sectionId);
          });
          break;
          
        case DeduplicationAction.MERGE_CONTENT:
          // AI: Create merged section and mark originals for removal
          const mergedSection = this.mergeCompatibleSections(
            duplicate.originalSection, 
            duplicate.duplicateSections
          );
          uniqueSections.push(mergedSection);
          sectionsToRemove.add(duplicate.originalSection.sectionId);
          duplicate.duplicateSections.forEach(section => {
            sectionsToRemove.add(section.sectionId);
          });
          break;
          
        case DeduplicationAction.PRIORITIZE_HIGHER:
          // AI: Keep highest priority section, remove others
          const allSections = [duplicate.originalSection, ...duplicate.duplicateSections];
          const highestPriority = allSections.reduce((highest, current) =>
            current.priority.isHigherThan(highest.priority) ? current : highest
          );
          
          allSections.forEach(section => {
            if (!section.equals(highestPriority)) {
              sectionsToRemove.add(section.sectionId);
            }
          });
          break;
          
        case DeduplicationAction.PRESERVE_BOTH:
        case DeduplicationAction.MANUAL_REVIEW:
          // AI: Keep all sections for these actions
          break;
          
        default:
          throw new BusinessRuleViolationError(
            `Unknown deduplication action: ${duplicate.recommendedAction}`,
            { action: duplicate.recommendedAction }
          );
      }
    }
    
    // AI: Add sections that are not marked for removal
    for (const section of sections) {
      if (!sectionsToRemove.has(section.sectionId)) {
        uniqueSections.push(section);
      }
    }
    
    return uniqueSections;
  }

  // AI: Calculate similarity factors between two sections
  private calculateSimilarityFactors(
    section1: PromptSection,
    section2: PromptSection,
    options: ContentDeduplicationOptions
  ): SimilarityFactor[] {
    const factors: SimilarityFactor[] = [];
    
    // AI: Lexical similarity (exact text matching)
    const lexicalSimilarity = this.calculateLexicalSimilarity(section1.content, section2.content);
    factors.push({
      factorType: SimilarityFactorType.LEXICAL,
      weight: 0.4,
      contribution: lexicalSimilarity * 0.4,
      details: { similarity: lexicalSimilarity }
    });
    
    // AI: Structural similarity (section type, format)
    const structuralSimilarity = this.calculateStructuralSimilarity(section1, section2);
    factors.push({
      factorType: SimilarityFactorType.STRUCTURAL,
      weight: 0.2,
      contribution: structuralSimilarity * 0.2,
      details: { similarity: structuralSimilarity }
    });
    
    // AI: Contextual similarity (service, priority)
    const contextualSimilarity = this.calculateContextualSimilarity(section1, section2);
    factors.push({
      factorType: SimilarityFactorType.CONTEXTUAL,
      weight: 0.2,
      contribution: contextualSimilarity * 0.2,
      details: { similarity: contextualSimilarity }
    });
    
    // AI: Semantic similarity (if enabled)
    if (options.enableSemanticAnalysis) {
      const semanticSimilarity = this.calculateSemanticSimilarity(section1.content, section2.content);
      factors.push({
        factorType: SimilarityFactorType.SEMANTIC,
        weight: 0.2,
        contribution: semanticSimilarity * 0.2,
        details: { similarity: semanticSimilarity }
      });
    }
    
    return factors;
  }

  // AI: Helper methods for similarity calculations
  private calculateLexicalSimilarity(content1: string, content2: string): number {
    const normalized1 = content1.toLowerCase().trim();
    const normalized2 = content2.toLowerCase().trim();
    
    if (normalized1 === normalized2) return 1.0;
    
    // AI: Simple word-based similarity
    const words1 = new Set(normalized1.split(/\s+/));
    const words2 = new Set(normalized2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateStructuralSimilarity(section1: PromptSection, section2: PromptSection): number {
    let similarity = 0;
    
    // AI: Same section type
    if (section1.sectionType === section2.sectionType) similarity += 0.5;
    
    // AI: Same content type
    if (section1.contentType === section2.contentType) similarity += 0.3;
    
    // AI: Similar content length
    const lengthRatio = Math.min(section1.contentLength, section2.contentLength) / 
                       Math.max(section1.contentLength, section2.contentLength);
    similarity += lengthRatio * 0.2;
    
    return Math.min(1.0, similarity);
  }

  private calculateContextualSimilarity(section1: PromptSection, section2: PromptSection): number {
    let similarity = 0;
    
    // AI: Same service
    if (section1.serviceId.equals(section2.serviceId)) similarity += 0.4;
    
    // AI: Similar priority
    const priorityDiff = Math.abs(section1.priority.numericValue - section2.priority.numericValue);
    const prioritySimilarity = Math.max(0, 1 - (priorityDiff / 1000));
    similarity += prioritySimilarity * 0.3;
    
    // AI: Same requirement level
    if (section1.isRequired === section2.isRequired) similarity += 0.3;
    
    return Math.min(1.0, similarity);
  }

  private calculateSemanticSimilarity(content1: string, content2: string): number {
    // AI: Simplified semantic similarity - in real implementation, use NLP models
    // For now, use enhanced lexical analysis
    return this.calculateLexicalSimilarity(content1, content2);
  }

  private computeOverallSimilarity(factors: SimilarityFactor[]): number {
    const totalContribution = factors.reduce((sum, factor) => sum + factor.contribution, 0);
    return Math.min(1.0, totalContribution);
  }

  private classifyDuplicateType(original: PromptSection, duplicates: PromptSection[]): DuplicateType {
    // AI: Simplified classification - can be enhanced with more sophisticated logic
    const avgSimilarity = this.calculateGroupSimilarity(original, duplicates);
    
    if (avgSimilarity >= 0.98) return DuplicateType.EXACT_MATCH;
    if (avgSimilarity >= 0.90) return DuplicateType.NEAR_DUPLICATE;
    if (avgSimilarity >= 0.80) return DuplicateType.SEMANTIC_DUPLICATE;
    if (avgSimilarity >= 0.70) return DuplicateType.PARTIAL_OVERLAP;
    return DuplicateType.REDUNDANT_CONTENT;
  }

  private determineDeduplicationAction(
    original: PromptSection,
    duplicates: PromptSection[],
    options: ContentDeduplicationOptions
  ): DeduplicationAction {
    const duplicateType = this.classifyDuplicateType(original, duplicates);
    
    switch (duplicateType) {
      case DuplicateType.EXACT_MATCH:
        return DeduplicationAction.REMOVE_DUPLICATE;
      
      case DuplicateType.NEAR_DUPLICATE:
        return options.preserveHighPriority 
          ? DeduplicationAction.PRIORITIZE_HIGHER 
          : DeduplicationAction.REMOVE_DUPLICATE;
      
      case DuplicateType.SEMANTIC_DUPLICATE:
        return options.mergeCompatibleContent 
          ? DeduplicationAction.MERGE_CONTENT 
          : DeduplicationAction.PRIORITIZE_HIGHER;
      
      case DuplicateType.PARTIAL_OVERLAP:
        return DeduplicationAction.PRESERVE_BOTH;
      
      default:
        return DeduplicationAction.MANUAL_REVIEW;
    }
  }

  private calculateGroupSimilarity(original: PromptSection, duplicates: PromptSection[]): number {
    if (duplicates.length === 0) return 0;
    
    const similarities = duplicates.map(duplicate => 
      this.calculateLexicalSimilarity(original.content, duplicate.content)
    );
    
    return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
  }

  private getPreservationReason(
    original: PromptSection,
    duplicates: PromptSection[],
    options: ContentDeduplicationOptions
  ): string | undefined {
    if (original.isRequired) {
      return 'Required section preserved by business rule';
    }
    
    if (options.preserveHighPriority && original.priority.category === 'critical') {
      return 'Critical priority section preserved';
    }
    
    return undefined;
  }

  private mergeCompatibleSections(original: PromptSection, duplicates: readonly PromptSection[]): PromptSection {
    // AI: Simplified merging - combine content with highest priority metadata
    const allSections = [original, ...duplicates];
    const highestPriority = allSections.reduce((highest, current) =>
      current.priority.isHigherThan(highest.priority) ? current : highest
    );
    
    const mergedContent = allSections
      .map(section => section.content.trim())
      .filter((content, index, array) => array.indexOf(content) === index) // Remove exact duplicates
      .join('\n\n');
    
    return original.withContent(mergedContent).withPriority(highestPriority.priority);
  }

  private calculateContentReduction(original: readonly PromptSection[], deduplicated: readonly PromptSection[]): number {
    const originalLength = original.reduce((sum, section) => sum + section.contentLength, 0);
    const deduplicatedLength = deduplicated.reduce((sum, section) => sum + section.contentLength, 0);
    
    return originalLength > 0 ? (originalLength - deduplicatedLength) / originalLength : 0;
  }

  private calculateQualityScore(
    sections: readonly PromptSection[],
    duplicates: readonly DuplicateContent[],
    options: ContentDeduplicationOptions
  ): number {
    if (sections.length === 0) return 0;
    
    // AI: Base quality from section priorities and content
    const avgPriority = sections.reduce((sum, section) => sum + section.priority.numericValue, 0) / sections.length;
    let quality = avgPriority / 1000; // Normalize to 0-1
    
    // AI: Reduce quality for duplicates
    const duplicateRatio = duplicates.length / sections.length;
    quality = Math.max(0, quality - (duplicateRatio * 0.3));
    
    // AI: Boost quality for optimization
    if (options.qualityOptimization) {
      quality = Math.min(1.0, quality * 1.1);
    }
    
    return Math.round(quality * 100) / 100;
  }

  private filterLowQualitySections(sections: PromptSection[]): PromptSection[] {
    // AI: Remove sections below minimum quality threshold
    return sections.filter(section => {
      // AI: Basic quality checks
      if (section.content.length < 10) return false; // Too short
      if (section.priority.numericValue < 100) return false; // Too low priority
      return true;
    });
  }
} 