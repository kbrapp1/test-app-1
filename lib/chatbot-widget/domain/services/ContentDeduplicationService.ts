/**
 * Content Deduplication Service - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for content deduplication
 * - Use content hashing to identify duplicate content
 * - Handle both URL-based and content-based duplicates
 * - No external dependencies, pure functions only
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on deduplication logic
 */

import { createHash } from 'crypto';
import { UrlNormalizationService } from './UrlNormalizationService';
import { SimHashContentSimilarityService, SimilarityContent } from './SimHashContentSimilarityService';

/**
 * Represents content that can be deduplicated
 */
export interface DeduplicatableContent {
  url: string;
  content: string;
  title?: string;
}

/**
 * Result of deduplication process
 */
export interface DeduplicationResult {
  /** The canonical content entry to keep */
  canonical: DeduplicatableContent;
  /** Duplicate entries that should be removed */
  duplicates: DeduplicatableContent[];
  /** All URLs that point to this content */
  allUrls: string[];
  /** Content hash for this group */
  contentHash: string;
}

/**
 * Domain service for detecting and handling duplicate content (2025 Enhanced)
 * 
 * Performs three types of deduplication:
 * 1. URL-based: URLs that normalize to the same canonical form
 * 2. Content-based: Different URLs with identical content (SHA-256)
 * 3. Similarity-based: Near-duplicate content using SimHash algorithm
 */
export class ContentDeduplicationService {
  
  private simHashService = new SimHashContentSimilarityService({
    hashBits: 64,
    duplicateThreshold: 3, // Allow 3-bit difference for near-duplicates
    includeTitle: true
  });
  
  constructor(private urlNormalizationService: UrlNormalizationService) {}
  
  /**
   * Create a hash of the cleaned content for deduplication
   * 
   * @param content - Raw HTML or text content
   * @returns SHA-256 hash of cleaned content
   */
  createContentHash(content: string): string {
    // Clean content for consistent hashing
    const cleanedContent = this.cleanContentForHashing(content);
    return createHash('sha256').update(cleanedContent, 'utf8').digest('hex');
  }
  
