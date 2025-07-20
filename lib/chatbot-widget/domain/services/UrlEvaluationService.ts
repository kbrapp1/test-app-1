/**
 * URL Evaluation Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: URL validation and domain checking
 * - Keep URL evaluation logic pure and deterministic
 * - Never exceed 250 lines per @golden-rule
 * - Handle domain boundary validation for crawling
 * - Support URL structure analysis and validation
 */

/** Domain model for URL validation result */
export interface UrlValidationResult {
  readonly isValid: boolean;
  readonly reason: string;
  readonly urlStructure: {
    readonly hostname: string;
    readonly pathname: string;
    readonly segments: string[];
  };
}

/**
 * Specialized Service for URL Validation and Domain Checking
 * 
 * AI INSTRUCTIONS:
 * - Handle URL structure validation and analysis
 * - Apply domain boundary rules for crawling
 * - Support URL normalization and structure analysis
 * - Provide clear reasoning for validation decisions
 */
export class UrlEvaluationService {

  /** Validate URL structure and domain boundaries */
  validateUrl(
    url: string,
    baseUrl: string,
    currentDepth: number,
    maxDepth: number
  ): UrlValidationResult {
    // Check depth constraints
    if (currentDepth >= maxDepth) {
      return {
        isValid: false,
        reason: `Exceeds maximum depth limit (${maxDepth})`,
        urlStructure: this.parseUrlStructure(url)
      };
    }

    // Check domain constraints
    if (!this.isSameDomain(url, baseUrl)) {
      return {
        isValid: false,
        reason: 'Outside target domain',
        urlStructure: this.parseUrlStructure(url)
      };
    }

    // Valid URL within constraints
    return {
      isValid: true,
      reason: 'Meets URL validation criteria',
      urlStructure: this.parseUrlStructure(url)
    };
  }

  /** Check if URLs are from the same domain */
  isSameDomain(url: string, baseUrl: string): boolean {
    try {
      const urlHostname = new URL(url).hostname.toLowerCase();
      const baseHostname = new URL(baseUrl).hostname.toLowerCase();
      
      // Allow exact matches
      if (urlHostname === baseHostname) {
        return true;
      }
      
      // Allow subdomain crawling (optional enhancement)
      if (this.shouldAllowSubdomains()) {
        return urlHostname.endsWith(`.${baseHostname}`) || 
               baseHostname.endsWith(`.${urlHostname}`);
      }
      
      return false;
    } catch {
      return false; // Invalid URLs should not be crawled
    }
  }

  /** Parse URL structure for analysis */
  parseUrlStructure(url: string): { hostname: string; pathname: string; segments: string[] } {
    try {
      const parsedUrl = new URL(url);
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      
      return {
        hostname: parsedUrl.hostname.toLowerCase(),
        pathname: parsedUrl.pathname,
        segments
      };
    } catch {
      return {
        hostname: '',
        pathname: '',
        segments: []
      };
    }
  }

  /** Check if URL has clean structure (non-dynamic) */
  hasCleanStructure(url: string): boolean {
    const { segments } = this.parseUrlStructure(url);
    
    // Clean URLs have reasonable segment count and no numeric IDs
    return segments.length <= 3 && segments.every(seg => !/\d/.test(seg));
  }

  /** Check if URL is too long (likely dynamic/generated) */
  isReasonableLength(url: string): boolean {
    return url.length <= 200;
  }

  /** Check if URL has tracking parameters or fragments */
  hasTrackingElements(url: string): boolean {
    return /#/.test(url) || /[?&]utm_/.test(url);
  }

  // Check if subdomain crawling should be allowed
  private shouldAllowSubdomains(): boolean {
    return false; // Conservative default - same domain only to prevent scope creep
  }
}