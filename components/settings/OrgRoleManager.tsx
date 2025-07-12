import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddMemberDialog } from './AddMemberDialog';
import type { OrgMember } from '@/types/settings';
import { useOrgMembers, useOrgMemberActions } from '@/lib/auth';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { OrgMembersTable } from './OrgMembersTable';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

export function OrgRoleManager() {
  const supabase = createClient();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<OrgMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  const { activeOrganizationId, isLoading: isLoadingOrganization } = useOrganization();

  const { members, roles, loading: dataLoading, error: dataError } = useOrgMembers(
    isLoadingOrganization ? null : activeOrganizationId, 
    debouncedSearchTerm
  );

  const { 
    updatingMemberId,
    handleRoleChange,
    handleConfirmRemoveMember,
    handleResendInvitation,
    handleResetPassword 
  } = useOrgMemberActions({ activeOrganizationId, supabase, members });

  useEffect(() => {
    let isMounted = true;
    const fetchUserId = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (isMounted) {
        setCurrentUserId(userData.user?.id ?? null);
      }
    };
    fetchUserId();
    return () => { isMounted = false; };
  }, [supabase]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const currentMembership = members.find(m => m.id === currentUserId);
  const currentUserRoleName = currentMembership?.role_name;

  const handleBeginRemoveMember = useCallback((member: OrgMember) => {
    setRemovingMember(member);
  }, []);

  const executeRemoveMember = useCallback(async () => {
    if (!removingMember) return;
    const success = await handleConfirmRemoveMember(removingMember);
    if (success) {
      setRemovingMember(null);
    }
  }, [removingMember, handleConfirmRemoveMember]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Organization Members</h2>
        {(currentUserRoleName === 'admin' || currentUserRoleName === 'super-admin') && (
          <Button onClick={() => setShowAddMemberDialog(true)}>Add Member</Button>
        )}
      </div>
      
      <Input 
        type="search"
        placeholder="Search members by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      {(dataLoading || isLoadingOrganization) ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          {isLoadingOrganization 
            ? 'Loading organization context...' 
            : debouncedSearchTerm 
            ? 'Searching members...' 
            : 'Loading organization members...'
          }
        </div>
      ) : dataError ? (
        <div className="p-4 text-center text-sm text-red-600">
          Error loading members: {dataError}
        </div>
      ) : (
        <OrgMembersTable 
            members={members}
            roles={roles}
            currentUserId={currentUserId}
            updatingMemberId={updatingMemberId}
            onRoleChange={handleRoleChange}
            onBeginRemoveMember={handleBeginRemoveMember}
            onResendInvitation={handleResendInvitation}
            onResetPassword={handleResetPassword}
        />
      )}

      <RemoveMemberDialog 
        isOpen={!!removingMember}
        onOpenChange={(isOpen) => !isOpen && setRemovingMember(null)}
        memberToRemove={removingMember}
        onConfirmRemove={executeRemoveMember}
        isRemoving={!!removingMember && updatingMemberId === removingMember.id}
      />

      <AddMemberDialog
        isOpen={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        roles={roles}
        organizationId={activeOrganizationId}
        onMemberInvited={(email: string, name?: string) => {
          setShowAddMemberDialog(false);
          toast({ title: "Invitation Sent", description: `Invitation has been sent to ${email}${name ? ' (' + name + ')' : ''}.` });
        }}
      />
    </div>
  );
} 