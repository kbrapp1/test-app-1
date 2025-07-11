import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

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
  status: 'pending' | 'crawling' | 'completed' | 'error';
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
    if (!Array.isArray(props.faqs)) {
      throw new Error('FAQs must be an array');
    }
    
    // Validate FAQ structure
    props.faqs.forEach((faq, index) => {
      if (!faq.id?.trim()) {
        throw new Error(`FAQ at index ${index} must have an ID`);
      }
      if (!faq.question?.trim()) {
        throw new Error(`FAQ at index ${index} must have a question`);
      }
      if (!faq.answer?.trim()) {
        throw new Error(`FAQ at index ${index} must have an answer`);
      }
      if (!faq.category?.trim()) {
        throw new Error(`FAQ at index ${index} must have a category`);
      }
    });
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
    // Check for duplicate ID
    if (this.props.faqs.some(existing => existing.id === faq.id)) {
      throw new BusinessRuleViolationError(
        'FAQ with duplicate ID cannot be added',
        { faqId: faq.id, existingFAQs: this.props.faqs.length }
      );
    }

    return new KnowledgeBase({
      ...this.props,
      faqs: [...this.props.faqs, faq],
    });
  }

  updateFAQ(faqId: string, updates: Partial<Omit<FAQ, 'id'>>): KnowledgeBase {
    const faqIndex = this.props.faqs.findIndex(faq => faq.id === faqId);
    if (faqIndex === -1) {
      throw new BusinessRuleViolationError(
        'FAQ not found for update',
        { faqId, availableFAQs: this.props.faqs.map(f => f.id) }
      );
    }

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
    return this.props.faqs.filter(faq => faq.category === category && faq.isActive);
  }

  searchFAQs(query: string): FAQ[] {
    // NOTE: This is a simple fallback for basic filtering
    // For semantic search, use KnowledgeRetrievalService instead
    const lowerQuery = query.toLowerCase();
    return this.props.faqs.filter(faq => 
      faq.isActive && (
        faq.question.toLowerCase().includes(lowerQuery) ||
        faq.answer.toLowerCase().includes(lowerQuery) ||
        faq.category.toLowerCase().includes(lowerQuery)
      )
    );
  }

  getCategories(): string[] {
    const categories = new Set(this.props.faqs.map(faq => faq.category));
    return Array.from(categories).sort();
  }

  // Website source management methods
  addWebsiteSource(websiteSource: WebsiteSource): KnowledgeBase {
    // Check for duplicate URL
    if (this.props.websiteSources.some(existing => existing.url === websiteSource.url)) {
      throw new BusinessRuleViolationError(
        'Website source with duplicate URL cannot be added',
        { 
          url: websiteSource.url, 
          existingSources: this.props.websiteSources.length,
          existingUrls: this.props.websiteSources.map(s => s.url)
        }
      );
    }

    return new KnowledgeBase({
      ...this.props,
      websiteSources: [...this.props.websiteSources, websiteSource],
    });
  }

  updateWebsiteSource(sourceId: string, updates: Partial<Omit<WebsiteSource, 'id'>>): KnowledgeBase {
    const sourceIndex = this.props.websiteSources.findIndex(source => source.id === sourceId);
    if (sourceIndex === -1) {
      throw new BusinessRuleViolationError(
        'Website source not found for update',
        { 
          sourceId, 
          availableSources: this.props.websiteSources.map(s => ({ id: s.id, url: s.url }))
        }
      );
    }

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
      maxPages: 50,
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