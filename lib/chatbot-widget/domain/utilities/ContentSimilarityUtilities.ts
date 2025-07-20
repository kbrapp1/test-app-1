/**
 * Content Similarity Utilities
 * 
 * AI INSTRUCTIONS:
 * - Pure domain utility for content similarity and duplicate detection
 * - Consolidates duplicate implementations across codebase
 * - Keep under 200 lines per @golden-rule patterns
 * - Single responsibility: similarity algorithms only
 * - No external dependencies - pure business logic
 * - Static methods for efficiency and statelessness
 */

export interface SimilarityOptions {
  algorithm: 'exact' | 'jaccard' | 'normalized';
  threshold?: number;
  minWordLength?: number;
}

export interface DuplicateGroup<T> {
  items: T[];
  count: number;
}

export interface ContentItem {
  id: string;
  content: string;
}

export class ContentSimilarityUtilities {
  
  /**
   * Normalize content for comparison
   * Consolidates multiple normalization patterns found in codebase
   */
  static normalizeContent(content: string): string {
    return content.toLowerCase().trim();
  }

  /**
   * Calculate Jaccard similarity between two texts
   * Consolidates identical implementations from multiple services
   */
  static calculateJaccardSimilarity(text1: string, text2: string, minWordLength: number = 2): number {
    const normalized1 = this.normalizeContent(text1);
    const normalized2 = this.normalizeContent(text2);
    
    if (normalized1.length === 0 || normalized2.length === 0) {
      return 0;
    }
    
    const words1 = new Set(normalized1.split(' ').filter(word => word.length > minWordLength));
    const words2 = new Set(normalized2.split(' ').filter(word => word.length > minWordLength));
    
    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Find exact content duplicates using map-based grouping
   * Consolidates identical implementations from KnowledgeQualityAnalysisService and ContentAnalysisUtilities
   */
  static findExactDuplicates<T extends ContentItem>(items: T[]): {
    duplicateGroups: DuplicateGroup<T>[];
    duplicateIds: string[];
    duplicateCount: number;
  } {
    const contentMap = new Map<string, T[]>();
    
    // Group items by normalized content
    items.forEach(item => {
      if (item.content) {
        const normalized = this.normalizeContent(item.content);
        if (!contentMap.has(normalized)) {
          contentMap.set(normalized, []);
        }
        contentMap.get(normalized)!.push(item);
      }
    });
    
    // Extract duplicate groups
    const duplicateGroups: DuplicateGroup<T>[] = [];
    const duplicateIds: string[] = [];
    
    contentMap.forEach((groupItems) => {
      if (groupItems.length > 1) {
        duplicateGroups.push({
          items: groupItems,
          count: groupItems.length
        });
        
        // Mark all but first as duplicates (keeping first as canonical)
        duplicateIds.push(...groupItems.slice(1).map(item => item.id));
      }
    });
    
    return {
      duplicateGroups,
      duplicateIds,
      duplicateCount: duplicateIds.length
    };
  }

  /**
   * Check if two content items are similar based on algorithm
   */
  static areContentsSimilar(content1: string, content2: string, options: SimilarityOptions): boolean {
    const threshold = options.threshold ?? 0.8;
    
    switch (options.algorithm) {
      case 'exact':
        return this.normalizeContent(content1) === this.normalizeContent(content2);
      
      case 'jaccard':
        const similarity = this.calculateJaccardSimilarity(
          content1, 
          content2, 
          options.minWordLength
        );
        return similarity >= threshold;
      
      case 'normalized':
        const normalized1 = this.normalizeContent(content1);
        const normalized2 = this.normalizeContent(content2);
        
        if (normalized1.length < 10 || normalized2.length < 10) {
          return normalized1 === normalized2;
        }
        
        // Substring containment for longer strings
        const maxLength = Math.min(20, Math.min(normalized1.length, normalized2.length));
        return normalized1.includes(normalized2.substring(0, maxLength)) ||
               normalized2.includes(normalized1.substring(0, maxLength));
      
      default:
        return false;
    }
  }

  /**
   * Find similar content based on algorithm
   */
  static findSimilarContent<T extends ContentItem>(
    items: T[], 
    options: SimilarityOptions
  ): Array<{ canonical: T; similar: T[]; algorithm: string }> {
    const similarGroups: Array<{ canonical: T; similar: T[]; algorithm: string }> = [];
    const processed = new Set<string>();
    
    for (let i = 0; i < items.length; i++) {
      if (processed.has(items[i].id)) continue;
      
      const canonical = items[i];
      const similar: T[] = [];
      
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(items[j].id)) continue;
        
        if (this.areContentsSimilar(canonical.content, items[j].content, options)) {
          similar.push(items[j]);
          processed.add(items[j].id);
        }
      }
      
      if (similar.length > 0) {
        similarGroups.push({
          canonical,
          similar,
          algorithm: options.algorithm
        });
        processed.add(canonical.id);
      }
    }
    
    return similarGroups;
  }

  /**
   * Calculate overall duplication rate for a collection
   */
  static calculateDuplicationRate<T extends ContentItem>(items: T[], algorithm: 'exact' | 'jaccard' = 'exact'): number {
    if (items.length === 0) return 0;
    
    const options: SimilarityOptions = { algorithm };
    const { duplicateCount } = algorithm === 'exact' 
      ? this.findExactDuplicates(items)
      : { duplicateCount: this.findSimilarContent(items, options).reduce((sum, group) => sum + group.similar.length, 0) };
    
    return (duplicateCount / items.length) * 100;
  }
}