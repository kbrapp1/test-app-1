/**
 * Knowledge Filtering Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for knowledge filtering business logic
 * - Contains business rules for tag and category filtering
 * - No external dependencies beyond domain objects
 * - Encapsulates filtering business logic
 */

import { KnowledgeItem } from '../interfaces/IKnowledgeRetrievalService';

export class KnowledgeFilteringService {
  /**
   * Filter knowledge items by tags with business rules
   */
  public filterByTags(items: KnowledgeItem[], tags: string[]): KnowledgeItem[] {
    if (!tags || tags.length === 0) {
      return items;
    }

    const normalizedTags = tags.map(tag => tag.toLowerCase().trim());

    return items.filter(item => {
      if (!item.tags || item.tags.length === 0) {
        return false;
      }

      // Business rule: Item matches if it contains ANY of the specified tags
      return normalizedTags.some(searchTag => 
        item.tags.some(itemTag => 
          this.tagMatches(itemTag, searchTag)
        )
      );
    });
  }

  /**
   * Filter knowledge items by category with business rules
   */
  public filterByCategory(items: KnowledgeItem[], category: string): KnowledgeItem[] {
    if (!category?.trim()) {
      return items;
    }

    const normalizedCategory = category.toLowerCase().trim();

    return items.filter(item => {
      if (!item.category) {
        return false;
      }

      // Business rule: Exact category match (case-insensitive)
      return item.category.toLowerCase().trim() === normalizedCategory;
    });
  }

  /**
   * Filter knowledge items by source type with business rules
   */
  public filterBySourceType(items: KnowledgeItem[], sourceType: string): KnowledgeItem[] {
    if (!sourceType?.trim()) {
      return items;
    }

    const normalizedSourceType = sourceType.toLowerCase().trim();

    return items.filter(item => {
      if (!item.source) {
        return false;
      }

      // Business rule: Source contains source type (case-insensitive)
      return item.source.toLowerCase().trim().includes(normalizedSourceType);
    });
  }

  /**
   * Filter knowledge items by source URL with business rules
   */
  public filterBySourceUrl(items: KnowledgeItem[], sourceUrl: string): KnowledgeItem[] {
    if (!sourceUrl?.trim()) {
      return items;
    }

    const normalizedSourceUrl = sourceUrl.toLowerCase().trim();

    return items.filter(item => {
      if (!item.source) {
        return false;
      }

      // Business rule: Exact URL match (case-insensitive)
      return item.source.toLowerCase().trim() === normalizedSourceUrl;
    });
  }

  /**
   * Filter knowledge items by multiple criteria
   */
  public filterByCriteria(
    items: KnowledgeItem[], 
    criteria: {
      category?: string;
      tags?: string[];
      sourceType?: string;
      sourceUrl?: string;
    }
  ): KnowledgeItem[] {
    let filteredItems = items;

    if (criteria.category) {
      filteredItems = this.filterByCategory(filteredItems, criteria.category);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      filteredItems = this.filterByTags(filteredItems, criteria.tags);
    }

    if (criteria.sourceType) {
      filteredItems = this.filterBySourceType(filteredItems, criteria.sourceType);
    }

    if (criteria.sourceUrl) {
      filteredItems = this.filterBySourceUrl(filteredItems, criteria.sourceUrl);
    }

    return filteredItems;
  }

  /**
   * Sort knowledge items by relevance with business rules
   */
  public sortByRelevance(items: KnowledgeItem[]): KnowledgeItem[] {
    return [...items].sort((a, b) => {
      // Business rule: Sort by last updated date (most recent first)
      if (a.lastUpdated && b.lastUpdated) {
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      }

      // Business rule: Items with update dates come before those without
      if (a.lastUpdated && !b.lastUpdated) return -1;
      if (!a.lastUpdated && b.lastUpdated) return 1;

      // Business rule: Sort by title alphabetically as final fallback
      return (a.title || '').localeCompare(b.title || '');
    });
  }

  /**
   * Get unique categories from knowledge items
   */
  public getUniqueCategories(items: KnowledgeItem[]): string[] {
    const categories = new Set<string>();
    
    items.forEach(item => {
      if (item.category?.trim()) {
        categories.add(item.category.trim());
      }
    });

    return Array.from(categories).sort();
  }

  /**
   * Get unique tags from knowledge items
   */
  public getUniqueTags(items: KnowledgeItem[]): string[] {
    const tags = new Set<string>();
    
    items.forEach(item => {
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach(tag => {
          if (tag?.trim()) {
            tags.add(tag.trim());
          }
        });
      }
    });

    return Array.from(tags).sort();
  }

  /**
   * Get unique source types from knowledge items
   */
  public getUniqueSourceTypes(items: KnowledgeItem[]): string[] {
    const sourceTypes = new Set<string>();
    
    items.forEach(item => {
      if (item.source?.trim()) {
        // Extract source type from source URL/path
        const sourceType = this.extractSourceType(item.source);
        if (sourceType) {
          sourceTypes.add(sourceType);
        }
      }
    });

    return Array.from(sourceTypes).sort();
  }

  /**
   * Business rule for tag matching
   */
  private tagMatches(itemTag: string, searchTag: string): boolean {
    const normalizedItemTag = itemTag.toLowerCase().trim();
    const normalizedSearchTag = searchTag.toLowerCase().trim();

    // Business rule: Exact match or partial match
    return normalizedItemTag.includes(normalizedSearchTag) ||
           normalizedSearchTag.includes(normalizedItemTag);
  }

  /**
   * Extract source type from source URL/path
   */
  private extractSourceType(source: string): string | null {
    const trimmedSource = source.trim().toLowerCase();
    
    if (trimmedSource.includes('faq')) return 'faq';
    if (trimmedSource.includes('doc')) return 'documentation';
    if (trimmedSource.includes('api')) return 'api';
    if (trimmedSource.includes('web')) return 'website';
    if (trimmedSource.includes('file')) return 'file';
    
    return 'unknown';
  }
}