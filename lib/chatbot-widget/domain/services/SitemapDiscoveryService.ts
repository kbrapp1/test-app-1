/**
 * Sitemap Discovery Domain Service
 * 
 * Pure domain logic for sitemap URL discovery strategy.
 * Determines which sitemap URLs to attempt based on common patterns.
 */

/**
 * Sitemap discovery configuration for business domain
 */
export interface SitemapDiscoveryConfig {
  readonly baseUrl: string;
  readonly maxAttempts?: number;
  readonly prioritizeCompressedSitemaps?: boolean;
}

/**
 * Sitemap URL discovery result
 */
export interface SitemapUrlCandidate {
  readonly url: string;
  readonly priority: number;
  readonly type: 'standard' | 'index' | 'compressed' | 'nested';
}

/**
 * Domain service for sitemap discovery strategy
 * Contains business logic for determining sitemap URLs to attempt
 */
export class SitemapDiscoveryService {
  
  /**
   * Generate sitemap URL candidates based on common patterns
   * Domain logic: prioritize by likelihood of containing valuable content
   */
  public generateSitemapCandidates(config: SitemapDiscoveryConfig): SitemapUrlCandidate[] {
    const { baseUrl, prioritizeCompressedSitemaps = false } = config;
    const candidates: SitemapUrlCandidate[] = [];
    
    // Standard sitemap locations (highest priority)
    candidates.push({
      url: `${baseUrl}/sitemap.xml`,
      priority: prioritizeCompressedSitemaps ? 2 : 1,
      type: 'standard'
    });
    
    // Sitemap index (often contains multiple sitemaps)
    candidates.push({
      url: `${baseUrl}/sitemap_index.xml`,
      priority: 1,
      type: 'index'
    });
    
    // Compressed sitemap (faster download, but less common)
    candidates.push({
      url: `${baseUrl}/sitemap.xml.gz`,
      priority: prioritizeCompressedSitemaps ? 1 : 3,
      type: 'compressed'
    });
    
    // Nested sitemaps directory (common in larger sites)
    candidates.push({
      url: `${baseUrl}/sitemaps/sitemap.xml`,
      priority: 4,
      type: 'nested'
    });
    
    // Sort by priority (lower number = higher priority)
    return candidates.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Determine if a sitemap response is valid based on domain rules
   * Business logic: validate sitemap contains valuable content
   */
  public isValidSitemapResponse(xml: string, baseUrl: string): boolean {
    // Domain rule: Must contain valid XML structure
    if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) {
      return false;
    }
    
    // Domain rule: Must contain at least one URL or sitemap reference
    if (!xml.includes('<loc>') || !xml.includes('</loc>')) {
      return false;
    }
    
    // Domain rule: URLs should be from the same domain for security
    const baseUrlObj = new URL(baseUrl);
    const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g);
    
    if (urlMatches) {
      // At least one URL should match the base domain
      return urlMatches.some(match => {
        const url = match.replace(/<\/?loc>/g, '').trim();
        try {
          const urlObj = new URL(url);
          return urlObj.hostname === baseUrlObj.hostname;
        } catch {
          return false;
        }
      });
    }
    
    return false;
  }
  
  /**
   * Calculate sitemap discovery success metrics
   * Domain logic: track discovery effectiveness for optimization
   */
  public calculateDiscoveryMetrics(
    attemptedUrls: string[],
    successfulUrls: string[],
    extractedUrlCount: number
  ): SitemapDiscoveryMetrics {
    return {
      totalAttempts: attemptedUrls.length,
      successfulAttempts: successfulUrls.length,
      successRate: attemptedUrls.length > 0 ? successfulUrls.length / attemptedUrls.length : 0,
      extractedUrlCount,
      avgUrlsPerSitemap: successfulUrls.length > 0 ? extractedUrlCount / successfulUrls.length : 0
    };
  }
}

/**
 * Sitemap discovery effectiveness metrics
 */
export interface SitemapDiscoveryMetrics {
  readonly totalAttempts: number;
  readonly successfulAttempts: number;
  readonly successRate: number;
  readonly extractedUrlCount: number;
  readonly avgUrlsPerSitemap: number;
}