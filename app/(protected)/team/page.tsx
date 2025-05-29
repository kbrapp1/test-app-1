import { getTeamMembers } from '@/lib/auth';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import { AddTeamMemberDialog } from '@/components/team/AddTeamMemberDialog';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  // Fetch team members
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
} 