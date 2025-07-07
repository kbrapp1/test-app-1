/**
 * Knowledge Base Form DTOs
 * 
 * AI INSTRUCTIONS:
 * - Data transfer objects for knowledge base form operations
 * - Clean boundaries between presentation and application layers
 * - Immutable data structures for predictable behavior
 * - Validation-ready structures for business rule enforcement
 * - Follow @golden-rule DTO patterns exactly
 */

export interface KnowledgeBaseFormDto {
  readonly companyInfo: string;
  readonly productCatalog: string;
  readonly supportDocs: string;
  readonly complianceGuidelines: string;
  readonly faqs: FaqFormDto[];
}

export interface FaqFormDto {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly category: string;
  readonly keywords: string[];
  readonly priority: number;
  readonly isActive: boolean;
}

export interface KnowledgeBaseFormValidationDto {
  readonly isValid: boolean;
  readonly errors: FormValidationErrorDto[];
  readonly warnings: FormValidationWarningDto[];
  readonly suggestions: FormValidationSuggestionDto[];
}

export interface FormValidationErrorDto {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'high' | 'medium' | 'low';
}

export interface FormValidationWarningDto {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly impact: 'performance' | 'quality' | 'usability';
}

export interface FormValidationSuggestionDto {
  readonly field: string;
  readonly message: string;
  readonly action: string;
  readonly benefit: string;
}

export interface KnowledgeBaseProcessingResultDto {
  readonly success: boolean;
  readonly processedChunks: ProcessedChunkDto[];
  readonly statistics: ProcessingStatisticsDto;
  readonly validation: KnowledgeBaseFormValidationDto;
}

export interface ProcessedChunkDto {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags: string[];
  readonly category: 'general' | 'product_info' | 'support';
  readonly source: 'company_info' | 'product_catalog' | 'support_docs' | 'compliance' | 'faq';
  readonly contentHash: string;
  readonly chunkIndex: number;
  readonly qualityScore: number;
}

export interface ProcessingStatisticsDto {
  readonly totalChunks: number;
  readonly chunksBySource: Record<string, number>;
  readonly chunksByCategory: Record<string, number>;
  readonly averageChunkSize: number;
  readonly totalContentLength: number;
  readonly processingTimeMs: number;
  readonly qualityMetrics: QualityMetricsDto;
}

export interface QualityMetricsDto {
  readonly averageQualityScore: number;
  readonly chunksAboveThreshold: number;
  readonly duplicateChunks: number;
  readonly emptyChunks: number;
  readonly lowQualityChunks: number;
}

export interface KnowledgeBaseUpdateRequestDto {
  readonly configId: string;
  readonly organizationId: string;
  readonly formData: KnowledgeBaseFormDto;
  readonly generateVectors: boolean;
  readonly preserveExisting: boolean;
}

export interface KnowledgeBaseUpdateResponseDto {
  readonly success: boolean;
  readonly configId: string;
  readonly processingResult: KnowledgeBaseProcessingResultDto;
  readonly vectorsGenerated: boolean;
  readonly affectedItems: number;
  readonly errors: string[];
  readonly warnings: string[];
}

export interface FaqOperationDto {
  readonly operation: 'add' | 'update' | 'remove' | 'activate' | 'deactivate';
  readonly faqId?: string;
  readonly faqData?: Omit<FaqFormDto, 'id'>;
  readonly updates?: Partial<Omit<FaqFormDto, 'id'>>;
}

export interface FaqOperationResultDto {
  readonly success: boolean;
  readonly operation: string;
  readonly faqId: string;
  readonly errors: string[];
}