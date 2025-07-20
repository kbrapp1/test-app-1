import { KnowledgeBaseStructureValidationService } from '../../services/knowledge/KnowledgeBaseStructureValidationService';
import { KnowledgeBaseSearchService } from '../../services/knowledge/KnowledgeBaseSearchService';

/**
 * Knowledge Base Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing chatbot knowledge
 * - Contains company info, FAQs, documentation, and website sources
 * - All mutations return new instances (immutable)
 * - Validates business rules and constraints
 * - Use domain-specific errors for rule violations
 * - Follow @golden-rule patterns exactly
 */

export interface KnowledgeBaseProps {
  companyInfo: string;
  productCatalog: string;
  faqs: FAQ[];
  supportDocs: string;
  complianceGuidelines: string;
  websiteSources: WebsiteSource[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
}

export interface WebsiteSource {
  id: string;
  url: string;
  name: string;
  description?: string;
  isActive: boolean;
  crawlSettings: WebsiteCrawlSettings;
  lastCrawled?: Date;
  pageCount?: number;
  status: 'pending' | 'crawling' | 'vectorizing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface WebsiteCrawlSettings {
  maxPages: number;           // Maximum pages to crawl (default: 50)
  maxDepth: number;           // Maximum crawl depth (default: 3)
  includePatterns: string[];  // URL patterns to include (e.g., ["/docs/*", "/help/*"])
  excludePatterns: string[];  // URL patterns to exclude (e.g., ["/admin/*", "/login"])
  respectRobotsTxt: boolean;  // Follow robots.txt (default: true)
  crawlFrequency: 'manual' | 'daily' | 'weekly' | 'monthly'; // Auto-crawl frequency
  includeImages: boolean;     // Extract image alt text (default: false)
  includePDFs: boolean;       // Crawl linked PDFs (default: true)
}

export class KnowledgeBase {
  private constructor(private readonly props: KnowledgeBaseProps) {
    this.validateProps(props);
  }

  static create(props: KnowledgeBaseProps): KnowledgeBase {
    return new KnowledgeBase(props);
  }

  static createEmpty(): KnowledgeBase {
    return new KnowledgeBase({
      companyInfo: '',
      productCatalog: '',
      faqs: [],
      supportDocs: '',
      complianceGuidelines: '',
      websiteSources: [],
    });
  }

  private validateProps(props: KnowledgeBaseProps): void {
    // Delegate validation to domain service
    KnowledgeBaseStructureValidationService.validateKnowledgeBaseStructure(props);
  }

  // Getters
  get companyInfo(): string { return this.props.companyInfo; }
  get productCatalog(): string { return this.props.productCatalog; }
  get faqs(): FAQ[] { return [...this.props.faqs]; }
  get supportDocs(): string { return this.props.supportDocs; }
  get complianceGuidelines(): string { return this.props.complianceGuidelines; }
  get websiteSources(): WebsiteSource[] { return [...this.props.websiteSources]; }

  // Business methods
  updateCompanyInfo(info: string): KnowledgeBase {
    return new KnowledgeBase({
      ...this.props,
      companyInfo: info,
    });
  }

  updateProductCatalog(catalog: string): KnowledgeBase {
    return new KnowledgeBase({
      ...this.props,
      productCatalog: catalog,
    });
  }

  updateSupportDocs(docs: string): KnowledgeBase {
    return new KnowledgeBase({
      ...this.props,
      supportDocs: docs,
    });
  }

  updateComplianceGuidelines(guidelines: string): KnowledgeBase {
    return new KnowledgeBase({
      ...this.props,
      complianceGuidelines: guidelines,
    });
  }

  addFAQ(faq: FAQ): KnowledgeBase {
    // Validate uniqueness using domain service
    KnowledgeBaseStructureValidationService.validateFAQUniqueness(this.props.faqs, faq);

    return new KnowledgeBase({
      ...this.props,
      faqs: [...this.props.faqs, faq],
    });
  }

  updateFAQ(faqId: string, updates: Partial<Omit<FAQ, 'id'>>): KnowledgeBase {
    // Validate FAQ exists using domain service
    KnowledgeBaseStructureValidationService.validateFAQExistsForUpdate(this.props.faqs, faqId);

    const faqIndex = this.props.faqs.findIndex(faq => faq.id === faqId);
    const updatedFAQs = [...this.props.faqs];
    updatedFAQs[faqIndex] = { ...updatedFAQs[faqIndex], ...updates };

    return new KnowledgeBase({
      ...this.props,
      faqs: updatedFAQs,
    });
  }

  removeFAQ(faqId: string): KnowledgeBase {
    const filteredFAQs = this.props.faqs.filter(faq => faq.id !== faqId);
    
    return new KnowledgeBase({
      ...this.props,
      faqs: filteredFAQs,
    });
  }

