/**
 * SitemapDiscoveryService Tests
 * 
 * Critical domain logic tests for sitemap URL discovery and validation
 * Tests sophisticated business rules for efficient sitemap finding
 */

import { describe, it, expect } from 'vitest';
import { 
  SitemapDiscoveryService, 
  SitemapDiscoveryConfig, 
  SitemapUrlCandidate, 
  SitemapDiscoveryMetrics 
} from '../SitemapDiscoveryService';

describe('SitemapDiscoveryService', () => {
  let service: SitemapDiscoveryService;

  beforeEach(() => {
    service = new SitemapDiscoveryService();
  });

  describe('generateSitemapCandidates', () => {
    it('should generate standard sitemap candidates with default priorities', () => {
      const config: SitemapDiscoveryConfig = {
        baseUrl: 'https://example.com'
      };

      const candidates = service.generateSitemapCandidates(config);

      expect(candidates).toHaveLength(4);
      expect(candidates[0]).toEqual({
        url: 'https://example.com/sitemap_index.xml',
        priority: 1,
        type: 'index'
      });
      expect(candidates[1]).toEqual({
        url: 'https://example.com/sitemap.xml',
        priority: 2,
        type: 'standard'
      });
      expect(candidates[2]).toEqual({
        url: 'https://example.com/sitemap.xml.gz',
        priority: 3,
        type: 'compressed'
      });
      expect(candidates[3]).toEqual({
        url: 'https://example.com/sitemaps/sitemap.xml',
        priority: 4,
        type: 'nested'
      });
    });

    it('should prioritize compressed sitemaps when flag is enabled', () => {
      const config: SitemapDiscoveryConfig = {
        baseUrl: 'https://example.com',
        prioritizeCompressedSitemaps: true
      };

      const candidates = service.generateSitemapCandidates(config);

      expect(candidates).toHaveLength(4);
      expect(candidates[0]).toEqual({
        url: 'https://example.com/sitemap.xml.gz',
        priority: 1,
        type: 'compressed'
      });
      expect(candidates[1]).toEqual({
        url: 'https://example.com/sitemap_index.xml',
        priority: 1,
        type: 'index'
      });
      expect(candidates[2]).toEqual({
        url: 'https://example.com/sitemap.xml',
        priority: 2,
        type: 'standard'
      });
      expect(candidates[3]).toEqual({
        url: 'https://example.com/sitemaps/sitemap.xml',
        priority: 4,
        type: 'nested'
      });
    });

    it('should handle URLs with trailing slashes correctly', () => {
      const config: SitemapDiscoveryConfig = {
        baseUrl: 'https://example.com/'
      };

      const candidates = service.generateSitemapCandidates(config);

      expect(candidates[0].url).toBe('https://example.com//sitemap_index.xml');
      expect(candidates[1].url).toBe('https://example.com//sitemap.xml');
    });

    it('should handle URLs without protocol correctly', () => {
      const config: SitemapDiscoveryConfig = {
        baseUrl: 'example.com'
      };

      const candidates = service.generateSitemapCandidates(config);

      expect(candidates[0].url).toBe('example.com/sitemap_index.xml');
      expect(candidates[1].url).toBe('example.com/sitemap.xml');
    });

    it('should handle complex URLs with paths and ports', () => {
      const config: SitemapDiscoveryConfig = {
        baseUrl: 'https://subdomain.example.com:8080/app'
      };

      const candidates = service.generateSitemapCandidates(config);

      expect(candidates[0].url).toBe('https://subdomain.example.com:8080/app/sitemap_index.xml');
      expect(candidates[1].url).toBe('https://subdomain.example.com:8080/app/sitemap.xml');
      expect(candidates[2].url).toBe('https://subdomain.example.com:8080/app/sitemap.xml.gz');
      expect(candidates[3].url).toBe('https://subdomain.example.com:8080/app/sitemaps/sitemap.xml');
    });

    it('should always return candidates sorted by priority', () => {
      const config: SitemapDiscoveryConfig = {
        baseUrl: 'https://example.com',
        prioritizeCompressedSitemaps: false
      };

      const candidates = service.generateSitemapCandidates(config);

      for (let i = 1; i < candidates.length; i++) {
        expect(candidates[i].priority).toBeGreaterThanOrEqual(candidates[i - 1].priority);
      }
    });

    it('should handle maxAttempts configuration parameter', () => {
      const config: SitemapDiscoveryConfig = {
        baseUrl: 'https://example.com',
        maxAttempts: 2 // This doesn't affect generation but should be accepted
      };

      const candidates = service.generateSitemapCandidates(config);

      expect(candidates).toHaveLength(4); // Still generates all candidates
    });
  });

  describe('isValidSitemapResponse', () => {
    const baseUrl = 'https://example.com';

    it('should validate standard sitemap XML with urlset', () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
            <lastmod>2023-01-01</lastmod>
          </url>
          <url>
            <loc>https://example.com/page2</loc>
            <lastmod>2023-01-02</lastmod>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(validXml, baseUrl);

      expect(isValid).toBe(true);
    });

    it('should validate sitemap index XML with sitemapindex', () => {
      const validIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap>
            <loc>https://example.com/sitemap1.xml</loc>
            <lastmod>2023-01-01</lastmod>
          </sitemap>
          <sitemap>
            <loc>https://example.com/sitemap2.xml</loc>
            <lastmod>2023-01-02</lastmod>
          </sitemap>
        </sitemapindex>`;

      const isValid = service.isValidSitemapResponse(validIndexXml, baseUrl);

      expect(isValid).toBe(true);
    });

    it('should reject XML without urlset or sitemapindex', () => {
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
        <root>
          <item>
            <url>https://example.com/page1</url>
          </item>
        </root>`;

      const isValid = service.isValidSitemapResponse(invalidXml, baseUrl);

      expect(isValid).toBe(false);
    });

    it('should reject XML without loc tags', () => {
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <title>Page 1</title>
            <description>Description</description>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(invalidXml, baseUrl);

      expect(isValid).toBe(false);
    });

    it('should reject XML with malformed loc tags', () => {
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>invalid-url</loc>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(invalidXml, baseUrl);

      expect(isValid).toBe(false);
    });

    it('should accept URLs from same domain', () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
          </url>
          <url>
            <loc>https://example.com/subdir/page2</loc>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(validXml, baseUrl);

      expect(isValid).toBe(true);
    });

    it('should reject XML with URLs from different domains only', () => {
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://other-domain.com/page1</loc>
          </url>
          <url>
            <loc>https://another-domain.com/page2</loc>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(invalidXml, 'https://example.com');

      expect(isValid).toBe(false);
    });

    it('should accept mixed domains if at least one matches', () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
          </url>
          <url>
            <loc>https://other-domain.com/page2</loc>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(validXml, baseUrl);

      expect(isValid).toBe(true);
    });

    it('should handle URLs with different protocols correctly', () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>http://example.com/page1</loc>
          </url>
          <url>
            <loc>https://example.com/page2</loc>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(validXml, 'https://example.com');

      expect(isValid).toBe(true);
    });

    it('should handle URLs with subdomains correctly', () => {
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://sub.example.com/page1</loc>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(invalidXml, 'https://example.com');

      expect(isValid).toBe(false);
    });

    it('should handle whitespace and formatting in URLs', () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>  https://example.com/page1  </loc>
          </url>
        </urlset>`;

      const isValid = service.isValidSitemapResponse(validXml, baseUrl);

      expect(isValid).toBe(true);
    });

    it('should handle empty XML gracefully', () => {
      const isValid = service.isValidSitemapResponse('', baseUrl);

      expect(isValid).toBe(false);
    });

    it('should handle non-XML content gracefully', () => {
      const notXml = 'This is not XML content';

      const isValid = service.isValidSitemapResponse(notXml, baseUrl);

      expect(isValid).toBe(false);
    });

    it('should handle HTML content that might be returned by mistake', () => {
      const htmlContent = `<!DOCTYPE html>
        <html>
          <head><title>404 Not Found</title></head>
          <body>
            <h1>Page not found</h1>
            <p>The requested URL /sitemap.xml was not found.</p>
          </body>
        </html>`;

      const isValid = service.isValidSitemapResponse(htmlContent, baseUrl);

      expect(isValid).toBe(false);
    });
  });

  describe('calculateDiscoveryMetrics', () => {
    it('should calculate basic metrics correctly', () => {
      const attemptedUrls = [
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap_index.xml',
        'https://example.com/sitemap.xml.gz'
      ];
      const successfulUrls = [
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap_index.xml'
      ];
      const extractedUrlCount = 150;

      const metrics = service.calculateDiscoveryMetrics(
        attemptedUrls,
        successfulUrls,
        extractedUrlCount
      );

      expect(metrics).toEqual({
        totalAttempts: 3,
        successfulAttempts: 2,
        successRate: 2/3, // 0.6666...
        extractedUrlCount: 150,
        avgUrlsPerSitemap: 75 // 150 / 2
      });
    });

    it('should handle perfect success rate', () => {
      const attemptedUrls = [
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap_index.xml'
      ];
      const successfulUrls = [
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap_index.xml'
      ];
      const extractedUrlCount = 100;

      const metrics = service.calculateDiscoveryMetrics(
        attemptedUrls,
        successfulUrls,
        extractedUrlCount
      );

      expect(metrics.successRate).toBe(1.0);
      expect(metrics.avgUrlsPerSitemap).toBe(50);
    });

    it('should handle zero success rate', () => {
      const attemptedUrls = [
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap_index.xml'
      ];
      const successfulUrls: string[] = [];
      const extractedUrlCount = 0;

      const metrics = service.calculateDiscoveryMetrics(
        attemptedUrls,
        successfulUrls,
        extractedUrlCount
      );

      expect(metrics.successRate).toBe(0);
      expect(metrics.avgUrlsPerSitemap).toBe(0);
    });

    it('should handle no attempts gracefully', () => {
      const attemptedUrls: string[] = [];
      const successfulUrls: string[] = [];
      const extractedUrlCount = 0;

      const metrics = service.calculateDiscoveryMetrics(
        attemptedUrls,
        successfulUrls,
        extractedUrlCount
      );

      expect(metrics).toEqual({
        totalAttempts: 0,
        successfulAttempts: 0,
        successRate: 0,
        extractedUrlCount: 0,
        avgUrlsPerSitemap: 0
      });
    });

    it('should handle single successful sitemap', () => {
      const attemptedUrls = ['https://example.com/sitemap.xml'];
      const successfulUrls = ['https://example.com/sitemap.xml'];
      const extractedUrlCount = 42;

      const metrics = service.calculateDiscoveryMetrics(
        attemptedUrls,
        successfulUrls,
        extractedUrlCount
      );

      expect(metrics.successRate).toBe(1.0);
      expect(metrics.avgUrlsPerSitemap).toBe(42);
    });

    it('should handle high URL extraction counts', () => {
      const attemptedUrls = [
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap_index.xml'
      ];
      const successfulUrls = [
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap_index.xml'
      ];
      const extractedUrlCount = 50000; // Large site

      const metrics = service.calculateDiscoveryMetrics(
        attemptedUrls,
        successfulUrls,
        extractedUrlCount
      );

      expect(metrics.avgUrlsPerSitemap).toBe(25000);
      expect(metrics.extractedUrlCount).toBe(50000);
    });

    it('should handle uneven sitemap sizes', () => {
      const attemptedUrls = [
        'https://example.com/sitemap1.xml',
        'https://example.com/sitemap2.xml',
        'https://example.com/sitemap3.xml'
      ];
      const successfulUrls = [
        'https://example.com/sitemap1.xml',
        'https://example.com/sitemap2.xml'
      ];
      const extractedUrlCount = 75; // Average of 37.5 per sitemap

      const metrics = service.calculateDiscoveryMetrics(
        attemptedUrls,
        successfulUrls,
        extractedUrlCount
      );

      expect(metrics.avgUrlsPerSitemap).toBe(37.5);
      expect(metrics.successRate).toBeCloseTo(0.667, 3);
    });

    it('should maintain data consistency across calculations', () => {
      const attemptedUrls = [
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap_index.xml',
        'https://example.com/sitemaps/sitemap.xml'
      ];
      const successfulUrls = ['https://example.com/sitemap.xml'];
      const extractedUrlCount = 25;

      const metrics = service.calculateDiscoveryMetrics(
        attemptedUrls,
        successfulUrls,
        extractedUrlCount
      );

      // Verify all metrics are consistent
      expect(metrics.totalAttempts).toBe(attemptedUrls.length);
      expect(metrics.successfulAttempts).toBe(successfulUrls.length);
      expect(metrics.successRate).toBe(metrics.successfulAttempts / metrics.totalAttempts);
      expect(metrics.avgUrlsPerSitemap).toBe(
        metrics.successfulAttempts > 0 ? extractedUrlCount / metrics.successfulAttempts : 0
      );
    });
  });

  describe('Domain Business Rules Integration', () => {
    it('should generate candidates optimized for discovery efficiency', () => {
      const config: SitemapDiscoveryConfig = {
        baseUrl: 'https://enterprise-site.com'
      };

      const candidates = service.generateSitemapCandidates(config);

      // Should prioritize index files which often contain multiple sitemaps
      expect(candidates[0].type).toBe('index');
      expect(candidates[0].priority).toBe(1);

      // Should have variety of sitemap patterns for comprehensive discovery
      const types = candidates.map(c => c.type);
      expect(types).toContain('standard');
      expect(types).toContain('index');
      expect(types).toContain('compressed');
      expect(types).toContain('nested');
    });

    it('should validate domain security rules strictly', () => {
      const baseUrl = 'https://secure-company.com';
      
      // Valid same-domain sitemap
      const validSameDomain = `<?xml version="1.0"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://secure-company.com/products</loc></url>
          <url><loc>https://secure-company.com/about</loc></url>
        </urlset>`;

      // Invalid cross-domain sitemap (security risk)
      const invalidCrossDomain = `<?xml version="1.0"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://malicious-site.com/inject</loc></url>
          <url><loc>https://spam-domain.com/content</loc></url>
        </urlset>`;

      expect(service.isValidSitemapResponse(validSameDomain, baseUrl)).toBe(true);
      expect(service.isValidSitemapResponse(invalidCrossDomain, baseUrl)).toBe(false);
    });

    it('should provide meaningful metrics for optimization decisions', () => {
      // Simulate different discovery scenarios
      
      // Scenario 1: Highly successful discovery
      const highSuccess = service.calculateDiscoveryMetrics(
        ['sitemap.xml', 'sitemap_index.xml'],
        ['sitemap.xml', 'sitemap_index.xml'],
        1000
      );

      // Scenario 2: Partial discovery success
      const partialSuccess = service.calculateDiscoveryMetrics(
        ['sitemap.xml', 'sitemap_index.xml', 'sitemap.xml.gz'],
        ['sitemap.xml'],
        250
      );

      // Scenario 3: Discovery failure
      const failureCase = service.calculateDiscoveryMetrics(
        ['sitemap.xml', 'sitemap_index.xml'],
        [],
        0
      );

      // High success should show optimization potential
      expect(highSuccess.successRate).toBe(1.0);
      expect(highSuccess.avgUrlsPerSitemap).toBe(500);

      // Partial success should show room for improvement
      expect(partialSuccess.successRate).toBeCloseTo(0.333, 3);
      expect(partialSuccess.avgUrlsPerSitemap).toBe(250);

      // Failure should indicate need for alternative strategies
      expect(failureCase.successRate).toBe(0);
      expect(failureCase.avgUrlsPerSitemap).toBe(0);
    });

    it('should handle edge cases gracefully in production scenarios', () => {
      // Edge case: Empty base URL
      const emptyUrlConfig: SitemapDiscoveryConfig = {
        baseUrl: ''
      };
      
      const emptyCandidates = service.generateSitemapCandidates(emptyUrlConfig);
      expect(emptyCandidates).toHaveLength(4); // Should still generate structure
      
      // Edge case: Malformed XML response
      const malformedXml = '<urlset><url><loc>https://example.com</loc></url'; // Missing closing tags
      expect(service.isValidSitemapResponse(malformedXml, 'https://example.com')).toBe(false);
      
      // Edge case: Very large metrics
      const largeSiteMetrics = service.calculateDiscoveryMetrics(
        Array(10).fill('sitemap-url'),
        Array(8).fill('successful-url'),
        1000000 // 1M URLs
      );
      
      expect(largeSiteMetrics.totalAttempts).toBe(10);
      expect(largeSiteMetrics.successfulAttempts).toBe(8);
      expect(largeSiteMetrics.avgUrlsPerSitemap).toBe(125000);
    });

    it('should support configuration flexibility for different site types', () => {
      const configs = [
        { baseUrl: 'https://blog.example.com', prioritizeCompressedSitemaps: false },
        { baseUrl: 'https://ecommerce.example.com', prioritizeCompressedSitemaps: true },
        { baseUrl: 'https://enterprise.example.com', maxAttempts: 10 }
      ];

      configs.forEach(config => {
        const candidates = service.generateSitemapCandidates(config);
        
        // All configs should generate valid candidate structures
        expect(candidates).toHaveLength(4);
        expect(candidates.every(c => c.url.includes(config.baseUrl))).toBe(true);
        expect(candidates.every(c => c.priority > 0)).toBe(true);
        
        // Compressed sitemap prioritization should affect ordering
        if (config.prioritizeCompressedSitemaps) {
          const compressedCandidate = candidates.find(c => c.type === 'compressed');
          expect(compressedCandidate?.priority).toBe(1);
        }
      });
    });
  });
});