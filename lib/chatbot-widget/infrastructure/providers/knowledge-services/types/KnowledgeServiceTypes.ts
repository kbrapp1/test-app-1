/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Central location for all knowledge service related types
 * - Maintain type safety across all knowledge processing services
 * - Support generic content processing for any organization
 * - Include comprehensive interfaces for content chunking and processing
 * - Follow @golden-rule patterns exactly
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export interface ProductSection {
  title?: string;
  content: string;
}

export interface ContentChunk {
  title: string;
  content: string;
  tags: string[];
}

export interface ChunkingStrategy {
  name: string;
  minChunkSize: number;
  maxChunkSize: number;
  overlapSize: number;
}

export interface TagExtractionConfig {
  extractHeaders: boolean;
  extractBullets: boolean;
  extractNumberedItems: boolean;
  minTagLength: number;
  maxTags: number;
}

export interface ContentAnalysisResult {
  sections?: ProductSection[];
  totalSections?: number;
  averageSectionLength?: number;
  hasStructuredContent?: boolean;
  averageLength: number;
  lengthDistribution: Record<string, number>;
  complexityScores: { average: number; distribution: Record<string, number> };
  readabilityMetrics: { averageReadability: number; distribution: Record<string, number> };
  topicClusters: Array<{ topic: string; items: number; keywords: string[] }>;
  contentDuplication: { duplicateCount: number; duplicateRate: number; examples: string[] };
  languagePatterns: Record<string, number>;
}

export interface KnowledgeProcessingContext {
  organizationId: string;
  companyName?: string;
  lastUpdated: Date;
  source: string;
}

export interface KnowledgeConversionResult {
  items: KnowledgeItem[];
  totalProcessed: number;
  processingTime: number;
  warnings: string[];
}

export interface CategoryMapping {
  faqCategory: string;
  knowledgeCategory: KnowledgeItem['category'];
  tags: string[];
}

export interface ContentEnhancementOptions {
  addCompanyContext: boolean;
  addCrossReferences: boolean;
  maintainOriginalStructure: boolean;
  optimizeForEmbeddings: boolean;
}

// Statistics and Health Metrics Types
export interface KnowledgeStats {
  totalItems: number;
  totalSources: number;
  totalTags: number;
  averageContentLength: number;
  itemsByType: Record<string, number>;
  itemsBySource: Record<string, number>;
  tagDistribution: Record<string, number>;
  contentLengthDistribution: Record<string, number>;
  recentlyUpdated: number;
  itemsWithoutTags: number;
}

export interface KnowledgeHealthMetrics {
  totalItems: number;
  itemsWithContent: number;
  itemsWithTags: number;
  itemsWithMetadata: number;
  duplicateItems: number;
  staleItems: number;
  incompleteItems: number;
  contentCoverage: number;
  tagCoverage: number;
  metadataCoverage: number;
  duplicateRate: number;
  staleRate: number;
  completionRate: number;
  overallHealth: number;
}

// Analytics specific types
export interface KnowledgeInsights {
  contentGaps: ContentGap[];
  popularTags: Array<{ tag: string; count: number; percentage: number }>;
  contentPatterns: UsagePattern[];
  sourceEffectiveness: Record<string, { count: number; avgQuality: number; effectiveness: string }>;
  recommendations: string[];
  qualityIssues: Array<{ issue: string; count: number; severity: string }>;
  optimizationOpportunities: string[];
}

export interface KnowledgeTrends {
  creationTrends: Record<string, number>;
  updateTrends: Record<string, number>;
  contentGrowth: { totalGrowth: number; monthlyGrowth: Record<string, number> };
  tagTrends: Record<string, Record<string, number>>;
  sourceTrends: Record<string, Record<string, number>>;
  qualityTrends: Record<string, number>;
}

export interface TagAnalysisResult {
  tagFrequency: Record<string, number>;
  tagCooccurrence: Record<string, Record<string, number>>;
  tagClusters: Array<{ cluster: string[]; strength: number }>;
  unusedTags: string[];
  tagEffectiveness: Record<string, { usage: number; effectiveness: number }>;
  suggestedTags: string[];
}

export interface UsagePattern {
  type: string;
  description: string;
  frequency: number;
  confidence: number;
}

export interface ContentGap {
  type: string;
  description: string;
  severity: string;
  suggestions: string[];
}

export const DEFAULT_CHUNKING_STRATEGY: ChunkingStrategy = {
  name: 'intelligent-semantic',
  minChunkSize: 50,
  maxChunkSize: 2000,
  overlapSize: 100
};

export const DEFAULT_TAG_EXTRACTION_CONFIG: TagExtractionConfig = {
  extractHeaders: true,
  extractBullets: true,
  extractNumberedItems: true,
  minTagLength: 3,
  maxTags: 10
};

export const FAQ_CATEGORY_MAPPINGS: CategoryMapping[] = [
  { faqCategory: 'general', knowledgeCategory: 'general', tags: ['general', 'info', 'about', 'company'] },
  { faqCategory: 'product', knowledgeCategory: 'product_info', tags: ['product', 'features', 'functionality', 'capabilities'] },
  { faqCategory: 'support', knowledgeCategory: 'support', tags: ['support', 'help', 'troubleshooting', 'assistance'] },
  { faqCategory: 'billing', knowledgeCategory: 'pricing', tags: ['billing', 'pricing', 'cost', 'price', 'plans', 'payment', 'invoice'] },
  { faqCategory: 'technical', knowledgeCategory: 'support', tags: ['technical', 'integration', 'api', 'setup', 'configuration'] }
]; 