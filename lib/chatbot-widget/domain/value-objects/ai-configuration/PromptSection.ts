/**
 * PromptSection Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing a section of prompt content
 * - Include validation logic for content and metadata
 * - Support comparison and equality operations
 * - Follow @golden-rule value object patterns exactly
 * - Keep business logic pure, no external dependencies
 * - Delegate complex operations to specialized methods
 */

import { ContentType } from '../content/ContentType';
import { BusinessRuleViolationError } from '../../errors/base/DomainErrorBase';
import { ServiceIdentifier } from './ServiceIdentifier';
import { PromptPriority } from './PromptPriority';

export class PromptSection {
  private constructor(
    public readonly sectionId: string,
    public readonly serviceId: ServiceIdentifier,
    public readonly sectionType: string,
    public readonly title: string,
    public readonly content: string,
    public readonly contentType: ContentType,
    public readonly priority: PromptPriority,
    public readonly isRequired: boolean,
    public readonly metadata: Record<string, any> = {}
  ) {
    this.validateInvariants();
  }

  /**
   * Create new PromptSection with validation
   * 
   * AI INSTRUCTIONS:
   * - Validate all inputs according to business rules
   * - Use specific domain errors for violations
   * - Ensure immutability of created instance
   */
  static create(
    sectionId: string,
    serviceId: ServiceIdentifier,
    sectionType: string,
    title: string,
    content: string,
    contentType: ContentType,
    priority: PromptPriority,
    isRequired: boolean = false,
    metadata: Record<string, any> = {}
  ): PromptSection {
    return new PromptSection(
      sectionId,
      serviceId,
      sectionType,
      title,
      content,
      contentType,
      priority,
      isRequired,
      metadata
    );
  }

  /**
   * Create PromptSection with updated content
   * 
   * AI INSTRUCTIONS:
   * - Return new immutable instance with updated content
   * - Preserve all other properties unchanged
   * - Validate new content according to business rules
   */
  withContent(newContent: string): PromptSection {
    return new PromptSection(
      this.sectionId,
      this.serviceId,
      this.sectionType,
      this.title,
      newContent,
      this.contentType,
      this.priority,
      this.isRequired,
      this.metadata
    );
  }

  /**
   * Create PromptSection with updated priority
   * 
   * AI INSTRUCTIONS:
   * - Return new immutable instance with updated priority
   * - Preserve all other properties unchanged
   */
  withPriority(newPriority: PromptPriority): PromptSection {
    return new PromptSection(
      this.sectionId,
      this.serviceId,
      this.sectionType,
      this.title,
      this.content,
      this.contentType,
      newPriority,
      this.isRequired,
      this.metadata
    );
  }

  /**
   * Create PromptSection with updated metadata
   * 
   * AI INSTRUCTIONS:
   * - Return new immutable instance with merged metadata
   * - Preserve existing metadata, override with new values
   */
  withMetadata(additionalMetadata: Record<string, any>): PromptSection {
    return new PromptSection(
      this.sectionId,
      this.serviceId,
      this.sectionType,
      this.title,
      this.content,
      this.contentType,
      this.priority,
      this.isRequired,
      { ...this.metadata, ...additionalMetadata }
    );
  }

  /**
   * Check content similarity with another section
   * 
   * AI INSTRUCTIONS:
   * - Compare normalized content for similarity detection
   * - Use business rules for similarity threshold
   * - Support deduplication logic
   */
  isSimilarTo(other: PromptSection, similarityThreshold: number = 0.9): boolean {
    if (this.sectionType !== other.sectionType) {
      return false;
    }

    const normalizedThis = this.normalizeContent();
    const normalizedOther = other.normalizeContent();

    if (normalizedThis === normalizedOther) {
      return true;
    }

    // AI: Simple similarity check based on common words
    const similarity = this.calculateContentSimilarity(normalizedThis, normalizedOther);
    return similarity >= similarityThreshold;
  }

  /**
   * Check if section conflicts with another section
   * 
   * AI INSTRUCTIONS:
   * - Detect conflicts based on type and content overlap
   * - Apply business rules for conflict detection
   * - Support conflict resolution workflows
   */
  conflictsWith(other: PromptSection): boolean {
    // AI: Same section type with different content indicates conflict
    if (this.sectionType === other.sectionType && !this.isSimilarTo(other, 0.8)) {
      return true;
    }

    // AI: Required sections with overlapping content may conflict
    if (this.isRequired && other.isRequired && this.hasContentOverlap(other)) {
      return true;
    }

    return false;
  }

  /**
   * Get content length for optimization calculations
   */
  get contentLength(): number {
    return this.content.length;
  }

  /**
   * Get unique content key for deduplication
   */
  get contentKey(): string {
    return `${this.sectionType}:${this.normalizeContent()}`;
  }

  /**
   * Value object equality comparison
   * 
   * AI INSTRUCTIONS:
   * - Compare all properties for equality
   * - Support Set and Map operations
   * - Follow value object equality patterns
   */
  equals(other: PromptSection): boolean {
    return (
      this.sectionId === other.sectionId &&
      this.serviceId.equals(other.serviceId) &&
      this.sectionType === other.sectionType &&
      this.title === other.title &&
      this.content === other.content &&
      this.contentType === other.contentType &&
      this.priority.equals(other.priority) &&
      this.isRequired === other.isRequired &&
      JSON.stringify(this.metadata) === JSON.stringify(other.metadata)
    );
  }

  // AI: Validate business invariants for PromptSection
  private validateInvariants(): void {
    if (!this.sectionId || this.sectionId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'PromptSection must have a valid section ID',
        { sectionId: this.sectionId }
      );
    }

    if (!this.sectionType || this.sectionType.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'PromptSection must have a valid section type',
        { sectionType: this.sectionType, sectionId: this.sectionId }
      );
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'PromptSection must have a valid title',
        { title: this.title, sectionId: this.sectionId }
      );
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'PromptSection must have valid content',
        { contentLength: this.content?.length || 0, sectionId: this.sectionId }
      );
    }

    if (this.content.length > 10000) {
      throw new BusinessRuleViolationError(
        'PromptSection content cannot exceed 10,000 characters',
        { contentLength: this.content.length, sectionId: this.sectionId }
      );
    }
  }

  // AI: Normalize content for comparison operations
  private normalizeContent(): string {
    return this.content
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, ''); // Remove punctuation
  }

  // AI: Calculate similarity between normalized content strings
  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.split(' '));
    const words2 = new Set(content2.split(' '));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // AI: Check for content overlap between sections
  private hasContentOverlap(other: PromptSection): boolean {
    const similarity = this.calculateContentSimilarity(
      this.normalizeContent(),
      other.normalizeContent()
    );
    return similarity > 0.3; // 30% overlap threshold
  }
} 