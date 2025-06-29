/**
 * Knowledge Vector Domain Entity
 * 
 * AI INSTRUCTIONS:
 * - Represents a cached vector embedding for a knowledge item
 * - Immutable entity with content hash for change detection
 * - Used for vector similarity search and caching optimization
 * - Follows DDD principles - pure domain logic only
 */
export class KnowledgeVector {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly chatbotConfigId: string,
    public readonly knowledgeItemId: string,
    public readonly vector: number[],
    public readonly contentHash: string,
    public readonly metadata: Record<string, any>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validateVector();
  }

  /**
   * Create new KnowledgeVector instance
   * 
   * AI INSTRUCTIONS:
   * - Factory method for creating new vectors
   * - Validates vector dimensions and content hash
   * - Generates unique ID and timestamps
   */
  static create(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string,
    vector: number[],
    contentHash: string,
    metadata: Record<string, any> = {}
  ): KnowledgeVector {
    return new KnowledgeVector(
      crypto.randomUUID(),
      organizationId,
      chatbotConfigId,
      knowledgeItemId,
      vector,
      contentHash,
      metadata,
      new Date(),
      new Date()
    );
  }

  /**
   * Calculate cosine similarity with another vector
   * 
   * AI INSTRUCTIONS:
   * - Implements cosine similarity calculation
   * - Used for vector similarity search
   * - Returns value between -1 and 1 (higher = more similar)
   */
  calculateSimilarity(otherVector: number[]): number {
    if (otherVector.length !== this.vector.length) {
      throw new Error(
        `Vector dimension mismatch: ${this.vector.length} vs ${otherVector.length}`
      );
    }

    const dotProduct = this.vector.reduce((sum, a, i) => sum + a * otherVector[i], 0);
    const magnitudeA = Math.sqrt(this.vector.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(otherVector.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Check if content has changed based on hash
   * 
   * AI INSTRUCTIONS:
   * - Compares content hashes to detect changes
   * - Used to determine if vector needs recalculation
   * - Enables efficient cache invalidation
   */
  hasContentChanged(newContentHash: string): boolean {
    return this.contentHash !== newContentHash;
  }

  /**
   * Get vector dimensions
   */
  getDimensions(): number {
    return this.vector.length;
  }

  /**
   * Validate vector properties
   * 
   * AI INSTRUCTIONS:
   * - Ensures vector has correct dimensions (1536 for OpenAI)
   * - Validates all required properties are present
   * - Throws domain errors for invalid vectors
   */
  private validateVector(): void {
    if (!this.vector || this.vector.length === 0) {
      throw new Error('Vector cannot be empty');
    }

    if (this.vector.length !== 1536) {
      throw new Error(
        `Invalid vector dimensions: expected 1536, got ${this.vector.length}`
      );
    }

    if (!this.contentHash || this.contentHash.length !== 64) {
      throw new Error('Content hash must be a 64-character SHA-256 hash');
    }

    if (!this.organizationId || !this.chatbotConfigId || !this.knowledgeItemId) {
      throw new Error('Missing required identifiers');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): {
    id: string;
    organizationId: string;
    chatbotConfigId: string;
    knowledgeItemId: string;
    vector: number[];
    contentHash: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id,
      organizationId: this.organizationId,
      chatbotConfigId: this.chatbotConfigId,
      knowledgeItemId: this.knowledgeItemId,
      vector: this.vector,
      contentHash: this.contentHash,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
} 