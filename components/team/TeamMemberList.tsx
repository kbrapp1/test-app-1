
/**
 * Next.js Server Component that renders a list of team members.
 * It displays a grid of team member cards and a message if no members are found.
 */

import type { TeamMember } from '@/types/team';
import { TeamMemberCard } from './TeamMemberCard';

interface TeamMemberListProps {
  members: TeamMember[] | null | undefined;
}

export function TeamMemberList({ members }: TeamMemberListProps) {
  if (!members || members.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">No team members found. Add your first team member to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {members.map((member) => (
        <TeamMemberCard key={member.id} member={member} />
      ))}
    </div>
  );
} 