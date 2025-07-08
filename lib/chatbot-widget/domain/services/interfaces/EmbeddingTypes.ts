/**
 * Embedding Domain Types
 * 
 * AI INSTRUCTIONS:
 * - Shared types and interfaces for embedding domain
 * - Keep types pure and focused on domain concepts
 * - Follow @golden-rule patterns for type definitions
 * - No business logic, only type definitions
 */

// ===== CORE EMBEDDING TYPES =====

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  tokenCount: number;
}

export interface SimilarityMatch {
  text: string;
  similarity: number;
  index: number;
}

export interface EmbeddingLogContext {
  logEntry: (message: string) => void;
}

// ===== CACHE MANAGEMENT TYPES =====

export interface CacheStats {
  size: number;
  maxSize: number;
  utilizationPercent: number;
  keys: string[];
}

export interface CacheConfiguration {
  // AI: Removed cache size limits - let serverless platform handle memory management
}

export enum CacheType {
  KNOWLEDGE_BASE = 'knowledge_base',
  USER_QUERY = 'user_query',
  PDF_DOCUMENT = 'pdf_document'
}

// ===== BATCH PROCESSING TYPES =====

export interface BatchProcessingOptions {
  batchSize: number;
  progressCallback?: (processed: number, total: number) => void;
}

export interface KnowledgeItem {
  id: string;
  content: string;
}

export interface PDFChunk {
  id: string;
  content: string;
}

// ===== SIMILARITY SEARCH TYPES =====

export interface SimilaritySearchOptions {
  topK: number;
  minSimilarity: number;
}

export interface SimilaritySearchRequest {
  queryText: string;
  candidateTexts: string[];
  options: SimilaritySearchOptions;
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface OpenAIEmbeddingRequest {
  model: string;
  input: string | string[];
  encoding_format: 'float';
}

export interface OpenAIEmbeddingResponse {
  model: string;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
  };
  data: Array<{
    embedding: number[];
    index: number;
  }>;
}

// ===== CONSTANTS =====

export const EMBEDDING_CONSTANTS = {
  DEFAULT_MODEL: 'text-embedding-3-small',
  DEFAULT_BATCH_SIZE: 10,
  DEFAULT_PDF_BATCH_SIZE: 10,
  DEFAULT_TOP_K: 5,
  DEFAULT_MIN_SIMILARITY: 0.3,
  // AI: Removed cache size constants - serverless handles memory management automatically
  API_TIMEOUT: 30000,
  KNOWLEDGE_BASE_MIN_LENGTH: 100
} as const; 