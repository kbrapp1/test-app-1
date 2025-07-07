/**
 * Knowledge Base Form Helpers
 * 
 * AI INSTRUCTIONS:
 * - Pure utility functions extracted from KnowledgeBaseFormApplicationService
 * - No business logic - just data transformation and calculations
 * - Keep functions simple and focused on single responsibility
 * - Follow @golden-rule patterns exactly
 * - Under 250 lines total
 */

import { 
  ProcessedChunkDto,
  ProcessingStatisticsDto,
  QualityMetricsDto 
} from '../dto/KnowledgeBaseFormDto';

/**
 * Create a processed chunk DTO
 * AI INSTRUCTIONS: Data transformation utility for chunk creation
 */
export function createChunkDto(
  id: string,
  title: string,
  content: string,
  tags: string[],
  category: 'general' | 'product_info' | 'support',
  source: 'company_info' | 'product_catalog' | 'support_docs' | 'compliance' | 'faq',
  chunkIndex: number,
  contentHashFn: (content: string) => string
): ProcessedChunkDto {
  return {
    id,
    title,
    content,
    tags,
    category,
    source,
    contentHash: contentHashFn(content),
    chunkIndex,
    qualityScore: calculateQualityScore(content, tags, title)
  };
}

/**
 * Calculate quality score for content
 * AI INSTRUCTIONS: Quality assessment algorithm
 */
export function calculateQualityScore(content: string, tags: string[], title: string): number {
  let score = 0.5; // Base score
  
  // Content length scoring
  if (content.length > 100) score += 0.2;
  if (content.length > 500) score += 0.1;
  
  // Tag scoring
  if (tags.length > 1) score += 0.1;
  if (tags.length > 3) score += 0.1;
  
  // Title scoring
  if (title.length > 10) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * Calculate processing statistics
 * AI INSTRUCTIONS: Statistical analysis of processed chunks
 */
export function calculateStatistics(chunks: ProcessedChunkDto[], processingTimeMs: number): ProcessingStatisticsDto {
  const chunksBySource: Record<string, number> = {};
  const chunksByCategory: Record<string, number> = {};
  let totalContentLength = 0;
  let totalQualityScore = 0;
  let chunksAboveThreshold = 0;
  const threshold = 0.7;

  chunks.forEach(chunk => {
    chunksBySource[chunk.source] = (chunksBySource[chunk.source] || 0) + 1;
    chunksByCategory[chunk.category] = (chunksByCategory[chunk.category] || 0) + 1;
    totalContentLength += chunk.content.length;
    totalQualityScore += chunk.qualityScore;
    
    if (chunk.qualityScore >= threshold) {
      chunksAboveThreshold++;
    }
  });

  const qualityMetrics: QualityMetricsDto = {
    averageQualityScore: chunks.length > 0 ? totalQualityScore / chunks.length : 0,
    chunksAboveThreshold,
    duplicateChunks: 0, // TODO: Implement duplicate detection
    emptyChunks: 0,
    lowQualityChunks: chunks.length - chunksAboveThreshold
  };

  return {
    totalChunks: chunks.length,
    chunksBySource,
    chunksByCategory,
    averageChunkSize: chunks.length > 0 ? totalContentLength / chunks.length : 0,
    totalContentLength,
    processingTimeMs,
    qualityMetrics
  };
}

/**
 * Create empty statistics for error cases
 * AI INSTRUCTIONS: Default statistics object creation
 */
export function createEmptyStatistics(processingTimeMs: number): ProcessingStatisticsDto {
  return {
    totalChunks: 0,
    chunksBySource: {},
    chunksByCategory: {},
    averageChunkSize: 0,
    totalContentLength: 0,
    processingTimeMs,
    qualityMetrics: {
      averageQualityScore: 0,
      chunksAboveThreshold: 0,
      duplicateChunks: 0,
      emptyChunks: 0,
      lowQualityChunks: 0
    }
  };
}

/**
 * Filter and validate FAQs
 * AI INSTRUCTIONS: FAQ data sanitization and validation
 */
export function filterValidFaqs(faqs: any[]): Array<{
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
}> {
  return faqs
    .filter(faq => faq.question?.trim() && faq.answer?.trim())
    .map(faq => ({
      id: faq.id || `faq_${Date.now()}_${Math.random()}`,
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      category: faq.category?.trim() || 'general',
      isActive: faq.isActive !== false
    }));
}

/**
 * Check if form has any content
 * AI INSTRUCTIONS: Content presence validation
 */
export function hasFormContent(formData: any): boolean {
  return !!(
    formData.companyInfo?.trim() ||
    formData.productCatalog?.trim() ||
    formData.supportDocs?.trim() ||
    formData.complianceGuidelines?.trim() ||
    formData.faqs.some((faq: any) => faq.question?.trim() && faq.answer?.trim())
  );
}

/**
 * Create vector items from processed chunks
 * AI INSTRUCTIONS: Transform chunks to vector storage format
 */
export function createVectorItems(chunks: ProcessedChunkDto[]) {
  return chunks.map(chunk => ({
    knowledgeItemId: chunk.id,
    title: chunk.title,
    content: chunk.content,
    category: chunk.category,
    sourceType: chunk.source,
    sourceUrl: undefined,
    contentHash: chunk.contentHash
  }));
}