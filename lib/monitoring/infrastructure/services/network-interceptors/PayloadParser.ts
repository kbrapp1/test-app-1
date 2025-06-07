/**
 * Service responsible for parsing network request payloads and headers
 * 
 * Handles efficient parsing of various request data formats including
 * JSON payloads, form data, and header collections for network monitoring.
 */
export class PayloadParser {
  /**
   * Parse request payload with optimized handling for different formats
   * 
   * Efficiently extracts and parses request payloads from various sources
   * including server actions, JSON bodies, and form data.
   * 
   * @param {RequestInit} init - Request initialization options
   * @param {string | null} nextAction - Next.js server action identifier
   * @param {boolean} isServerAction - Whether this is a server action
   * @returns {any} Parsed payload data or undefined
   */
  parseRequestPayload(init: RequestInit | undefined, nextAction: string | null, isServerAction: boolean): any {
    if (isServerAction && nextAction) {
      return { actionId: nextAction };
    }
    
    if (init?.body && typeof init.body === 'string') {
      return this.parseJsonBody(init.body);
    }
    
    return undefined;
  }

  /**
   * Parse generic payload from various body types
   * 
   * Handles parsing of different body formats with efficient
   * truncation for large payloads to prevent memory issues.
   * 
   * @param {any} body - Request body to parse
   * @returns {any} Parsed payload data or metadata
   */
  parsePayload(body: any): any {
    if (!body) return undefined;
    
    if (typeof body === 'string') {
      return this.parseJsonBody(body);
    }
    
    return { type: typeof body };
  }

  /**
   * Parse headers from various HeadersInit formats
   * 
   * Efficiently converts different header formats into a consistent
   * record structure for monitoring and analysis.
   * 
   * @param {HeadersInit} headers - Headers in various formats
   * @returns {Record<string, string>} Normalized headers object
   */
  parseHeaders(headers: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else if (typeof headers === 'object') {
      Object.assign(result, headers);
    }
    
    return result;
  }

  /**
   * Parse JSON body with error handling and truncation
   * 
   * @param {string} body - JSON string to parse
   * @returns {any} Parsed JSON or truncated raw string
   */
  private parseJsonBody(body: string): any {
    try {
      return JSON.parse(body);
    } catch {
      // Truncate for efficiency if JSON parsing fails
      return { raw: body.slice(0, 100) };
    }
  }
} 