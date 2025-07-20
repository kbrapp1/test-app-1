import { SupabaseClient } from '@supabase/supabase-js';
import { IVectorKnowledgeRepository } from '../../../domain/repositories/IVectorKnowledgeRepository';
import { IVectorKnowledgeQueryRepository } from '../../../domain/repositories/IVectorKnowledgeQueryRepository';
import { IVectorKnowledgeCommandRepository } from '../../../domain/repositories/IVectorKnowledgeCommandRepository';
import { IVectorKnowledgeAnalyticsRepository } from '../../../domain/repositories/IVectorKnowledgeAnalyticsRepository';
import { VectorKnowledgeQueryRepository } from './VectorKnowledgeQueryRepository';
import { VectorKnowledgeCommandRepository } from './VectorKnowledgeCommandRepository';
import { VectorKnowledgeAnalyticsRepository } from './VectorKnowledgeAnalyticsRepository';
import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

// Vector Knowledge Repository Composite
//
// AI INSTRUCTIONS:
// - Maintains backward compatibility with original IVectorKnowledgeRepository
// - Delegates operations to specialized CQRS repositories
export class VectorKnowledgeRepositoryComposite implements IVectorKnowledgeRepository {
  private readonly queryRepository: IVectorKnowledgeQueryRepository;
  private readonly commandRepository: IVectorKnowledgeCommandRepository;
  private readonly analyticsRepository: IVectorKnowledgeAnalyticsRepository;

  constructor(private supabase: SupabaseClient) {
    this.queryRepository = new VectorKnowledgeQueryRepository(supabase);
    this.commandRepository = new VectorKnowledgeCommandRepository(supabase);
    this.analyticsRepository = new VectorKnowledgeAnalyticsRepository(supabase);
  }

  // Query operations - delegate to query repository
  async searchKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      categoryFilter?: string;
      sourceTypeFilter?: string;
    } = {}
  ): Promise<Array<{ item: KnowledgeItem; similarity: number; }>> {
    return this.queryRepository.searchKnowledgeItems(organizationId, chatbotConfigId, queryEmbedding, options);
  }

  async getAllKnowledgeVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<Array<{ item: KnowledgeItem; vector: number[]; }>> {
    return this.queryRepository.getAllKnowledgeVectors(organizationId, chatbotConfigId);
  }

  async getCrawledPages(
    organizationId: string,
    chatbotConfigId: string,
    sourceUrl?: string
  ): Promise<Array<{
    url: string;
    title: string;
    content: string;
    status: 'success' | 'failed' | 'skipped';
    statusCode?: number;
    responseTime?: number;
    depth: number;
    crawledAt: Date;
    errorMessage?: string;
  }>> {
    return this.queryRepository.getCrawledPages(organizationId, chatbotConfigId, sourceUrl);
  }

  // Command operations - delegate to command repository
  async storeKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    items: Array<{
      knowledgeItemId: string;
      title: string;
      content: string;
      category: string;
      sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
      sourceUrl?: string;
      embedding: number[];
      contentHash: string;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void> {
    return this.commandRepository.storeKnowledgeItems(organizationId, chatbotConfigId, items);
  }

  async deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number> {
    return this.commandRepository.deleteKnowledgeItemsBySource(organizationId, chatbotConfigId, sourceType, sourceUrl);
  }

  // Analytics operations - delegate to analytics repository
  async getKnowledgeItemStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: Date | null;
    storageSize: number;
  }> {
    return this.analyticsRepository.getKnowledgeItemStats(organizationId, chatbotConfigId);
  }

  async getStorageOptimizationMetrics(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    averageVectorSize: number;
    totalVectorCount: number;
    duplicateContentCount: number;
    unusedVectorCount: number;
    storageEfficiency: number;
    recommendations: string[];
  }> {
    return this.analyticsRepository.getStorageOptimizationMetrics(organizationId, chatbotConfigId);
  }

  async getKnowledgeBaseHealthMetrics(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    healthScore: number;
    staleContentCount: number;
    recentUpdatesCount: number;
    contentFreshness: 'excellent' | 'good' | 'fair' | 'poor';
    maintenanceNeeded: boolean;
    recommendations: string[];
  }> {
    return this.analyticsRepository.getKnowledgeBaseHealthMetrics(organizationId, chatbotConfigId);
  }
}