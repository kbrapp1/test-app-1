/**
 * Vector Repository Types
 * 
 * AI INSTRUCTIONS:
 * - Central location for all vector repository related types
 * - Maintain type safety across all vector storage services
 * - Support knowledge vector storage, search, and analytics operations
 * - Include comprehensive metadata and configuration types
 * - Follow @golden-rule patterns exactly
 */

import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';

export interface VectorKnowledgeItem {
  knowledgeItemId: string;
  title: string;
  content: string;
  category: string;
  sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
  sourceUrl?: string;
  embedding: number[];
  contentHash: string;
  metadata?: Record<string, unknown>;
}

export interface VectorSearchOptions {
  threshold?: number;
  limit?: number;
  categoryFilter?: string;
  sourceTypeFilter?: string;
}

export interface VectorSearchResult {
  item: KnowledgeItem;
  similarity: number;
}

export interface VectorWithItem {
  item: KnowledgeItem;
  vector: number[];
}

export interface VectorKnowledgeStats {
  totalItems: number;
  itemsBySourceType: Record<string, number>;
  itemsByCategory: Record<string, number>;
  lastUpdated: Date | null;
  storageSize: number;
}

export interface CrawledPageInfo {
  url: string;
  title: string;
  content: string;
  status: 'success' | 'failed' | 'skipped';
  statusCode?: number;
  responseTime?: number;
  depth: number;
  crawledAt: Date;
  errorMessage?: string;
}

export interface VectorStorageRecord {
  organization_id: string;
  chatbot_config_id: string;
  knowledge_item_id: string;
  title: string;
  content: string;
  category: string;
  source_type: string;
  source_url?: string;
  vector: number[];
  content_hash: string;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface VectorQueryContext {
  organizationId: string;
  chatbotConfigId: string;
  [key: string]: unknown;
}

export interface VectorDeletionContext extends VectorQueryContext {
  sourceType: string;
  sourceUrl?: string;
}

export interface VectorValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VectorDimensionConfig {
  expectedDimensions: number;
  validateDimensions: boolean;
}

export interface VectorStorageConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  enableValidation: boolean;
  dimensionConfig: VectorDimensionConfig;
}

export interface VectorSearchConfig {
  defaultThreshold: number;
  defaultLimit: number;
  maxLimit: number;
  enableFiltering: boolean;
}

export interface VectorOperationResult {
  success: boolean;
  itemsProcessed: number;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, unknown>;
}

export interface SupabaseVectorRow {
  knowledge_item_id: string;
  title: string;
  content: string;
  category: string;
  source_type: string;
  source_url?: string;
  vector: number[] | string; // Can be array or string from Supabase
  updated_at: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  id?: string;
}

export interface VectorSimilarityRow extends SupabaseVectorRow {
  similarity: number;
} 