import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

/**
 * Product Section Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing a semantic section of product content
 * - Used for intermediate processing before chunk creation
 * - Validates section structure and content quality
 * - Maintains hierarchical information for context preservation
 * - Follow @golden-rule patterns exactly
 */

export interface ProductSectionProps {
  readonly title?: string;
  readonly content: string;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly level: number;
  readonly parentTitle?: string;
}

export class ProductSection {
  private constructor(private readonly props: ProductSectionProps) {
    this.validateProps(props);
  }

  static create(props: ProductSectionProps): ProductSection {
    return new ProductSection(props);
  }

  private validateProps(props: ProductSectionProps): void {
    if (!props.content?.trim()) {
      throw new BusinessRuleViolationError(
        'Product section must have content',
        { contentLength: props.content?.length || 0 }
      );
    }

    if (props.content.length < 50) {
      throw new BusinessRuleViolationError(
        'Product section content must be at least 50 characters for meaningful processing',
        { contentLength: props.content.length, minLength: 50 }
      );
    }

    if (props.startIndex < 0) {
      throw new BusinessRuleViolationError(
        'Product section start index must be non-negative',
        { startIndex: props.startIndex }
      );
    }

    if (props.endIndex <= props.startIndex) {
      throw new BusinessRuleViolationError(
        'Product section end index must be greater than start index',
        { startIndex: props.startIndex, endIndex: props.endIndex }
      );
    }

    if (props.level < 0) {
      throw new BusinessRuleViolationError(
        'Product section level must be non-negative',
        { level: props.level }
      );
    }
  }

  // Getters
  get title(): string | undefined { return this.props.title; }
  get content(): string { return this.props.content; }
  get startIndex(): number { return this.props.startIndex; }
  get endIndex(): number { return this.props.endIndex; }
  get level(): number { return this.props.level; }
  get parentTitle(): string | undefined { return this.props.parentTitle; }

  // Business methods
  getLength(): number {
    return this.props.endIndex - this.props.startIndex;
  }

  hasTitle(): boolean {
    return Boolean(this.props.title?.trim());
  }

  getDisplayTitle(): string {
    if (this.props.title?.trim()) {
      return this.props.title;
    }
    return `Section ${this.props.startIndex}-${this.props.endIndex}`;
  }

  getContextualTitle(): string {
    const displayTitle = this.getDisplayTitle();
    
    if (this.props.parentTitle?.trim()) {
      return `${this.props.parentTitle} - ${displayTitle}`;
    }
    
    return displayTitle;
  }

  isTopLevel(): boolean {
    return this.props.level === 0;
  }

  isSubSection(): boolean {
    return this.props.level > 0;
  }

  getHierarchyDepth(): number {
    return this.props.level;
  }

  extractKeywords(): string[] {
    const text = this.props.content.toLowerCase();
    const words = text.split(/\W+/).filter(word => 
      word.length > 3 && 
      !this.isCommonWord(word)
    );
    
    // Count word frequency and return top words
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'under', 'over',
      'this', 'that', 'these', 'those', 'our', 'your', 'their', 'have',
      'has', 'had', 'been', 'being', 'are', 'were', 'was', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'does', 'did', 'do'
    ]);
    
    return commonWords.has(word);
  }

  isSimilarContentTo(other: ProductSection): boolean {
    // Simple similarity check based on content overlap
    const thisWords = new Set(this.props.content.toLowerCase().split(/\W+/));
    const otherWords = new Set(other.content.toLowerCase().split(/\W+/));
    
    const intersection = new Set(Array.from(thisWords).filter(word => otherWords.has(word)));
    const union = new Set([...Array.from(thisWords), ...Array.from(otherWords)]);
    
    const similarity = intersection.size / union.size;
    return similarity > 0.3; // 30% similarity threshold
  }

  withContextualContent(fullCatalog: string): ProductSection {
    let contextualContent = '';
    
    // Add parent context if available
    if (this.props.parentTitle?.trim()) {
      contextualContent += `${this.props.parentTitle}\n\n`;
    }
    
    // Add section title if available
    if (this.props.title?.trim()) {
      contextualContent += `${this.props.title}\n\n`;
    }
    
    // Add main content
    contextualContent += this.props.content;
    
    return new ProductSection({
      ...this.props,
      content: contextualContent
    });
  }

  toPlainObject(): ProductSectionProps {
    return { ...this.props };
  }

  toString(): string {
    const title = this.getDisplayTitle();
    return `ProductSection(${title}, ${this.getLength()} chars, level ${this.props.level})`;
  }
}