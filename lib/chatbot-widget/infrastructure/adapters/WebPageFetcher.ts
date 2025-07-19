/**
 * Web Page Fetcher Infrastructure Adapter
 * 
 * Infrastructure layer adapter for HTTP requests and page fetching.
 * Abstracts network operations and response handling from domain logic.
 */

import { CrawledPageData } from '../../domain/services/WebsiteCrawlingDomainService';

/**
 * Page fetch configuration
 */
export interface PageFetchConfig {
  readonly userAgent: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly retryDelay: number;
  readonly headers?: Record<string, string>;
}

/**
 * Page fetch result with metadata
 */
export interface PageFetchResult {
  readonly success: boolean;
  readonly html?: string;
  readonly statusCode: number;
  readonly responseTime: number;
  readonly headers?: Record<string, string>;
  readonly error?: string;
}

/**
 * Infrastructure adapter for web page fetching operations
 * Handles HTTP requests, timeouts, retries, and response processing
 */
export class WebPageFetcher {
  private readonly defaultConfig: PageFetchConfig = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    timeout: 30000,
    maxRetries: 2,
    retryDelay: 1000,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  };

  /**
   * Fetch a single web page with retry logic
   * Infrastructure operation: HTTP request with error handling
   */
  async fetchPage(url: string, config?: Partial<PageFetchConfig>): Promise<PageFetchResult> {
    const fetchConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= fetchConfig.maxRetries; attempt++) {
      try {
        const result = await this.performFetch(url, fetchConfig, startTime);
        if (result.success) {
          return result;
        }
        
        // If not the last attempt, wait before retrying
        if (attempt < fetchConfig.maxRetries) {
          await this.delay(fetchConfig.retryDelay * (attempt + 1));
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // If this is the last attempt, return the error
        if (attempt === fetchConfig.maxRetries) {
          return {
            success: false,
            statusCode: 0,
            responseTime: Date.now() - startTime,
            error: errorMessage
          };
        }
        
        // Wait before retrying
        await this.delay(fetchConfig.retryDelay * (attempt + 1));
      }
    }
    
    return {
      success: false,
      statusCode: 0,
      responseTime: Date.now() - startTime,
      error: 'All retry attempts failed'
    };
  }

  /**
   * Fetch page and convert to domain CrawledPageData
   * Infrastructure operation: fetch and transform to domain object
   */
  async fetchPageData(url: string, depth: number, config?: Partial<PageFetchConfig>): Promise<CrawledPageData | null> {
    const fetchResult = await this.fetchPage(url, config);
    
    if (!fetchResult.success || !fetchResult.html) {
      return {
        url,
        title: 'Failed to load',
        content: '',
        depth,
        crawledAt: new Date(),
        status: 'failed',
        responseTime: fetchResult.responseTime,
        statusCode: fetchResult.statusCode,
        errorMessage: fetchResult.error
      };
    }

    // Extract title from HTML
    const title = this.extractTitleFromHtml(fetchResult.html);

    return {
      url,
      title,
      content: fetchResult.html,
      depth,
      crawledAt: new Date(),
      status: 'success',
      responseTime: fetchResult.responseTime,
      statusCode: fetchResult.statusCode
    };
  }

  /**
   * Perform the actual HTTP fetch operation
   * Infrastructure operation: low-level HTTP request
   */
  private async performFetch(url: string, config: PageFetchConfig, startTime: number): Promise<PageFetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': config.userAgent,
          ...config.headers
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          responseTime: Date.now() - startTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const html = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      return {
        success: true,
        html,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        headers: responseHeaders
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  /**
   * Extract title from HTML content
   * Infrastructure operation: HTML parsing for title extraction
   */
  private extractTitleFromHtml(html: string): string {
    // Try to extract title from <title> tag
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      if (title) {
        return title;
      }
    }
    
    // Fallback to first <h1> tag
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      const h1Title = h1Match[1].replace(/<[^>]*>/g, '').trim();
      if (h1Title) {
        return h1Title;
      }
    }
    
    return 'Untitled';
  }

  /**
   * Validate URL before fetching
   * Infrastructure operation: URL validation and safety checks
   */
  public isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Infrastructure rule: Only HTTP/HTTPS protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Infrastructure rule: No localhost or internal IPs (basic security)
      if (urlObj.hostname === 'localhost' || 
          urlObj.hostname.startsWith('127.') ||
          urlObj.hostname.startsWith('10.') ||
          urlObj.hostname.startsWith('172.') ||
          urlObj.hostname.startsWith('192.168.')) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delay utility for retry logic
   * Infrastructure operation: async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}