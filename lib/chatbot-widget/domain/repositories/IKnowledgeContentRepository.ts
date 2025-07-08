/**
 * IKnowledgeContentRepository Domain Interface
 * 
 * AI INSTRUCTIONS:
 * - Define data access contracts for knowledge content processing
 * - Return structured data instead of raw strings
 * - Follow @golden-rule repository interface patterns exactly
 * - Support content sanitization at infrastructure boundary
 * - Maintain separation between infrastructure and domain concerns
 * - Enable content processing without breaking existing repositories
 */

import { SanitizedContent } from '../value-objects/content/SanitizedContent';
import { ContentType } from '../value-objects/content/ContentType';

export interface RawKnowledgeContent {
  readonly companyInfo: string | null;
  readonly complianceGuidelines: string | null;
  readonly productCatalog: string | null;
  readonly supportDocs: string | null;
  readonly faqs: readonly { question: string; answer: string; }[];
}

export interface StructuredKnowledgeContent {
  readonly companyInfo: SanitizedContent | null;
  readonly complianceGuidelines: SanitizedContent | null;
  readonly productCatalog: SanitizedContent | null;
  readonly supportDocs: SanitizedContent | null;
  readonly faqs: readonly SanitizedContent[];
}

export interface ContentProcessingMetadata {
  readonly organizationId: string;
  readonly lastUpdated: Date;
  readonly processedAt: Date;
  readonly sanitizationVersion: string;
  readonly hasValidationErrors: boolean;
  readonly validationErrorCount: number;
}

export interface IKnowledgeContentRepository {
  /** Get raw knowledge content from database without processing */
  getRawKnowledgeContent(organizationId: string): Promise<RawKnowledgeContent>;

  /** Get structured knowledge content with sanitization and validation */
  getStructuredKnowledgeContent(organizationId: string): Promise<StructuredKnowledgeContent>;

  /** Get specific content type with processing */
  getProcessedContent(
    organizationId: string, 
    contentType: ContentType
  ): Promise<SanitizedContent | null>;

  /** Get content processing metadata for monitoring */
  getContentMetadata(organizationId: string): Promise<ContentProcessingMetadata>;

  /** Validate content without full processing (for preview) */
  validateContent(
    content: string, 
    contentType: ContentType
  ): Promise<{ isValid: boolean; issues: string[]; warnings: string[] }>;

  /** Check if organization has any knowledge content */
  hasKnowledgeContent(organizationId: string): Promise<boolean>;

  /** Get content statistics for analytics */
  getContentStatistics(organizationId: string): Promise<{
    totalContentItems: number;
    contentTypes: ContentType[];
    totalCharacters: number;
    lastModified: Date | null;
    validationStatus: 'valid' | 'warnings' | 'errors';
  }>;
} 