/**
 * Sitemap XML Infrastructure Adapter
 * 
 * Infrastructure layer adapter for sitemap XML parsing and URL extraction.
 * Handles external XML parsing and URL validation concerns.
 */

import { SitemapDiscoveryService, SitemapUrlCandidate } from '../../domain/services/SitemapDiscoveryService';
import { CrawlPolicyService } from '../../domain/services/CrawlPolicyService';

/**
 * Sitemap fetching configuration
 */
export interface SitemapFetchConfig {
  readonly userAgent: string;
  readonly timeout: number;
  readonly maxRedirects: number;
}

/**
 * Sitemap extraction result
 */
export interface SitemapExtractionResult {
  readonly urls: string[];
  readonly nestedSitemaps: string[];
  readonly isIndex: boolean;
  readonly parseSuccess: boolean;
}

/**
 * Infrastructure adapter for sitemap XML operations
 * Abstracts XML parsing and HTTP fetching from domain logic
 */
export class SitemapXmlAdapter {
  private readonly sitemapDiscoveryService: SitemapDiscoveryService;
  private readonly crawlPolicyService: CrawlPolicyService;
  private readonly defaultConfig: SitemapFetchConfig = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    timeout: 30000,
    maxRedirects: 5
  };

  constructor() {
    this.sitemapDiscoveryService = new SitemapDiscoveryService();
    this.crawlPolicyService = new CrawlPolicyService();
  }

  /**
   * Discover and fetch URLs from sitemap(s)
   * Infrastructure operation: handles HTTP requests and XML parsing
   */
  async discoverUrlsFromSitemap(baseUrl: string, config?: Partial<SitemapFetchConfig>): Promise<string[]> {
    const fetchConfig = { ...this.defaultConfig, ...config };
    const candidates = this.sitemapDiscoveryService.generateSitemapCandidates({ baseUrl });
    
    for (const candidate of candidates) {
      try {
        const extractedUrls = await this.fetchAndExtractFromCandidate(candidate, baseUrl, fetchConfig);
        if (extractedUrls.length > 0) {
          return extractedUrls;
        }
      } catch {
        // Continue to next candidate
        continue;
      }
    }
    
    return []; // No sitemap found or extractable
  }

  /**
   * Fetch and extract URLs from a single sitemap candidate
   * Infrastructure operation: HTTP request and XML processing
   */
  private async fetchAndExtractFromCandidate(
    candidate: SitemapUrlCandidate,
    baseUrl: string,
    config: SitemapFetchConfig
  ): Promise<string[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const response = await fetch(candidate.url, {
        headers: {
          'User-Agent': config.userAgent
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return [];
      }

      const xml = await response.text();
      
      // Use domain service to validate response
      if (!this.sitemapDiscoveryService.isValidSitemapResponse(xml, baseUrl)) {
        return [];
      }

      const extractionResult = await this.extractUrlsFromSitemapXml(xml, baseUrl);
      return extractionResult.urls;
      
    } catch {
      clearTimeout(timeoutId);
      return [];
    }
  }

  /**
   * Extract URLs from sitemap XML content
   * Infrastructure operation: XML parsing and URL validation
   */
  async extractUrlsFromSitemapXml(xml: string, baseUrl: string): Promise<SitemapExtractionResult> {
    const urls: string[] = [];
    const nestedSitemaps: string[] = [];
    let isIndex = false;
    
    try {
      // Check if this is a sitemap index
      isIndex = xml.includes('<sitemapindex') || xml.includes('<sitemap>');
      
      if (isIndex) {
        // Extract nested sitemap URLs
        const sitemapMatches = xml.match(/<sitemap>[\s\S]*?<\/sitemap>/g);
        if (sitemapMatches) {
          for (const sitemapMatch of sitemapMatches) {
            const locMatch = sitemapMatch.match(/<loc>(.*?)<\/loc>/);
            if (locMatch) {
              const sitemapUrl = locMatch[1].trim();
              nestedSitemaps.push(sitemapUrl);
              
              // Recursively fetch nested sitemap
              const nestedUrls = await this.fetchNestedSitemap(sitemapUrl, baseUrl);
              urls.push(...nestedUrls);
            }
          }
        }
      } else {
        // Extract URLs from regular sitemap
        const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g);
        if (urlMatches) {
          for (const match of urlMatches) {
            const url = match.replace(/<\/?loc>/g, '').trim();
            
            if (this.isValidUrlForCrawling(url, baseUrl)) {
              urls.push(url);
            }
          }
        }
      }
      
      return {
        urls: this.deduplicateUrls(urls),
        nestedSitemaps,
        isIndex,
        parseSuccess: true
      };
      
    } catch {
      return {
        urls: [],
        nestedSitemaps: [],
        isIndex: false,
        parseSuccess: false
      };
    }
  }

  /**
   * Fetch and parse nested sitemap
   * Infrastructure operation: recursive sitemap processing
   */
  private async fetchNestedSitemap(sitemapUrl: string, baseUrl: string): Promise<string[]> {
    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': this.defaultConfig.userAgent
        }
      });
      
      if (response.ok) {
        const xml = await response.text();
        const result = await this.extractUrlsFromSitemapXml(xml, baseUrl);
        return result.urls;
      }
    } catch {
      // Return empty array if fetch fails
    }
    
    return [];
  }

  /**
   * Validate URL for crawling based on domain and infrastructure rules
   * Infrastructure operation: URL validation and domain checking
   */
  private isValidUrlForCrawling(url: string, baseUrl: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(baseUrl);
      
      // Infrastructure rule: Same domain only
      if (urlObj.hostname !== baseUrlObj.hostname) {
        return false;
      }
      
      // Infrastructure rule: Valid protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Use domain service for business validation
      return this.crawlPolicyService.isValuableLeadGenContent(url);
      
    } catch {
      return false;
    }
  }

  /**
   * Remove duplicate URLs while preserving order
   * Infrastructure operation: URL deduplication
   */
  private deduplicateUrls(urls: string[]): string[] {
    const seen = new Set<string>();
    return urls.filter(url => {
      const normalized = url.toLowerCase().replace(/\/$/, ''); // Normalize trailing slash
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }
}