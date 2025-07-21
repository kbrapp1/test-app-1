/**
 * Audit Trail Repository Interface
 * 
 * Domain repository interface for audit trail operations
 * Provides clean abstraction for audit logging and querying
 */

export interface AuditLogEntry {
  id: string;
  user_id: string;
  organization_id: string | null;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  source?: string;
  correlationId?: string;
}

export interface AuditTrailFilters {
  organizationId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  action?: string;
  limit?: number;
  offset?: number;
}

export interface AuditTrailResult {
  entries: AuditLogEntry[];
  total: number;
}

export interface AuditSummary {
  totalEntries: number;
  recentActions: string[];
  uniqueUsers: number;
  dateRange: { oldest: string; newest: string };
}

export interface AuthContext {
  userId: string;
  isAuthenticated: boolean;
}

export interface AuthResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
}

export interface PermissionResult {
  hasPermission: boolean;
  error?: string;
}

/**
 * Repository interface for audit trail operations
 * Domain layer abstraction for audit persistence
 */
export interface IAuditTrailRepository {
  /**
   * Get authenticated user context
   * @returns Promise resolving to authentication result
   */
  getAuthContext(): Promise<AuthResult>;

  /**
   * Log an audit entry
   * @param userId - User performing the action
   * @param organizationId - Organization context (null for global actions)
   * @param action - Action being performed
   * @param details - Action-specific details
   * @param metadata - Request metadata
   * @returns Promise that resolves when logged
   */
  logEntry(
    userId: string,
    organizationId: string | null,
    action: string,
    details: Record<string, unknown>,
    metadata?: AuditMetadata
  ): Promise<void>;

  /**
   * Retrieve audit trail with filters
   * @param filters - Query filters
   * @returns Promise resolving to audit results
   */
  getAuditTrail(filters: AuditTrailFilters): Promise<AuditTrailResult>;

  /**
   * Get audit summary statistics
   * @param organizationId - Organization to summarize (optional)
   * @returns Promise resolving to summary data
   */
  getAuditSummary(organizationId?: string): Promise<AuditSummary>;

  /**
   * Validate user has audit export permissions
   * @param userId - User to check
   * @param organizationId - Organization context
   * @returns Promise resolving to permission result
   */
  validateExportPermission(userId: string, organizationId: string): Promise<PermissionResult>;
}