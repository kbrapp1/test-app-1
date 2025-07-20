/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Content hashing and deduplication utilities
 * - Uses ContentSimilarityUtilities for similarity calculations
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on content hashing, fingerprinting, and domain-specific operations
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ContentSimilarityUtilities } from '../../../../domain/utilities/ContentSimilarityUtilities';

export class KnowledgeContentHashingService {

  // Content Hashing Operations
  static generateContentHash(content: string): string {
    if (!content || content.trim().length === 0) {
      return 'empty_content';
    }
    
    // Simple hash function for content deduplication
    let hash = 0;
    const normalizedContent = ContentSimilarityUtilities.normalizeContent(content);
    
    for (let i = 0; i < normalizedContent.length; i++) {
      const char = normalizedContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  static generateItemContentHash(item: KnowledgeItem): string {
    const content = item.content || '';
    const title = item.title || '';
    const source = item.source || '';
    
    // Combine content, title, and source for more accurate deduplication
    const combinedContent = `${title}|${content}|${source}`;
    return this.generateContentHash(combinedContent);
  }

  static generateMultiFieldHash(fields: Record<string, string>): string {
    const combinedContent = Object.entries(fields)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistent ordering
      .map(([key, value]) => `${key}:${value || ''}`)
      .join('|');
    
    return this.generateContentHash(combinedContent);
  }

  // Content Normalization Operations - Domain-specific extensions
  static normalizeContent(content: string): string {
    return ContentSimilarityUtilities.normalizeContent(content);
  }

  static normalizeForComparison(content: string): string {
    return ContentSimilarityUtilities.normalizeContent(content)
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, '') // Remove common words
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Deduplication Operations
  static findDuplicatesByHash(items: KnowledgeItem[]): Array<{
    hash: string;
    duplicates: KnowledgeItem[];
  }> {
    const hashGroups = new Map<string, KnowledgeItem[]>();
    
    items.forEach(item => {
      const hash = this.generateItemContentHash(item);
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash)!.push(item);
    });
    
    // Return only groups with duplicates
    return Array.from(hashGroups.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([hash, duplicates]) => ({ hash, duplicates }));
  }

  static findDuplicatesByContent(items: KnowledgeItem[]): Array<{
    normalizedContent: string;
    duplicates: KnowledgeItem[];
  }> {
    const contentGroups = new Map<string, KnowledgeItem[]>();
    
    items.forEach(item => {
      if (!item.content) return;
      
      const normalized = this.normalizeForComparison(item.content);
      if (normalized.length < 10) return; // Skip very short content
      
      if (!contentGroups.has(normalized)) {
        contentGroups.set(normalized, []);
      }
      contentGroups.get(normalized)!.push(item);
    });
    
    // Return only groups with duplicates
    return Array.from(contentGroups.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([normalizedContent, duplicates]) => ({ normalizedContent, duplicates }));
  }

  static identifyNearDuplicates(items: KnowledgeItem[], threshold: number = 0.85): Array<{
    item1: KnowledgeItem;
    item2: KnowledgeItem;
    similarity: number;
  }> {
    const nearDuplicates: Array<{
      item1: KnowledgeItem;
      item2: KnowledgeItem;
      similarity: number;
    }> = [];

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const similarity = this.calculateContentSimilarity(items[i], items[j]);
        
        if (similarity >= threshold) {
          nearDuplicates.push({
            item1: items[i],
            item2: items[j],
            similarity
          });
        }
      }
    }

    return nearDuplicates.sort((a, b) => b.similarity - a.similarity);
  }

  // Content Similarity Operations using ContentSimilarityUtilities
  static calculateContentSimilarity(item1: KnowledgeItem, item2: KnowledgeItem): number {
    const content1 = this.normalizeForComparison(item1.content || '');
    const content2 = this.normalizeForComparison(item2.content || '');
    
    if (content1.length === 0 || content2.length === 0) {
      return 0;
    }
    
    return ContentSimilarityUtilities.calculateJaccardSimilarity(content1, content2, 2);
  }

  static calculateTitleSimilarity(item1: KnowledgeItem, item2: KnowledgeItem): number {
    const title1 = this.normalizeForComparison(item1.title || '');
    const title2 = this.normalizeForComparison(item2.title || '');
    
    if (title1.length === 0 || title2.length === 0) {
      return 0;
    }
    
    return ContentSimilarityUtilities.calculateJaccardSimilarity(title1, title2, 2);
  }

  // Hash Validation Operations
  static validateHashIntegrity(items: KnowledgeItem[]): {
    validHashes: number;
    invalidHashes: number;
    rehashRequired: KnowledgeItem[];
  } {
    let validHashes = 0;
    let invalidHashes = 0;
    const rehashRequired: KnowledgeItem[] = [];

    items.forEach(item => {
      const currentHash = this.generateItemContentHash(item);
      
      // If item has a stored hash, validate it
      if ((item as unknown as Record<string, unknown>).contentHash) {
        if ((item as unknown as Record<string, unknown>).contentHash === currentHash) {
          validHashes++;
        } else {
          invalidHashes++;
          rehashRequired.push(item);
        }
      } else {
        // No stored hash, needs initial hashing
        rehashRequired.push(item);
      }
    });

    return {
      validHashes,
      invalidHashes,
      rehashRequired
    };
  }

  // Content Fingerprinting Operations
  static generateContentFingerprint(item: KnowledgeItem): {
    contentHash: string;
    titleHash: string;
    metadataHash: string;
    combinedHash: string;
  } {
    const contentHash = this.generateContentHash(item.content || '');
    const titleHash = this.generateContentHash(item.title || '');
    const metadataHash = this.generateMultiFieldHash({
      source: item.source || '',
      category: item.category || '',
      tags: (item.tags || []).join(',')
    });
    const combinedHash = this.generateItemContentHash(item);

    return {
      contentHash,
      titleHash,
      metadataHash,
      combinedHash
    };
  }

  static compareFingerprints(
    fingerprint1: ReturnType<typeof KnowledgeContentHashingService.generateContentFingerprint>,
    fingerprint2: ReturnType<typeof KnowledgeContentHashingService.generateContentFingerprint>
  ): {
    contentMatch: boolean;
    titleMatch: boolean;
    metadataMatch: boolean;
    exactMatch: boolean;
  } {
    return {
      contentMatch: fingerprint1.contentHash === fingerprint2.contentHash,
      titleMatch: fingerprint1.titleHash === fingerprint2.titleHash,
      metadataMatch: fingerprint1.metadataHash === fingerprint2.metadataHash,
      exactMatch: fingerprint1.combinedHash === fingerprint2.combinedHash
    };
  }
} 