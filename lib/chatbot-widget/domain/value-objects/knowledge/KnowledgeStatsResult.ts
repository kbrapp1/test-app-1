/**
 * Knowledge Stats Result Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable domain value object for knowledge statistics
 * - Contains business logic for stats analysis
 * - No external dependencies
 * - Encapsulates statistics business rules
 */

export interface KnowledgeStatsData {
  totalItems: number;
  itemsBySourceType: Record<string, number>;
  itemsByCategory: Record<string, number>;
  lastUpdated: Date | null;
  storageSize: number;
  organizationId: string;
  chatbotConfigId: string;
}

export class KnowledgeStatsResult {
  private constructor(private readonly data: KnowledgeStatsData) {
    this.validateStats();
  }

  public static create(data: KnowledgeStatsData): KnowledgeStatsResult {
    return new KnowledgeStatsResult(data);
  }

  public get totalItems(): number {
    return this.data.totalItems;
  }

  public get itemsBySourceType(): Record<string, number> {
    return { ...this.data.itemsBySourceType };
  }

  public get itemsByCategory(): Record<string, number> {
    return { ...this.data.itemsByCategory };
  }

  public get lastUpdated(): Date | null {
    return this.data.lastUpdated;
  }

  public get storageSize(): number {
    return this.data.storageSize;
  }

  public get organizationId(): string {
    return this.data.organizationId;
  }

  public get chatbotConfigId(): string {
    return this.data.chatbotConfigId;
  }

  /**
   * Business rule: Check if knowledge base is empty
   */
  public isEmpty(): boolean {
    return this.data.totalItems === 0;
  }

  /**
   * Business rule: Check if knowledge base needs updating
   */
  public needsUpdate(): boolean {
    if (!this.data.lastUpdated) return true;
    
    const daysSinceUpdate = (Date.now() - this.data.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 30; // Business rule: Update if older than 30 days
  }

  /**
   * Business rule: Check if storage is getting large
   */
  public isStorageLarge(): boolean {
    return this.data.storageSize > 100 * 1024 * 1024; // Business rule: 100MB threshold
  }

  /**
   * Get most common source type
   */
  public getMostCommonSourceType(): string | null {
    const sources = Object.entries(this.data.itemsBySourceType);
    if (sources.length === 0) return null;

    return sources.reduce((max, [type, count]) => 
      count > (this.data.itemsBySourceType[max] || 0) ? type : max, 
      sources[0][0]
    );
  }

  /**
   * Get most common category
   */
  public getMostCommonCategory(): string | null {
    const categories = Object.entries(this.data.itemsByCategory);
    if (categories.length === 0) return null;

    return categories.reduce((max, [category, count]) => 
      count > (this.data.itemsByCategory[max] || 0) ? category : max, 
      categories[0][0]
    );
  }

  /**
   * Get diversity score (0-1, higher = more diverse)
   */
  public getDiversityScore(): number {
    const sourceTypeCount = Object.keys(this.data.itemsBySourceType).length;
    const categoryCount = Object.keys(this.data.itemsByCategory).length;
    
    if (this.data.totalItems === 0) return 0;
    
    // Business rule: Diversity based on source types and categories
    const maxPossibleTypes = 10; // Reasonable maximum for diversity calculation
    const normalizedTypes = Math.min(sourceTypeCount, maxPossibleTypes) / maxPossibleTypes;
    const normalizedCategories = Math.min(categoryCount, maxPossibleTypes) / maxPossibleTypes;
    
    return (normalizedTypes + normalizedCategories) / 2;
  }

  public toData(): KnowledgeStatsData {
    return {
      totalItems: this.data.totalItems,
      itemsBySourceType: { ...this.data.itemsBySourceType },
      itemsByCategory: { ...this.data.itemsByCategory },
      lastUpdated: this.data.lastUpdated,
      storageSize: this.data.storageSize,
      organizationId: this.data.organizationId,
      chatbotConfigId: this.data.chatbotConfigId
    };
  }

  private validateStats(): void {
    if (!this.data.organizationId) {
      throw new Error('Organization ID is required for knowledge stats');
    }

    if (!this.data.chatbotConfigId) {
      throw new Error('Chatbot config ID is required for knowledge stats');
    }

    if (this.data.totalItems < 0) {
      throw new Error('Total items cannot be negative');
    }

    if (this.data.storageSize < 0) {
      throw new Error('Storage size cannot be negative');
    }
  }
}