/**
 * Auth Context Interface - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Simple abstraction to remove direct auth domain dependencies
 * - Keep interface minimal and focused
 * - Avoid over-engineering - just what Notes domain needs
 * - Follow @golden-rule interface patterns exactly
 */

export interface IAuthContext {
  /**
   * Validate user has required permissions
   */
  validatePermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: string[]
  ): Promise<void>;

  /**
   * Check if user is super admin
   */
  isSuperAdmin(userId: string): Promise<boolean>;
}