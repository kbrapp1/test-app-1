/**
 * Auth Presentation Layer Exports
 * 
 * AI INSTRUCTIONS:
 * - Export only presentation layer components
 * - Keep clean API surface for UI components
 * - Never expose domain entities directly
 * - Focus on UI-specific concerns
 */

// Server Actions
export * from './actions/serverActions';
export * from './actions/memberActions';
export * from './actions/teamActions';
export * from './actions/super-admin/serverActions';

// Hooks
export { useCompleteOnboarding } from './hooks/useCompleteOnboarding';
export { useOrgMemberActions } from './hooks/useOrgMemberActions';
export { useAddMemberForm } from './hooks/useAddMemberForm';
export { useOrgMembers } from './hooks/useOrgMembers';
export { useOrganizationSelector } from './hooks/use-organization-selector';

// Providers
export { AuthenticationProvider, useAuthentication } from './providers/AuthenticationProvider';
export { UserProfileProvider, useUserProfile } from './providers/UserProfileProvider';
export { IdleTimeoutProvider, useIdleTimeout } from './providers/IdleTimeoutProvider';
export { TeamMembersProvider, useTeamMembers } from './providers/TeamMembersProvider';

// Types
export * from './types/AuthTypes';

// Components (when moved to presentation layer)
// export * from './components/'; 