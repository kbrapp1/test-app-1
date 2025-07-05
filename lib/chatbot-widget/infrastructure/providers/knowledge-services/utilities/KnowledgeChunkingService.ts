/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Basic content chunking
 * - Keep under 120 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - Simple chunking strategies, no complex analysis
 * - Just split content, nothing more
 */

import {
  ProductSection,
  ContentChunk,
  ChunkingStrategy,
  KnowledgeProcessingContext,
  DEFAULT_CHUNKING_STRATEGY
} from '../types/KnowledgeServiceTypes';

export class KnowledgeChunkingService {

  static chunkByHeaders(content: string, strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY): ProductSection[] {
    const sections: ProductSection[] = [];
    const headerPattern = /^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/gm;
    const headerMatches = Array.from(content.matchAll(headerPattern));
    
    if (headerMatches.length > 1) {
      for (let i = 0; i < headerMatches.length; i++) {
        const currentMatch = headerMatches[i];
        const nextMatch = headerMatches[i + 1];
        
        const startIndex = currentMatch.index!;
        const endIndex = nextMatch ? nextMatch.index! : content.length;
        
        const sectionContent = content.slice(startIndex, endIndex).trim();
        const title = currentMatch[0].replace(/^#{1,6}\s+|^\d+\.\s+|:$/g, '').trim();
        
        if (sectionContent.length >= strategy.minChunkSize) {
          sections.push({
            title: title || undefined,
            content: sectionContent
          });
        }
      }
    }
    
    return sections;
  }

  static chunkByParagraphs(content: string, strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY): ProductSection[] {
    const sections: ProductSection[] = [];
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length >= strategy.minChunkSize);
    
    paragraphs.forEach((paragraph, index) => {
      sections.push({
        title: `Content Section ${index + 1}`,
        content: paragraph.trim()
      });
    });
    
    return sections;
  }

  static chunkBySize(content: string, strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY): ProductSection[] {
    const sections: ProductSection[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    let currentChunk = '';
    let chunkIndex = 1;
    
    for (const sentence of sentences) {
      const potentialChunk = currentChunk + sentence + '. ';
      
      if (potentialChunk.length > strategy.maxChunkSize && currentChunk.length > strategy.minChunkSize) {
        sections.push({
          title: `Content Part ${chunkIndex}`,
          content: currentChunk.trim()
        });
        currentChunk = sentence + '. ';
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
      }
    }
    
    if (currentChunk.trim().length >= strategy.minChunkSize) {
      sections.push({
        title: `Content Part ${chunkIndex}`,
        content: currentChunk.trim()
      });
    }
    
    return sections;
  }

  static chunkContent(content: string, strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY): ProductSection[] {
    // Try headers first
    let sections = this.chunkByHeaders(content, strategy);
    if (sections.length > 0) return sections;
    
    // Try paragraphs
    sections = this.chunkByParagraphs(content, strategy);
    if (sections.length > 1) return sections;
    
    // Try size-based chunking
    if (content.length > strategy.maxChunkSize) {
      sections = this.chunkBySize(content, strategy);
      if (sections.length > 0) return sections;
    }
    
    // Fallback to single chunk
    return [{
      title: 'Content',
      content: content
    }];
  }

  static createChunks(
    content: string,
    context: KnowledgeProcessingContext,
    strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY
  ): ContentChunk[] {
    const sections = this.chunkContent(content, strategy);
    
    return sections.map((section, index) => ({
      title: section.title || `Content Section ${index + 1}`,
      content: this.addContext(section.content, context),
      tags: this.extractBasicTags(section.content)
    }));
  }

  private static addContext(content: string, context: KnowledgeProcessingContext): string {
    let contextualContent = '';
    
    if (context.companyName) {
      contextualContent += `${context.companyName} Information:\n\n`;
    }
    
    contextualContent += content;
    
    return contextualContent;
  }

  private static extractBasicTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract headers
    const headerMatches = content.match(/^#{1,6}\s+(.+)$/gm);
    if (headerMatches) {
      headerMatches.forEach(match => {
        const headerText = match.replace(/^#{1,6}\s+/, '').toLowerCase();
        const cleanHeader = this.cleanTag(headerText);
        if (cleanHeader.length > 2) {
          tags.push(cleanHeader);
        }
      });
    }
    
    return Array.from(new Set(tags.slice(0, 5)));
  }

  private static cleanTag(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  }
} 