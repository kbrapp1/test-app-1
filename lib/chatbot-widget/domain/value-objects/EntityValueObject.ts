/**
 * Entity Value Objects - Core Domain Types
 * 
 * Pure domain value objects for entity management.
 * No external dependencies - core business concepts only.
 */

/**
 * Entity value interface with type safety
 * Core domain value object for entity extraction and management
 */
export interface EntityValue {
  readonly type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  readonly value: string | number | boolean | Date | Record<string, unknown> | unknown[];
  readonly confidence: number;
  readonly source: 'user' | 'inferred' | 'system';
  readonly extractedAt: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Entity change tracking interface
 * Domain value object for tracking entity modifications over time
 */
export interface EntityChange {
  readonly entityType: string;
  readonly messageId: string;
  readonly previousValue?: EntityValue;
  readonly newValue: EntityValue;
  readonly confidence: number;
  readonly timestamp: Date;
  readonly reason: 'correction' | 'update' | 'addition' | 'removal';
}