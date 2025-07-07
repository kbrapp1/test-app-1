/**
 * Knowledge Content Types
 * 
 * AI INSTRUCTIONS:
 * - Simple type definitions for knowledge content processing
 * - Keep focused on data structure contracts only
 * - Follow @golden-rule infrastructure type patterns
 */

import { SanitizedContent } from '../../../../domain/value-objects/content/SanitizedContent';

export interface StructuredKnowledgeContent {
  readonly companyInfo: SanitizedContent | null;
  readonly complianceGuidelines: SanitizedContent | null;
  readonly productCatalog: SanitizedContent | null;
  readonly supportDocs: SanitizedContent | null;
  readonly faqs: readonly SanitizedContent[];
}

export interface RawKnowledgeContent {
  readonly companyInfo: string | null;
  readonly complianceGuidelines: string | null;
  readonly productCatalog: string | null;
  readonly supportDocs: string | null;
  readonly faqs: readonly { question: string; answer: string; }[];
} 