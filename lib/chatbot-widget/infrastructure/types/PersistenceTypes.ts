/**
 * Persistence Infrastructure Types
 * 
 * Infrastructure layer types for data persistence.
 * Database and storage contracts for external data systems.
 */

import { EntityValue } from '../../domain/value-objects/EntityValueObject';
import { ChatSessionMetadata } from '../../domain/value-objects/ChatSessionValueObjects';

/**
 * Persistence data interface
 * Infrastructure type for chat session persistence operations
 */
export interface ChatSessionPersistenceData {
  readonly sessionId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId?: string;
  readonly createdAt: string; // ISO timestamp
  readonly updatedAt: string; // ISO timestamp
  readonly status: 'active' | 'completed' | 'abandoned' | 'escalated';
  readonly context: {
    readonly entities: Record<string, EntityValue>;
    readonly intent: Record<string, unknown>;
    readonly metadata: ChatSessionMetadata;
  };
  readonly qualificationState: {
    readonly isQualified: boolean;
    readonly score: number;
    readonly level: 'low' | 'medium' | 'high';
    readonly breakdown: Record<string, number>;
  };
  readonly messages: Array<{
    readonly id: string;
    readonly content: string;
    readonly role: 'user' | 'assistant' | 'system';
    readonly timestamp: string; // ISO timestamp
    readonly metadata?: Record<string, unknown>;
  }>;
}