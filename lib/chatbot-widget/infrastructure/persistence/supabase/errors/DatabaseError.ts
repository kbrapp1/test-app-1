/**
 * DatabaseError Infrastructure Error
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure-specific error for database operations
 * - Keep simple and focused on database concerns only
 * - Follow @golden-rule error handling patterns
 * - Include context for debugging database issues
 */

export class DatabaseError extends Error {
  constructor(message: string, public readonly context: Record<string, any> = {}) {
    super(message);
    this.name = 'DatabaseError';
  }
} 