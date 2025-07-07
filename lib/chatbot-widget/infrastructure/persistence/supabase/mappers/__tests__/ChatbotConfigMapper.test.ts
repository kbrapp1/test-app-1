/**
 * ChatbotConfig Mapper Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test data transformation between database and domain models
 * - Ensure status field consistency (no crawlStatus field)
 * - Test edge cases and validation scenarios
 * - Follow @golden-rule testing patterns
 * - Verify proper domain model compliance
 */

import { ChatbotConfigMapper, RawChatbotConfigDbRecord } from '../ChatbotConfigMapper';
import { TestDataFactory } from '../../../../../__tests__/test-utilities/TestDataFactory';
import { ChatbotConfig } from '../../../../../domain/entities/ChatbotConfig';

describe('ChatbotConfigMapper', () => {
  describe('toDomain', () => {
    describe('Website Sources Status Field Fix', () => {
      it('should map website sources with correct status field (no crawlStatus)', () => {
        const dbRecord: RawChatbotConfigDbRecord = {
          id: 'config-123',
          organization_id: 'org-123',
          name: 'Test Config',
          avatar_url: null,
          description: null,
          personality_settings: {},
          knowledge_base: {
            websiteSources: [
              {
                id: 'ws-1',
                url: 'https://example.com',
                name: 'Example Site',
                description: 'Test website',
                isActive: true,
                status: 'completed',
                pageCount: 5,
                lastCrawled: '2024-01-01T00:00:00.000Z',
                crawlSettings: {
                  maxPages: 50,
                  maxDepth: 3,
                  includePatterns: [],
                  excludePatterns: ['/admin/*'],
                  respectRobotsTxt: true,
                  crawlFrequency: 'manual',
                  includeImages: false,
                  includePDFs: true
                }
              }
            ]
          },
          operating_hours: { timezone: 'UTC' },
          lead_qualification_questions: [],
          ai_configuration: {},
          is_active: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        };

        const domainConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);
        const websiteSource = domainConfig.knowledgeBase.websiteSources[0];

        expect(websiteSource.status).toBe('completed');
        expect(websiteSource.pageCount).toBe(5);
        expect(websiteSource.lastCrawled).toEqual(new Date('2024-01-01T00:00:00.000Z'));
        
        // Critical: Ensure no crawlStatus field exists
        expect((websiteSource as any).crawlStatus).toBeUndefined();
      });

      it('should handle all valid status values', () => {
        const statusValues: Array<'pending' | 'crawling' | 'completed' | 'error'> = 
          ['pending', 'crawling', 'completed', 'error'];

        statusValues.forEach(status => {
          const dbRecord: RawChatbotConfigDbRecord = {
            id: 'config-123',
            organization_id: 'org-123',
            name: 'Test Config',
            avatar_url: null,
            description: null,
            personality_settings: {},
            knowledge_base: {
              websiteSources: [
                {
                  id: 'ws-1',
                  url: 'https://example.com',
                  name: 'Example Site',
                  isActive: true,
                  status,
                  crawlSettings: { maxPages: 50, maxDepth: 3 }
                }
              ]
            },
            operating_hours: { timezone: 'UTC' },
            lead_qualification_questions: [],
            ai_configuration: {},
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          };

          const domainConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);
          expect(domainConfig.knowledgeBase.websiteSources[0].status).toBe(status);
        });
      });

      it('should default to pending status when missing', () => {
        const dbRecord: RawChatbotConfigDbRecord = {
          id: 'config-123',
          organization_id: 'org-123',
          name: 'Test Config',
          avatar_url: null,
          description: null,
          personality_settings: {},
          knowledge_base: {
            websiteSources: [
              {
                id: 'ws-1',
                url: 'https://example.com',
                name: 'Example Site',
                isActive: true,
                crawlSettings: { maxPages: 50, maxDepth: 3 }
                // No status field
              }
            ]
          },
          operating_hours: { timezone: 'UTC' },
          lead_qualification_questions: [],
          ai_configuration: {},
          is_active: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        };

        const domainConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);
        const websiteSource = domainConfig.knowledgeBase.websiteSources[0];

        expect(websiteSource.status).toBe('pending');
        expect(websiteSource.pageCount).toBe(0);
        expect(websiteSource.lastCrawled).toBeUndefined();
      });

      it('should handle error status with error message', () => {
        const dbRecord: RawChatbotConfigDbRecord = {
          id: 'config-123',
          organization_id: 'org-123',
          name: 'Test Config',
          avatar_url: null,
          description: null,
          personality_settings: {},
          knowledge_base: {
            websiteSources: [
              {
                id: 'ws-1',
                url: 'https://example.com',
                name: 'Example Site',
                isActive: true,
                status: 'error',
                errorMessage: 'Website not accessible',
                crawlSettings: { maxPages: 50, maxDepth: 3 }
              }
            ]
          },
          operating_hours: { timezone: 'UTC' },
          lead_qualification_questions: [],
          ai_configuration: {},
          is_active: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        };

        const domainConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);
        const websiteSource = domainConfig.knowledgeBase.websiteSources[0];

        expect(websiteSource.status).toBe('error');
        expect(websiteSource.errorMessage).toBe('Website not accessible');
      });
    });

    describe('Crawl Settings Mapping', () => {
      it('should map all crawl settings correctly', () => {
        const dbRecord: RawChatbotConfigDbRecord = {
          id: 'config-123',
          organization_id: 'org-123',
          name: 'Test Config',
          avatar_url: null,
          description: null,
          personality_settings: {},
          knowledge_base: {
            websiteSources: [
              {
                id: 'ws-1',
                url: 'https://example.com',
                name: 'Example Site',
                isActive: true,
                status: 'pending',
                crawlSettings: {
                  maxPages: 100,
                  maxDepth: 5,
                  includePatterns: ['/blog/*', '/docs/*'],
                  excludePatterns: ['/admin/*', '/private/*'],
                  respectRobotsTxt: false,
                  crawlFrequency: 'weekly',
                  includeImages: true,
                  includePDFs: false
                }
              }
            ]
          },
          operating_hours: { timezone: 'UTC' },
          lead_qualification_questions: [],
          ai_configuration: {},
          is_active: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        };

        const domainConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);
        const crawlSettings = domainConfig.knowledgeBase.websiteSources[0].crawlSettings;

        expect(crawlSettings.maxPages).toBe(100);
        expect(crawlSettings.maxDepth).toBe(5);
        expect(crawlSettings.includePatterns).toEqual(['/blog/*', '/docs/*']);
        expect(crawlSettings.excludePatterns).toEqual(['/admin/*', '/private/*']);
        expect(crawlSettings.respectRobotsTxt).toBe(false);
        expect(crawlSettings.crawlFrequency).toBe('weekly');
        expect(crawlSettings.includeImages).toBe(true);
        expect(crawlSettings.includePDFs).toBe(false);
      });

      it('should apply default crawl settings when missing', () => {
        const dbRecord: RawChatbotConfigDbRecord = {
          id: 'config-123',
          organization_id: 'org-123',
          name: 'Test Config',
          avatar_url: null,
          description: null,
          personality_settings: {},
          knowledge_base: {
            websiteSources: [
              {
                id: 'ws-1',
                url: 'https://example.com',
                name: 'Example Site',
                isActive: true,
                status: 'pending'
                // No crawlSettings
              }
            ]
          },
          operating_hours: { timezone: 'UTC' },
          lead_qualification_questions: [],
          ai_configuration: {},
          is_active: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        };

        const domainConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);
        const crawlSettings = domainConfig.knowledgeBase.websiteSources[0].crawlSettings;

        expect(crawlSettings.maxPages).toBe(50);
        expect(crawlSettings.maxDepth).toBe(3);
        expect(crawlSettings.includePatterns).toEqual([]);
        expect(crawlSettings.excludePatterns).toEqual([]);
        expect(crawlSettings.respectRobotsTxt).toBe(true);
        expect(crawlSettings.crawlFrequency).toBe('manual');
        expect(crawlSettings.includeImages).toBe(false);
        expect(crawlSettings.includePDFs).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty knowledge base gracefully', () => {
        const dbRecord: RawChatbotConfigDbRecord = {
          id: 'config-123',
          organization_id: 'org-123',
          name: 'Test Config',
          avatar_url: null,
          description: null,
          personality_settings: {},
          knowledge_base: {},
          operating_hours: { timezone: 'UTC' },
          lead_qualification_questions: [],
          ai_configuration: {},
          is_active: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        };

        const domainConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);
        
        expect(domainConfig.knowledgeBase.websiteSources).toEqual([]);
        expect(domainConfig.knowledgeBase.faqs).toEqual([]);
        expect(domainConfig.knowledgeBase.companyInfo).toBe('');
      });

      it('should generate unique IDs for website sources when missing', () => {
        const dbRecord: RawChatbotConfigDbRecord = {
          id: 'config-123',
          organization_id: 'org-123',
          name: 'Test Config',
          avatar_url: null,
          description: null,
          personality_settings: {},
          knowledge_base: {
            websiteSources: [
              { url: 'https://example1.com', name: 'Site 1' },
              { url: 'https://example2.com', name: 'Site 2' }
            ]
          },
          operating_hours: { timezone: 'UTC' },
          lead_qualification_questions: [],
          ai_configuration: {},
          is_active: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        };

        const domainConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);
        const sources = domainConfig.knowledgeBase.websiteSources;
        
        expect(sources[0].id).toBeTruthy();
        expect(sources[1].id).toBeTruthy();
        expect(sources[0].id).not.toBe(sources[1].id);
      });
    });
  });

  describe('toInsert', () => {
    it('should convert domain config to insert format correctly', () => {
      // Create a domain config using test factory
      const websiteSource = TestDataFactory.createCompletedWebsiteSource({
        status: 'completed',
        pageCount: 5
      });

      const knowledgeBase = TestDataFactory.createKnowledgeBase({
        websiteSources: [websiteSource]
      });

      // Mock a ChatbotConfig (simplified for testing)
      const domainConfig = {
        id: 'config-123',
        organizationId: 'org-123',
        name: 'Test Config',
        avatarUrl: undefined,
        description: undefined,
        personalitySettings: { toPlainObject: () => ({}) },
        knowledgeBase: { toPlainObject: () => ({ websiteSources: [websiteSource] }) },
        operatingHours: { toPlainObject: () => ({}) },
        leadQualificationQuestions: [],
        aiConfiguration: { toPlainObject: () => ({}) },
        isActive: true
      } as any;

      const insertData = ChatbotConfigMapper.toInsert(domainConfig);

      expect(insertData.id).toBe('config-123');
      expect(insertData.organization_id).toBe('org-123');
      expect(insertData.name).toBe('Test Config');
      expect(insertData.is_active).toBe(true);
      expect(insertData.knowledge_base).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain status field consistency in round-trip conversion', () => {
      const originalDbRecord: RawChatbotConfigDbRecord = {
        id: 'config-123',
        organization_id: 'org-123',
        name: 'Test Config',
        avatar_url: null,
        description: null,
        personality_settings: {},
        knowledge_base: {
          websiteSources: [
            {
              id: 'ws-1',
              url: 'https://example.com',
              name: 'Example Site',
              status: 'completed',
              pageCount: 5,
              lastCrawled: '2024-01-01T00:00:00.000Z',
              crawlSettings: {
                maxPages: 50,
                maxDepth: 3,
                includePatterns: [],
                excludePatterns: [],
                respectRobotsTxt: true,
                crawlFrequency: 'manual',
                includeImages: false,
                includePDFs: true
              }
            }
          ]
        },
        operating_hours: { timezone: 'UTC' },
        lead_qualification_questions: [],
        ai_configuration: {},
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      // Convert to domain
      const domainConfig = ChatbotConfigMapper.toDomainEntity(originalDbRecord);
      
      // Verify domain model has correct status
      const websiteSource = domainConfig.knowledgeBase.websiteSources[0];
      expect(websiteSource.status).toBe('completed');
      expect(websiteSource.pageCount).toBe(5);
      expect((websiteSource as any).crawlStatus).toBeUndefined();

      // Convert back to insert format
      const insertData = ChatbotConfigMapper.toInsert(domainConfig);
      
      // Verify insert data maintains integrity
      expect(insertData.id).toBe(originalDbRecord.id);
      expect(insertData.organization_id).toBe(originalDbRecord.organization_id);
      expect(insertData.knowledge_base).toBeDefined();
    });
  });
}); 