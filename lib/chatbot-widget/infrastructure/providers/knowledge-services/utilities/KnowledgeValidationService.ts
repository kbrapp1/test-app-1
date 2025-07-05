/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Basic content validation
 * - Keep under 120 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - No complex interfaces or over-engineering
 * - Just validation, nothing more
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeValidationService {

  static validateItem(item: KnowledgeItem): string[] {
    const errors: string[] = [];

    // Required field validation
    if (!item.id || item.id.trim().length === 0) {
      errors.push('Missing or empty ID');
    }

    if (!item.title || item.title.trim().length === 0) {
      errors.push('Missing or empty title');
    }

    if (!item.content || item.content.trim().length === 0) {
      errors.push('Missing or empty content');
    }

    // Content length validation
    if (item.content && item.content.length < 10) {
      errors.push('Content too short (minimum 10 characters)');
    }

    if (item.content && item.content.length > 50000) {
      errors.push('Content too long (maximum 50,000 characters)');
    }

    // Timestamp validation
    if (!item.lastUpdated) {
      errors.push('Missing lastUpdated timestamp');
    } else if (item.lastUpdated > new Date()) {
      errors.push('lastUpdated timestamp cannot be in the future');
    }

    // Score validation
    if (typeof item.relevanceScore === 'number' && (item.relevanceScore < 0 || item.relevanceScore > 1)) {
      errors.push('relevanceScore must be between 0 and 1');
    }

    return errors;
  }

  static validateBatch(items: KnowledgeItem[]): {
    validItems: KnowledgeItem[];
    invalidItems: KnowledgeItem[];
    validationErrors: Array<{ itemId: string; errors: string[] }>;
  } {
    const validItems: KnowledgeItem[] = [];
    const invalidItems: KnowledgeItem[] = [];
    const validationErrors: Array<{ itemId: string; errors: string[] }> = [];

    items.forEach(item => {
      const errors = this.validateItem(item);
      
      if (errors.length === 0) {
        validItems.push(item);
      } else {
        invalidItems.push(item);
        validationErrors.push({
          itemId: item.id,
          errors
        });
      }
    });

    return {
      validItems,
      invalidItems,
      validationErrors
    };
  }

  static isValid(item: KnowledgeItem): boolean {
    return this.validateItem(item).length === 0;
  }

  static getValidationSummary(items: KnowledgeItem[]): {
    totalItems: number;
    validItems: number;
    invalidItems: number;
    commonIssues: Array<{ issue: string; count: number }>;
  } {
    const results = items.map(item => this.validateItem(item));
    const validItems = results.filter(errors => errors.length === 0).length;
    const invalidItems = results.length - validItems;

    // Count common issues
    const issueCount = new Map<string, number>();
    results.forEach(errors => {
      errors.forEach(error => {
        issueCount.set(error, (issueCount.get(error) || 0) + 1);
      });
    });

    const commonIssues = Array.from(issueCount.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 issues

    return {
      totalItems: items.length,
      validItems,
      invalidItems,
      commonIssues
    };
  }

  // Backward compatibility method
  static validateContentQuality(items: KnowledgeItem[]) {
    return this.validateBatch(items);
  }
} 