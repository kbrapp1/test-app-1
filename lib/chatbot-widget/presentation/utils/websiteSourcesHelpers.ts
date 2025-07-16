/**
 * Website Sources Helper Functions
 * 
 * AI INSTRUCTIONS:
 * - Pure utility functions for website sources actions
 * - Single responsibility per function
 * - No external dependencies except domain objects
 * - Follow @golden-rule patterns exactly
 * - Keep functions under 30 lines each
 */

import { revalidatePath } from 'next/cache';
import { WebsiteSource, WebsiteCrawlSettings } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { DomainError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

// Type definitions
export interface WebsiteSourceFormData {
  url: string;
  name: string;
  description?: string;
  maxPages?: number;
  maxDepth?: number;
  respectRobotsTxt?: boolean;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    severity: string;
  };
}

/** Generate Website Source ID Helper
 */
function generateWebsiteSourceId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Create Crawl Settings Helper
 */
function createCrawlSettings(formData: WebsiteSourceFormData): WebsiteCrawlSettings {
  return {
    maxPages: Math.min(formData.maxPages!, 1000), // Cap at 1000 pages
    maxDepth: Math.min(formData.maxDepth!, 10), // Cap at 10 levels
    includePatterns: [],
    excludePatterns: [],
    respectRobotsTxt: formData.respectRobotsTxt!,
    crawlFrequency: 'manual',
    includeImages: false,
    includePDFs: true
  };
}

/** Create Crawl Settings from Form Data (Public)
 */
export function createCrawlSettingsFromFormData(formData: WebsiteSourceFormData): WebsiteCrawlSettings {
  return createCrawlSettings(formData);
}

/** Create Website Source from Form Data
 */
export function createWebsiteSourceFromFormData(formData: WebsiteSourceFormData): WebsiteSource {
  return {
    id: generateWebsiteSourceId(),
    url: formData.url,
    name: formData.name,
    description: formData.description,
    isActive: true,
    status: 'pending',
    crawlSettings: createCrawlSettings(formData)
  };
}

/** Update Website Source Status Helper
 */
export async function updateWebsiteSourceStatus(
  configId: string,
  sourceId: string,
  status: WebsiteSource['status'],
  pageCount?: number,
  errorMessage?: string
): Promise<void> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    
    const config = await configRepository.findById(configId);
    if (!config) return;
    
    const updatedKnowledgeBase = config.knowledgeBase.updateWebsiteSource(sourceId, {
      status,
      pageCount,
      errorMessage,
      lastCrawled: status === 'completed' ? new Date() : undefined
    });
    
    const updatedConfig = config.updateKnowledgeBase(updatedKnowledgeBase);
    await configRepository.update(updatedConfig);
  } catch (error) {
    console.error('❌ Failed to update website source status:', error);
  }
}

/**
 * Create Error Result Helper
 * 
 * AI INSTRUCTIONS:
 * - Standardize error result creation
 * - Provide consistent error structure
 * - Handle error severity levels
 */
export function createErrorResult<T = unknown>(code: string, message: string, severity: string): ActionResult<T> {
  return {
    success: false,
    error: {
      code,
      message,
      severity
    }
  };
}

/** Handle Action Error Helper
 */
export function handleActionError<T = unknown>(error: unknown, operation: string): ActionResult<T> {
  if (error instanceof DomainError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity
      }
    };
  }
  
  console.error(`❌ Error ${operation}:`, error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: `An unexpected error occurred while ${operation}`,
      severity: 'HIGH'
    }
  };
}

/** Revalidate Website Sources Paths Helper
 */
export function revalidateWebsiteSourcesPaths(): void {
  revalidatePath('/ai-playground/chatbot-widget/website-sources');
  revalidatePath('/ai-playground/chatbot-widget/knowledge');
}

/** Create Cleaned Knowledge Base Helper
 */
interface KnowledgeBaseData {
  companyInfo: unknown;
  productCatalog: unknown;
  faqs: unknown;
  supportDocs: unknown;
  complianceGuidelines: unknown;
}

export function createCleanedKnowledgeBase(existingKnowledgeBase: KnowledgeBaseData): unknown {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { KnowledgeBase } = require('../../domain/value-objects/ai-configuration/KnowledgeBase');
  return KnowledgeBase.create({
    companyInfo: existingKnowledgeBase.companyInfo,
    productCatalog: existingKnowledgeBase.productCatalog,
    faqs: existingKnowledgeBase.faqs,
    supportDocs: existingKnowledgeBase.supportDocs,
    complianceGuidelines: existingKnowledgeBase.complianceGuidelines,
    websiteSources: [] // Clear all website sources
  });
} 