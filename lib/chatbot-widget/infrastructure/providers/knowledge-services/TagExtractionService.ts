/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Content-based tag generation
 * - NO hardcoded business terms - completely customer-agnostic
 * - Extracts basic content structure only (headers, emphasized text)
 * - Follows DDD principles - infrastructure stays generic across all organizations
 * - Keep under 250 lines per @golden-rule
 * - Future: Can be enhanced with LLM-based tag generation
 */

import {
  TagExtractionConfig,
  DEFAULT_TAG_EXTRACTION_CONFIG
} from './types/KnowledgeServiceTypes';

export class TagExtractionService {

  static extractTagsFromContent(
    content: string,
    config: TagExtractionConfig = DEFAULT_TAG_EXTRACTION_CONFIG
  ): string[] {
    const tags: string[] = [];
    
    // Extract headers if enabled
    if (config.extractHeaders) {
      const headerTags = this.extractHeaderTags(content);
      tags.push(...headerTags);
    }
    
    // Extract bullet points if enabled
    if (config.extractBullets) {
      const bulletTags = this.extractBulletTags(content);
      tags.push(...bulletTags);
    }
    
    // Extract numbered items if enabled
    if (config.extractNumberedItems) {
      const numberedTags = this.extractNumberedItemTags(content);
      tags.push(...numberedTags);
    }
    
    // Clean and filter tags
    const cleanTags = tags
      .map(tag => this.cleanTextForTag(tag))
      .filter(tag => tag.length >= config.minTagLength)
      .filter(tag => tag.length <= 50) // Reasonable max length
      .slice(0, config.maxTags);
    
    return Array.from(new Set(cleanTags)); // Remove duplicates
  }

  private static extractHeaderTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract markdown-style headers
    const headerMatches = content.match(/^#{1,6}\s+(.+)$/gm);
    if (headerMatches) {
      headerMatches.forEach(match => {
        const headerText = match.replace(/^#{1,6}\s+/, '').toLowerCase();
        if (headerText.length > 2) {
          tags.push(headerText);
        }
      });
    }
    
    // Extract colon-terminated headers (e.g., "Services:")
    const colonHeaders = content.match(/^[A-Z][^.]*:$/gm);
    if (colonHeaders) {
      colonHeaders.forEach(match => {
        const headerText = match.replace(/:$/, '').toLowerCase();
        if (headerText.length > 2) {
          tags.push(headerText);
        }
      });
    }
    
    return tags;
  }

  private static extractBulletTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract bullet point content
    const bulletItems = content.match(/^[-*•]\s+(.+)$/gm);
    if (bulletItems && bulletItems.length <= 10) { // Limit to avoid too many tags
      bulletItems.forEach(match => {
        const itemText = match.replace(/^[-*•]\s+/, '').toLowerCase();
        if (itemText.length > 2) {
          tags.push(itemText);
        }
      });
    }
    
    return tags;
  }

  private static extractNumberedItemTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract numbered list items (potential service/product names)
    const numberedItems = content.match(/^\d+\.\s+(.+)$/gm);
    if (numberedItems && numberedItems.length <= 8) { // Limit to avoid too many tags
      numberedItems.forEach(match => {
        const itemText = match.replace(/^\d+\.\s+/, '').toLowerCase();
        if (itemText.length > 2) {
          tags.push(itemText);
        }
      });
    }
    
    return tags;
  }

  private static cleanTextForTag(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
      .trim();
  }

  static extractFaqCategoryTags(category: string): string[] {
    const baseTag = category.toLowerCase();
    const tagMap: Record<string, string[]> = {
      'general': ['general', 'info', 'about', 'company'],
      'product': ['product', 'features', 'functionality', 'capabilities'],
      'support': ['support', 'help', 'troubleshooting', 'assistance'],
      'billing': ['billing', 'pricing', 'cost', 'price', 'plans', 'payment', 'invoice'],
      'technical': ['technical', 'integration', 'api', 'setup', 'configuration']
    };

    return tagMap[baseTag] || [baseTag];
  }

  static extractContextAwareTags(
    content: string,
    context: {
      category?: string;
      source?: string;
      companyName?: string;
    },
    config: TagExtractionConfig = DEFAULT_TAG_EXTRACTION_CONFIG
  ): string[] {
    const baseTags = this.extractTagsFromContent(content, config);
    const contextTags: string[] = [];
    
    // Add category-based tags
    if (context.category) {
      switch (context.category) {
        case 'product_info':
          contextTags.push('products', 'services', 'offerings');
          break;
        case 'support':
          contextTags.push('help', 'assistance', 'guidance');
          break;
        case 'pricing':
          contextTags.push('cost', 'price', 'plans');
          break;
        case 'general':
          contextTags.push('information', 'about', 'overview');
          break;
      }
    }
    
    // Add source-based tags
    if (context.source) {
      switch (context.source) {
        case 'faq':
          contextTags.push('frequently-asked', 'questions');
          break;
        case 'chatbot_config':
          contextTags.push('configuration', 'setup');
          break;
        case 'website_crawled':
          contextTags.push('website', 'web-content');
          break;
      }
    }
    
    // Combine and deduplicate
    const allTags = [...baseTags, ...contextTags];
    return Array.from(new Set(allTags.slice(0, config.maxTags)));
  }

  static validateAndFilterTags(tags: string[], config: TagExtractionConfig = DEFAULT_TAG_EXTRACTION_CONFIG): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'among', 'under', 'over', 'within', 'without', 'along', 'following', 'across',
      'behind', 'beyond', 'plus', 'except', 'but', 'up', 'out', 'off', 'down', 'upon', 'near',
      'since', 'per', 'than', 'like', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself',
      'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he',
      'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they',
      'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
      'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'should', 'could', 'can',
      'may', 'might', 'must', 'shall', 'should', 'ought'
    ]);
    
    return tags
      .filter(tag => !stopWords.has(tag))
      .filter(tag => tag.length >= config.minTagLength)
      .filter(tag => tag.length <= 50)
      .filter(tag => !/^\d+$/.test(tag)) // Remove pure numbers
      .slice(0, config.maxTags);
  }

  static generateTagSuggestions(content: string): {
    extractedTags: string[];
    suggestions: string[];
    recommendations: string[];
  } {
    const extractedTags = this.extractTagsFromContent(content);
    const suggestions: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze content for tag suggestions
    if (extractedTags.length < 3) {
      recommendations.push('Consider adding more descriptive headers to improve tag extraction');
    }
    
    if (!/^#{1,6}\s+/gm.test(content)) {
      recommendations.push('Adding markdown-style headers will improve tag quality');
    }
    
    if (!/^[-*]\s+/gm.test(content) && !/^\d+\.\s+/gm.test(content)) {
      recommendations.push('Using bullet points or numbered lists will generate more specific tags');
    }
    
    // Generate suggestions based on content patterns
    if (content.includes('service') || content.includes('product')) {
      suggestions.push('services', 'products', 'offerings');
    }
    
    if (content.includes('support') || content.includes('help')) {
      suggestions.push('support', 'assistance', 'help');
    }
    
    if (content.includes('price') || content.includes('cost') || content.includes('billing')) {
      suggestions.push('pricing', 'cost', 'billing');
    }
    
    return {
      extractedTags,
      suggestions: Array.from(new Set(suggestions)),
      recommendations
    };
  }
} 