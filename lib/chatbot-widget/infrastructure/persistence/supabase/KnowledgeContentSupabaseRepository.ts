/**
 * KnowledgeContentSupabaseRepository Infrastructure Implementation
 * 
 * AI INSTRUCTIONS:
 * - Implement repository interface with database access focus
 * - Delegate content processing to specialized services
 * - Follow @golden-rule infrastructure layer patterns exactly
 * - Handle database-specific logic and data transformation
 * - Maintain separation between infrastructure and domain concerns
 * - Keep under 250 lines - focus on data access coordination only
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../../../supabase/server';
import { 
  IKnowledgeContentRepository, 
  RawKnowledgeContent, 
  StructuredKnowledgeContent,
  ContentProcessingMetadata
} from '../../../domain/repositories/IKnowledgeContentRepository';
import { SanitizedContent } from '../../../domain/value-objects/content/SanitizedContent';
import { ContentType } from '../../../domain/value-objects/content/ContentType';
import { ContentValidationError } from '../../../domain/errors/ContentValidationError';
import { DatabaseError } from '../../../domain/errors/InfrastructureErrors';
import { ContentProcessingService } from './services/ContentProcessingService';
import { ContentAnalyticsService, ContentStatistics } from './services/ContentAnalyticsService';

export class KnowledgeContentSupabaseRepository implements IKnowledgeContentRepository {
  private supabase: SupabaseClient;
  private readonly contentProcessor: ContentProcessingService;
  private readonly contentAnalytics: ContentAnalyticsService;

  constructor(
    supabaseClient?: SupabaseClient,
    contentProcessor?: ContentProcessingService,
    contentAnalytics?: ContentAnalyticsService
  ) {
    this.supabase = supabaseClient ?? createClient();
    this.contentProcessor = contentProcessor ?? new ContentProcessingService();
    this.contentAnalytics = contentAnalytics ?? new ContentAnalyticsService(this.contentProcessor);
  }

  // AI: Get raw content from database without any processing
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
        throw new DatabaseError('Failed to fetch knowledge base content', error.message);
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
      throw new DatabaseError('Unexpected error fetching knowledge base', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // AI: Get structured content with full sanitization and validation processing
  async getStructuredKnowledgeContent(organizationId: string): Promise<StructuredKnowledgeContent> {
    try {
      const rawContent = await this.getRawKnowledgeContent(organizationId);
      
      return {
        companyInfo: await this.contentProcessor.sanitizeContent(rawContent.companyInfo, ContentType.COMPANY_INFO),
        complianceGuidelines: await this.contentProcessor.sanitizeContent(rawContent.complianceGuidelines, ContentType.COMPLIANCE_GUIDELINES),
        productCatalog: await this.contentProcessor.sanitizeContent(rawContent.productCatalog, ContentType.PRODUCT_CATALOG),
        supportDocs: await this.contentProcessor.sanitizeContent(rawContent.supportDocs, ContentType.SUPPORT_DOCS),
        faqs: await this.contentProcessor.sanitizeFaqs(rawContent.faqs)
      };
    } catch (error) {
      if (error instanceof ContentValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to process knowledge content', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // AI: Get specific content type with processing
  async getProcessedContent(organizationId: string, contentType: ContentType): Promise<SanitizedContent | null> {
    try {
      const rawContent = await this.getRawKnowledgeContent(organizationId);
      const content = this.contentProcessor.getContentByType(rawContent, contentType);
      return await this.contentProcessor.sanitizeContent(content, contentType);
    } catch (error) {
      if (error instanceof ContentValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to get processed content', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // AI: Get content processing metadata for monitoring
  async getContentMetadata(organizationId: string): Promise<ContentProcessingMetadata> {
    try {
      const { data, error } = await this.supabase
        .from('knowledge_base')
        .select('updated_at')
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError('Failed to fetch content metadata', error.message);
      }

      const rawContent = await this.getRawKnowledgeContent(organizationId);
      const lastUpdated = data?.updated_at ? new Date(data.updated_at) : new Date();
      
      return await this.contentAnalytics.generateContentMetadata(organizationId, rawContent, lastUpdated);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to get content metadata', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // AI: Validate content without full processing for preview
  async validateContent(content: string, contentType: ContentType): Promise<{ isValid: boolean; issues: string[]; warnings: string[] }> {
    return await this.contentProcessor.validateContent(content, contentType);
  }

  // AI: Check if organization has any knowledge content
  async hasKnowledgeContent(organizationId: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('knowledge_base')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (error) {
        throw new DatabaseError('Failed to check knowledge content existence', error.message);
      }

      return (count || 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to check content existence', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // AI: Get content statistics for analytics
  async getContentStatistics(organizationId: string): Promise<ContentStatistics> {
    try {
      const rawContent = await this.getRawKnowledgeContent(organizationId);
      const metadata = await this.getContentMetadata(organizationId);
      
      return await this.contentAnalytics.analyzeContentStatistics(rawContent, metadata);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ContentValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to get content statistics', error instanceof Error ? error.message : 'Unknown error');
    }
  }
} 