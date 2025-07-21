/**
 * Audit Trail Factory
 * 
 * Provides factory methods for creating AuditTrailService instances
 * Handles dependency injection and composition
 */

import { AuditTrailService } from '../../domain/services/AuditTrailService';
import { SupabaseAuditTrailRepository } from '../persistence/SupabaseAuditTrailRepository';

/**
 * Factory for creating configured AuditTrailService instances
 */
export class AuditTrailFactory {
  /**
   * Creates a configured AuditTrailService instance
   * @returns Configured service ready for use
   */
  static createService(): AuditTrailService {
    const repository = new SupabaseAuditTrailRepository();
    return new AuditTrailService(repository);
  }

  /**
   * Static helper for backward compatibility
   * Creates service and calls logAccess method
   * @param action - Action being logged
   * @param organizationId - Organization context
   * @param details - Action details
   * @param metadata - Request metadata
   * @returns Promise that resolves when logged
   */
  static async logAccess(
    action: string,
    organizationId: string | null,
    details: Record<string, unknown> = {},
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      source?: string;
      correlationId?: string;
    }
  ): Promise<void> {
    const service = AuditTrailFactory.createService();
    return service.logAccess(action, organizationId, details, metadata);
  }
}