/**
 * PDF Knowledge Processor - Advanced Document Chunking
 * 
 * AI INSTRUCTIONS:
 * - Implements 2025 RAG best practices for large document processing
 * - Handles PDF content with intelligent semantic chunking
 * - Maintains document context and relationships between chunks
 * - Optimizes for embedding model performance and retrieval accuracy
 * - Follows @golden-rule patterns for scalable document processing
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

export interface PDFChunkingConfig {
  maxChunkSize: number;        // Max characters per chunk (default: 1000)
  overlapSize: number;         // Character overlap between chunks (default: 200)
  preserveStructure: boolean;  // Maintain document structure (default: true)
  includeMetadata: boolean;    // Include document metadata (default: true)
}

export interface PDFDocumentMetadata {
  filename: string;
  pageCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  uploadDate: Date;
  fileSize: number;
}

export interface PDFChunk {
  chunkId: string;
  content: string;
  pageNumbers: number[];
  chunkIndex: number;
  totalChunks: number;
  metadata: PDFDocumentMetadata;
  tags: string[];
}

export class PDFKnowledgeProcessor {
  private readonly defaultConfig: PDFChunkingConfig = {
    maxChunkSize: 1000,
    overlapSize: 200,
    preserveStructure: true,
    includeMetadata: true
  };

  private readonly config: PDFChunkingConfig;

  constructor(config: Partial<PDFChunkingConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Process PDF content into knowledge items with intelligent chunking
   * 
   * AI INSTRUCTIONS:
   * - Splits large PDFs into semantically coherent chunks
   * - Maintains document context and relationships
   * - Optimizes chunk sizes for embedding performance
   * - Preserves document structure and metadata
   */
  async processPDFContent(
    pdfContent: string,
    metadata: PDFDocumentMetadata,
    organizationId: string,
    chatbotConfigId: string
  ): Promise<KnowledgeItem[]> {
    try {
      // Step 1: Clean and normalize PDF content
      const cleanedContent = this.cleanPDFContent(pdfContent);
      
      // Step 2: Intelligent semantic chunking
      const chunks = this.createSemanticChunks(cleanedContent, metadata);
      
      // Step 3: Convert chunks to knowledge items
      const knowledgeItems = chunks.map(chunk => this.convertChunkToKnowledgeItem(chunk));
      
      // Step 4: Add document overview item
      const overviewItem = this.createDocumentOverview(cleanedContent, metadata, chunks.length);
      
      return [overviewItem, ...knowledgeItems];
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PDF processing failed: ${errorMessage}`);
    }
  }

  /**
   * Clean PDF content - Remove artifacts and normalize text
   * 
   * AI INSTRUCTIONS:
   * - Removes PDF extraction artifacts (extra whitespace, broken lines)
   * - Normalizes text formatting for better embedding quality
   * - Preserves semantic structure while cleaning technical artifacts
   */
  private cleanPDFContent(rawContent: string): string {
    return rawContent
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Fix broken line endings
      .replace(/(\w)-\s+(\w)/g, '$1$2')
      // Normalize paragraph breaks
      .replace(/\n\s*\n/g, '\n\n')
      // Remove page headers/footers (common patterns)
      .replace(/^Page \d+.*$/gm, '')
      .replace(/^\d+\s*$/gm, '')
      // Clean up special characters
      .replace(/[^\w\s\n.,!?;:()\-"']/g, ' ')
      .trim();
  }

  /**
   * Create semantic chunks with intelligent boundaries
   * 
   * AI INSTRUCTIONS:
   * - Prioritizes semantic boundaries (paragraphs, sections)
   * - Maintains context with overlapping content
   * - Optimizes chunk sizes for embedding model performance
   * - Preserves document structure and relationships
   */
  private createSemanticChunks(content: string, metadata: PDFDocumentMetadata): PDFChunk[] {
    const chunks: PDFChunk[] = [];
    const sentences = this.splitIntoSentences(content);
    
    let currentChunk = '';
    let chunkIndex = 0;
    let sentenceIndex = 0;
    
    while (sentenceIndex < sentences.length) {
      const sentence = sentences[sentenceIndex];
      
      // Check if adding this sentence would exceed chunk size
      if (currentChunk.length + sentence.length > this.config.maxChunkSize && currentChunk.length > 0) {
        // Create chunk with current content
        chunks.push(this.createChunk(
          currentChunk.trim(),
          chunkIndex,
          metadata,
          this.estimatePageNumbers(chunkIndex, chunks.length)
        ));
        
        // Start new chunk with overlap
        currentChunk = this.createOverlapContent(chunks[chunks.length - 1]?.content || '', sentence);
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
      
      sentenceIndex++;
    }
    
    // Add final chunk if there's remaining content
    if (currentChunk.trim()) {
      chunks.push(this.createChunk(
        currentChunk.trim(),
        chunkIndex,
        metadata,
        this.estimatePageNumbers(chunkIndex, chunks.length)
      ));
    }
    
    // Update total chunks count
    const totalChunks = chunks.length;
    chunks.forEach(chunk => {
      chunk.totalChunks = totalChunks;
    });
    
    return chunks;
  }

  /**
   * Split content into sentences for better chunk boundaries
   */
  private splitIntoSentences(content: string): string[] {
    // Simple sentence splitting (can be enhanced with NLP libraries)
    return content
      .split(/(?<=[.!?])\s+/)
      .filter(sentence => sentence.trim().length > 10);
  }

  /**
   * Create overlap content for chunk continuity
   */
  private createOverlapContent(previousContent: string, newSentence: string): string {
    if (!this.config.overlapSize || !previousContent) {
      return newSentence;
    }
    
    const overlapText = previousContent.slice(-this.config.overlapSize);
    const lastSentenceStart = overlapText.lastIndexOf('.');
    
    if (lastSentenceStart > 0) {
      return overlapText.slice(lastSentenceStart + 1).trim() + ' ' + newSentence;
    }
    
    return overlapText + ' ' + newSentence;
  }

  /**
   * Create a PDF chunk with metadata
   */
  private createChunk(
    content: string,
    chunkIndex: number,
    metadata: PDFDocumentMetadata,
    pageNumbers: number[]
  ): PDFChunk {
    return {
      chunkId: `${this.sanitizeFilename(metadata.filename)}-chunk-${chunkIndex + 1}`,
      content,
      pageNumbers,
      chunkIndex,
      totalChunks: 0, // Will be updated after all chunks are created
      metadata,
      tags: this.extractChunkTags(content, metadata)
    };
  }

  /**
   * Estimate page numbers for chunk (rough approximation)
   */
  private estimatePageNumbers(chunkIndex: number, totalChunks: number): number[] {
    const pageCount = this.config.includeMetadata && this.config.preserveStructure 
      ? (totalChunks > 0 ? Math.ceil(totalChunks / 3) : 1) // Rough estimate: 3 chunks per page
      : 1;
    
    const startPage = Math.floor((chunkIndex / totalChunks) * pageCount) + 1;
    return [startPage];
  }

  /**
   * Extract tags from chunk content
   */
  private extractChunkTags(content: string, metadata: PDFDocumentMetadata): string[] {
    const tags: string[] = ['pdf', 'document'];
    
    // Add filename-based tags
    const filenameTags = this.sanitizeFilename(metadata.filename)
      .split('-')
      .filter(tag => tag.length > 2);
    tags.push(...filenameTags);
    
    // Add content-based tags (headers, emphasized text)
    const headerMatches = content.match(/^[A-Z][^.]*:|\b[A-Z]{2,}\b/g);
    if (headerMatches) {
      headerMatches.forEach(match => {
        const cleanMatch = match.replace(/[^\w\s]/g, '').toLowerCase();
        if (cleanMatch.length > 2) {
          tags.push(cleanMatch);
        }
      });
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Convert PDF chunk to knowledge item
   */
  private convertChunkToKnowledgeItem(chunk: PDFChunk): KnowledgeItem {
    const contextualContent = this.buildContextualContent(chunk);
    
    return {
      id: chunk.chunkId,
      title: `${chunk.metadata.filename} - Part ${chunk.chunkIndex + 1} of ${chunk.totalChunks}`,
      content: contextualContent,
      category: 'support', // PDFs typically contain support/reference material
      tags: chunk.tags,
      relevanceScore: 0.8,
      source: 'pdf_document',
      lastUpdated: chunk.metadata.uploadDate
    };
  }

  /**
   * Build contextual content with document metadata
   */
  private buildContextualContent(chunk: PDFChunk): string {
    let content = '';
    
    // Add document context
    if (this.config.includeMetadata) {
      content += `Document: ${chunk.metadata.filename}\n`;
      if (chunk.metadata.title) {
        content += `Title: ${chunk.metadata.title}\n`;
      }
      content += `Part ${chunk.chunkIndex + 1} of ${chunk.totalChunks}\n\n`;
    }
    
    // Add main content
    content += chunk.content;
    
    return content;
  }

  /**
   * Create document overview knowledge item
   */
  private createDocumentOverview(
    content: string,
    metadata: PDFDocumentMetadata,
    totalChunks: number
  ): KnowledgeItem {
    const overview = content.length > 2000 
      ? content.substring(0, 2000) + '...' 
      : content;
    
    return {
      id: `${this.sanitizeFilename(metadata.filename)}-overview`,
      title: `${metadata.filename} - Document Overview`,
      content: `Document: ${metadata.filename}\n\nOverview:\n${overview}\n\nThis document contains ${totalChunks} sections with detailed information.`,
      category: 'support',
      tags: ['pdf', 'document', 'overview', ...this.extractChunkTags(content, metadata)],
      relevanceScore: 0.9,
      source: 'pdf_document',
      lastUpdated: metadata.uploadDate
    };
  }

  /**
   * Sanitize filename for use in IDs
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .toLowerCase();
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(chunks: PDFChunk[]): {
    totalChunks: number;
    averageChunkSize: number;
    totalVectors: number;
    estimatedMemoryUsage: string;
  } {
    const totalChunks = chunks.length;
    const averageChunkSize = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / totalChunks;
    const totalVectors = totalChunks + 1; // +1 for overview
    const estimatedMemoryUsage = `${Math.round(totalVectors * 7)} KB`; // ~7KB per vector
    
    return {
      totalChunks,
      averageChunkSize: Math.round(averageChunkSize),
      totalVectors,
      estimatedMemoryUsage
    };
  }
} 