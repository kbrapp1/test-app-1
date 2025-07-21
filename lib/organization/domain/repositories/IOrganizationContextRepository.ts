// Domain Repository Interface: Organization Context Operations
// Single Responsibility: Define contract for organization context data access
// DDD: Pure domain interface with no infrastructure dependencies

export interface OrganizationContextData {
  id?: string;
  user_id: string;
  active_organization_id: string | null;
  last_accessed_at: string;
  created_at?: string;
  updated_at: string;
  organization_name: string;
  feature_flags: Record<string, boolean>;
}

export interface IOrganizationContextRepository {
  /**
   * Get current user's organization context
   * @param userId - The user ID to get context for
   * @returns Organization context data or null if not found
   */
  getCurrentContext(userId: string): Promise<OrganizationContextData | null>;

  /**
   * Switch user's active organization
   * @param userId - The user ID
   * @param organizationId - The organization to switch to
   */
  switchOrganization(userId: string, organizationId: string): Promise<void>;

  /**
   * Clear user's organization context
   * @param userId - The user ID to clear context for
   */
  clearContext(userId: string): Promise<void>;

  /**
   * Update last accessed timestamp for user's context
   * @param userId - The user ID to update
   */
  updateLastAccessed(userId: string): Promise<void>;

  /**
   * Verify user has access to specific organization
   * @param userId - The user ID to check
   * @param organizationId - The organization ID to verify access to
   * @returns True if user has access, false otherwise
   */
  verifyOrganizationAccess(userId: string, organizationId: string): Promise<boolean>;

  /**
   * Get current authenticated user ID
   * @returns User ID or null if not authenticated
   */
  getCurrentUserId(): Promise<string | null>;
}