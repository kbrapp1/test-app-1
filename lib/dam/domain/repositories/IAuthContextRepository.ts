/**
 * Authentication Context Repository Interface
 * 
 * Domain repository interface for authentication operations
 * Provides clean abstraction for authentication context retrieval
 */

export interface AuthContext {
  userId: string;
  organizationId: string;
}

export interface AuthContextResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
}

/**
 * Repository interface for authentication context operations
 * Domain layer abstraction for authentication services
 */
export interface IAuthContextRepository {
  /**
   * Retrieves authenticated user context with organization
   * @returns Promise resolving to authentication context result
   */
  getAuthContext(): Promise<AuthContextResult>;

  /**
   * Validates if user has access to organization
   * @param userId - User identifier
   * @param organizationId - Organization identifier  
   * @returns Promise resolving to boolean indicating access
   */
  validateUserAccess(userId: string, organizationId: string): Promise<boolean>;
}