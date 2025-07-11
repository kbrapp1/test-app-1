import { getTeamMembers } from '@/lib/auth';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import { AddTeamMemberDialog } from '@/components/team/AddTeamMemberDialog';
import { checkViewTeamAccess } from '@/lib/shared/access-control/server/checkFeatureAccess';
import { FeatureNotAvailable, NoOrganizationAccess, InsufficientPermissions } from '@/components/access-guards';

export const dynamic = 'force-dynamic';

/**
 * Team Management Page
 * 
 * AI INSTRUCTIONS:
 * - Protected by VIEW_TEAM permission
 * - Shows team members and management interface
 * - Graceful fallback for users without access
 * - Distinguishes between feature availability and role permissions
 */
export default async function TeamPage() {
  try {
    // AI: Check team viewing permissions first
    await checkViewTeamAccess();
    
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
    // AI: Handle different types of access denials like notes page
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    
    if (errorMessage.includes('feature') || errorMessage.includes('disabled')) {
      return <FeatureNotAvailable feature="Team" />;
    }
    
    if (errorMessage.includes('organization')) {
      return <NoOrganizationAccess />;
    }
    
    if (errorMessage.includes('permission')) {
      return <InsufficientPermissions feature="Team Management" />;
    }
    
    // AI: Generic access denied fallback
    return <NoOrganizationAccess />;
  }
} 