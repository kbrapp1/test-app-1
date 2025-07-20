/**
 * KnowledgeBaseMapper Tests
 * 
 * Critical infrastructure tests for complex JSONB knowledge base mapping
 * Tests nested object transformation, validation, and error handling
 */

import { describe, it, expect, vi } from 'vitest';
import { KnowledgeBaseMapper } from '../KnowledgeBaseMapper';
import { KnowledgeBase } from '../../../../../domain/value-objects/ai-configuration/KnowledgeBase';

// Mock crypto.randomUUID for consistent testing
const mockUUID = '12345678-1234-5678-9012-123456789012';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID)
});

describe('KnowledgeBaseMapper', () => {
  describe('fromJsonb', () => {
    it('should map complete JSONB data to KnowledgeBase correctly', () => {
      const jsonbData = {
        companyInfo: 'Enterprise Solutions Inc. - Leading provider of AI-powered business automation',
        productCatalog: 'CRM Suite, Analytics Platform, Integration Hub',
        faqs: [
          {
            id: 'faq-1',
            question: 'What is your pricing model?',
            answer: 'We offer flexible pricing tiers based on usage and features.',
            category: 'pricing',
            isActive: true
          },
          {
            id: 'faq-2',
            question: 'Do you offer enterprise support?',
            answer: 'Yes, we provide 24/7 dedicated support for enterprise customers.',
            category: 'support',
            isActive: true
          }
        ],
        supportDocs: 'User manual, API documentation, troubleshooting guides',
        complianceGuidelines: 'SOC 2 Type II, ISO 27001, GDPR compliant',
        websiteSources: [
          {
            id: 'source-1',
            url: 'https://example.com',
            name: 'Main Website',
            description: 'Company main website with product information',
            isActive: true,
            crawlSettings: {
              maxPages: 50,
              maxDepth: 3,
              includePatterns: ['/products/*', '/docs/*'],
              excludePatterns: ['/admin/*', '/private/*'],
              respectRobotsTxt: true,
              crawlFrequency: 'weekly',
              includeImages: false,
              includePDFs: true
            },
            lastCrawled: '2023-12-01T10:00:00.000Z',
            status: 'completed',
            pageCount: 42,
            errorMessage: undefined
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(jsonbData);

      expect(knowledgeBase.companyInfo).toBe('Enterprise Solutions Inc. - Leading provider of AI-powered business automation');
      expect(knowledgeBase.productCatalog).toBe('CRM Suite, Analytics Platform, Integration Hub');
      expect(knowledgeBase.faqs).toHaveLength(2);
      expect(knowledgeBase.faqs[0].question).toBe('What is your pricing model?');
      expect(knowledgeBase.websiteSources).toHaveLength(1);
      expect(knowledgeBase.websiteSources[0].url).toBe('https://example.com');
    });

    it('should handle null/undefined JSONB data gracefully', () => {
      const nullKnowledgeBase = KnowledgeBaseMapper.fromJsonb(null);
      const undefinedKnowledgeBase = KnowledgeBaseMapper.fromJsonb(undefined);

      // Both should return empty knowledge base
      expect(nullKnowledgeBase.isEmpty()).toBe(true);
      expect(undefinedKnowledgeBase.isEmpty()).toBe(true);
      
      expect(nullKnowledgeBase.faqs).toEqual([]);
      expect(undefinedKnowledgeBase.websiteSources).toEqual([]);
    });

    it('should handle empty object JSONB data', () => {
      const knowledgeBase = KnowledgeBaseMapper.fromJsonb({});

      expect(knowledgeBase.companyInfo).toBe('');
      expect(knowledgeBase.productCatalog).toBe('');
      expect(knowledgeBase.faqs).toEqual([]);
      expect(knowledgeBase.supportDocs).toBe('');
      expect(knowledgeBase.complianceGuidelines).toBe('');
      expect(knowledgeBase.websiteSources).toEqual([]);
    });

    it('should map partial JSONB data with defaults', () => {
      const partialData = {
        companyInfo: 'Partial Company Info',
        faqs: [
          {
            question: 'Question without ID',
            answer: 'Answer'
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(partialData);

      expect(knowledgeBase.companyInfo).toBe('Partial Company Info');
      expect(knowledgeBase.productCatalog).toBe(''); // Default
      expect(knowledgeBase.faqs).toHaveLength(1);
      expect(knowledgeBase.faqs[0].id).toMatch(/^[a-f0-9-]+-\d+$/); // Generated UUID with counter
      expect(knowledgeBase.faqs[0].category).toBe('general'); // Default
      expect(knowledgeBase.faqs[0].isActive).toBe(true); // Default
    });

    it('should handle FAQ array mapping correctly', () => {
      const dataWithFaqs = {
        faqs: [
          {
            id: 'faq-1',
            question: 'Complete FAQ',
            answer: 'Complete answer',
            category: 'billing',
            isActive: true
          },
          {
            // Missing id
            question: 'Incomplete FAQ',
            answer: 'Incomplete answer',
            isActive: false
          },
          {
            id: 'faq-3',
            question: 'FAQ with minimal data',
            answer: 'Minimal answer'
            // Missing category and isActive
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(dataWithFaqs);

      expect(knowledgeBase.faqs).toHaveLength(3);
      
      // Complete FAQ
      expect(knowledgeBase.faqs[0].id).toBe('faq-1');
      expect(knowledgeBase.faqs[0].category).toBe('billing');
      expect(knowledgeBase.faqs[0].isActive).toBe(true);
      
      // Incomplete FAQ with generated ID
      expect(knowledgeBase.faqs[1].id).toMatch(/^[a-f0-9-]+-\d+$/); // Generated UUID with counter
      expect(knowledgeBase.faqs[1].category).toBe('general'); // Default
      expect(knowledgeBase.faqs[1].isActive).toBe(false);
      
      // FAQ with defaults
      expect(knowledgeBase.faqs[2].id).toBe('faq-3');
      expect(knowledgeBase.faqs[2].category).toBe('general'); // Default
      expect(knowledgeBase.faqs[2].isActive).toBe(true); // Default true
    });

    it('should handle invalid FAQ array data gracefully', () => {
      const invalidFaqData = {
        faqs: 'not-an-array'
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(invalidFaqData);

      expect(knowledgeBase.faqs).toEqual([]);
    });

    it('should handle website sources array mapping correctly', () => {
      const dataWithSources = {
        websiteSources: [
          {
            id: 'source-1',
            url: 'https://complete-example.com',
            name: 'Complete Source',
            description: 'Complete website source',
            isActive: true,
            crawlSettings: {
              maxPages: 100,
              maxDepth: 4,
              includePatterns: ['/docs/*', '/help/*'],
              excludePatterns: ['/private/*'],
              respectRobotsTxt: true,
              crawlFrequency: 'daily',
              includeImages: true,
              includePDFs: false
            },
            lastCrawled: '2023-12-01T15:30:00.000Z',
            status: 'completed',
            pageCount: 85,
            errorMessage: null
          },
          {
            // Minimal source
            url: 'https://minimal-example.com',
            name: 'Minimal Source'
            // Missing many fields
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(dataWithSources);

      expect(knowledgeBase.websiteSources).toHaveLength(2);
      
      // Complete source
      const completeSource = knowledgeBase.websiteSources[0];
      expect(completeSource.id).toBe('source-1');
      expect(completeSource.url).toBe('https://complete-example.com');
      expect(completeSource.crawlSettings.maxPages).toBe(100);
      expect(completeSource.crawlSettings.crawlFrequency).toBe('daily');
      expect(completeSource.lastCrawled).toEqual(new Date('2023-12-01T15:30:00.000Z'));
      expect(completeSource.status).toBe('completed');
      expect(completeSource.pageCount).toBe(85);
      
      // Minimal source with defaults
      const minimalSource = knowledgeBase.websiteSources[1];
      expect(minimalSource.id).toMatch(/^[a-f0-9-]+-\d+$/); // Generated UUID with counter
      expect(minimalSource.url).toBe('https://minimal-example.com');
      expect(minimalSource.description).toBe(''); // Default
      expect(minimalSource.isActive).toBe(true); // Default
      expect(minimalSource.crawlSettings.maxPages).toBe(10); // Default
      expect(minimalSource.crawlSettings.crawlFrequency).toBe('weekly'); // Default
      expect(minimalSource.status).toBe('pending'); // Default
      expect(minimalSource.pageCount).toBe(0); // Default
    });

    it('should handle invalid website sources array data gracefully', () => {
      const invalidSourceData = {
        websiteSources: 'not-an-array'
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(invalidSourceData);

      expect(knowledgeBase.websiteSources).toEqual([]);
    });

    it('should handle crawl settings mapping with all defaults', () => {
      const dataWithEmptyCrawlSettings = {
        websiteSources: [
          {
            url: 'https://example.com',
            name: 'Test Source',
            crawlSettings: {} // Empty crawl settings
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(dataWithEmptyCrawlSettings);

      const crawlSettings = knowledgeBase.websiteSources[0].crawlSettings;
      expect(crawlSettings.maxPages).toBe(10);
      expect(crawlSettings.maxDepth).toBe(3);
      expect(crawlSettings.includePatterns).toEqual([]);
      expect(crawlSettings.excludePatterns).toEqual([]);
      expect(crawlSettings.respectRobotsTxt).toBe(true);
      expect(crawlSettings.crawlFrequency).toBe('weekly');
      expect(crawlSettings.includeImages).toBe(false);
      expect(crawlSettings.includePDFs).toBe(true);
    });

    it('should handle null crawl settings', () => {
      const dataWithNullCrawlSettings = {
        websiteSources: [
          {
            url: 'https://example.com',
            name: 'Test Source',
            crawlSettings: null
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(dataWithNullCrawlSettings);

      const crawlSettings = knowledgeBase.websiteSources[0].crawlSettings;
      expect(crawlSettings.maxPages).toBe(10);
      expect(crawlSettings.respectRobotsTxt).toBe(true);
      expect(crawlSettings.includePDFs).toBe(true);
    });

    it('should handle invalid date strings gracefully', () => {
      const dataWithInvalidDate = {
        websiteSources: [
          {
            url: 'https://example.com',
            name: 'Test Source',
            lastCrawled: 'invalid-date-string'
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(dataWithInvalidDate);

      // Should handle invalid date gracefully (Date constructor with invalid string returns Invalid Date)
      // In this case, the mapper should handle it appropriately
      expect(knowledgeBase.websiteSources[0].lastCrawled).toBeUndefined();
    });

    it('should handle crawl frequency variants correctly', () => {
      const frequencyVariants = ['manual', 'daily', 'weekly', 'monthly'] as const;

      frequencyVariants.forEach(frequency => {
        const data = {
          websiteSources: [
            {
              url: 'https://example.com',
              name: 'Test Source',
              crawlSettings: {
                crawlFrequency: frequency
              }
            }
          ]
        };

        const knowledgeBase = KnowledgeBaseMapper.fromJsonb(data);
        expect(knowledgeBase.websiteSources[0].crawlSettings.crawlFrequency).toBe(frequency);
      });
    });

    it('should handle invalid crawl frequency with fallback', () => {
      const dataWithInvalidFrequency = {
        websiteSources: [
          {
            url: 'https://example.com',
            name: 'Test Source',
            crawlSettings: {
              crawlFrequency: 'invalid-frequency'
            }
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(dataWithInvalidFrequency);

      expect(knowledgeBase.websiteSources[0].crawlSettings.crawlFrequency).toBe('weekly');
    });

    it('should handle status variants correctly', () => {
      const statusVariants = ['pending', 'crawling', 'vectorizing', 'completed', 'error'] as const;

      statusVariants.forEach(status => {
        const data = {
          websiteSources: [
            {
              url: 'https://example.com',
              name: 'Test Source',
              status: status
            }
          ]
        };

        const knowledgeBase = KnowledgeBaseMapper.fromJsonb(data);
        expect(knowledgeBase.websiteSources[0].status).toBe(status);
      });
    });

    it('should handle invalid status with fallback', () => {
      const dataWithInvalidStatus = {
        websiteSources: [
          {
            url: 'https://example.com',
            name: 'Test Source',
            status: 'invalid-status'
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(dataWithInvalidStatus);

      expect(knowledgeBase.websiteSources[0].status).toBe('pending');
    });
  });

  describe('toJsonb', () => {
    it('should convert KnowledgeBase to JSONB format correctly', () => {
      const knowledgeBase = KnowledgeBase.create({
        companyInfo: 'Test Company Information',
        productCatalog: 'Product A, Product B, Product C',
        faqs: [
          {
            id: 'faq-1',
            question: 'Test question',
            answer: 'Test answer',
            category: 'general',
            isActive: true
          }
        ],
        supportDocs: 'Test support documentation',
        complianceGuidelines: 'Test compliance guidelines',
        websiteSources: [
          {
            id: 'source-1',
            url: 'https://test.com',
            name: 'Test Website',
            description: 'Test description',
            isActive: true,
            crawlSettings: {
              maxPages: 25,
              maxDepth: 2,
              includePatterns: ['/test/*'],
              excludePatterns: ['/exclude/*'],
              respectRobotsTxt: true,
              crawlFrequency: 'monthly',
              includeImages: true,
              includePDFs: false
            },
            lastCrawled: new Date('2023-12-01T12:00:00.000Z'),
            status: 'completed',
            pageCount: 20,
            errorMessage: undefined
          }
        ]
      });

      const jsonbData = KnowledgeBaseMapper.toJsonb(knowledgeBase);

      expect(jsonbData).toEqual({
        companyInfo: 'Test Company Information',
        productCatalog: 'Product A, Product B, Product C',
        faqs: [
          {
            id: 'faq-1',
            question: 'Test question',
            answer: 'Test answer',
            category: 'general',
            isActive: true
          }
        ],
        supportDocs: 'Test support documentation',
        complianceGuidelines: 'Test compliance guidelines',
        websiteSources: [
          {
            id: 'source-1',
            url: 'https://test.com',
            name: 'Test Website',
            description: 'Test description',
            isActive: true,
            crawlSettings: {
              maxPages: 25,
              maxDepth: 2,
              includePatterns: ['/test/*'],
              excludePatterns: ['/exclude/*'],
              respectRobotsTxt: true,
              crawlFrequency: 'monthly',
              includeImages: true,
              includePDFs: false
            },
            lastCrawled: new Date('2023-12-01T12:00:00.000Z'),
            status: 'completed',
            pageCount: 20,
            errorMessage: undefined
          }
        ]
      });
    });

    it('should convert empty KnowledgeBase correctly', () => {
      const emptyKnowledgeBase = KnowledgeBase.createEmpty();
      const jsonbData = KnowledgeBaseMapper.toJsonb(emptyKnowledgeBase);

      expect(jsonbData).toEqual({
        companyInfo: '',
        productCatalog: '',
        faqs: [],
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: []
      });
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through fromJsonb -> toJsonb conversion', () => {
      const originalData = {
        companyInfo: 'Round-trip Test Company',
        productCatalog: 'Round-trip Products',
        faqs: [
          {
            id: 'rt-faq-1',
            question: 'Round-trip question',
            answer: 'Round-trip answer',
            category: 'testing',
            isActive: false
          }
        ],
        supportDocs: 'Round-trip support docs',
        complianceGuidelines: 'Round-trip compliance',
        websiteSources: [
          {
            id: 'rt-source-1',
            url: 'https://roundtrip.test',
            name: 'Round-trip Source',
            description: 'Round-trip description',
            isActive: false,
            crawlSettings: {
              maxPages: 75,
              maxDepth: 5,
              includePatterns: ['/api/*', '/docs/*'],
              excludePatterns: ['/private/*', '/admin/*'],
              respectRobotsTxt: false,
              crawlFrequency: 'daily',
              includeImages: true,
              includePDFs: false
            },
            lastCrawled: '2023-11-15T08:30:00.000Z',
            status: 'error',
            pageCount: 0,
            errorMessage: 'Round-trip error'
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(originalData);
      const reconvertedData = KnowledgeBaseMapper.toJsonb(knowledgeBase);

      // Verify structure preservation
      expect((reconvertedData as any).companyInfo).toBe('Round-trip Test Company');
      expect((reconvertedData as any).faqs).toHaveLength(1);
      expect((reconvertedData as any).faqs[0].isActive).toBe(false);
      expect((reconvertedData as any).websiteSources).toHaveLength(1);
      expect((reconvertedData as any).websiteSources[0].isActive).toBe(false);
      expect((reconvertedData as any).websiteSources[0].crawlSettings.respectRobotsTxt).toBe(false);
      expect((reconvertedData as any).websiteSources[0].status).toBe('error');
    });

    it('should handle complex nested data round-trip', () => {
      const complexData = {
        faqs: [
          { question: 'Q1', answer: 'A1', category: 'cat1', isActive: true },
          { question: 'Q2', answer: 'A2', category: 'cat2', isActive: false }
        ],
        websiteSources: [
          {
            url: 'https://site1.com',
            name: 'Site 1',
            crawlSettings: {
              maxPages: 10,
              includePatterns: ['/p1/*', '/p2/*'],
              excludePatterns: ['/e1/*'],
              crawlFrequency: 'manual'
            },
            status: 'crawling'
          },
          {
            url: 'https://site2.com',
            name: 'Site 2',
            crawlSettings: {
              maxPages: 100,
              includePatterns: [],
              excludePatterns: ['/admin/*', '/private/*'],
              crawlFrequency: 'weekly'
            },
            status: 'completed'
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(complexData);
      const reconverted = KnowledgeBaseMapper.toJsonb(knowledgeBase);
      const finalKnowledgeBase = KnowledgeBaseMapper.fromJsonb(reconverted);
      const finalData = KnowledgeBaseMapper.toJsonb(finalKnowledgeBase);

      // Should maintain consistency across multiple conversions
      expect((reconverted as any).faqs).toHaveLength(2);
      expect((reconverted as any).websiteSources).toHaveLength(2);
      expect(reconverted).toEqual(finalData);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JSONB data gracefully', () => {
      const malformedData = {
        companyInfo: 123, // Should be string
        faqs: 'not-an-array', // Should be array
        websiteSources: { url: 'wrong-structure' }, // Should be array
        nonExistentField: 'should-be-ignored'
      };

      expect(() => {
        KnowledgeBaseMapper.fromJsonb(malformedData);
      }).not.toThrow();

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(malformedData);
      
      expect(knowledgeBase.companyInfo).toBe(''); // Fallback for non-string
      expect(knowledgeBase.faqs).toEqual([]); // Fallback for non-array
      expect(knowledgeBase.websiteSources).toEqual([]); // Fallback for non-array
    });

    it('should handle deeply nested malformed data', () => {
      const deeplyMalformedData = {
        websiteSources: [
          {
            url: 'https://example.com',
            crawlSettings: {
              maxPages: 'not-a-number',
              includePatterns: 'not-an-array',
              respectRobotsTxt: 'not-a-boolean',
              crawlFrequency: 123 // Not a valid string
            },
            lastCrawled: 'invalid-date',
            status: null,
            pageCount: 'not-a-number'
          }
        ]
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(deeplyMalformedData);

      const source = knowledgeBase.websiteSources[0];
      expect(source.crawlSettings.maxPages).toBe(10); // Default fallback
      expect(source.crawlSettings.includePatterns).toEqual([]); // Default fallback
      expect(source.crawlSettings.respectRobotsTxt).toBe(true); // Default fallback
      expect(source.crawlSettings.crawlFrequency).toBe('weekly'); // Default fallback
      expect(source.status).toBe('pending'); // Default fallback
      expect(source.pageCount).toBe(0); // Default fallback
    });

    it('should handle very large data structures', () => {
      const largeFaqArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `faq-${i}`,
        question: `Question ${i}`,
        answer: `Answer ${i}`,
        category: `category-${i % 10}`,
        isActive: i % 2 === 0
      }));

      const largeSourceArray = Array.from({ length: 100 }, (_, i) => ({
        id: `source-${i}`,
        url: `https://example${i}.com`,
        name: `Source ${i}`,
        description: `Description ${i}`,
        isActive: true,
        crawlSettings: {
          maxPages: 10 + i,
          maxDepth: 3,
          includePatterns: [`/path${i}/*`],
          excludePatterns: [],
          respectRobotsTxt: true,
          crawlFrequency: 'weekly',
          includeImages: false,
          includePDFs: true
        },
        status: 'pending',
        pageCount: 0
      }));

      const largeData = {
        faqs: largeFaqArray,
        websiteSources: largeSourceArray
      };

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(largeData);

      expect(knowledgeBase.faqs).toHaveLength(1000);
      expect(knowledgeBase.websiteSources).toHaveLength(100);
      expect(knowledgeBase.faqs[999].question).toBe('Question 999');
      expect(knowledgeBase.websiteSources[99].url).toBe('https://example99.com');
    });

    it('should handle circular reference objects safely', () => {
      const circularData: any = {
        companyInfo: 'Circular test'
      };
      circularData.self = circularData;

      expect(() => {
        KnowledgeBaseMapper.fromJsonb(circularData);
      }).not.toThrow();

      const knowledgeBase = KnowledgeBaseMapper.fromJsonb(circularData);
      expect(knowledgeBase.companyInfo).toBe('Circular test');
    });
  });
});