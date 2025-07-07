import { ProductChunk, ProductSection } from '../../value-objects/knowledge-processing';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

/**
 * Knowledge Base Form Service
 * 
 * AI INSTRUCTIONS:
 * - Domain service for knowledge base content processing
 * - Handles intelligent product catalog chunking for RAG optimization
 * - Maintains semantic coherence and context preservation
 * - Pure business logic - no external dependencies
 * - Single responsibility: Knowledge content transformation
 * - Keep under 250 lines per @golden-rule
 */

export interface ContentHashStrategy {
  createHash(content: string): string;
}

export class SimpleContentHashStrategy implements ContentHashStrategy {
  createHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export class KnowledgeBaseFormService {
  constructor(
    private readonly hashStrategy: ContentHashStrategy = new SimpleContentHashStrategy()
  ) {}

  /**
   * Process product catalog with intelligent chunking strategy
   * 
   * AI INSTRUCTIONS:
   * - Analyze content structure and apply appropriate chunking
   * - Preserve semantic boundaries and context
   * - Generate meaningful titles and tags
   * - Return structured chunks for embedding generation
   */
  processProductCatalog(catalog: string): ProductChunk[] {
    if (!catalog?.trim()) {
      throw new BusinessRuleViolationError(
        'Product catalog content is required for processing',
        { catalogLength: catalog?.length || 0 }
      );
    }

    const sections = this.identifyProductSections(catalog);
    const chunks: ProductChunk[] = [];

    sections.forEach((section, index) => {
      const contextualSection = section.withContextualContent(catalog);
      const tags = this.extractProductTags(contextualSection.content);
      
      const chunk = ProductChunk.create({
        title: contextualSection.getContextualTitle(),
        content: contextualSection.content,
        tags,
        contentHash: this.hashStrategy.createHash(contextualSection.content),
        chunkIndex: index,
        sourceLength: catalog.length
      });

      chunks.push(chunk);
    });

    return chunks;
  }

  /**
   * Identify semantic sections in product catalog
   */
  private identifyProductSections(catalog: string): ProductSection[] {
    const sections: ProductSection[] = [];
    
    // Strategy 1: Split by headers (markdown-style or numbered)
    const headerPattern = /^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/gm;
    const headerMatches = Array.from(catalog.matchAll(headerPattern));
    
    if (headerMatches.length > 1) {
      return this.processByHeaders(catalog, headerMatches);
    }
    
    // Strategy 2: Split by paragraph breaks for unstructured content
    const paragraphs = catalog.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    if (paragraphs.length > 1) {
      return this.processByParagraphs(paragraphs, catalog);
    }
    
    // Strategy 3: Fallback - use complete catalog as single section
    return [this.createSingleSection(catalog)];
  }

  private processByHeaders(catalog: string, headerMatches: RegExpMatchArray[]): ProductSection[] {
    const sections: ProductSection[] = [];
    
    for (let i = 0; i < headerMatches.length; i++) {
      const currentMatch = headerMatches[i];
      const nextMatch = headerMatches[i + 1];
      
      const startIndex = currentMatch.index!;
      const endIndex = nextMatch ? nextMatch.index! : catalog.length;
      
      const sectionContent = catalog.slice(startIndex, endIndex).trim();
      const title = this.cleanHeaderTitle(currentMatch[0]);
      
      if (sectionContent.length >= 50) {
        sections.push(ProductSection.create({
          title,
          content: sectionContent,
          startIndex,
          endIndex,
          level: this.determineHeaderLevel(currentMatch[0])
        }));
      }
    }
    
    return sections;
  }

  private processByParagraphs(paragraphs: string[], fullCatalog: string): ProductSection[] {
    const sections: ProductSection[] = [];
    let currentIndex = 0;
    
    paragraphs.forEach((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      const startIndex = fullCatalog.indexOf(trimmedParagraph, currentIndex);
      const endIndex = startIndex + trimmedParagraph.length;
      
      sections.push(ProductSection.create({
        title: `Product Information ${index + 1}`,
        content: trimmedParagraph,
        startIndex,
        endIndex,
        level: 0
      }));
      
      currentIndex = endIndex;
    });
    
    return sections;
  }

  private createSingleSection(catalog: string): ProductSection {
    return ProductSection.create({
      title: 'Complete Product Catalog',
      content: catalog.trim(),
      startIndex: 0,
      endIndex: catalog.length,
      level: 0
    });
  }

  private cleanHeaderTitle(header: string): string {
    return header.replace(/^#{1,6}\s+|^\d+\.\s+|:$/g, '').trim();
  }

  private determineHeaderLevel(header: string): number {
    if (header.startsWith('#')) {
      const match = header.match(/^#{1,6}/);
      return match ? match[0].length - 1 : 0;
    }
    
    if (header.match(/^\d+\./)) {
      return 1;
    }
    
    return 0;
  }

  /**
   * Extract semantic tags from product content
   */
  private extractProductTags(content: string): string[] {
    const tags: string[] = [];
    const lowercaseContent = content.toLowerCase();
    
    // Business domain keywords
    const businessKeywords = [
      'software', 'hardware', 'service', 'solution', 'platform',
      'consulting', 'support', 'training', 'development', 'design',
      'marketing', 'sales', 'analytics', 'automation', 'integration',
      'enterprise', 'cloud', 'api', 'dashboard', 'reporting'
    ];
    
    businessKeywords.forEach(keyword => {
      if (lowercaseContent.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    // Product-specific patterns
    const productPatterns = [
      { pattern: /\$\d+/, tag: 'pricing' },
      { pattern: /\b(feature|features)\b/i, tag: 'features' },
      { pattern: /\b(benefit|benefits)\b/i, tag: 'benefits' },
      { pattern: /\b(package|packages|plan|plans)\b/i, tag: 'packages' },
      { pattern: /\b(custom|customize|customization)\b/i, tag: 'customization' }
    ];
    
    productPatterns.forEach(({ pattern, tag }) => {
      if (pattern.test(content)) {
        tags.push(tag);
      }
    });
    
    return tags.length > 0 ? [...new Set(tags)] : ['general'];
  }

  /**
   * Generate content deduplication hash
   */
  generateContentHash(content: string): string {
    if (!content?.trim()) {
      throw new BusinessRuleViolationError(
        'Content is required for hash generation',
        { contentLength: content?.length || 0 }
      );
    }
    
    return this.hashStrategy.createHash(content.trim());
  }

  /**
   * Validate chunk quality for embedding generation
   */
  validateChunkQuality(chunk: ProductChunk): boolean {
    // Minimum content length
    if (chunk.content.length < 50) return false;
    
    // Must have meaningful title
    if (!chunk.title?.trim() || chunk.title.length < 3) return false;
    
    // Should have relevant tags
    if (chunk.tags.length === 0) return false;
    
    // Content should not be mostly whitespace
    const meaningfulContent = chunk.content.replace(/\s+/g, ' ').trim();
    if (meaningfulContent.length < chunk.content.length * 0.5) return false;
    
    return true;
  }
}