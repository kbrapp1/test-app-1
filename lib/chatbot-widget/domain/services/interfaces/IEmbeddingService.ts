/**
 * Embedding Service Interface
 * 
 * AI INSTRUCTIONS:
 * - Contract for generating vector embeddings
 * - Abstracts embedding provider implementation details
 * - Supports both single and batch embedding generation
 * - Enables dependency injection and testing
 */
export interface IEmbeddingService {
  /**
   * Generate embedding for a single text
   * 
   * AI INSTRUCTIONS:
   * - Returns vector embedding as number array
   * - Handles caching internally for performance
   * - Throws error if embedding generation fails
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generate embeddings for multiple texts in batch
   * 
   * AI INSTRUCTIONS:
   * - More efficient than multiple single calls
   * - Returns embeddings in same order as input texts
   * - Handles partial failures gracefully
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Clear internal embedding cache
   * 
   * AI INSTRUCTIONS:
   * - Useful for memory management
   * - Should be called when knowledge base changes
   * - Resets any cached embeddings
   */
  clearCache(): void;
} 