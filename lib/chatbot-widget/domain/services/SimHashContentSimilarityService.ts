/**
 * SimHash Content Similarity Service - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for content-based similarity detection
 * - Implements SimHash algorithm for near-duplicate detection
 * - 2025 best practices: 64-bit SimHash, Hamming distance comparison
 * - No external dependencies, pure functions only
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on similarity detection logic
 */

/**
 * Content that can be analyzed for similarity
 */
export interface SimilarityContent {
  url: string;
  content: string;
  title?: string;
}

/**
 * Result of similarity analysis
 */
export interface SimilarityResult {
  url1: string;
  url2: string;
  similarity: number;
  hammingDistance: number;
  isDuplicate: boolean;
}

/**
 * SimHash configuration
 */
export interface SimHashConfig {
  /** Number of bits in the hash (default: 64) */
  hashBits: number;
  /** Maximum Hamming distance for duplicates (default: 3) */
  duplicateThreshold: number;
  /** Whether to include title in content analysis */
  includeTitle: boolean;
}

/**
 * Domain service for content-based similarity detection using SimHash
 * 
 * SimHash algorithm creates a fixed-size fingerprint of content where
 * similar content produces similar fingerprints. Uses 2025 best practices:
 * - 64-bit SimHash for optimal performance
 * - Hamming distance for similarity measurement
 * - 3-bit tolerance for near-duplicate detection
 */
export class SimHashContentSimilarityService {
  
  private readonly config: SimHashConfig;
  
  constructor(config: Partial<SimHashConfig> = {}) {
    this.config = {
      hashBits: 64,
      duplicateThreshold: 3,
      includeTitle: true,
      ...config
    };
  }
  
  /**
   * Generate SimHash fingerprint for content
   * 
   * @param content - Content to analyze
   * @returns 64-bit SimHash as bigint
   */
  generateSimHash(content: SimilarityContent): bigint {
    const text = this.prepareTextForAnalysis(content);
    const tokens = this.tokenizeContent(text);
    const features = this.extractFeatures(tokens);
    
    return this.computeSimHash(features);
  }
  
  /**
   * Calculate similarity between two content pieces
   * 
   * @param content1 - First content to compare
   * @param content2 - Second content to compare
   * @returns Similarity result with metrics
   */
  calculateSimilarity(content1: SimilarityContent, content2: SimilarityContent): SimilarityResult {
    const hash1 = this.generateSimHash(content1);
    const hash2 = this.generateSimHash(content2);
    
    const hammingDistance = this.calculateHammingDistance(hash1, hash2);
    const similarity = this.hammingDistanceToSimilarity(hammingDistance);
    const isDuplicate = hammingDistance <= this.config.duplicateThreshold;
    
    return {
      url1: content1.url,
      url2: content2.url,
      similarity,
      hammingDistance,
      isDuplicate
    };
  }
  
  /**
   * Check if two content pieces are near-duplicates
   * 
   * @param content1 - First content
   * @param content2 - Second content
   * @returns True if content is similar enough to be considered duplicate
   */
  areSimilar(content1: SimilarityContent, content2: SimilarityContent): boolean {
    const result = this.calculateSimilarity(content1, content2);
    return result.isDuplicate;
  }
  
  /**
   * Prepare text for analysis by cleaning and normalizing
   */
  private prepareTextForAnalysis(content: SimilarityContent): string {
    let text = content.content;
    
    // Include title if configured
    if (this.config.includeTitle && content.title) {
      text = content.title + ' ' + text;
    }
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ');
    
    // Convert to lowercase for consistency
    text = text.toLowerCase();
    
    // Remove common HTML entities if any remain
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    return text.trim();
  }
  
  /**
   * Tokenize content into meaningful terms
   */
  private tokenizeContent(text: string): string[] {
    // Split on word boundaries and filter meaningful tokens
    const tokens = text
      .split(/\W+/)
      .filter(token => 
        token.length >= 2 && // Minimum length
        /[a-zA-Z]/.test(token) && // Contains at least one letter
        !this.isStopWord(token) // Not a stop word
      );
    
    return tokens;
  }
  
  /**
   * Check if a word is a common stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }
  
  /**
   * Extract features from tokens using shingle approach
   */
  private extractFeatures(tokens: string[]): string[] {
    const features: string[] = [];
    
    // Single tokens
    features.push(...tokens);
    
    // Bigrams (2-word combinations)
    for (let i = 0; i < tokens.length - 1; i++) {
      features.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    
    // Trigrams (3-word combinations) for longer content
    if (tokens.length > 10) {
      for (let i = 0; i < tokens.length - 2; i++) {
        features.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
      }
    }
    
    return features;
  }
  
  /**
   * Compute SimHash from features using 2025 best practices
   */
  private computeSimHash(features: string[]): bigint {
    const hashBits = this.config.hashBits;
    const bitCounts = new Array(hashBits).fill(0);
    
    // Process each feature
    for (const feature of features) {
      const featureHash = this.hashFeature(feature);
      
      // Update bit counts based on feature hash
      for (let i = 0; i < hashBits; i++) {
        const bit = (featureHash >> BigInt(i)) & BigInt(1);
        bitCounts[i] += bit === BigInt(1) ? 1 : -1;
      }
    }
    
    // Create final SimHash
    let simHash = BigInt(0);
    for (let i = 0; i < hashBits; i++) {
      if (bitCounts[i] > 0) {
        simHash |= (BigInt(1) << BigInt(i));
      }
    }
    
    return simHash;
  }
  
  /**
   * Create hash for individual feature
   */
  private hashFeature(feature: string): bigint {
    // Simple but effective hash function for features
    let hash = BigInt(0);
    for (let i = 0; i < feature.length; i++) {
      const char = BigInt(feature.charCodeAt(i));
      hash = ((hash << BigInt(5)) - hash) + char;
      hash = hash & ((BigInt(1) << BigInt(64)) - BigInt(1)); // Keep within 64 bits
    }
    return hash;
  }
  
  /**
   * Calculate Hamming distance between two SimHashes
   */
  private calculateHammingDistance(hash1: bigint, hash2: bigint): number {
    let xor = hash1 ^ hash2;
    let distance = 0;
    
    // Count set bits in XOR result
    while (xor !== BigInt(0)) {
      distance++;
      xor = xor & (xor - BigInt(1)); // Clear lowest set bit
    }
    
    return distance;
  }
  
  /**
   * Convert Hamming distance to similarity percentage
   */
  private hammingDistanceToSimilarity(hammingDistance: number): number {
    const maxDistance = this.config.hashBits;
    const similarity = 1 - (hammingDistance / maxDistance);
    return Math.max(0, Math.min(1, similarity));
  }
} 