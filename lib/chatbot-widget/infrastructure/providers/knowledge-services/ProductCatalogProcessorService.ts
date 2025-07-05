/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Advanced product catalog processing
 * - Implements intelligent chunking for product catalogs
 * - Creates separate embeddings for better semantic matching
 * - Optimizes for both overview and specific product queries
 * - Follows RAG best practices for product information retrieval
 * - Keep under 250 lines per @golden-rule
 * - Generic approach that works for any organization
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import {
  ContentChunk,
  ChunkingStrategy,
  ContentAnalysisResult,
  KnowledgeProcessingContext,
  DEFAULT_CHUNKING_STRATEGY
} from './types/KnowledgeServiceTypes';
import { KnowledgeChunkingService, KnowledgeAnalysisService } from './utilities';

export class ProductCatalogProcessorService {

  static processProductCatalogAdvanced(
    productCatalog: string,
    context: KnowledgeProcessingContext,
    strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY
  ): KnowledgeItem[] {
    const items: KnowledgeItem[] = [];
    
    // Strategy 1: Always include complete catalog overview for general queries
    items.push({
      id: 'product-catalog-overview',
      title: 'Complete Product & Service Overview',
      content: productCatalog,
      category: 'product_info',
      tags: ['products', 'services', 'catalog', 'overview', 'complete'],
      relevanceScore: 0.9,
      source: context.source,
      lastUpdated: context.lastUpdated
    });

    // Strategy 2: Intelligent chunking for specific product queries
    const productChunks = this.intelligentProductChunking(productCatalog, context, strategy);
    
    productChunks.forEach((chunk, index) => {
      items.push({
        id: `product-chunk-${index + 1}`,
        title: chunk.title,
        content: chunk.content,
        category: 'product_info',
        tags: [...chunk.tags, 'products', 'specific'],
        relevanceScore: 0.85,
        source: context.source,
        lastUpdated: context.lastUpdated
      });
    });

    return items;
  }

  static intelligentProductChunking(
    catalog: string,
    context: KnowledgeProcessingContext,
    strategy: ChunkingStrategy
  ): ContentChunk[] {
    // Delegate to KnowledgeChunkingService for intelligent chunking
    return KnowledgeChunkingService.createChunks(catalog, context, strategy);
  }

  static analyzeProductCatalogStructure(catalog: string): ContentAnalysisResult {
    return KnowledgeAnalysisService.analyzeContent(catalog);
  }

  static extractCompanyNameFromCatalog(catalog: string): string | undefined {
    // Try to extract company name from common patterns
    const patterns = [
      /(?:For nearly \d+ years?,\s+)?([A-Z][a-zA-Z\s&]+)(?:\s+has been)/,
      /^([A-Z][a-zA-Z\s&]+)(?:\s+is\s+)/,
      /(?:Welcome to\s+)([A-Z][a-zA-Z\s&]+)/,
      /(?:About\s+)([A-Z][a-zA-Z\s&]+)/
    ];
    
    for (const pattern of patterns) {
      const match = catalog.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }

  static createProcessingContext(
    organizationId: string,
    catalog: string,
    source: string = 'chatbot_config'
  ): KnowledgeProcessingContext {
    const companyName = this.extractCompanyNameFromCatalog(catalog);
    
    return {
      organizationId,
      companyName,
      lastUpdated: new Date(),
      source
    };
  }

  static optimizeCatalogForSemanticSearch(
    catalog: string,
    context: KnowledgeProcessingContext
  ): string {
    let optimizedContent = catalog;
    
    // Add company context at the beginning if available
    if (context.companyName) {
      const contextHeader = `${context.companyName} Product & Service Information:\n\n`;
      if (!optimizedContent.includes(context.companyName)) {
        optimizedContent = contextHeader + optimizedContent;
      }
    }
    
    // Ensure content has clear structure markers
    optimizedContent = this.enhanceContentStructure(optimizedContent);
    
    return optimizedContent;
  }

  private static enhanceContentStructure(content: string): string {
    // Add section markers if content lacks clear structure
    if (!/^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/gm.test(content)) {
      // Split by double line breaks and add basic structure
      const sections = content.split(/\n\s*\n/).filter(section => section.trim().length > 50);
      
      if (sections.length > 1) {
        return sections.map((section, index) => {
          const trimmedSection = section.trim();
          // Don't add headers if section already starts with one
          if (/^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/.test(trimmedSection)) {
            return trimmedSection;
          }
          return `## Section ${index + 1}\n\n${trimmedSection}`;
        }).join('\n\n');
      }
    }
    
    return content;
  }

  static generateCatalogSummary(catalog: string, maxLength: number = 500): string {
    // Extract first few sentences or paragraphs for summary
    const sentences = catalog.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    let summary = '';
    for (const sentence of sentences) {
      const potentialSummary = summary + sentence + '. ';
      if (potentialSummary.length > maxLength) {
        break;
      }
      summary = potentialSummary;
    }
    
    return summary.trim() || catalog.substring(0, maxLength) + '...';
  }

  static validateCatalogContent(catalog: string): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Check minimum length
    if (catalog.length < 100) {
      warnings.push('Catalog content is very short');
      recommendations.push('Consider adding more detailed product information');
    }
    
    // Check for structure
    const hasHeaders = /^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/gm.test(catalog);
    if (!hasHeaders) {
      recommendations.push('Consider adding headers to improve content structure');
    }
    
    // Check for lists
    const hasLists = /^[-*]\s+/gm.test(catalog) || /^\d+\.\s+/gm.test(catalog);
    if (!hasLists) {
      recommendations.push('Consider using lists to organize product features');
    }
    
    return {
      isValid: catalog.length >= 50,
      warnings,
      recommendations
    };
  }
} 