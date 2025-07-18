/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Implements 2025 RAG best practices for large document processing
 * - Handles PDF content with intelligent semantic chunking
 * - Maintains document context and relationships between chunks
 * - Optimizes for embedding model performance and retrieval accuracy
 * - Follows @golden-rule patterns for scalable document processing
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { 
  PDFChunkingService, 
  PDFChunkingConfig, 
  PDFDocumentMetadata, 
  PDFChunk 
} from './processing/PDFChunkingService';

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

  async processPDFContent(
    pdfContent: string,
    metadata: PDFDocumentMetadata,
    organizationId: string,
    _chatbotConfigId: string
  ): Promise<KnowledgeItem[]> {
    try {
      // SECURITY: Validate organization context for multi-tenant isolation
      if (!organizationId || organizationId.trim().length === 0) {
        throw new Error('Organization ID is required for PDF processing');
      }
      // Step 1: Clean and normalize PDF content
      const cleanedContent = PDFChunkingService.cleanPDFContent(pdfContent);
      
      // Step 2: Intelligent semantic chunking
      const chunks = PDFChunkingService.createSemanticChunks(cleanedContent, metadata, this.config);
      
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

  // Content processing methods delegated to PDFChunkingService

  // Extract tags from chunk content (simplified version for document overview)
  private extractChunkTags(content: string, metadata: PDFDocumentMetadata): string[] {
    const tags: string[] = [];
    
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

  // Convert PDF chunk to knowledge item
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

  // Build contextual content with document metadata
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

  // Create document overview knowledge item
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

  // Sanitize filename for use in IDs
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .toLowerCase();
  }

  // Get processing statistics - Delegate to chunking service
  getProcessingStats(chunks: PDFChunk[]): {
    totalChunks: number;
    averageChunkSize: number;
    totalVectors: number;
    estimatedMemoryUsage: string;
  } {
    return PDFChunkingService.getChunkingStats(chunks);
  }
} 