  activateFAQ(faqId: string): KnowledgeBase {
    return this.updateFAQ(faqId, { isActive: true });
  }

  deactivateFAQ(faqId: string): KnowledgeBase {
    return this.updateFAQ(faqId, { isActive: false });
  }

  getActiveFAQs(): FAQ[] {
    return this.props.faqs.filter(faq => faq.isActive);
  }

  getFAQsByCategory(category: string): FAQ[] {
    return KnowledgeBaseSearchService.searchFAQsByCategory(this.props.faqs, category);
  }

  searchFAQs(query: string): FAQ[] {
    // Delegate to domain search service for enhanced search capabilities
    // NOTE: For semantic search, use VectorKnowledgeQueryRepository instead
    return KnowledgeBaseSearchService.searchFAQs(this.props.faqs, query);
  }

  getCategories(): string[] {
    return KnowledgeBaseSearchService.searchFAQCategories(this.props.faqs);
  }

  // Website source management methods
  addWebsiteSource(websiteSource: WebsiteSource): KnowledgeBase {
    // Validate uniqueness using domain service
    KnowledgeBaseStructureValidationService.validateWebsiteSourceUniqueness(this.props.websiteSources, websiteSource);

    return new KnowledgeBase({
      ...this.props,
      websiteSources: [...this.props.websiteSources, websiteSource],
    });
  }

  updateWebsiteSource(sourceId: string, updates: Partial<Omit<WebsiteSource, 'id'>>): KnowledgeBase {
    // Validate source exists using domain service
    KnowledgeBaseStructureValidationService.validateWebsiteSourceExistsForUpdate(this.props.websiteSources, sourceId);

    const sourceIndex = this.props.websiteSources.findIndex(source => source.id === sourceId);
    const updatedSources = [...this.props.websiteSources];
    updatedSources[sourceIndex] = { ...updatedSources[sourceIndex], ...updates };

    return new KnowledgeBase({
      ...this.props,
      websiteSources: updatedSources,
    });
  }

  removeWebsiteSource(sourceId: string): KnowledgeBase {
    const filteredSources = this.props.websiteSources.filter(source => source.id !== sourceId);
    
    return new KnowledgeBase({
      ...this.props,
      websiteSources: filteredSources,
    });
  }

  activateWebsiteSource(sourceId: string): KnowledgeBase {
    return this.updateWebsiteSource(sourceId, { isActive: true });
  }

  deactivateWebsiteSource(sourceId: string): KnowledgeBase {
    return this.updateWebsiteSource(sourceId, { isActive: false });
  }

  getActiveWebsiteSources(): WebsiteSource[] {
    return this.props.websiteSources.filter(source => source.isActive);
  }

  searchWebsiteSources(query: string): WebsiteSource[] {
    return KnowledgeBaseSearchService.searchWebsiteSources(this.props.websiteSources, query);
  }

  findSimilarFAQs(targetFAQ: FAQ, limit: number = 5): FAQ[] {
    return KnowledgeBaseSearchService.findSimilarFAQs(this.props.faqs, targetFAQ, limit);
  }

  searchAllContent(query: string): {
    faqs: FAQ[];
    sources: WebsiteSource[];
    hasCompanyInfoMatch: boolean;
    hasProductCatalogMatch: boolean;
    hasSupportDocsMatch: boolean;
  } {
    return KnowledgeBaseSearchService.searchAllContent(
      this.props.faqs,
      this.props.websiteSources,
      this.props.companyInfo,
      this.props.productCatalog,
      this.props.supportDocs,
      query
    );
  }

  updateWebsiteCrawlStatus(sourceId: string, status: WebsiteSource['status'], errorMessage?: string): KnowledgeBase {
    const updates: Partial<WebsiteSource> = { status };
    
    if (status === 'completed') {
      updates.lastCrawled = new Date();
    }
    
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }

    return this.updateWebsiteSource(sourceId, updates);
  }

  static createDefaultWebsiteCrawlSettings(): WebsiteCrawlSettings {
    return {
      maxPages: 5,
      maxDepth: 3,
      includePatterns: [],
      excludePatterns: ['/admin/*', '/login', '/logout', '/account/*', '/cart/*', '/checkout/*'],
      respectRobotsTxt: true,
      crawlFrequency: 'weekly',
      includeImages: false,
      includePDFs: true,
    };
  }

  isEmpty(): boolean {
    return !this.props.companyInfo.trim() &&
           !this.props.productCatalog.trim() &&
           !this.props.supportDocs.trim() &&
           !this.props.complianceGuidelines.trim() &&
           this.props.faqs.length === 0 &&
           this.props.websiteSources.length === 0;
  }

  toPlainObject(): KnowledgeBaseProps {
    return { ...this.props };
  }
} 