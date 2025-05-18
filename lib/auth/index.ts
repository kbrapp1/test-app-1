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

// Middleware for API routes
export { withAuth, type AuthenticatedHandler, type AuthOptions } from './middleware';

// Server action wrappers
export { getSessionUser } from './server-action';
export { withAuthAction, type AuthActionOptions } from './action-wrapper'; 