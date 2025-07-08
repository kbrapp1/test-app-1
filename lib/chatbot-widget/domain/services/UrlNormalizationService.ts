/**
 * URL Normalization Service - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for URL normalization and comparison
 * - Handle common URL variations that represent the same content
 * - No external dependencies, pure functions only
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on normalization logic
 */

/**
 * Domain service for normalizing URLs to prevent duplicate content crawling
 * 
 * Handles common URL variations:
 * - Hash fragments (#primary, #section1, etc.)
 * - Trailing slashes
 * - Protocol variations (http vs https)
 * - Query parameter ordering
 * - Default ports
 * - Case sensitivity in paths
 */
export class UrlNormalizationService {
  
  /**
   * Normalize a URL to its canonical form for deduplication (2025 Best Practices)
   * 
   * @param url - The URL to normalize
   * @returns Normalized URL string
   */
  normalizeUrl(url: string): string {
    try {
      // Parse URL first without decoding to preserve structure
      const urlObj = new URL(url);
      
      // CRITICAL: Remove hash fragments (fixes ironmarkusa.com/#primary issue)
      urlObj.hash = '';
      
      // Normalize hostname to lowercase
      urlObj.hostname = urlObj.hostname.toLowerCase();
      
      // Handle www vs non-www consistently (prefer non-www for canonical form)
      if (urlObj.hostname.startsWith('www.')) {
        urlObj.hostname = urlObj.hostname.substring(4);
      }
      
      // Remove default ports
      if ((urlObj.protocol === 'http:' && urlObj.port === '80') ||
          (urlObj.protocol === 'https:' && urlObj.port === '443')) {
        urlObj.port = '';
      }
      
      // Normalize pathname and decode safe characters
      let normalizedPathname = this.normalizePathname(urlObj.pathname);
      normalizedPathname = this.decodeSafeCharacters(normalizedPathname);
      
      // Sort query parameters for consistent ordering and handle plus signs
      const params = Array.from(urlObj.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
      
      // Build final URL manually to preserve decoded characters
      let finalUrl = `${urlObj.protocol}//${urlObj.hostname}`;
      
      // Add port if non-default
      if (urlObj.port) {
        finalUrl += `:${urlObj.port}`;
      }
      
      // Add normalized pathname (remove trailing slash from root)
      if (normalizedPathname === '/') {
        // Don't add anything for root path
      } else {
        finalUrl += normalizedPathname;
      }
      
      // Add query parameters if any, manually constructed to preserve spaces
      if (params.length > 0) {
        const queryParts = params.map(([key, value]) => {
          // Handle plus signs in query parameters (convert to spaces)
          const decodedValue = value.replace(/\+/g, ' ');
          // Encode key and value but preserve spaces
          const encodedKey = encodeURIComponent(key);
          const encodedValue = encodeURIComponent(decodedValue).replace(/%20/g, ' ');
          return `${encodedKey}=${encodedValue}`;
        });
        finalUrl += '?' + queryParts.join('&');
      }
      
      return finalUrl;
      
    } catch (error) {
      // If URL parsing fails, return original URL
      console.warn(`Failed to normalize URL: ${url}`, error);
      return url;
    }
  }

  /** Normalize pathname component according to 2025 standards */
  private normalizePathname(pathname: string): string {
    // Remove trailing slash for consistency (except root)
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    
    // Ensure path starts with /
    if (!pathname.startsWith('/')) {
      pathname = '/' + pathname;
    }
    
    // Remove consecutive slashes
    pathname = pathname.replace(/\/+/g, '/');
    
    // Remove dot segments (. and ..)
    const segments = pathname.split('/');
    const normalizedSegments: string[] = [];
    
    for (const segment of segments) {
      if (segment === '' || segment === '.') {
        continue;
      } else if (segment === '..') {
        normalizedSegments.pop();
      } else {
        normalizedSegments.push(segment);
      }
    }
    
    return '/' + normalizedSegments.join('/');
  }

  /** Decode safe percent-encoded characters in pathname */
  private decodeSafeCharacters(pathname: string): string {
    try {
      // Use decodeURIComponent for proper percent-decoding
      return decodeURIComponent(pathname);
    } catch (error) {
      // If decoding fails, try selective decoding of common characters
      try {
        return pathname
          .replace(/%20/gi, ' ')   // space
          .replace(/%21/gi, '!')   // exclamation
          .replace(/%22/gi, '"')   // quote
          .replace(/%23/gi, '#')   // hash
          .replace(/%24/gi, '$')   // dollar
          .replace(/%25/gi, '%')   // percent
          .replace(/%26/gi, '&')   // ampersand
          .replace(/%27/gi, "'")   // apostrophe
          .replace(/%28/gi, '(')   // left paren
          .replace(/%29/gi, ')')   // right paren
          .replace(/%2A/gi, '*')   // asterisk
          .replace(/%2B/gi, '+')   // plus
          .replace(/%2C/gi, ',')   // comma
          .replace(/%2D/gi, '-')   // hyphen
          .replace(/%2E/gi, '.')   // period
          .replace(/%2F/gi, '/')   // slash
          .replace(/%3A/gi, ':')   // colon
          .replace(/%3B/gi, ';')   // semicolon
          .replace(/%3C/gi, '<')   // less than
          .replace(/%3D/gi, '=')   // equals
          .replace(/%3E/gi, '>')   // greater than
          .replace(/%3F/gi, '?')   // question mark
          .replace(/%40/gi, '@')   // at symbol
          .replace(/%5B/gi, '[')   // left bracket
          .replace(/%5C/gi, '\\')  // backslash
          .replace(/%5D/gi, ']')   // right bracket
          .replace(/%5E/gi, '^')   // caret
          .replace(/%5F/gi, '_')   // underscore
          .replace(/%60/gi, '`')   // backtick
          .replace(/%7B/gi, '{')   // left brace
          .replace(/%7C/gi, '|')   // pipe
          .replace(/%7D/gi, '}')   // right brace
          .replace(/%7E/gi, '~');  // tilde
      } catch (fallbackError) {
        return pathname;
      }
    }
  }
  
  /**
   * Check if two URLs represent the same content after normalization
   * 
   * @param url1 - First URL to compare
   * @param url2 - Second URL to compare
   * @returns True if URLs represent the same content
   */
  areUrlsEquivalent(url1: string, url2: string): boolean {
    const normalized1 = this.normalizeUrl(url1);
    const normalized2 = this.normalizeUrl(url2);
    return normalized1 === normalized2;
  }
  
  /**
   * Get canonical URL from a list of equivalent URLs
   * Prefers HTTPS over HTTP, shorter paths, and URLs without query params
   * 
   * @param urls - Array of equivalent URLs
   * @returns The canonical URL from the list
   */
  getCanonicalUrl(urls: string[]): string {
    if (urls.length === 0) return '';
    if (urls.length === 1) return urls[0];
    
    return urls.sort((a, b) => {
      try {
        const urlA = new URL(a);
        const urlB = new URL(b);
        
        // Prefer HTTPS over HTTP
        if (urlA.protocol === 'https:' && urlB.protocol === 'http:') return -1;
        if (urlA.protocol === 'http:' && urlB.protocol === 'https:') return 1;
        
        // Prefer URLs without query parameters
        const hasQueryA = urlA.search.length > 0;
        const hasQueryB = urlB.search.length > 0;
        if (!hasQueryA && hasQueryB) return -1;
        if (hasQueryA && !hasQueryB) return 1;
        
        // Prefer shorter paths
        if (urlA.pathname.length !== urlB.pathname.length) {
          return urlA.pathname.length - urlB.pathname.length;
        }
        
        // Fallback to alphabetical
        return a.localeCompare(b);
        
      } catch (error) {
        // If URL parsing fails, fallback to string comparison
        return a.localeCompare(b);
      }
    })[0];
  }
  
  /**
   * Create a stable hash for URL content identification
   * Uses normalized URL as the basis for content grouping
   * 
   * @param url - URL to create hash for
   * @returns Normalized URL hash for content identification
   */
  createContentHash(url: string): string {
    return this.normalizeUrl(url);
  }
} 