/**
 * Authentication and Authorization module exports
 * 
 * This provides a centralized entry point for importing all auth-related 
 * functionality throughout the application.
 */

// Role and permission definitions (from new DDD structure)
export * from './domain/value-objects/UserRole';
export * from './domain/value-objects/Permission';

// Authorization utilities (from enhanced PermissionService)
export { PermissionService } from './domain/services/PermissionService';

// Backward compatibility exports for existing authorization patterns
export {
  PermissionService as AuthorizationService // Alias for backward compatibility
} from './domain/services/PermissionService';

// Authorization compatibility functions (deprecated - use PermissionService instead)
export * from './infrastructure/adapters/AuthorizationCompatibilityAdapter';

// Onboarding utilities (moved to infrastructure)
export * from './infrastructure/utilities/OnboardingUtils';

// Super Admin functionality
export * from './super-admin';

// Services (moved to infrastructure layer)
export { updateUserProfile } from './infrastructure/persistence/supabase/ProfileRepository';
export { completeOnboardingMembership } from './infrastructure/services/OnboardingService';

// Presentation Layer Exports
export * from './presentation';

// Middleware for API routes (moved to infrastructure layer)
export { withAuth, type AuthenticatedHandler, type AuthOptions } from './infrastructure/middleware/AuthMiddleware';

// Server action wrappers (moved to infrastructure layer)
export { 
  withAuth as withAuthAction, 
  withAuthAndOrg as withAuthAndOrgAction, 
  getCurrentUser, 
  isAuthenticated 
} from './infrastructure/wrappers/ActionWrapper';
export type { AuthenticatedUser, AuthActionResult } from './infrastructure/wrappers/ActionWrapper';

// Organization context utilities (from presentation layer)
export { getActiveOrganizationId } from './presentation/actions/serverActions'; 