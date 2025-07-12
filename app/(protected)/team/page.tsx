import { getTeamMembers } from '@/lib/auth';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import { AddTeamMemberDialog } from '@/components/team/AddTeamMemberDialog';
import { checkTeamAccess } from '@/lib/shared/access-control';
import { FeatureNotAvailable, NoOrganizationAccess, InsufficientPermissions } from '@/components/access-guards';

export const dynamic = 'force-dynamic';

/**
 * Team Management Page
 * 
 * AI INSTRUCTIONS:
 * - Protected by VIEW_TEAM_MEMBER permission
 * - Shows team members and management interface
 * - Graceful fallback for users without access
 * - Distinguishes between feature availability and role permissions
 */
export default async function TeamPage() {
  try {
    // AI: Check team viewing permissions using dedicated team access function
    const accessResult = await checkTeamAccess();
    
    // AI: Handle access denial
    if (!accessResult.hasAccess) {
      if (accessResult.error?.includes('Organization context required')) {
        return <NoOrganizationAccess />;
      }
      if (accessResult.error?.includes('not enabled')) {
        return <FeatureNotAvailable feature="Team Management" />;
      }
      throw new Error(accessResult.error || 'Access denied');
    }

    // AI: Ensure organizationId exists (should be guaranteed by access control)
    if (!accessResult.organizationId) {
      return <NoOrganizationAccess />;
    }
    
    // AI: Fetch team members only after permission check
    const members = await getTeamMembers();

    return (
      <div className="space-y-6 min-h-[50vh]">
        <div className="flex justify-between items-center min-h-[60px]">
          <h1 className="text-3xl font-bold">Our Team</h1>
          <AddTeamMemberDialog />
        </div>
        
        <TeamMemberList members={members} />
      </div>
    );
  } catch (error: unknown) {
    // AI: Handle different types of access denials with specific error matching
    const errorMessage = error instanceof Error ? error.message : '';
    
    // AI: Check for feature flag errors
    if (errorMessage.includes('Feature') && errorMessage.includes('not enabled')) {
      return <FeatureNotAvailable feature="Team Management" />;
    }
    
    // AI: Check for organization access errors
    if (errorMessage.includes('Organization access required')) {
      return <NoOrganizationAccess />;
    }
    
    // AI: Check for permission errors (most specific match)
    if (errorMessage.includes('Insufficient permissions')) {
      // AI: Extract required permissions from error message
      const permissionMatch = errorMessage.match(/\[(.*?)\]/);
      const requiredPermissions = permissionMatch ? permissionMatch[1].split(', ') : ['view:team-member'];
      
      return (
        <InsufficientPermissions 
          feature="Team Management"
          requiredPermissions={requiredPermissions}
          showContactAdmin={true}
        />
      );
    }
    
    // AI: Check for role-related errors
    if (errorMessage.includes('No role found')) {
      return <NoOrganizationAccess />;
    }
    
    // AI: Generic access denied fallback
    return <NoOrganizationAccess />;
  }
} 