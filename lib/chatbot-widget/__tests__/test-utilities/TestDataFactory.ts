/**
 * Test Data Factory
 * 
 * AI INSTRUCTIONS:
 * - Create consistent test data for domain entities and value objects
 * - Follow @golden-rule patterns with builder pattern for flexibility
 * - Support both minimal and complete entity creation
 * - Enable easy customization for specific test scenarios
 * - Maintain type safety and domain model compliance
 */

import { 
  WebsiteSource, 
  WebsiteCrawlSettings, 
  KnowledgeBase, 
  FAQ 
} from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';

export class TestDataFactory {
  
  /** Website Source Factory */
  static createWebsiteSource(overrides: Partial<WebsiteSource> = {}): WebsiteSource {
    return {
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: 'https://example.com',
      name: 'Example Website',
      description: 'Test website source',
      isActive: true,
      status: 'pending',
      pageCount: 0,
      crawlSettings: this.createWebsiteCrawlSettings(),
      ...overrides
    };
  }

  /** Website Source with Completed Status */
  static createCompletedWebsiteSource(overrides: Partial<WebsiteSource> = {}): WebsiteSource {
    return this.createWebsiteSource({
      status: 'completed',
      pageCount: 5,
      lastCrawled: new Date(),
      ...overrides
    });
  }

  /** Website Source with Error Status */
  static createErrorWebsiteSource(overrides: Partial<WebsiteSource> = {}): WebsiteSource {
    return this.createWebsiteSource({
      status: 'error',
      errorMessage: 'Website not accessible',
      ...overrides
    });
  }

  /** Website Crawl Settings Factory */
  static createWebsiteCrawlSettings(overrides: Partial<WebsiteCrawlSettings> = {}): WebsiteCrawlSettings {
    return {
      maxPages: 50,
      maxDepth: 3,
      includePatterns: [],
      excludePatterns: ['/admin/*', '/login'],
      respectRobotsTxt: true,
      crawlFrequency: 'manual',
      includeImages: false,
      includePDFs: true,
      ...overrides
    };
  }

  /** Knowledge Base Factory */
  static createKnowledgeBase(overrides: Partial<{
    companyInfo: string;
    productCatalog: string;
    faqs: FAQ[];
    supportDocs: string;
    complianceGuidelines: string;
    websiteSources: WebsiteSource[];
  }> = {}): KnowledgeBase {
    return KnowledgeBase.create({
      companyInfo: 'Test company information',
      productCatalog: 'Test product catalog',
      faqs: [this.createFAQ()],
      supportDocs: 'Test support documentation',
      complianceGuidelines: 'Test compliance guidelines',
      websiteSources: [this.createWebsiteSource()],
      ...overrides
    });
  }

  /** FAQ Factory */
  static createFAQ(overrides: Partial<FAQ> = {}): FAQ {
    return {
      id: `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: 'What is your return policy?',
      answer: 'We offer 30-day returns on all items.',
      category: 'general',
      isActive: true,
      ...overrides
    };
  }

  /** Knowledge Item Factory */
  static createKnowledgeItem(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
    return {
      id: `ki_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test Knowledge Item',
      content: 'This is test content for knowledge retrieval.',
      category: 'general',
      tags: ['test', 'knowledge'],
      relevanceScore: 0.85,
      source: 'https://example.com/page',
      lastUpdated: new Date(),
      ...overrides
    };
  }

  /** Knowledge Item with Vector Data */
  static createKnowledgeItemWithVector(
    overrides: Partial<KnowledgeItem & { embedding: number[] }> = {}
  ): KnowledgeItem & { embedding: number[] } {
    return {
      ...this.createKnowledgeItem(),
      embedding: this.createMockEmbedding(),
      ...overrides
    };
  }

  /** Mock Embedding Vector (1536 dimensions like OpenAI) */
  static createMockEmbedding(): number[] {
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }

  /** Crawled Page Data Factory */
  static createCrawledPageData(overrides: Partial<{
    url: string;
    title: string;
    content: string;
    depth: number;
    crawledAt: Date;
    status: 'success' | 'failed' | 'skipped';
    errorMessage?: string;
    responseTime?: number;
    statusCode?: number;
  }> = {}) {
    return {
      url: 'https://example.com/page1',
      title: 'Example Page',
      content: 'This is example page content for testing.',
      depth: 1,
      crawledAt: new Date(),
      status: 'success' as const,
      responseTime: 250,
      statusCode: 200,
      ...overrides
    };
  }