  /**
   * Clean content for consistent hashing by removing variable elements
   * 
   * @param content - Raw content to clean
   * @returns Cleaned content suitable for hashing
   */
  private cleanContentForHashing(content: string): string {
    let cleaned = content;
    
    // Remove HTML comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove script and style tags with their content
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove common dynamic elements that shouldn't affect content identity
    cleaned = cleaned.replace(/\btimestamp\s*[:=]\s*["\']?\d+["\']?/gi, '');
    cleaned = cleaned.replace(/\bdate\s*[:=]\s*["\']?[\d\-\/]+["\']?/gi, '');
    cleaned = cleaned.replace(/\bid\s*[:=]\s*["\']?[\w\-]+["\']?/gi, '');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }
  
  /**
   * Group content by both URL normalization and content similarity
   * 
   * @param contentItems - Array of content to deduplicate
   * @returns Array of deduplication results, one per unique content group
   */
  deduplicateContent(contentItems: DeduplicatableContent[]): DeduplicationResult[] {
    // Step 1: Group by normalized URL
    const urlGroups = new Map<string, DeduplicatableContent[]>();
    
    for (const item of contentItems) {
      const normalizedUrl = this.urlNormalizationService.normalizeUrl(item.url);
      
      if (!urlGroups.has(normalizedUrl)) {
        urlGroups.set(normalizedUrl, []);
      }
      urlGroups.get(normalizedUrl)!.push(item);
    }
    
    // Step 2: Within each URL group, check for content duplicates across groups
    const contentGroups = new Map<string, DeduplicatableContent[]>();
    
    for (const [normalizedUrl, urlGroupItems] of urlGroups) {
      // For URL groups with multiple items, pick the canonical URL
      if (urlGroupItems.length > 1) {
        const canonicalUrl = this.urlNormalizationService.getCanonicalUrl(
          urlGroupItems.map(item => item.url)
        );
        const canonicalItem = urlGroupItems.find(item => item.url === canonicalUrl) || urlGroupItems[0];
        
        // Use the canonical item for content hashing
        const contentHash = this.createContentHash(canonicalItem.content);
        
        if (!contentGroups.has(contentHash)) {
          contentGroups.set(contentHash, []);
        }
        contentGroups.get(contentHash)!.push(...urlGroupItems);
      } else {
        // Single item in URL group
        const item = urlGroupItems[0];
        const contentHash = this.createContentHash(item.content);
        
        if (!contentGroups.has(contentHash)) {
          contentGroups.set(contentHash, []);
        }
        contentGroups.get(contentHash)!.push(item);
      }
    }
    
    // Step 3: Create deduplication results
    const results: DeduplicationResult[] = [];
    
    for (const [contentHash, items] of contentGroups) {
      if (items.length > 1) {
        // Multiple items with same content - need deduplication
        const canonicalUrl = this.urlNormalizationService.getCanonicalUrl(
          items.map(item => item.url)
        );
        
        const canonical = items.find(item => item.url === canonicalUrl) || items[0];
        const duplicates = items.filter(item => item.url !== canonical.url);
        
        results.push({
          canonical,
          duplicates,
          allUrls: items.map(item => item.url),
          contentHash
        });
      } else {
        // Single item - no duplicates
        const item = items[0];
        results.push({
          canonical: item,
          duplicates: [],
          allUrls: [item.url],
          contentHash
        });
      }
    }
    
    return results;
  }
  
  /**
   * Find duplicate content entries for a specific URL
   * 
   * @param targetUrl - URL to find duplicates for
   * @param allContent - All content items to search through
   * @returns Array of duplicate content items
   */
  findDuplicatesForUrl(targetUrl: string, allContent: DeduplicatableContent[]): DeduplicatableContent[] {
    const targetItem = allContent.find(item => item.url === targetUrl);
    if (!targetItem) return [];
    
    const targetContentHash = this.createContentHash(targetItem.content);
    const targetNormalizedUrl = this.urlNormalizationService.normalizeUrl(targetUrl);
    
    return allContent.filter(item => {
      if (item.url === targetUrl) return false; // Don't include the target itself
      
      // Check for URL equivalence
      const itemNormalizedUrl = this.urlNormalizationService.normalizeUrl(item.url);
      if (itemNormalizedUrl === targetNormalizedUrl) return true;
      
      // Check for content equivalence
      const itemContentHash = this.createContentHash(item.content);
      return itemContentHash === targetContentHash;
    });
  }
  
  /**
   * Calculate similarity percentage between two content strings using SimHash (2025 Enhanced)
   * 
   * @param content1 - First content to compare
   * @param content2 - Second content to compare
   * @returns Similarity percentage (0-100)
   */
  calculateContentSimilarity(content1: string, content2: string): number {
    const cleaned1 = this.cleanContentForHashing(content1);
    const cleaned2 = this.cleanContentForHashing(content2);
    
    if (cleaned1 === cleaned2) return 100;
    
    // Use SimHash for advanced similarity detection
    const similarityContent1: SimilarityContent = {
      url: 'temp1',
      content: cleaned1
    };
    
    const similarityContent2: SimilarityContent = {
      url: 'temp2', 
      content: cleaned2
    };
    
    const result = this.simHashService.calculateSimilarity(similarityContent1, similarityContent2);
    return Math.round(result.similarity * 100);
  }
  
  /**
   * Check if two content items are similar enough to be considered near-duplicates
   * 
   * @param item1 - First content item
   * @param item2 - Second content item
   * @returns True if content is similar enough to be considered duplicate
   */
  areContentItemsSimilar(item1: DeduplicatableContent, item2: DeduplicatableContent): boolean {
    const similarityContent1: SimilarityContent = {
      url: item1.url,
      content: item1.content,
      title: item1.title
    };
    
    const similarityContent2: SimilarityContent = {
      url: item2.url,
      content: item2.content,
      title: item2.title
    };
    
    return this.simHashService.areSimilar(similarityContent1, similarityContent2);
  }
  
  /**
   * Enhanced deduplication that includes SimHash similarity detection
   * 
   * @param contentItems - Array of content to deduplicate
   * @returns Array of deduplication results including near-duplicates
   */
  deduplicateContentWithSimilarity(contentItems: DeduplicatableContent[]): DeduplicationResult[] {
    // Start with standard deduplication
    const standardResults = this.deduplicateContent(contentItems);
    
    // Now check for near-duplicates across different content groups
    const enhancedResults: DeduplicationResult[] = [];
    const processedItems = new Set<string>();
    
    for (const result of standardResults) {
      if (processedItems.has(result.canonical.url)) continue;
      
      // Find all items similar to this canonical item
      const similarItems: DeduplicatableContent[] = [result.canonical, ...result.duplicates];
      
      // Check against remaining unprocessed results
      for (const otherResult of standardResults) {
        if (processedItems.has(otherResult.canonical.url)) continue;
        if (otherResult.canonical.url === result.canonical.url) continue;
        
        // Check if this content is similar using SimHash
        if (this.areContentItemsSimilar(result.canonical, otherResult.canonical)) {
          similarItems.push(otherResult.canonical, ...otherResult.duplicates);
          processedItems.add(otherResult.canonical.url);
          otherResult.duplicates.forEach(dup => processedItems.add(dup.url));
        }
      }
      
      // Mark all URLs in this group as processed
      similarItems.forEach(item => processedItems.add(item.url));
      
      // Create enhanced result
      if (similarItems.length > 1) {
        const canonicalUrl = this.urlNormalizationService.getCanonicalUrl(
          similarItems.map(item => item.url)
        );
        
        const canonical = similarItems.find(item => item.url === canonicalUrl) || similarItems[0];
        const duplicates = similarItems.filter(item => item.url !== canonical.url);
        
        enhancedResults.push({
          canonical,
          duplicates,
          allUrls: similarItems.map(item => item.url),
          contentHash: this.createContentHash(canonical.content)
        });
      } else {
        enhancedResults.push(result);
      }
    }
    
    return enhancedResults;
  }
} 