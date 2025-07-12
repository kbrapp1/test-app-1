/**
 * Authentication and Authorization module exports
 * 
 * This provides a centralized entry point for importing all auth-related 
 * functionality throughout the application.
 */

// Role and permission definitions
export * from './roles';

// Authorization utilities
export * from './authorization';

// Super Admin functionality
export * from './super-admin';

// Services
export { updateUserProfile } from './services/profileService';
export { completeOnboardingMembership } from './services/onboardingService';

// Actions
export { inviteMemberToOrganization } from './actions/members';
export { getTeamMembers, addTeamMember } from './actions/team';

// Middleware for API routes
export { withAuth, type AuthenticatedHandler, type AuthOptions } from './middleware';

// Server action wrappers
export { getSessionUser } from './server-action';
export { 
  withAuth as withAuthAction, 
  withAuthAndOrg as withAuthAndOrgAction, 
  getCurrentUser, 
  isAuthenticated 
} from './action-wrapper';
export type { AuthenticatedUser, AuthActionResult } from './action-wrapper'; 