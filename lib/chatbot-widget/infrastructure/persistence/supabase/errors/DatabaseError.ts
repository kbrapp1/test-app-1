/**
 * DatabaseError Infrastructure Error
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure-specific error for database operations
 * - Keep simple and focused on database concerns only
 * - Follow @golden-rule error handling patterns
 * - Include context for debugging database issues
 */

interface DatabaseErrorContext {
  query?: string;
  table?: string;
  organizationId?: string;
  userId?: string;
  operation?: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  timestamp?: string;
  [key: string]: unknown;
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly context: DatabaseErrorContext = {}) {
    super(message);
    this.name = 'DatabaseError';
  }
} 