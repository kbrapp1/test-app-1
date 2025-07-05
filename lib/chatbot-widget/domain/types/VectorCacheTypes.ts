/**
 * Vector Cache Types
 * 
 * AI INSTRUCTIONS:
 * - Central location for all vector cache related types
 * - Maintain type safety across all vector cache services
 * - Support memory management, similarity search, and statistics
 * - Include comprehensive configuration and monitoring types
 */

import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';

export interface CachedKnowledgeVector {
  item: KnowledgeItem;
  vector: number[];
  similarity?: number;
  lastAccessed: Date;
  accessCount: number;
}

export interface VectorCacheStats {
  totalVectors: number;
  memoryUsageKB: number;
  memoryLimitKB: number;
  memoryUtilization: number;
  cacheHitRate: number;
  searchesPerformed: number;
  cacheHits: number;
  evictionsPerformed: number;
  lastUpdated: Date;
}

export interface VectorSearchOptions {
  threshold?: number;
  limit?: number;
  categoryFilter?: string;
  sourceTypeFilter?: string;
}

export interface VectorCacheConfig {
  maxMemoryKB?: number; // Default: 50MB
  maxVectors?: number; // Default: 10000
  enableLRUEviction?: boolean; // Default: true
  evictionBatchSize?: number; // Default: 100
}

export interface VectorSearchResult {
  item: KnowledgeItem;
  similarity: number;
}

export interface VectorCacheInitializationResult {
  success: boolean;
  vectorsLoaded: number;
  vectorsEvicted: number;
  memoryUsageKB: number;
  timeMs: number;
}

export interface VectorCacheEntry {
  key: string;
  vector: CachedKnowledgeVector;
}

export interface MemoryEvictionResult {
  evictedCount: number;
  reason: MemoryEvictionReason;
  memoryUsageKB: number;
  vectorCount: number;
}

export type MemoryEvictionReason = 'memory' | 'count';

export interface SimilarityCalculationOptions {
  handleZeroVectors?: boolean;
  validateDimensions?: boolean;
}

export interface VectorDimensions {
  queryVector: number;
  cachedVector: number;
  match: boolean;
}

export interface SimilarityDebugInfo {
  id: string;
  similarity: number;
  passedThreshold: boolean;
}

export interface VectorSearchMetrics {
  searchTimeMs: number;
  vectorsSearched: number;
  resultsFound: number;
  cacheHitRate: number;
  memoryUtilization: number;
  searchThreshold: number;
}

export interface VectorCacheInitializationMetrics {
  initializationTimeMs: number;
  vectorsLoaded: number;
  vectorsEvicted: number;
  memoryUsageKB: number;
  memoryUtilization: number;
  averageVectorSize: number;
} 