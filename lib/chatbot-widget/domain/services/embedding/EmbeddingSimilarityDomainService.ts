/**
 * Embedding Similarity Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for cosine similarity calculations and semantic matching
 * - No external dependencies, only mathematical operations
 * - Keep under 250 lines by focusing on core similarity algorithms
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: similarity calculations and ranking
 */

import {
  SimilarityMatch,
  SimilaritySearchOptions,
  EmbeddingResult,
  EMBEDDING_CONSTANTS
} from '../interfaces/EmbeddingTypes';

export class EmbeddingSimilarityDomainService {

  /**
   * Calculate cosine similarity between two embeddings
   * 
   * AI INSTRUCTIONS:
   * - Pure mathematical function for cosine similarity
   * - Handle edge cases (zero vectors, different lengths)
   * - Return normalized score between -1 and 1
   */
  static calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    if (embeddingA.length !== embeddingB.length) {
      throw new Error(`Embedding vectors must have the same length. Got ${embeddingA.length} and ${embeddingB.length}`);
    }

    if (embeddingA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      normA += embeddingA[i] * embeddingA[i];
      normB += embeddingB[i] * embeddingB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    
    // Handle zero vectors
    if (denominator === 0) {
      return 0;
    }

    const similarity = dotProduct / denominator;
    
    // Ensure result is within valid range due to floating point precision
    return Math.max(-1, Math.min(1, similarity));
  }

  /**
   * Find most similar embeddings using cosine similarity
   * 
   * AI INSTRUCTIONS:
   * - Calculate similarities for all candidates
   * - Filter by minimum similarity threshold
   * - Sort by similarity score (highest first)
   * - Limit results to topK
   */
  static findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: EmbeddingResult[],
    options: SimilaritySearchOptions = {
      topK: EMBEDDING_CONSTANTS.DEFAULT_TOP_K,
      minSimilarity: EMBEDDING_CONSTANTS.DEFAULT_MIN_SIMILARITY
    }
  ): SimilarityMatch[] {
    if (candidateEmbeddings.length === 0) {
      return [];
    }

    // Calculate similarities for all candidates
    const similarities: SimilarityMatch[] = candidateEmbeddings
      .map((candidate, index) => ({
        text: candidate.text,
        similarity: this.calculateCosineSimilarity(queryEmbedding, candidate.embedding),
        index
      }))
      .filter(match => match.similarity >= options.minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.topK);

    return similarities;
  }

  /**
   * Calculate similarity matrix for multiple embeddings
   * 
   * AI INSTRUCTIONS:
   * - Create pairwise similarity matrix
   * - Useful for clustering and analysis
   * - Return symmetric matrix with diagonal of 1.0
   */
  static calculateSimilarityMatrix(embeddings: number[][]): number[][] {
    const size = embeddings.length;
    const matrix: number[][] = Array(size).fill(null).map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
      for (let j = i; j < size; j++) {
        if (i === j) {
          matrix[i][j] = 1.0; // Perfect similarity with itself
        } else {
          const similarity = this.calculateCosineSimilarity(embeddings[i], embeddings[j]);
          matrix[i][j] = similarity;
          matrix[j][i] = similarity; // Symmetric matrix
        }
      }
    }

    return matrix;
  }

  /**
   * Find duplicate or near-duplicate embeddings
   * 
   * AI INSTRUCTIONS:
   * - Identify embeddings with very high similarity
   * - Useful for deduplication
   * - Return pairs of similar embeddings
   */
  static findDuplicates(
    embeddings: EmbeddingResult[],
    duplicateThreshold: number = 0.95
  ): Array<{ indexA: number; indexB: number; similarity: number; textA: string; textB: string }> {
    const duplicates: Array<{ indexA: number; indexB: number; similarity: number; textA: string; textB: string }> = [];

    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const similarity = this.calculateCosineSimilarity(
          embeddings[i].embedding,
          embeddings[j].embedding
        );

        if (similarity >= duplicateThreshold) {
          duplicates.push({
            indexA: i,
            indexB: j,
            similarity,
            textA: embeddings[i].text,
            textB: embeddings[j].text
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate average similarity for an embedding against a set
   * 
   * AI INSTRUCTIONS:
   * - Calculate mean similarity score
   * - Useful for measuring centrality
   * - Handle empty sets gracefully
   */
  static calculateAverageSimilarity(
    targetEmbedding: number[],
    referenceEmbeddings: number[][]
  ): number {
    if (referenceEmbeddings.length === 0) {
      return 0;
    }

    const totalSimilarity = referenceEmbeddings.reduce((sum, embedding) => {
      return sum + this.calculateCosineSimilarity(targetEmbedding, embedding);
    }, 0);

    return totalSimilarity / referenceEmbeddings.length;
  }

  /**
   * Find outlier embeddings with low average similarity
   * 
   * AI INSTRUCTIONS:
   * - Identify embeddings that are dissimilar to the group
   * - Useful for quality control and anomaly detection
   * - Return embeddings below threshold
   */
  static findOutliers(
    embeddings: EmbeddingResult[],
    outlierThreshold: number = 0.3
  ): Array<{ index: number; text: string; averageSimilarity: number }> {
    const outliers: Array<{ index: number; text: string; averageSimilarity: number }> = [];
    const embeddingVectors = embeddings.map(e => e.embedding);

    embeddings.forEach((embedding, index) => {
      const otherEmbeddings = embeddingVectors.filter((_, i) => i !== index);
      const averageSimilarity = this.calculateAverageSimilarity(embedding.embedding, otherEmbeddings);

      if (averageSimilarity < outlierThreshold) {
        outliers.push({
          index,
          text: embedding.text,
          averageSimilarity
        });
      }
    });

    return outliers.sort((a, b) => a.averageSimilarity - b.averageSimilarity);
  }

  /**
   * Calculate embedding diversity score
   * 
   * AI INSTRUCTIONS:
   * - Measure how diverse a set of embeddings is
   * - Higher score means more diverse content
   * - Based on average pairwise distances
   */
  static calculateDiversityScore(embeddings: number[][]): number {
    if (embeddings.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    let pairCount = 0;

    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const similarity = this.calculateCosineSimilarity(embeddings[i], embeddings[j]);
        const distance = 1 - similarity; // Convert similarity to distance
        totalDistance += distance;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalDistance / pairCount : 0;
  }

  /**
   * Validate embedding vector
   * 
   * AI INSTRUCTIONS:
   * - Check for valid embedding format
   * - Ensure no NaN or infinite values
   * - Verify reasonable vector magnitude
   */
  static validateEmbedding(embedding: number[]): boolean {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return false;
    }

    // Check for invalid numbers
    const hasInvalidNumbers = embedding.some(value => 
      !Number.isFinite(value) || Number.isNaN(value)
    );

    if (hasInvalidNumbers) {
      return false;
    }

    // Check for zero vector (usually indicates an error)
    const isZeroVector = embedding.every(value => value === 0);
    if (isZeroVector) {
      return false;
    }

    // Check for reasonable magnitude (not too large or too small)
    const magnitude = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0));
    const isReasonableMagnitude = magnitude > 1e-10 && magnitude < 1e10;

    return isReasonableMagnitude;
  }

  /**
   * Normalize embedding vector to unit length
   * 
   * AI INSTRUCTIONS:
   * - Convert to unit vector for consistent comparisons
   * - Handle zero vectors gracefully
   * - Preserve direction while normalizing magnitude
   */
  static normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0));
    
    if (magnitude === 0) {
      return new Array(embedding.length).fill(0);
    }

    return embedding.map(value => value / magnitude);
  }
} 