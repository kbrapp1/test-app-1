/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: PDF content chunking and semantic processing
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on intelligent semantic chunking for RAG optimization
 */

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

export class PDFChunkingService {
  private static readonly DEFAULT_CONFIG: PDFChunkingConfig = {
    maxChunkSize: 1000,
    overlapSize: 200,
    preserveStructure: true,
    includeMetadata: true
  };

  // Content Cleaning Operations
  static cleanPDFContent(rawContent: string): string {
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

  // Semantic Chunking Operations
  static createSemanticChunks(
    content: string, 
    metadata: PDFDocumentMetadata, 
    config: Partial<PDFChunkingConfig> = {}
  ): PDFChunk[] {
    const chunkingConfig = { ...this.DEFAULT_CONFIG, ...config };
    const chunks: PDFChunk[] = [];
    const sentences = this.splitIntoSentences(content);
    
    let currentChunk = '';
    let chunkIndex = 0;
    let sentenceIndex = 0;
    
    while (sentenceIndex < sentences.length) {
      const sentence = sentences[sentenceIndex];
      
      // Check if adding this sentence would exceed chunk size
      if (currentChunk.length + sentence.length > chunkingConfig.maxChunkSize && currentChunk.length > 0) {
        // Create chunk with current content
        chunks.push(this.createChunk(
          currentChunk.trim(),
          chunkIndex,
          metadata,
          this.estimatePageNumbers(chunkIndex, chunks.length),
          chunkingConfig
        ));
        
        // Start new chunk with overlap
        currentChunk = this.createOverlapContent(
          chunks[chunks.length - 1]?.content || '', 
          sentence,
          chunkingConfig
        );
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
        this.estimatePageNumbers(chunkIndex, chunks.length),
        chunkingConfig
      ));
    }
    
    // Update total chunks count
    const totalChunks = chunks.length;
    chunks.forEach(chunk => {
      chunk.totalChunks = totalChunks;
    });
    
    return chunks;
  }

  // Chunk Statistics and Analysis
  static getChunkingStats(chunks: PDFChunk[]): {
    totalChunks: number;
    averageChunkSize: number;
    totalVectors: number;
    estimatedMemoryUsage: string;
  } {
    const totalChunks = chunks.length;
    const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
    const averageChunkSize = totalChunks > 0 ? Math.round(totalCharacters / totalChunks) : 0;
    
    // Estimate memory usage (rough calculation)
    const estimatedMemoryMB = Math.round((totalCharacters * 2) / (1024 * 1024)); // 2 bytes per character
    
    return {
      totalChunks,
      averageChunkSize,
      totalVectors: totalChunks, // Each chunk becomes one vector
      estimatedMemoryUsage: `${estimatedMemoryMB}MB`
    };
  }

  // Helper Methods
  private static splitIntoSentences(content: string): string[] {
    // Simple sentence splitting (can be enhanced with NLP libraries)
    return content
      .split(/(?<=[.!?])\s+/)
      .filter(sentence => sentence.trim().length > 10);
  }

  private static createOverlapContent(
    previousContent: string, 
    newSentence: string,
    config: PDFChunkingConfig
  ): string {
    if (!config.overlapSize || !previousContent) {
      return newSentence;
    }
    
    const overlapText = previousContent.slice(-config.overlapSize);
    const lastSentenceStart = overlapText.lastIndexOf('.');
    
    if (lastSentenceStart > 0) {
      return overlapText.slice(lastSentenceStart + 1).trim() + ' ' + newSentence;
    }
    
    return overlapText + ' ' + newSentence;
  }

  private static createChunk(
    content: string,
    chunkIndex: number,
    metadata: PDFDocumentMetadata,
    pageNumbers: number[],
    config: PDFChunkingConfig
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

  private static estimatePageNumbers(chunkIndex: number, totalChunks: number): number[] {
    const pageCount = totalChunks > 0 ? Math.ceil(totalChunks / 3) : 1; // Rough estimate: 3 chunks per page
    const startPage = Math.floor((chunkIndex / Math.max(totalChunks, 1)) * pageCount) + 1;
    return [startPage];
  }

  private static extractChunkTags(content: string, metadata: PDFDocumentMetadata): string[] {
    const tags: string[] = ['pdf', 'document'];
    
    if (metadata.filename) {
      const extension = metadata.filename.split('.').pop()?.toLowerCase();
      if (extension) tags.push(extension);
    }
    
    // Extract tags based on content patterns
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('api') || lowerContent.includes('endpoint')) tags.push('api');
    if (lowerContent.includes('guide') || lowerContent.includes('tutorial')) tags.push('guide');
    if (lowerContent.includes('troubleshoot') || lowerContent.includes('error')) tags.push('troubleshooting');
    if (lowerContent.includes('config') || lowerContent.includes('setting')) tags.push('configuration');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }
} 