/**
 * Permission Service Interface - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Domain interface for permission validation without infrastructure dependencies
 * - Follows DDD principle of dependency inversion
 * - Abstracts away Supabase implementation details
 * - Enables testability and clean architecture
 * - Follow @golden-rule patterns exactly
 */

import { Permission } from '@/lib/auth/domain/value-objects/Permission';

export interface IPermissionService {
  /**
   * Validate if user has required permissions for note operations
   * Returns true if user has permissions, throws domain error if not
   */
  validateNotePermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: Permission[]
  ): Promise<void>;

  /**
   * Check if user is superadmin (bypasses all permission checks)
   */
  isSuperAdmin(userId: string): Promise<boolean>;

  /**
   * Get current authenticated user ID
   */
  getCurrentUserId(): Promise<string | null>;
}