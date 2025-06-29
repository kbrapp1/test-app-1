/**
 * Knowledge Item Service - Multi-Tenant Generic Content Processing
 * 
 * AI INSTRUCTIONS:
 * - NO hardcoded business terms - works for ANY organization
 * - Implements generic content chunking strategies
 * - Follows DDD principles - infrastructure stays customer-agnostic
 * - FAQ categories use predefined semantic mappings (customer-selected)
 * - Product catalogs use structural extraction only (headers, lists)
 * - Future: Enhanced with LLM-based tag generation or user-defined tags
 * - Maintains single responsibility principle
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';

export class KnowledgeItemService {
  constructor(private chatbotConfig: ChatbotConfig) {}

  async getAllKnowledgeItems(): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];

    // Convert FAQs to knowledge items
    const faqItems = this.chatbotConfig.knowledgeBase.faqs
      .filter(faq => faq.isActive)
      .map(faq => this.convertFaqToKnowledgeItem(faq));
    
    items.push(...faqItems);

    // Convert company info to knowledge item
    if (this.chatbotConfig.knowledgeBase.companyInfo) {
      items.push({
        id: 'company-info',
        title: 'Company Information',
        content: this.chatbotConfig.knowledgeBase.companyInfo,
        category: 'general',
        tags: ['company', 'about', 'general'],
        relevanceScore: 0.8,
        source: 'chatbot_config',
        lastUpdated: this.chatbotConfig.updatedAt
      });
    }

    // ✅ 2025 BEST PRACTICE: Advanced Product Catalog Processing
    if (this.chatbotConfig.knowledgeBase.productCatalog) {
      const productItems = this.processProductCatalogAdvanced(
        this.chatbotConfig.knowledgeBase.productCatalog
      );
      items.push(...productItems);
    }

    // Convert support docs to knowledge item
    if (this.chatbotConfig.knowledgeBase.supportDocs) {
      items.push({
        id: 'support-docs',
        title: 'Support Documentation',
        content: this.chatbotConfig.knowledgeBase.supportDocs,
        category: 'support',
        tags: ['support', 'help', 'documentation'],
        relevanceScore: 0.7,
        source: 'chatbot_config',
        lastUpdated: this.chatbotConfig.updatedAt
      });
    }

    return items;
  }

  /**
   * Advanced Product Catalog Processing - 2025 Best Practice
   * 
   * AI INSTRUCTIONS:
   * - Implements intelligent chunking for product catalogs
   * - Creates separate embeddings for better semantic matching
   * - Optimizes for both overview and specific product queries
   * - Follows RAG best practices for product information retrieval
   */
  private processProductCatalogAdvanced(productCatalog: string): KnowledgeItem[] {
    const items: KnowledgeItem[] = [];
    
    // Strategy 1: Always include complete catalog overview for general queries
    items.push({
      id: 'product-catalog-overview',
      title: 'Complete Product & Service Overview',
      content: productCatalog,
      category: 'product_info',
      tags: ['products', 'services', 'catalog', 'overview', 'complete'],
      relevanceScore: 0.9,
      source: 'chatbot_config',
      lastUpdated: this.chatbotConfig.updatedAt
    });

    // Strategy 2: Intelligent chunking for specific product queries
    const productChunks = this.intelligentProductChunking(productCatalog);
    
    productChunks.forEach((chunk, index) => {
      items.push({
        id: `product-chunk-${index + 1}`,
        title: chunk.title,
        content: chunk.content,
        category: 'product_info',
        tags: [...chunk.tags, 'products', 'specific'],
        relevanceScore: 0.85,
        source: 'chatbot_config',
        lastUpdated: this.chatbotConfig.updatedAt
      });
    });

    return items;
  }

  /**
   * Intelligent Product Chunking - 2025 RAG Strategy
   * 
   * AI INSTRUCTIONS:
   * - Chunks product catalog by semantic sections
   * - Maintains context while enabling specific matching
   * - Optimizes chunk size for embedding model performance
   * - Preserves product relationships and categories
   */
  private intelligentProductChunking(catalog: string): Array<{
    title: string;
    content: string;
    tags: string[];
  }> {
    const chunks: Array<{ title: string; content: string; tags: string[]; }> = [];
    
    // Split by common product catalog patterns
    const sections = this.identifyProductSections(catalog);
    
    sections.forEach((section, index) => {
      // Ensure each chunk has sufficient context
      const contextualContent = this.addContextToChunk(section, catalog);
      
      chunks.push({
        title: section.title || `Product Section ${index + 1}`,
        content: contextualContent,
        tags: this.extractProductTags(section.content)
      });
    });

    return chunks;
  }

  /**
   * Identify Product Sections - Smart Pattern Recognition
   * 
   * AI INSTRUCTIONS:
   * - Recognizes common product catalog structures
   * - Handles various formatting patterns (headers, bullets, paragraphs)
   * - Maintains semantic coherence in chunks
   * - Adapts to different catalog styles
   */
  private identifyProductSections(catalog: string): Array<{
    title?: string;
    content: string;
  }> {
    const sections: Array<{ title?: string; content: string; }> = [];
    
    // Strategy 1: Split by headers (markdown-style or numbered)
    const headerPattern = /^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/gm;
    const headerMatches = Array.from(catalog.matchAll(headerPattern));
    
    if (headerMatches.length > 1) {
      // Split by headers
      for (let i = 0; i < headerMatches.length; i++) {
        const currentMatch = headerMatches[i];
        const nextMatch = headerMatches[i + 1];
        
        const startIndex = currentMatch.index!;
        const endIndex = nextMatch ? nextMatch.index! : catalog.length;
        
        const sectionContent = catalog.slice(startIndex, endIndex).trim();
        const title = currentMatch[0].replace(/^#{1,6}\s+|^\d+\.\s+|:$/g, '').trim();
        
        if (sectionContent.length > 50) { // Minimum viable chunk size
          sections.push({
            title: title || undefined,
            content: sectionContent
          });
        }
      }
    } else {
      // Strategy 2: Split by paragraph breaks for unstructured content
      const paragraphs = catalog.split(/\n\s*\n/).filter(p => p.trim().length > 50);
      
      if (paragraphs.length > 1) {
        paragraphs.forEach((paragraph, index) => {
          sections.push({
            title: `Product Information ${index + 1}`,
            content: paragraph.trim()
          });
        });
      } else {
        // Strategy 3: Fallback - use complete catalog as single section
        sections.push({
          title: 'Product Catalog',
          content: catalog
        });
      }
    }
    
    return sections;
  }

  /**
   * Add Context to Chunk - Maintain Semantic Coherence
   * 
   * AI INSTRUCTIONS:
   * - Adds company context to each product chunk
   * - Ensures chunks are self-contained for embeddings
   * - Maintains product relationships and categories
   * - Optimizes for standalone semantic understanding
   */
  private addContextToChunk(section: { title?: string; content: string }, fullCatalog: string): string {
    const companyName = this.extractCompanyName();
    let contextualContent = '';
    
    // Add company context
    if (companyName) {
      contextualContent += `${companyName} Product Information:\n\n`;
    }
    
    // Add section title if available
    if (section.title) {
      contextualContent += `${section.title}\n\n`;
    }
    
    // Add main content
    contextualContent += section.content;
    
    // Add brief context about other offerings (if chunk is specific)
    if (section.content.length < fullCatalog.length * 0.8) {
      const otherServices = this.extractOtherServicesHint(section.content, fullCatalog);
      if (otherServices) {
        contextualContent += `\n\nNote: ${companyName || 'We'} also offer ${otherServices}.`;
      }
    }
    
    return contextualContent;
  }

  /**
   * Extract Product Tags - Generic Content-Based Tagging
   * 
   * AI INSTRUCTIONS:
   * - NO hardcoded business terms - completely customer-agnostic
   * - Extracts basic content structure only (headers, emphasized text)
   * - Follows DDD principles - infrastructure stays generic across all organizations
   * - Future: Can be enhanced with LLM-based tag generation or user-defined tags
   */
  private extractProductTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract only structural/formatting-based tags (no business assumptions)
    // This ensures the system works for ANY organization's content
    
    // Extract text that appears to be headers or emphasized (markdown-style)
    const headerMatches = content.match(/^#{1,6}\s+(.+)$/gm);
    if (headerMatches) {
      headerMatches.forEach(match => {
        const headerText = match.replace(/^#{1,6}\s+/, '').toLowerCase();
        const cleanHeader = this.cleanTextForTag(headerText);
        if (cleanHeader.length > 2) {
          tags.push(cleanHeader);
        }
      });
    }
    
    // Extract numbered list items (potential service/product names)
    const numberedItems = content.match(/^\d+\.\s+(.+)$/gm);
    if (numberedItems) {
      numberedItems.forEach(match => {
        const itemText = match.replace(/^\d+\.\s+/, '').toLowerCase();
        const cleanItem = this.cleanTextForTag(itemText);
        if (cleanItem.length > 2) {
          tags.push(cleanItem);
        }
      });
    }
    
    // Extract bullet point content (potential features/services)
    const bulletItems = content.match(/^[-*]\s+(.+)$/gm);
    if (bulletItems) {
      bulletItems.forEach(match => {
        const itemText = match.replace(/^[-*]\s+/, '').toLowerCase();
        const cleanItem = this.cleanTextForTag(itemText);
        if (cleanItem.length > 2) {
          tags.push(cleanItem);
        }
      });
    }
    
    return Array.from(new Set(tags)); // Remove duplicates
  }

  /**
   * Clean text for use as a tag (generic text processing only)
   * 
   * AI INSTRUCTIONS:
   * - Generic text cleaning with no business assumptions
   * - Works for any organization's content
   * - Removes only formatting and special characters
   */
  private cleanTextForTag(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
      .trim();
  }

  /**
   * Extract Company Name - Context Helper
   */
  private extractCompanyName(): string | null {
    const companyInfo = this.chatbotConfig.knowledgeBase.companyInfo;
    if (!companyInfo) return null;
    
    // Extract company name from company info
    const nameMatch = companyInfo.match(/(?:For nearly \d+ years?,\s+)?([A-Z][a-zA-Z\s&]+)(?:\s+has been)/);
    return nameMatch ? nameMatch[1].trim() : null;
  }

  /**
   * Extract Other Services Hint - Generic Cross-Reference Helper
   * 
   * AI INSTRUCTIONS:
   * - NO hardcoded service categories - customer-agnostic
   * - Generic approach that works for any organization
   * - Future: Can be enhanced with LLM-based content analysis
   */
  private extractOtherServicesHint(currentContent: string, fullCatalog: string): string | null {
    // For now, return null to avoid hardcoded business assumptions
    // Future enhancement: Use LLM to analyze content relationships
    // or allow customers to define their own cross-reference rules
    return null;
  }

  async getKnowledgeByCategory(
    category: KnowledgeItem['category'],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    
    return allItems
      .filter(item => item.category === category)
      .slice(0, limit);
  }

  async getFrequentlyAskedQuestions(limit: number = 10): Promise<KnowledgeItem[]> {
    const faqs = this.chatbotConfig.knowledgeBase.faqs
      .filter(faq => faq.isActive)
      .slice(0, limit)
      .map(faq => this.convertFaqToKnowledgeItem(faq));

    return faqs;
  }

  async getKnowledgeByTags(
    tags: string[],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    
    const taggedItems = allItems
      .filter(item => tags.some(tag => item.tags.includes(tag.toLowerCase())))
      .slice(0, limit);

    return taggedItems;
  }

  async upsertKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem> {
    // For this simple implementation, we'll just return the item with generated ID
    // In a real implementation, this would persist to a database
    const newItem: KnowledgeItem = {
      ...item,
      id: crypto.randomUUID(),
      lastUpdated: new Date()
    };

    return newItem;
  }

  private convertFaqToKnowledgeItem(faq: any): KnowledgeItem {
    return {
      id: faq.id,
      title: faq.question,
      content: faq.answer,
      category: this.mapFaqCategoryToKnowledgeCategory(faq.category),
      tags: this.extractTagsFromFaqCategory(faq.category),
      relevanceScore: 0.8,
      source: 'faq',
      lastUpdated: new Date() // FAQs don't have lastUpdated in the current schema
    };
  }

  /**
   * Map FAQ category to internal knowledge category
   * 
   * AI INSTRUCTIONS:
   * - Single source of truth for category mapping
   * - Uses customer-selected FAQ categories from UI
   * - Maps to internal knowledge system categories
   */
  private mapFaqCategoryToKnowledgeCategory(faqCategory: string): KnowledgeItem['category'] {
    const categoryLower = faqCategory.toLowerCase();
    
    // Direct mapping - use customer's category when possible
    switch (categoryLower) {
      case 'general': return 'general';
      case 'product': return 'product_info';
      case 'support': return 'support';
      case 'billing': return 'pricing';  // Billing questions are about pricing
      case 'technical': return 'support'; // Technical questions are support-related
      default: return 'general';
    }
  }

  private extractTagsFromFaqCategory(category: string): string[] {
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
} 