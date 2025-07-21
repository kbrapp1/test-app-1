// Domain Service: Audit Trail Management
// Single Responsibility: Handle compliance and security logging
// DDD: Enterprise audit capabilities with performance optimization

import type { 
  IAuditTrailRepository,
  AuditLogEntry,
  AuditMetadata,
  AuditTrailFilters
} from '../repositories/IAuditTrailRepository';

export interface AuditTrailError extends Error {
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'EXPORT_ERROR';
  context?: Record<string, unknown>;
}

export class AuditTrailService {
  constructor(private readonly auditRepository: IAuditTrailRepository) {}

  /**
   * Log access or action with comprehensive metadata
   * @param action - Action being logged (e.g., 'switch', 'access', 'permission_grant')
   * @param organizationId - Organization ID (null for global actions)
   * @param details - Action-specific details object
   * @param metadata - Request metadata for compliance
   */
  async logAccess(
    action: string,
    organizationId: string | null,
    details: Record<string, unknown> = {},
    metadata?: AuditMetadata
  ): Promise<void> {
    if (!action?.trim()) {
      return; // Don't throw - audit failures shouldn't break main functionality
    }

    try {
      const authResult = await this.auditRepository.getAuthContext();
      if (!authResult.success || !authResult.context) {
        return; // Don't throw - audit failures shouldn't break main functionality
      }

      const enhancedDetails = {
        ...details,
        timestamp: new Date().toISOString(),
        correlation_id: metadata?.correlationId || crypto.randomUUID()
      };

      await this.auditRepository.logEntry(
        authResult.context.userId,
        organizationId,
        action,
        enhancedDetails,
        metadata
      );
    } catch {
      // Don't throw audit errors to avoid breaking main operations
    }
  }

  /**
   * Get audit trail with filters for compliance reporting
   * @param filters - Filtering options for audit queries
   * @returns Array of audit log entries
   * @throws AuditTrailError for authentication or database errors
   */
  async getAuditTrail(filters: AuditTrailFilters = {}): Promise<{ entries: AuditLogEntry[]; total: number }> {
    try {
      const authResult = await this.auditRepository.getAuthContext();
      
      if (!authResult.success || !authResult.context) {
        throw this.createError('UNAUTHORIZED', authResult.error || 'User not authenticated');
      }

      const result = await this.auditRepository.getAuditTrail(filters);
      return result;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error getting audit trail', { error });
    }
  }

  /**
   * Export audit trail for compliance reporting
   * @param organizationId - Organization to export (optional)
   * @param dateRange - Date range for export
   * @returns Complete audit data for export
   * @throws AuditTrailError for authentication or export errors
   */
  async exportAuditTrail(
    organizationId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<AuditLogEntry[]> {
    try {
      const authResult = await this.auditRepository.getAuthContext();
      
      if (!authResult.success || !authResult.context) {
        throw this.createError('UNAUTHORIZED', authResult.error || 'User not authenticated');
      }

      // Validate user has permission to export (admin/owner role required)
      if (organizationId) {
        const permissionResult = await this.auditRepository.validateExportPermission(
          authResult.context.userId, 
          organizationId
        );
        if (!permissionResult.hasPermission) {
          throw this.createError('UNAUTHORIZED', 'Insufficient permissions for audit export');
        }
      }

      const filters: AuditTrailFilters = { 
        limit: 10000, // Large limit for export
        offset: 0 
      };
      
      if (organizationId) filters.organizationId = organizationId;
      if (dateRange) {
        filters.startDate = dateRange.start;
        filters.endDate = dateRange.end;
      }

      const result = await this.getAuditTrail(filters);
      
      // Log the export action
      await this.logAccess('audit_export', organizationId || null, {
        exported_records: result.total,
        date_range: dateRange,
        export_timestamp: new Date().toISOString()
      });

      return result.entries;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('EXPORT_ERROR', 'Unexpected error exporting audit trail', { error });
    }
  }

  /**
   * Get audit summary for dashboard display
   * @param organizationId - Organization to summarize
   * @returns Summary statistics for audit trail
   * @throws AuditTrailError for authentication or database errors
   */
  async getAuditSummary(organizationId?: string): Promise<{
    totalEntries: number;
    recentActions: string[];
    uniqueUsers: number;
    dateRange: { oldest: string; newest: string };
  }> {
    try {
      const authResult = await this.auditRepository.getAuthContext();
      
      if (!authResult.success || !authResult.context) {
        throw this.createError('UNAUTHORIZED', authResult.error || 'User not authenticated');
      }

      const summary = await this.auditRepository.getAuditSummary(organizationId);
      return summary;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }
      throw this.createError('DATABASE_ERROR', 'Unexpected error getting audit summary', { error });
    }
  }


  /**
   * Create a standardized error with proper typing
   * @param code - Error code for categorization
   * @param message - Human-readable error message
   * @param context - Additional error context
   * @private
   */
  private createError(
    code: AuditTrailError['code'], 
    message: string, 
    context?: Record<string, unknown>
  ): AuditTrailError {
    const error = new Error(message) as AuditTrailError;
    error.code = code;
    error.context = context;
    return error;
  }
} 