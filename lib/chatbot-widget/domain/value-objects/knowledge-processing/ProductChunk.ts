import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

/**
 * Product Chunk Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing a processed product catalog chunk
 * - Contains semantic information for RAG optimization 
 * - Validates business rules for chunk structure
 * - Maintains content integrity and searchability
 * - Follow @golden-rule patterns exactly
 */

export interface ProductChunkProps {
  readonly title: string;
  readonly content: string;
  readonly tags: string[];
  readonly contentHash: string;
  readonly chunkIndex: number;
  readonly sourceLength: number;
}

export class ProductChunk {
  private constructor(private readonly props: ProductChunkProps) {
    this.validateProps(props);
  }

  static create(props: ProductChunkProps): ProductChunk {
    return new ProductChunk(props);
  }

  private validateProps(props: ProductChunkProps): void {
    if (!props.title?.trim()) {
      throw new BusinessRuleViolationError(
        'Product chunk must have a title',
        { title: props.title }
      );
    }

    if (!props.content?.trim()) {
      throw new BusinessRuleViolationError(
        'Product chunk must have content',
        { contentLength: props.content?.length || 0 }
      );
    }

    if (props.content.length < 50) {
      throw new BusinessRuleViolationError(
        'Product chunk content must be at least 50 characters for meaningful context',
        { contentLength: props.content.length, minLength: 50 }
      );
    }

    if (!Array.isArray(props.tags)) {
      throw new BusinessRuleViolationError(
        'Product chunk tags must be an array',
        { tags: props.tags }
      );
    }

    if (!props.contentHash?.trim()) {
      throw new BusinessRuleViolationError(
        'Product chunk must have a content hash for deduplication',
        { contentHash: props.contentHash }
      );
    }

    if (props.chunkIndex < 0) {
      throw new BusinessRuleViolationError(
        'Product chunk index must be non-negative',
        { chunkIndex: props.chunkIndex }
      );
    }

    if (props.sourceLength <= 0) {
      throw new BusinessRuleViolationError(
        'Source length must be positive',
        { sourceLength: props.sourceLength }
      );
    }
  }

  // Getters
  get title(): string { return this.props.title; }
  get content(): string { return this.props.content; }
  get tags(): string[] { return [...this.props.tags]; }
  get contentHash(): string { return this.props.contentHash; }
  get chunkIndex(): number { return this.props.chunkIndex; }
  get sourceLength(): number { return this.props.sourceLength; }

  // Business methods
  hasTag(tag: string): boolean {
    return this.props.tags.some(t => 
      t.toLowerCase().includes(tag.toLowerCase())
    );
  }

  matchesKeywords(keywords: string[]): boolean {
    if (!keywords || keywords.length === 0) return false;
    
    const searchableText = `${this.props.title} ${this.props.content}`.toLowerCase();
    return keywords.some(keyword => 
      searchableText.includes(keyword.toLowerCase())
    );
  }

  getRelevanceScore(query: string): number {
    if (!query?.trim()) return 0;
    
    const lowerQuery = query.toLowerCase();
    const lowerTitle = this.props.title.toLowerCase();
    const lowerContent = this.props.content.toLowerCase();
    
    let score = 0;
    
    // Title match has higher weight
    if (lowerTitle.includes(lowerQuery)) score += 0.8;
    
    // Content match
    if (lowerContent.includes(lowerQuery)) score += 0.4;
    
    // Tag matches
    const tagMatches = this.props.tags.filter(tag => 
      tag.toLowerCase().includes(lowerQuery)
    );
    score += tagMatches.length * 0.2;
    
    return Math.min(score, 1.0);
  }

  isSemanticallySimilar(other: ProductChunk): boolean {
    // Simple similarity check based on overlapping tags and content hash
    if (this.props.contentHash === other.contentHash) return true;
    
    const commonTags = this.props.tags.filter(tag => 
      other.tags.includes(tag)
    );
    
    return commonTags.length >= Math.min(this.props.tags.length, other.tags.length) * 0.5;
  }

  toPlainObject(): ProductChunkProps {
    return { ...this.props };
  }

  toString(): string {
    return `ProductChunk(${this.props.title}, ${this.props.content.length} chars, ${this.props.tags.length} tags)`;
  }
}