  /** Batch of Crawled Pages */
  static createCrawledPagesBatch(count: number = 3): Array<ReturnType<typeof TestDataFactory.createCrawledPageData>> {
    return Array.from({ length: count }, (_, index) => 
      this.createCrawledPageData({
        url: `https://example.com/page${index + 1}`,
        title: `Example Page ${index + 1}`,
        content: `This is content for page ${index + 1}.`,
        depth: Math.floor(index / 2) + 1
      })
    );
  }

  /** Duplicate Content Scenarios */
  static createDuplicateContentScenario(): {
    canonical: KnowledgeItem;
    duplicates: KnowledgeItem[];
  } {
    const canonicalContent = 'This is the original content that appears on multiple pages.';
    
    return {
      canonical: this.createKnowledgeItem({
        source: 'https://example.com/original',
        content: canonicalContent,
        title: 'Original Page'
      }),
      duplicates: [
        this.createKnowledgeItem({
          source: 'https://example.com/duplicate1',
          content: canonicalContent,
          title: 'Duplicate Page 1'
        }),
        this.createKnowledgeItem({
          source: 'https://example.com/duplicate2',
          content: canonicalContent + ' With slight variation.',
          title: 'Near Duplicate Page'
        })
      ]
    };
  }

  /** URL Normalization Test Cases */
  static createUrlNormalizationTestCases(): Array<{
    input: string;
    expected: string;
    description: string;
  }> {
    return [
      {
        input: 'https://example.com/#section',
        expected: 'https://example.com',
        description: 'Remove hash fragment'
      },
      {
        input: 'https://www.example.com/',
        expected: 'https://example.com',
        description: 'Remove www prefix'
      },
      {
        input: 'https://example.com/path/../other',
        expected: 'https://example.com/other',
        description: 'Resolve dot segments'
      },
      {
        input: 'https://example.com/path?b=2&a=1',
        expected: 'https://example.com/path?a=1&b=2',
        description: 'Sort query parameters'
      },
      {
        input: 'https://example.com/PATH',
        expected: 'https://example.com/PATH',
        description: 'Preserve case in path'
      }
    ];
  }

  /** Content Similarity Test Cases */
  static createContentSimilarityTestCases(): Array<{
    content1: string;
    content2: string;
    expectedSimilarity: 'high' | 'medium' | 'low';
    description: string;
  }> {
    return [
      {
        content1: 'The quick brown fox jumps over the lazy dog.',
        content2: 'The quick brown fox jumps over the lazy dog.',
        expectedSimilarity: 'high',
        description: 'Identical content'
      },
      {
        content1: 'The quick brown fox jumps over the lazy dog.',
        content2: 'A quick brown fox leaps over the lazy dog.',
        expectedSimilarity: 'high',
        description: 'Very similar content with minor word changes'
      },
      {
        content1: 'The quick brown fox jumps over the lazy dog.',
        content2: 'The slow red cat walks under the energetic bird.',
        expectedSimilarity: 'low',
        description: 'Completely different content'
      }
    ];
  }

  /** Error Scenarios Factory */
  static createErrorScenarios() {
    return {
      networkError: new Error('Network request failed'),
      timeoutError: new Error('Request timeout'),
      accessDeniedError: new Error('Access denied (403)'),
      notFoundError: new Error('Page not found (404)'),
      serverError: new Error('Internal server error (500)')
    };
  }

  /** Mock Request/Response Objects */
  static createMockWebsiteCrawlRequest(overrides: Partial<{
    organizationId: string;
    chatbotConfigId: string;
    websiteSource: WebsiteSource;
  }> = {}) {
    return {
      organizationId: 'org_test_123',
      chatbotConfigId: 'config_test_456',
      websiteSource: this.createWebsiteSource(),
      ...overrides
    };
  }

  /** Performance Test Data */
  static createPerformanceTestData(pageCount: number = 100): {
    websiteSource: WebsiteSource;
    expectedPages: Array<ReturnType<typeof TestDataFactory.createCrawledPageData>>;
  } {
    return {
      websiteSource: this.createWebsiteSource({
        crawlSettings: this.createWebsiteCrawlSettings({
          maxPages: pageCount,
          maxDepth: 5
        })
      }),
      expectedPages: Array.from({ length: pageCount }, (_, index) => 
        this.createCrawledPageData({
          url: `https://example.com/page${index}`,
          title: `Performance Test Page ${index}`,
          content: `Performance test content for page ${index}. `.repeat(10),
          depth: Math.floor(index / 20) + 1
        })
      )
    };
  }
} 