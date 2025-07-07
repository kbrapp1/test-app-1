/**
 * KnowledgeContentService Infrastructure Service
 * 
 * AI INSTRUCTIONS:
 * - Handle knowledge content processing operations
 * - Keep focused on content sanitization and validation
 * - Follow @golden-rule infrastructure service patterns
 * - Delegate to domain services for business logic
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ContentType } from '../../../../domain/value-objects/content/ContentType';
import { SanitizedContent } from '../../../../domain/value-objects/content/SanitizedContent';
import { UserContentSanitizationService } from '../../../../domain/services/content-processing/UserContentSanitizationService';
import { ContentValidationService } from '../../../../domain/services/content-processing/ContentValidationService';
import { ContentSanitizationError } from '../../../../domain/errors/ContentSanitizationError';
import { ContentValidationError } from '../../../../domain/errors/ContentValidationError';
import { DatabaseError } from '../errors/DatabaseError';
import { StructuredKnowledgeContent, RawKnowledgeContent } from '../types/KnowledgeContentTypes';

export class KnowledgeContentService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly contentSanitizer: UserContentSanitizationService,
    private readonly contentValidator: ContentValidationService
  ) {}

  // AI: Get structured knowledge content with sanitization
  async getStructuredKnowledgeContent(organizationId: string): Promise<StructuredKnowledgeContent> {
    try {
      const rawContent = await this.getRawKnowledgeContent(organizationId);
      
      return {
        companyInfo: await this.sanitizeContent(rawContent.companyInfo, ContentType.COMPANY_INFO),
        complianceGuidelines: await this.sanitizeContent(rawContent.complianceGuidelines, ContentType.COMPLIANCE_GUIDELINES),
        productCatalog: await this.sanitizeContent(rawContent.productCatalog, ContentType.PRODUCT_CATALOG),
        supportDocs: await this.sanitizeContent(rawContent.supportDocs, ContentType.SUPPORT_DOCS),
        faqs: await this.sanitizeFaqs(rawContent.faqs)
      };
    } catch (error) {
      if (error instanceof ContentSanitizationError || error instanceof ContentValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to process knowledge content', { error, organizationId });
    }
  }

  // AI: Get raw knowledge content from database
  async getRawKnowledgeContent(organizationId: string): Promise<RawKnowledgeContent> {
    try {
      const { data, error } = await this.supabase
        .from('knowledge_base')
        .select('company_info, compliance_guidelines, product_catalog, support_docs, faqs')
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // AI: Return empty structure if no knowledge base found
          return {
            companyInfo: null,
            complianceGuidelines: null,
            productCatalog: null,
            supportDocs: null,
            faqs: []
          };
        }
        throw new DatabaseError('Failed to fetch knowledge base content', { error, organizationId });
      }

      return {
        companyInfo: data.company_info as string | null,
        complianceGuidelines: data.compliance_guidelines as string | null,
        productCatalog: data.product_catalog as string | null,
        supportDocs: data.support_docs as string | null,
        faqs: (data.faqs as { question: string; answer: string; }[]) || []
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching knowledge base', { error, organizationId });
    }
  }

  // AI: Sanitize content with proper error handling
  private async sanitizeContent(content: string | null, contentType: ContentType): Promise<SanitizedContent | null> {
    if (!content || content.trim() === '') {
      return null;
    }

    try {
      // AI: Validate content first
      const validationResult = this.contentValidator.validateContent(content, contentType);
      if (!validationResult.isValid) {
        throw ContentValidationError.ruleViolation(
          validationResult.validationIssues.join(', '), 
          contentType.toString(),
          { validationErrors: validationResult.validationIssues }
        );
      }

      // AI: Sanitize valid content
      return this.contentSanitizer.sanitizeContent(content, contentType);
    } catch (error) {
      if (error instanceof ContentValidationError || error instanceof ContentSanitizationError) {
        throw error;
      }
      throw ContentSanitizationError.processingFailure(
        contentType.toString(),
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // AI: Sanitize FAQ content with batch processing
  private async sanitizeFaqs(faqs: readonly { question: string; answer: string; }[]): Promise<readonly SanitizedContent[]> {
    if (!faqs || faqs.length === 0) {
      return [];
    }

    const sanitizedFaqs: SanitizedContent[] = [];

    for (const faq of faqs) {
      try {
        const combinedContent = `Q: ${faq.question}\nA: ${faq.answer}`;
        const sanitized = await this.sanitizeContent(combinedContent, ContentType.FAQ);
        
        if (sanitized) {
          sanitizedFaqs.push(sanitized);
        }
      } catch (error) {
        // AI: Log error but continue processing other FAQs
        console.warn('Failed to sanitize FAQ:', { question: faq.question, error });
      }
    }

    return Object.freeze(sanitizedFaqs);
  }
} 