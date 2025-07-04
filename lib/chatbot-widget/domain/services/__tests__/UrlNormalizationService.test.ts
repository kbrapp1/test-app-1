/**
 * URL Normalization Service Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all URL normalization scenarios comprehensively
 * - Include edge cases and error handling
 * - Follow @golden-rule testing patterns
 * - Use descriptive test names and clear assertions
 * - Test both success and failure scenarios
 */

import { UrlNormalizationService } from '../UrlNormalizationService';
import { TestDataFactory } from '../../../__tests__/test-utilities/TestDataFactory';

describe('UrlNormalizationService', () => {
  let service: UrlNormalizationService;

  beforeEach(() => {
    service = new UrlNormalizationService();
  });

  describe('normalizeUrl', () => {
    describe('Hash Fragment Removal', () => {
      it('should remove hash fragments from URLs', () => {
        const testCases = [
          { input: 'https://example.com/#section', expected: 'https://example.com' },
          { input: 'https://example.com/page#top', expected: 'https://example.com/page' },
          { input: 'https://example.com/page?q=test#bottom', expected: 'https://example.com/page?q=test' },
          { input: 'https://example.com/#', expected: 'https://example.com' },
          { input: 'https://example.com#primary', expected: 'https://example.com' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should handle URLs without hash fragments', () => {
        const url = 'https://example.com/page';
        expect(service.normalizeUrl(url)).toBe(url);
      });
    });

    describe('WWW Canonicalization', () => {
      it('should remove www prefix consistently', () => {
        const testCases = [
          { input: 'https://www.example.com/', expected: 'https://example.com' },
          { input: 'http://www.example.com/page', expected: 'http://example.com/page' },
          { input: 'https://www.example.com/path?q=test', expected: 'https://example.com/path?q=test' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should preserve non-www URLs', () => {
        const testCases = [
          'https://example.com/',
          'https://api.example.com/',
          'https://subdomain.example.com/'
        ];

        testCases.forEach(url => {
          const expected = url.endsWith('/') ? url.slice(0, -1) : url;
          expect(service.normalizeUrl(url)).toBe(expected);
        });
      });

      it('should handle www in subdomain correctly', () => {
        expect(service.normalizeUrl('https://www.api.example.com/')).toBe('https://api.example.com');
      });
    });

    describe('Path Normalization', () => {
      it('should resolve dot segments', () => {
        const testCases = [
          { input: 'https://example.com/path/../other', expected: 'https://example.com/other' },
          { input: 'https://example.com/path/./current', expected: 'https://example.com/path/current' },
          { input: 'https://example.com/a/b/c/../../d', expected: 'https://example.com/a/d' },
          { input: 'https://example.com/./path', expected: 'https://example.com/path' },
          { input: 'https://example.com/../path', expected: 'https://example.com/path' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should remove trailing slashes', () => {
        const testCases = [
          { input: 'https://example.com/', expected: 'https://example.com' },
          { input: 'https://example.com/path/', expected: 'https://example.com/path' },
          { input: 'https://example.com/path/subpath/', expected: 'https://example.com/path/subpath' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should preserve case in path', () => {
        const testCases = [
          'https://example.com/CamelCase',
          'https://example.com/UPPERCASE',
          'https://example.com/MixedCase/Path'
        ];

        testCases.forEach(url => {
          expect(service.normalizeUrl(url)).toBe(url);
        });
      });

      it('should handle empty paths', () => {
        expect(service.normalizeUrl('https://example.com')).toBe('https://example.com');
      });
    });

    describe('Query Parameter Normalization', () => {
      it('should sort query parameters alphabetically', () => {
        const testCases = [
          { input: 'https://example.com/path?b=2&a=1', expected: 'https://example.com/path?a=1&b=2' },
          { input: 'https://example.com/?z=3&y=2&x=1', expected: 'https://example.com?x=1&y=2&z=3' },
          { input: 'https://example.com/path?c=3&a=1&b=2', expected: 'https://example.com/path?a=1&b=2&c=3' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should handle URLs without query parameters', () => {
        const url = 'https://example.com/path';
        expect(service.normalizeUrl(url)).toBe(url);
      });

      it('should handle empty query parameters', () => {
        expect(service.normalizeUrl('https://example.com/path?')).toBe('https://example.com/path');
      });

      it('should handle duplicate parameter names', () => {
        const input = 'https://example.com/path?a=1&b=2&a=3';
        const result = service.normalizeUrl(input);
        expect(result).toContain('a=1');
        expect(result).toContain('a=3');
        expect(result).toContain('b=2');
      });
    });

    describe('Character Encoding', () => {
      it('should decode percent-encoded characters safely', () => {
        const testCases = [
          { input: 'https://example.com/hello%20world', expected: 'https://example.com/hello world' },
          { input: 'https://example.com/caf%C3%A9', expected: 'https://example.com/café' },
          { input: 'https://example.com/path?q=hello%20world', expected: 'https://example.com/path?q=hello world' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should handle invalid percent encoding gracefully', () => {
        const testCases = [
          'https://example.com/path%ZZ',
          'https://example.com/path%2',
          'https://example.com/path%'
        ];

        testCases.forEach(url => {
          expect(() => service.normalizeUrl(url)).not.toThrow();
        });
      });
    });

    describe('Protocol Normalization', () => {
      it('should preserve protocol schemes', () => {
        const testCases = [
          'https://example.com/path',
          'http://example.com/path',
          'ftp://example.com/path'
        ];

        testCases.forEach(url => {
          expect(service.normalizeUrl(url)).toContain(url.split('://')[0]);
        });
      });

      it('should normalize protocol to lowercase', () => {
        const testCases = [
          { input: 'HTTPS://example.com/path', expected: 'https://example.com/path' },
          { input: 'HTTP://example.com/path', expected: 'http://example.com/path' },
          { input: 'FTP://example.com/path', expected: 'ftp://example.com/path' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });
    });

    describe('Domain Normalization', () => {
      it('should normalize domain to lowercase', () => {
        const testCases = [
          { input: 'https://EXAMPLE.COM/path', expected: 'https://example.com/path' },
          { input: 'https://Example.Com/path', expected: 'https://example.com/path' },
          { input: 'https://API.EXAMPLE.COM/path', expected: 'https://api.example.com/path' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should handle international domain names', () => {
        const testCases = [
          'https://测试.example.com/path',
          'https://тест.example.com/path',
          'https://テスト.example.com/path'
        ];

        testCases.forEach(url => {
          expect(() => service.normalizeUrl(url)).not.toThrow();
        });
      });
    });

    describe('Port Normalization', () => {
      it('should remove default ports', () => {
        const testCases = [
          { input: 'https://example.com:443/path', expected: 'https://example.com/path' },
          { input: 'http://example.com:80/path', expected: 'http://example.com/path' },
          { input: 'ftp://example.com:21/path', expected: 'ftp://example.com/path' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should preserve non-default ports', () => {
        const testCases = [
          'https://example.com:8080/path',
          'http://example.com:3000/path',
          'https://example.com:9443/path'
        ];

        testCases.forEach(url => {
          expect(service.normalizeUrl(url)).toBe(url);
        });
      });
    });

    describe('Comprehensive Integration Tests', () => {
      it('should handle complex URLs with multiple normalization needs', () => {
        const complexUrl = 'HTTPS://WWW.EXAMPLE.COM:443/Path/../Other/?b=2&a=1#section';
        const expected = 'https://example.com/Other?a=1&b=2';
        expect(service.normalizeUrl(complexUrl)).toBe(expected);
      });

      it('should use test data factory URL normalization cases', () => {
        const testCases = TestDataFactory.createUrlNormalizationTestCases();
        
        testCases.forEach(({ input, expected, description }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should be idempotent (normalizing twice produces same result)', () => {
        const testUrls = [
          'https://www.example.com/path/../other?b=2&a=1#section',
          'HTTPS://EXAMPLE.COM:443/Path/?query=test',
          'http://example.com/path/./current?z=3&a=1'
        ];

        testUrls.forEach(url => {
          const normalized = service.normalizeUrl(url);
          const doubleNormalized = service.normalizeUrl(normalized);
          expect(normalized).toBe(doubleNormalized);
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle malformed URLs gracefully', () => {
        const malformedUrls = [
          'not-a-url',
          'ftp://',
          'https://'
        ];

        malformedUrls.forEach(url => {
          expect(() => service.normalizeUrl(url)).not.toThrow();
        });
      });

      it('should return original URL for unparseable URLs', () => {
        const unparseable = 'not-a-url';
        expect(service.normalizeUrl(unparseable)).toBe(unparseable);
      });
    });

    describe('Performance Tests', () => {
      it('should handle large batches of URLs efficiently', () => {
        const urls = Array.from({ length: 1000 }, (_, i) => 
          `https://www.example.com/path${i}/../other?b=2&a=1#section`
        );

        const startTime = Date.now();
        urls.forEach(url => service.normalizeUrl(url));
        const endTime = Date.now();

        // Should process 1000 URLs in less than 1 second
        expect(endTime - startTime).toBeLessThan(1000);
      });

      it('should handle very long URLs', () => {
        const longPath = 'very-long-path-segment-'.repeat(100);
        const longUrl = `https://www.example.com/${longPath}?b=2&a=1#section`;
        
        expect(() => service.normalizeUrl(longUrl)).not.toThrow();
        expect(service.normalizeUrl(longUrl)).toContain('example.com');
      });
    });

    describe('Real-world URL Scenarios', () => {
      it('should handle common website patterns', () => {
        const realWorldUrls = [
          { input: 'https://www.ironmarkusa.com/#primary', expected: 'https://ironmarkusa.com' },
          { input: 'https://example.com/blog/post-title/', expected: 'https://example.com/blog/post-title' },
          { input: 'https://shop.example.com/products?sort=price&filter=category', expected: 'https://shop.example.com/products?filter=category&sort=price' },
          { input: 'https://www.example.com/search?q=test%20query&page=1', expected: 'https://example.com/search?page=1&q=test query' }
        ];

        realWorldUrls.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });

      it('should handle social media and tracking parameters', () => {
        const urlWithTracking = 'https://www.example.com/page?utm_source=google&utm_medium=cpc&ref=homepage&b=2&a=1';
        const result = service.normalizeUrl(urlWithTracking);
        
        expect(result).toContain('a=1');
        expect(result).toContain('b=2');
        expect(result).toContain('utm_source=google');
        expect(result).toContain('utm_medium=cpc');
        expect(result).toContain('ref=homepage');
        expect(result).toBe('https://example.com/page?a=1&b=2&ref=homepage&utm_medium=cpc&utm_source=google');
      });

      it('should handle the Ironmark duplicate URL scenario', () => {
        const testCases = [
          { input: 'https://www.ironmarkusa.com/#primary', expected: 'https://ironmarkusa.com' },
          { input: 'https://ironmarkusa.com/', expected: 'https://ironmarkusa.com' },
          { input: 'https://ironmarkusa.com', expected: 'https://ironmarkusa.com' }
        ];

        testCases.forEach(({ input, expected }) => {
          expect(service.normalizeUrl(input)).toBe(expected);
        });
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle URLs with special characters in path', () => {
      const specialChars = [
        { input: 'https://example.com/path with spaces', expected: 'https://example.com/path with spaces' },
        { input: 'https://example.com/path-with-dashes', expected: 'https://example.com/path-with-dashes' },
        { input: 'https://example.com/path_with_underscores', expected: 'https://example.com/path_with_underscores' }
      ];

      specialChars.forEach(({ input, expected }) => {
        expect(service.normalizeUrl(input)).toBe(expected);
      });
    });

    it('should handle URLs with no path', () => {
      const testCases = [
        { input: 'https://example.com', expected: 'https://example.com' },
        { input: 'https://example.com/', expected: 'https://example.com' },
        { input: 'https://www.example.com/', expected: 'https://example.com' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(service.normalizeUrl(input)).toBe(expected);
      });
    });

    it('should handle URLs with only query parameters', () => {
      const testCases = [
        { input: 'https://example.com?b=2&a=1', expected: 'https://example.com?a=1&b=2' },
        { input: 'https://www.example.com/?query=test', expected: 'https://example.com?query=test' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(service.normalizeUrl(input)).toBe(expected);
      });
    });

    it('should handle URLs with only hash fragments', () => {
      const testCases = [
        { input: 'https://example.com#section', expected: 'https://example.com' },
        { input: 'https://www.example.com/#top', expected: 'https://example.com' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(service.normalizeUrl(input)).toBe(expected);
      });
    });
  });

  describe('areUrlsEquivalent', () => {
    it('should identify equivalent URLs', () => {
      const equivalentPairs = [
        ['https://example.com/', 'https://example.com'],
        ['https://www.example.com/', 'https://example.com'],
        ['https://example.com/#section', 'https://example.com'],
        ['https://example.com/path?b=2&a=1', 'https://example.com/path?a=1&b=2']
      ];

      equivalentPairs.forEach(([url1, url2]) => {
        expect(service.areUrlsEquivalent(url1, url2)).toBe(true);
      });
    });

    it('should identify non-equivalent URLs', () => {
      const nonEquivalentPairs = [
        ['https://example.com/', 'https://different.com/'],
        ['https://example.com/path1', 'https://example.com/path2'],
        ['https://example.com/?a=1', 'https://example.com/?a=2']
      ];

      nonEquivalentPairs.forEach(([url1, url2]) => {
        expect(service.areUrlsEquivalent(url1, url2)).toBe(false);
      });
    });
  });

  describe('getCanonicalUrl', () => {
    it('should return empty string for empty array', () => {
      expect(service.getCanonicalUrl([])).toBe('');
    });

    it('should return single URL for single-item array', () => {
      const url = 'https://example.com/';
      expect(service.getCanonicalUrl([url])).toBe(url);
    });

    it('should prefer HTTPS over HTTP', () => {
      const urls = ['http://example.com/', 'https://example.com/'];
      expect(service.getCanonicalUrl(urls)).toBe('https://example.com/');
    });

    it('should prefer URLs without query parameters', () => {
      const urls = ['https://example.com/?utm_source=test', 'https://example.com/'];
      expect(service.getCanonicalUrl(urls)).toBe('https://example.com/');
    });
  });

  describe('createContentHash', () => {
    it('should create consistent hashes for equivalent URLs', () => {
      const url1 = 'https://www.example.com/#section';
      const url2 = 'https://example.com/';
      
      const hash1 = service.createContentHash(url1);
      const hash2 = service.createContentHash(url2);
      
      expect(hash1).toBe(hash2);
    });

    it('should create different hashes for different URLs', () => {
      const url1 = 'https://example.com/page1';
      const url2 = 'https://example.com/page2';
      
      const hash1 = service.createContentHash(url1);
      const hash2 = service.createContentHash(url2);
      
      expect(hash1).not.toBe(hash2);
    });
  });
}); 