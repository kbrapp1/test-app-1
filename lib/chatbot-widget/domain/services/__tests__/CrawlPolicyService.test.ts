/**
 * CrawlPolicyService Tests
 * 
 * AI INSTRUCTIONS:
 * - Test URL evaluation logic and policy decisions
 * - Test same-domain checking edge cases
 * - Test content value assessment rules
 * - Test priority calculation algorithms
 * - Test business rule enforcement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CrawlPolicyService } from '../CrawlPolicyService';
import { WebsiteCrawlSettings } from '../../value-objects/ai-configuration/KnowledgeBase';

describe('CrawlPolicyService', () => {
  let service: CrawlPolicyService;
  let mockCrawlSettings: WebsiteCrawlSettings;

  beforeEach(() => {
    service = new CrawlPolicyService();
    mockCrawlSettings = {
      maxPages: 50,
      maxDepth: 3,
      includePatterns: [],
      excludePatterns: [],
      respectRobotsTxt: true,
      crawlFrequency: 'weekly' as const,
      includeImages: false,
      includePDFs: true
    };
  });

  describe('isSameDomain', () => {
    it('should return true for exact domain matches', () => {
      expect(service.isSameDomain('https://example.com', 'https://example.com')).toBe(true);
      expect(service.isSameDomain('https://example.com/page', 'https://example.com')).toBe(true);
      expect(service.isSameDomain('http://example.com', 'http://example.com')).toBe(true);
    });

    it('should return false for different domains', () => {
      expect(service.isSameDomain('https://different.com', 'https://example.com')).toBe(false);
      expect(service.isSameDomain('https://malicious.com', 'https://example.com')).toBe(false);
    });

    it('should handle protocol differences correctly', () => {
      expect(service.isSameDomain('https://example.com', 'http://example.com')).toBe(true);
      expect(service.isSameDomain('http://example.com', 'https://example.com')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(service.isSameDomain('https://EXAMPLE.COM', 'https://example.com')).toBe(true);
      expect(service.isSameDomain('https://Example.Com', 'https://example.com')).toBe(true);
    });

    it('should handle www prefixes correctly', () => {
      expect(service.isSameDomain('https://www.example.com', 'https://example.com')).toBe(false);
      expect(service.isSameDomain('https://example.com', 'https://www.example.com')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(service.isSameDomain('invalid-url', 'https://example.com')).toBe(false);
      expect(service.isSameDomain('https://example.com', 'invalid-url')).toBe(false);
    });

    it('should handle ports correctly', () => {
      expect(service.isSameDomain('https://example.com:8080', 'https://example.com')).toBe(true);
      expect(service.isSameDomain('https://example.com', 'https://example.com:8080')).toBe(true);
    });
  });

  describe('isValuableContent', () => {
    it('should accept valuable content URLs', () => {
      expect(service.isValuableContent('https://example.com/about')).toBe(true);
      expect(service.isValuableContent('https://example.com/services')).toBe(true);
      expect(service.isValuableContent('https://example.com/blog/article')).toBe(true);
      expect(service.isValuableContent('https://example.com/help')).toBe(true);
    });

    it('should reject image file URLs', () => {
      expect(service.isValuableContent('https://example.com/image.jpg')).toBe(false);
      expect(service.isValuableContent('https://example.com/photo.PNG')).toBe(false);
      expect(service.isValuableContent('https://example.com/icon.svg')).toBe(false);
    });

    it('should reject document file URLs', () => {
      expect(service.isValuableContent('https://example.com/document.pdf')).toBe(false);
      expect(service.isValuableContent('https://example.com/sheet.xlsx')).toBe(false);
      expect(service.isValuableContent('https://example.com/presentation.pptx')).toBe(false);
    });

    it('should reject archive file URLs', () => {
      expect(service.isValuableContent('https://example.com/archive.zip')).toBe(false);
      expect(service.isValuableContent('https://example.com/backup.tar.gz')).toBe(false);
    });

    it('should reject media file URLs', () => {
      expect(service.isValuableContent('https://example.com/video.mp4')).toBe(false);
      expect(service.isValuableContent('https://example.com/audio.mp3')).toBe(false);
    });

    it('should reject technical file URLs', () => {
      expect(service.isValuableContent('https://example.com/styles.css')).toBe(false);
      expect(service.isValuableContent('https://example.com/script.js')).toBe(false);
      expect(service.isValuableContent('https://example.com/data.json')).toBe(false);
    });

    it('should reject administrative paths', () => {
      expect(service.isValuableContent('https://example.com/admin')).toBe(false);
      expect(service.isValuableContent('https://example.com/login')).toBe(false);
      expect(service.isValuableContent('https://example.com/wp-admin')).toBe(false);
      expect(service.isValuableContent('https://example.com/api/endpoint')).toBe(false);
    });

    it('should reject user-specific paths', () => {
      expect(service.isValuableContent('https://example.com/user/profile')).toBe(false);
      expect(service.isValuableContent('https://example.com/account/settings')).toBe(false);
      expect(service.isValuableContent('https://example.com/cart')).toBe(false);
    });

    it('should reject URLs with tracking parameters', () => {
      expect(service.isValuableContent('https://example.com/page?utm_source=google')).toBe(false);
      expect(service.isValuableContent('https://example.com/page?utm_campaign=test')).toBe(false);
    });

    it('should reject URLs with fragments', () => {
      expect(service.isValuableContent('https://example.com/page#section')).toBe(false);
    });

    it('should reject very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      expect(service.isValuableContent(longUrl)).toBe(false);
    });
  });

  describe('calculateUrlPriority', () => {
    it('should assign high priority to root pages', () => {
      expect(service.calculateUrlPriority('https://example.com', 0)).toBe('high');
      expect(service.calculateUrlPriority('https://example.com/anything', 0)).toBe('high');
    });

    it('should assign high priority to valuable content at shallow depth', () => {
      expect(service.calculateUrlPriority('https://example.com/about', 1)).toBe('high');
      expect(service.calculateUrlPriority('https://example.com/services', 1)).toBe('high');
      expect(service.calculateUrlPriority('https://example.com/blog', 1)).toBe('high');
    });

    it('should assign medium priority to valuable content at medium depth', () => {
      expect(service.calculateUrlPriority('https://example.com/about', 2)).toBe('medium');
      expect(service.calculateUrlPriority('https://example.com/services', 2)).toBe('medium');
    });

    it('should assign medium priority to navigation pages', () => {
      expect(service.calculateUrlPriority('https://example.com/category/tech', 1)).toBe('medium');
      expect(service.calculateUrlPriority('https://example.com/contact', 2)).toBe('medium');
    });

    it('should assign low priority to deep pages', () => {
      expect(service.calculateUrlPriority('https://example.com/deep/nested/page', 4)).toBe('low');
      expect(service.calculateUrlPriority('https://example.com/random/page', 3)).toBe('low');
    });

    it('should degrade priority with depth', () => {
      const url = 'https://example.com/about';
      expect(service.calculateUrlPriority(url, 0)).toBe('high');
      expect(service.calculateUrlPriority(url, 1)).toBe('high');
      expect(service.calculateUrlPriority(url, 2)).toBe('medium');
      expect(service.calculateUrlPriority(url, 3)).toBe('medium'); // High-value content stays medium at depth 3
    });
  });

  describe('estimateUrlValue', () => {
    it('should assign higher value to content pages', () => {
      const aboutValue = service.estimateUrlValue('https://example.com/about', 1);
      const randomValue = service.estimateUrlValue('https://example.com/random', 1);
      expect(aboutValue).toBeGreaterThan(randomValue);
    });

    it('should decrease value with depth', () => {
      const shallowValue = service.estimateUrlValue('https://example.com/about', 1);
      const deepValue = service.estimateUrlValue('https://example.com/about', 3);
      expect(shallowValue).toBeGreaterThan(deepValue);
    });

    it('should return values between 0.1 and 1.0', () => {
      const values = [
        service.estimateUrlValue('https://example.com/about', 0),
        service.estimateUrlValue('https://example.com/random', 5),
        service.estimateUrlValue('https://example.com/blog', 2)
      ];

      values.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0.1);
        expect(value).toBeLessThanOrEqual(1.0);
      });
    });

    it('should give bonus for clean URL structure', () => {
      const cleanValue = service.estimateUrlValue('https://example.com/about/team', 1);
      const messyValue = service.estimateUrlValue('https://example.com/page123/item456', 1);
      expect(cleanValue).toBeGreaterThan(messyValue);
    });

    it('should penalize very long URLs', () => {
      const shortUrl = 'https://example.com/short';
      const longUrl = 'https://example.com/' + 'very-long-url-path'.repeat(10);
      const shortValue = service.estimateUrlValue(shortUrl, 1);
      const longValue = service.estimateUrlValue(longUrl, 1);
      expect(shortValue).toBeGreaterThan(longValue);
    });
  });

  describe('evaluateUrl', () => {
    const baseUrl = 'https://example.com';

    it('should return comprehensive evaluation for valid URLs', () => {
      const evaluation = service.evaluateUrl(
        'https://example.com/about',
        baseUrl,
        1,
        mockCrawlSettings
      );

      expect(evaluation).toMatchObject({
        shouldCrawl: true,
        reason: 'Meets all crawling criteria',
        priority: expect.any(String),
        estimatedValue: expect.any(Number)
      });
    });

    it('should reject URLs exceeding depth limit', () => {
      const evaluation = service.evaluateUrl(
        'https://example.com/deep/page',
        baseUrl,
        3,
        mockCrawlSettings
      );

      expect(evaluation).toMatchObject({
        shouldCrawl: false,
        reason: 'Exceeds maximum depth limit (3)',
        priority: 'low',
        estimatedValue: 0
      });
    });

    it('should reject URLs from different domains', () => {
      const evaluation = service.evaluateUrl(
        'https://different.com/page',
        baseUrl,
        1,
        mockCrawlSettings
      );

      expect(evaluation).toMatchObject({
        shouldCrawl: false,
        reason: 'Outside target domain',
        priority: 'low',
        estimatedValue: 0
      });
    });

    it('should reject low-value content', () => {
      const evaluation = service.evaluateUrl(
        'https://example.com/image.jpg',
        baseUrl,
        1,
        mockCrawlSettings
      );

      expect(evaluation).toMatchObject({
        shouldCrawl: false,
        reason: 'Low-value content type or pattern',
        priority: 'low',
        estimatedValue: 0
      });
    });
  });

  describe('shouldCrawlUrl', () => {
    const baseUrl = 'https://example.com';

    it('should return true for valid URLs within constraints', () => {
      expect(service.shouldCrawlUrl(
        'https://example.com/about',
        baseUrl,
        1,
        mockCrawlSettings
      )).toBe(true);
    });

    it('should return false for URLs exceeding depth', () => {
      expect(service.shouldCrawlUrl(
        'https://example.com/deep/page',
        baseUrl,
        3,
        mockCrawlSettings
      )).toBe(false);
    });

    it('should return false for different domains', () => {
      expect(service.shouldCrawlUrl(
        'https://different.com/page',
        baseUrl,
        1,
        mockCrawlSettings
      )).toBe(false);
    });

    it('should return false for low-value content', () => {
      expect(service.shouldCrawlUrl(
        'https://example.com/image.jpg',
        baseUrl,
        1,
        mockCrawlSettings
      )).toBe(false);
    });
  });

  describe('getPriorityUrlPatterns', () => {
    it('should return list of priority URL patterns', () => {
      const patterns = service.getPriorityUrlPatterns();
      
      expect(patterns).toContain('/about');
      expect(patterns).toContain('/services');
      expect(patterns).toContain('/products');
      expect(patterns).toContain('/blog');
      expect(patterns).toContain('/help');
      expect(patterns).toContain('/faq');
      expect(patterns).toContain('/support');
      expect(patterns).toContain('/documentation');
    });

    it('should return non-empty array', () => {
      const patterns = service.getPriorityUrlPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });
  });
});