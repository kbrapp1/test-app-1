/**
 * Domain service for search validation operations
 * Follows Single Responsibility Principle - only handles search validation
 */
export class SearchValidation {
  private static readonly MAX_SEARCH_TERM_LENGTH = 255;

  /**
   * Validate if a search term is acceptable
   */
  static validateSearchTerm(searchTerm: string): { valid: boolean; error?: string } {
    const trimmed = searchTerm.trim();

    if (trimmed.length === 0) {
      return { valid: true }; // Empty search is valid (clears search)
    }

    if (trimmed.length > this.MAX_SEARCH_TERM_LENGTH) {
      return { 
        valid: false, 
        error: `Search term cannot exceed ${this.MAX_SEARCH_TERM_LENGTH} characters` 
      };
    }

    // Add any other business rules for search terms
    const invalidChars = /[<>]/;
    if (invalidChars.test(trimmed)) {
      return { 
        valid: false, 
        error: 'Search term contains invalid characters' 
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize search term for safe processing
   */
  static sanitizeSearchTerm(searchTerm: string): string {
    return searchTerm.trim().substring(0, this.MAX_SEARCH_TERM_LENGTH);
  }
} 
