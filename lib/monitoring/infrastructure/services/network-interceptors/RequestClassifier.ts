/**
 * Service responsible for classifying network request types
 * 
 * Analyzes URLs and request characteristics to categorize them into
 * appropriate types for monitoring and analysis purposes.
 */
export class RequestClassifier {
  /**
   * Classify the type of network request based on URL and characteristics
   * 
   * Analyzes request URL patterns and server action indicators to determine
   * the appropriate classification for monitoring purposes.
   * 
   * @param {string} url - The request URL to classify
   * @param {boolean} isServerAction - Whether this is a Next.js server action
   * @returns {string} The classified request type
   */
  classifyRequestType(url: string, isServerAction: boolean): 'server-action' | 'api-route' | 'fetch' | 'xhr' | 'unknown' {
    if (isServerAction) {
      return 'server-action';
    }
    
    if (this.isApiRoute(url)) {
      return 'api-route';
    }
    
    if (this.isExternalFetch(url)) {
      return 'fetch';
    }
    
    return 'unknown';
  }

  /**
   * Check if URL represents an API route
   * 
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is an API route
   */
  private isApiRoute(url: string): boolean {
    return url.includes('/api/');
  }

  /**
   * Check if URL represents an external fetch request
   * 
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is an external HTTP request
   */
  private isExternalFetch(url: string): boolean {
    return url.startsWith('http');
  }
} 