/**
 * Knowledge Query Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable domain value object for knowledge queries
 * - Contains business rules for query validation
 * - No external dependencies
 * - Encapsulates query business logic
 */

export interface KnowledgeQueryData {
  organizationId: string;
  chatbotConfigId: string;
  category?: string;
  tags?: string[];
  sourceType?: string;
  sourceUrl?: string;
  limit?: number;
  sharedLogFile?: string;
}

export class KnowledgeQuery {
  private constructor(private readonly data: KnowledgeQueryData) {
    this.validateQuery();
  }

  public static create(data: KnowledgeQueryData): KnowledgeQuery {
    return new KnowledgeQuery(data);
  }

  public static createByCategory(
    organizationId: string,
    chatbotConfigId: string,
    category: string,
    sharedLogFile?: string
  ): KnowledgeQuery {
    return new KnowledgeQuery({
      organizationId,
      chatbotConfigId,
      category: category.trim(),
      sharedLogFile
    });
  }

  public static createByTags(
    organizationId: string,
    chatbotConfigId: string,
    tags: string[],
    sharedLogFile?: string
  ): KnowledgeQuery {
    return new KnowledgeQuery({
      organizationId,
      chatbotConfigId,
      tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
      sharedLogFile
    });
  }

  public static createBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string,
    sharedLogFile?: string
  ): KnowledgeQuery {
    return new KnowledgeQuery({
      organizationId,
      chatbotConfigId,
      sourceType: sourceType.trim(),
      sourceUrl: sourceUrl?.trim(),
      sharedLogFile
    });
  }

  public get organizationId(): string {
    return this.data.organizationId;
  }

  public get chatbotConfigId(): string {
    return this.data.chatbotConfigId;
  }

  public get category(): string | undefined {
    return this.data.category;
  }

  public get tags(): string[] | undefined {
    return this.data.tags ? [...this.data.tags] : undefined;
  }

  public get sourceType(): string | undefined {
    return this.data.sourceType;
  }

  public get sourceUrl(): string | undefined {
    return this.data.sourceUrl;
  }

  public get limit(): number {
    return this.data.limit || 1000; // Default business rule limit
  }

  public get sharedLogFile(): string | undefined {
    return this.data.sharedLogFile;
  }

  /**
   * Business rule: Check if query has category filter
   */
  public hasCategoryFilter(): boolean {
    return !!this.data.category;
  }

  /**
   * Business rule: Check if query has tag filters
   */
  public hasTagFilters(): boolean {
    return !!this.data.tags && this.data.tags.length > 0;
  }

  /**
   * Business rule: Check if query has source filters
   */
  public hasSourceFilter(): boolean {
    return !!this.data.sourceType;
  }

  /**
   * Business rule: Check if query has any filters
   */
  public hasFilters(): boolean {
    return this.hasCategoryFilter() || this.hasTagFilters() || this.hasSourceFilter();
  }

  /**
   * Business rule: Check if query requires shared log file
   */
  public requiresSharedLogFile(): boolean {
    return true; // Business rule: All knowledge queries must be logged
  }

  /**
   * Business rule: Get query complexity score
   */
  public getComplexityScore(): number {
    let score = 0;
    
    if (this.hasCategoryFilter()) score += 1;
    if (this.hasTagFilters()) score += (this.data.tags?.length || 0);
    if (this.hasSourceFilter()) score += 1;
    if (this.data.sourceUrl) score += 1;
    
    return score;
  }

  /**
   * Business rule: Check if query is simple enough for caching
   */
  public isCacheable(): boolean {
    return this.getComplexityScore() <= 2; // Simple queries are cacheable
  }

  /**
   * Get search parameters for repository
   */
  public getSearchParameters(): {
    organizationId: string;
    chatbotConfigId: string;
    limit: number;
    categoryFilter?: string;
  } {
    return {
      organizationId: this.data.organizationId,
      chatbotConfigId: this.data.chatbotConfigId,
      limit: this.limit,
      categoryFilter: this.data.category
    };
  }

  public toData(): KnowledgeQueryData {
    return {
      organizationId: this.data.organizationId,
      chatbotConfigId: this.data.chatbotConfigId,
      category: this.data.category,
      tags: this.data.tags ? [...this.data.tags] : undefined,
      sourceType: this.data.sourceType,
      sourceUrl: this.data.sourceUrl,
      limit: this.data.limit,
      sharedLogFile: this.data.sharedLogFile
    };
  }

  private validateQuery(): void {
    if (!this.data.organizationId?.trim()) {
      throw new Error('Organization ID is required for knowledge query');
    }

    if (!this.data.chatbotConfigId?.trim()) {
      throw new Error('Chatbot config ID is required for knowledge query');
    }

    if (this.data.category !== undefined && !this.data.category.trim()) {
      throw new Error('Category cannot be empty if provided');
    }

    if (this.data.tags !== undefined && this.data.tags.length === 0) {
      throw new Error('Tags array cannot be empty if provided');
    }

    if (this.data.sourceType !== undefined && !this.data.sourceType.trim()) {
      throw new Error('Source type cannot be empty if provided');
    }

    if (this.data.limit !== undefined && this.data.limit <= 0) {
      throw new Error('Limit must be positive if provided');
    }

    // Business rule: At least one filter must be specified for specific queries
    if (this.data.category === undefined && 
        this.data.tags === undefined && 
        this.data.sourceType === undefined) {
      // This is allowed for general stats/health queries
    }
  }
}