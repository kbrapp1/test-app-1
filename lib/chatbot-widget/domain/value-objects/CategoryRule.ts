/**
 * Category Rule Domain Value Object
 * 
 * AI INSTRUCTIONS:
 * - Pure domain value object for categorization rules
 * - Immutable and encapsulates business knowledge
 * - No external dependencies
 * - Contains domain knowledge about content categorization patterns
 */

import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';

/** Domain rules for content categorization */
export interface CategoryRule {
  readonly category: KnowledgeItem['category'];
  readonly titlePatterns: RegExp[];
  readonly contentPatterns: RegExp[];
  readonly priority: number; // Higher priority = checked first
}

/**
 * Category Rules Domain Value Object
 * 
 * Encapsulates the business knowledge about how to categorize content
 * based on domain expertise and patterns
 */
export class CategoryRules {
  private static readonly rules: CategoryRule[] = [
    {
      category: 'faq',
      titlePatterns: [
        /faq/i,
        /frequently\s+asked/i,
        /questions/i,
        /help/i,
        /support/i
      ],
      contentPatterns: [
        /frequently\s+asked/i,
        /common\s+questions/i,
        /q:\s*|question:/i,
        /a:\s*|answer:/i
      ],
      priority: 10
    },
    {
      category: 'pricing',
      titlePatterns: [
        /pricing/i,
        /price/i,
        /cost/i,
        /plans/i,
        /subscription/i
      ],
      contentPatterns: [
        /\$\d+/,
        /pricing/i,
        /monthly|annually/i,
        /subscription/i,
        /plan/i
      ],
      priority: 9
    },
    {
      category: 'support',
      titlePatterns: [
        /support/i,
        /help/i,
        /documentation/i,
        /troubleshoot/i,
        /how\s+to/i
      ],
      contentPatterns: [
        /troubleshoot/i,
        /contact\s+support/i,
        /help\s+desk/i,
        /step\s+by\s+step/i
      ],
      priority: 8
    },
    {
      category: 'product_info',
      titlePatterns: [
        /product/i,
        /features/i,
        /about/i,
        /overview/i,
        /what\s+is/i
      ],
      contentPatterns: [
        /features/i,
        /product/i,
        /overview/i,
        /capabilities/i,
        /functionality/i
      ],
      priority: 7
    }
  ];

  /** Get all category rules sorted by priority */
  public static getAllRules(): CategoryRule[] {
    return [...this.rules].sort((a, b) => b.priority - a.priority);
  }

  /** Get valid category names */
  public static getValidCategories(): KnowledgeItem['category'][] {
    return ['general', 'faq', 'product_info', 'pricing', 'support'];
  }

  /** Check if a category is valid */
  public static isValidCategory(category: string): boolean {
    return this.getValidCategories().includes(category as KnowledgeItem['category']);
  }
}