/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Convert FAQ and config data to knowledge items
 * - Maps FAQ categories to internal knowledge categories
 * - Handles knowledge item creation and transformation
 * - Keep under 250 lines per @golden-rule
 * - Generic approach that works for any organization
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import {
  // CategoryMapping,
  KnowledgeProcessingContext,
  KnowledgeConversionResult,
  FAQ_CATEGORY_MAPPINGS
} from './types/KnowledgeServiceTypes';
import { TagExtractionService } from './TagExtractionService';

export class KnowledgeConverterService {

  static convertFaqToKnowledgeItem(faq: unknown, context: KnowledgeProcessingContext): KnowledgeItem {
    const faqData = faq as { id: string; question: string; answer: string; category: string };
    return {
      id: faqData.id,
      title: faqData.question,
      content: faqData.answer,
      category: this.mapFaqCategoryToKnowledgeCategory(faqData.category),
      tags: TagExtractionService.extractFaqCategoryTags(faqData.category),
      relevanceScore: 0.8,
      source: 'faq',
      lastUpdated: context.lastUpdated
    };
  }

  static convertCompanyInfoToKnowledgeItem(
    companyInfo: string,
    context: KnowledgeProcessingContext
  ): KnowledgeItem {
    return {
      id: 'company-info',
      title: 'Company Information',
      content: companyInfo,
      category: 'general',
      tags: TagExtractionService.extractContextAwareTags(
        companyInfo,
        { category: 'general', source: 'chatbot_config', companyName: context.companyName }
      ),
      relevanceScore: 0.8,
      source: context.source,
      lastUpdated: context.lastUpdated
    };
  }

  static convertSupportDocsToKnowledgeItem(
    supportDocs: string,
    context: KnowledgeProcessingContext
  ): KnowledgeItem {
    return {
      id: 'support-docs',
      title: 'Support Documentation',
      content: supportDocs,
      category: 'support',
      tags: TagExtractionService.extractContextAwareTags(
        supportDocs,
        { category: 'support', source: 'chatbot_config', companyName: context.companyName }
      ),
      relevanceScore: 0.7,
      source: context.source,
      lastUpdated: context.lastUpdated
    };
  }

  static convertFaqsToKnowledgeItems(
    faqs: Record<string, unknown>[],
    context: KnowledgeProcessingContext
  ): KnowledgeConversionResult {
    const startTime = Date.now();
    const warnings: string[] = [];
    const items: KnowledgeItem[] = [];

    const activeFaqs = faqs.filter(faq => faq.isActive);
    
    if (activeFaqs.length !== faqs.length) {
      warnings.push(`${faqs.length - activeFaqs.length} inactive FAQs were skipped`);
    }

    activeFaqs.forEach(faq => {
      try {
        const item = this.convertFaqToKnowledgeItem(faq, context);
        items.push(item);
      } catch (error) {
        warnings.push(`Failed to convert FAQ ${faq.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    const processingTime = Date.now() - startTime;

    return {
      items,
      totalProcessed: items.length,
      processingTime,
      warnings
    };
  }

  private static mapFaqCategoryToKnowledgeCategory(faqCategory: string): KnowledgeItem['category'] {
    const categoryLower = faqCategory.toLowerCase();
    
    // Find mapping from predefined mappings
    const mapping = FAQ_CATEGORY_MAPPINGS.find(
      mapping => mapping.faqCategory === categoryLower
    );
    
    return mapping ? mapping.knowledgeCategory : 'general';
  }

  static createKnowledgeItemFromContent(
    id: string,
    title: string,
    content: string,
    category: KnowledgeItem['category'],
    context: KnowledgeProcessingContext,
    options: {
      relevanceScore?: number;
      extractTags?: boolean;
      customTags?: string[];
    } = {}
  ): KnowledgeItem {
    const {
      relevanceScore = 0.7,
      extractTags = true,
      customTags = []
    } = options;

    let tags = customTags;
    
    if (extractTags) {
      const extractedTags = TagExtractionService.extractContextAwareTags(
        content,
        { category, source: context.source, companyName: context.companyName }
      );
      tags = [...tags, ...extractedTags];
    }

    return {
      id,
      title,
      content,
      category,
      tags: Array.from(new Set(tags)), // Remove duplicates
      relevanceScore,
      source: context.source,
      lastUpdated: context.lastUpdated
    };
  }

  static validateKnowledgeItem(item: KnowledgeItem): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check required fields
    if (!item.id) {
      warnings.push('Knowledge item missing required ID');
    }
    
    if (!item.title || item.title.trim().length === 0) {
      warnings.push('Knowledge item missing title');
    }
    
    if (!item.content || item.content.trim().length === 0) {
      warnings.push('Knowledge item missing content');
    }

    // Check content quality
    if (item.content && item.content.length < 20) {
      warnings.push('Knowledge item content is very short');
      recommendations.push('Consider adding more detailed information');
    }

    if (item.content && item.content.length > 5000) {
      warnings.push('Knowledge item content is very long');
      recommendations.push('Consider splitting into multiple items or using chunking');
    }

    // Check tags
    if (!item.tags || item.tags.length === 0) {
      recommendations.push('Consider adding tags to improve searchability');
    }

    if (item.tags && item.tags.length > 15) {
      warnings.push('Knowledge item has too many tags');
      recommendations.push('Consider reducing tags to most relevant ones');
    }

    // Check relevance score
    if (item.relevanceScore < 0 || item.relevanceScore > 1) {
      warnings.push('Relevance score must be between 0 and 1');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  static enhanceKnowledgeItemWithContext(
    item: KnowledgeItem,
    context: KnowledgeProcessingContext
  ): KnowledgeItem {
    let enhancedContent = item.content;

    // Add company context if available and not already present
    if (context.companyName && !enhancedContent.includes(context.companyName)) {
      enhancedContent = `${context.companyName} Information: ${enhancedContent}`;
    }

    // Add category context for better semantic understanding
    const categoryContext = this.getCategoryContext(item.category);
    if (categoryContext && !enhancedContent.toLowerCase().includes(categoryContext.toLowerCase())) {
      enhancedContent = `${categoryContext}: ${enhancedContent}`;
    }

    return {
      ...item,
      content: enhancedContent
    };
  }

  private static getCategoryContext(category: KnowledgeItem['category']): string | null {
    const contextMap: Record<KnowledgeItem['category'], string> = {
      'general': 'General Information',
      'product_info': 'Product Information',
      'support': 'Support Information',
      'pricing': 'Pricing Information',
      'faq': 'Frequently Asked Question'
    };

    return contextMap[category] || null;
  }
} 