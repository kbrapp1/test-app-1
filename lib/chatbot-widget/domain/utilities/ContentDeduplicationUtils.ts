/**
 * Content Deduplication Utilities
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Consolidate all content deduplication logic
 * - Replaces multiple duplicate implementations across codebase
 * - Follow @golden-rule patterns: Pure functions, no side effects
 * - Keep under 200 lines following DRY principle
 * - Supports different content types and similarity algorithms
 */

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarity: number;
  duplicateWith: string[];
  algorithm: 'exact' | 'hash' | 'similarity';
}

export interface ContentItem {
  id: string;
  content: string;
  url?: string;
  title?: string;
}

export interface DuplicationAnalysis {
  totalItems: number;
  duplicateCount: number;
  duplicateRate: number;
  examples: string[];
  duplicateGroups: Array<{
    canonical: ContentItem;
    duplicates: ContentItem[];
    similarity: number;
  }>;
}

export class ContentDeduplicationUtils {
  
  /**
   * Find exact content duplicates
   * Consolidates: analyzeContentDuplication, findDuplicateContent patterns
   */
  static findExactDuplicates(items: ContentItem[]): DuplicationAnalysis {
    const contentMap = new Map<string, ContentItem[]>();
    
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
    
    // Find duplicate groups
    const duplicateGroups: Array<{
      canonical: ContentItem;
      duplicates: ContentItem[];
      similarity: number;
    }> = [];
    
    let duplicateCount = 0;
    
    contentMap.forEach((groupItems) => {
      if (groupItems.length > 1) {
        const canonical = groupItems[0];
        const duplicates = groupItems.slice(1);
        duplicateCount += duplicates.length;
        
        duplicateGroups.push({
          canonical,
          duplicates,
          similarity: 1.0 // Exact match
        });
      }
    });
    
    const duplicateRate = items.length > 0 ? (duplicateCount / items.length) * 100 : 0;
    const examples = duplicateGroups.slice(0, 3).map(group => 
      `${group.duplicates.length + 1} items with identical content`
    );
    
    return {
      totalItems: items.length,
      duplicateCount,
      duplicateRate: Math.round(duplicateRate * 100) / 100,
      examples,
      duplicateGroups
    };
  }

  /**
   * Find content duplicates by hash
   * Consolidates: findDuplicatesByHash patterns
   */
  static findDuplicatesByHash(items: ContentItem[]): Array<{ hashValue: string; items: ContentItem[] }> {
    const hashMap = new Map<string, ContentItem[]>();
    
    items.forEach(item => {
      if (item.content) {
        const hash = this.generateContentHash(item.content);
        if (!hashMap.has(hash)) {
          hashMap.set(hash, []);
        }
        hashMap.get(hash)!.push(item);
      }
    });
    
    // Return only groups with duplicates
    return Array.from(hashMap.entries())
      .filter(([, groupItems]) => groupItems.length > 1)
      .map(([hashValue, groupItems]) => ({ hashValue, items: groupItems }));
  }

  /**
   * Calculate content similarity
   * Consolidates: calculateContentSimilarity patterns
   */
  static calculateSimilarity(content1: string, content2: string): number {
    const cleaned1 = this.normalizeContent(content1);
    const cleaned2 = this.normalizeContent(content2);
    
    if (cleaned1 === cleaned2) return 1.0;
    if (!cleaned1 || !cleaned2) return 0.0;
    
    // Simple Jaccard similarity for text
    const words1 = new Set(cleaned1.split(/\s+/));
    const words2 = new Set(cleaned2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0.0;
  }

  /**
   * Find similar content using similarity threshold
   * Consolidates: findDuplicates with similarity patterns
   */
  static findSimilarContent(
    items: ContentItem[], 
    similarityThreshold: number = 0.8
  ): DuplicationAnalysis {
    const duplicateGroups: Array<{
      canonical: ContentItem;
      duplicates: ContentItem[];
      similarity: number;
    }> = [];
    
    const processed = new Set<string>();
    
    for (let i = 0; i < items.length; i++) {
      if (processed.has(items[i].id)) continue;
      
      const canonical = items[i];
      const duplicates: ContentItem[] = [];
      let maxSimilarity = 0;
      
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(items[j].id)) continue;
        
        const similarity = this.calculateSimilarity(canonical.content, items[j].content);
        if (similarity >= similarityThreshold) {
          duplicates.push(items[j]);
          processed.add(items[j].id);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      }
      
      if (duplicates.length > 0) {
        duplicateGroups.push({
          canonical,
          duplicates,
          similarity: maxSimilarity
        });
        processed.add(canonical.id);
      }
    }
    
    const duplicateCount = duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0);
    const duplicateRate = items.length > 0 ? (duplicateCount / items.length) * 100 : 0;
    const examples = duplicateGroups.slice(0, 3).map(group => 
      `${group.duplicates.length + 1} similar items (${Math.round(group.similarity * 100)}% match)`
    );
    
    return {
      totalItems: items.length,
      duplicateCount,
      duplicateRate: Math.round(duplicateRate * 100) / 100,
      examples,
      duplicateGroups
    };
  }

  /**
   * Normalize content for comparison
   */
  private static normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Generate simple content hash
   */
  private static generateContentHash(content: string): string {
    const normalized = this.normalizeContent(content);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Check if two items are duplicates using multiple algorithms
   */
  static isDuplicate(
    item1: ContentItem, 
    item2: ContentItem, 
    method: 'exact' | 'hash' | 'similarity' = 'exact',
    threshold: number = 0.95
  ): DuplicateDetectionResult {
    let isDuplicate = false;
    let similarity = 0;
    
    switch (method) {
      case 'exact':
        similarity = this.normalizeContent(item1.content) === this.normalizeContent(item2.content) ? 1.0 : 0.0;
        isDuplicate = similarity === 1.0;
        break;
        
      case 'hash':
        similarity = this.generateContentHash(item1.content) === this.generateContentHash(item2.content) ? 1.0 : 0.0;
        isDuplicate = similarity === 1.0;
        break;
        
      case 'similarity':
        similarity = this.calculateSimilarity(item1.content, item2.content);
        isDuplicate = similarity >= threshold;
        break;
    }
    
    return {
      isDuplicate,
      similarity,
      duplicateWith: isDuplicate ? [item2.id] : [],
      algorithm: method
    };
  }
} 