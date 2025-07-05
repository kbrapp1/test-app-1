/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Advanced query operations and validation
 * - Handles complex multi-filter queries and parameter validation
 * - Supports sophisticated query combinations
 * - Keep under 250 lines per @golden-rule
 * - Generic approach that works for any organization
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeBasicFilterService } from './KnowledgeBasicFilterService';
import { KnowledgeSearchService } from './KnowledgeSearchService';

 // Advanced Query Parameters Interface
export interface AdvancedQueryFilters {
  categories?: KnowledgeItem['category'][];
  tags?: string[];
  sources?: string[];
  searchTerm?: string;
  minRelevanceScore?: number;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  qualityThreshold?: number;
}

 // Query Validation Result Interface
export interface QueryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class KnowledgeAdvancedQueryService {

  static advancedFilter(
    items: KnowledgeItem[],
    filters: AdvancedQueryFilters,
    limit: number = 10
  ): KnowledgeItem[] {
    let filteredItems = items;

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      filteredItems = KnowledgeBasicFilterService.filterByCategories(
        filteredItems,
        filters.categories,
        filteredItems.length
      );
    }

    // Apply source filter
    if (filters.sources && filters.sources.length > 0) {
      filteredItems = KnowledgeBasicFilterService.filterBySource(
        filteredItems,
        filters.sources,
        filteredItems.length
      );
    }

    // Apply relevance score filter
    if (filters.minRelevanceScore !== undefined) {
      filteredItems = KnowledgeBasicFilterService.filterByRelevanceScore(
        filteredItems,
        filters.minRelevanceScore,
        filteredItems.length
      );
    }

    // Apply quality threshold filter
    if (filters.qualityThreshold !== undefined) {
      filteredItems = KnowledgeBasicFilterService.getHighQualityItems(
        filteredItems,
        filters.qualityThreshold,
        filteredItems.length
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      filteredItems = KnowledgeBasicFilterService.getItemsByDateRange(
        filteredItems,
        filters.dateRange.startDate,
        filters.dateRange.endDate,
        filteredItems.length
      );
    }

    // Apply tag filter
    if (filters.tags && filters.tags.length > 0) {
      filteredItems = KnowledgeBasicFilterService.filterByTags(
        filteredItems,
        filters.tags,
        filteredItems.length
      );
    }

    // Apply content search filter (this should be last as it re-ranks results)
    if (filters.searchTerm) {
      filteredItems = KnowledgeSearchService.searchByContent(
        filteredItems,
        filters.searchTerm,
        filteredItems.length
      );
    }

    return filteredItems.slice(0, limit);
  }

  static smartQuery(
    items: KnowledgeItem[],
    query: string,
    limit: number = 10
  ): {
    results: KnowledgeItem[];
    suggestions: string[];
    alternativeQueries: string[];
  } {
    const results = KnowledgeSearchService.searchByContent(items, query, limit);
    const suggestions = this.generateQuerySuggestions(items, query);
    const alternativeQueries = this.generateAlternativeQueries(items, query);

    return {
      results,
      suggestions,
      alternativeQueries
    };
  }

  static validateQueryParameters(params: {
    limit?: number;
    searchTerm?: string;
    tags?: string[];
    categories?: string[];
    sources?: string[];
    minRelevanceScore?: number;
    qualityThreshold?: number;
  }): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate limit
    if (params.limit !== undefined) {
      if (params.limit < 1) {
        errors.push('Limit must be greater than 0');
      } else if (params.limit > 100) {
        warnings.push('Large limit values may impact performance');
        suggestions.push('Consider using pagination for large result sets');
      }
    }

    // Validate search term
    if (params.searchTerm !== undefined) {
      if (params.searchTerm.trim().length === 0) {
        warnings.push('Empty search term will return unfiltered results');
      } else if (params.searchTerm.length < 2) {
        warnings.push('Search terms shorter than 2 characters may return too many results');
      } else if (params.searchTerm.length > 100) {
        warnings.push('Very long search terms may not match effectively');
        suggestions.push('Consider breaking down long queries into shorter terms');
      }
    }

    // Validate tags
    if (params.tags !== undefined) {
      if (params.tags.length === 0) {
        warnings.push('Empty tags array will not filter results');
      } else if (params.tags.length > 10) {
        warnings.push('Many tags may result in very specific filtering');
        suggestions.push('Consider using fewer, more general tags');
      }
    }

    // Validate categories
    if (params.categories !== undefined) {
      const validCategories = ['faq', 'product_info', 'pricing', 'support', 'general'];
      const invalidCategories = params.categories.filter(cat => !validCategories.includes(cat));
      
      if (invalidCategories.length > 0) {
        errors.push(`Invalid categories: ${invalidCategories.join(', ')}`);
        suggestions.push(`Valid categories are: ${validCategories.join(', ')}`);
      }
    }

    // Validate relevance score
    if (params.minRelevanceScore !== undefined) {
      if (params.minRelevanceScore < 0 || params.minRelevanceScore > 1) {
        errors.push('Minimum relevance score must be between 0 and 1');
      } else if (params.minRelevanceScore > 0.9) {
        warnings.push('Very high relevance score threshold may return few results');
      }
    }

    // Validate quality threshold
    if (params.qualityThreshold !== undefined) {
      if (params.qualityThreshold < 0 || params.qualityThreshold > 1) {
        errors.push('Quality threshold must be between 0 and 1');
      } else if (params.qualityThreshold > 0.95) {
        warnings.push('Very high quality threshold may return few results');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private static generateQuerySuggestions(items: KnowledgeItem[], query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Suggest based on common tags
    const commonTags = this.getCommonTags(items);
    const relatedTags = commonTags.filter(tag => 
      tag.toLowerCase().includes(lowerQuery) || lowerQuery.includes(tag.toLowerCase())
    );
    
    relatedTags.slice(0, 3).forEach(tag => {
      suggestions.push(`Try searching for: "${tag}"`);
    });

    // Suggest based on categories
    if (lowerQuery.includes('product')) {
      suggestions.push('Consider filtering by "product_info" category');
    }
    if (lowerQuery.includes('support') || lowerQuery.includes('help')) {
      suggestions.push('Consider filtering by "support" category');
    }
    if (lowerQuery.includes('price') || lowerQuery.includes('cost')) {
      suggestions.push('Consider filtering by "pricing" category');
    }

    return suggestions.slice(0, 5);
  }

  private static generateAlternativeQueries(items: KnowledgeItem[], query: string): string[] {
    const alternatives: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Synonym suggestions
    const synonyms: Record<string, string[]> = {
      'help': ['support', 'assistance', 'guide'],
      'cost': ['price', 'pricing', 'fee'],
      'product': ['item', 'service', 'offering'],
      'how': ['what', 'why', 'when'],
      'buy': ['purchase', 'order', 'get']
    };

    Object.entries(synonyms).forEach(([word, syns]) => {
      if (lowerQuery.includes(word)) {
        syns.forEach(syn => {
          alternatives.push(lowerQuery.replace(word, syn));
        });
      }
    });

    return alternatives.slice(0, 3);
  }

  private static getCommonTags(items: KnowledgeItem[]): string[] {
    const tagCount: Record<string, number> = {};
    
    items.forEach(item => {
      item.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }
} 