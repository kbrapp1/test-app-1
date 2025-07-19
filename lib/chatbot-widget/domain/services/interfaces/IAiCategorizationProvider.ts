/**
 * AI Categorization Provider Interface
 * 
 * AI INSTRUCTIONS:
 * - Domain layer interface for AI categorization abstraction
 * - No implementation details, only contract definition
 * - Allows infrastructure layer to implement concrete providers
 * - Maintains domain layer independence from external AI services
 */

/** Interface for AI provider abstraction */
export interface IAiCategorizationProvider {
  /**
   * Categorize content using AI analysis
   * 
   * @param content - The content to categorize
   * @param title - The title of the content
   * @returns Promise resolving to category string
   */
  categorizeContent(content: string, title: string): Promise<string>;
}