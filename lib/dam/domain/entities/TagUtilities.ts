/**
 * Domain service for tag utility operations
 * Follows Single Responsibility Principle - only handles tag utilities
 */
export class TagUtilities {
  /**
   * Checks if tag name matches the given search term (case-insensitive)
   */
  static matchesSearch(tagName: string, searchTerm: string): boolean {
    if (!searchTerm || searchTerm.trim() === '') {
      return true;
    }
    
    return tagName.toLowerCase().includes(searchTerm.toLowerCase().trim());
  }

  /**
   * Gets a normalized version of the tag name for comparison/sorting
   */
  static getNormalizedName(tagName: string): string {
    return tagName.toLowerCase().trim();
  }

  /**
   * Gets the display name with proper capitalization
   */
  static getDisplayName(tagName: string): string {
    // Convert to title case for display
    return tagName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Checks if the tag name is similar to another tag name (for duplicate detection)
   */
  static isSimilarTo(tagName1: string, tagName2: string, threshold: number = 0.8): boolean {
    const similarity = this.calculateSimilarity(tagName1.toLowerCase(), tagName2.toLowerCase());
    return similarity >= threshold;
  }

  /**
   * Calculates similarity between two strings using Levenshtein distance
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }
} 
