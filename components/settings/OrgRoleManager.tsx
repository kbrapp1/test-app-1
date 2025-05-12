import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { AddMemberDialog } from './AddMemberDialog';
import type { OrgMember, RoleOption } from '@/types/settings';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { OrgMembersTable } from './OrgMembersTable';

export function OrgRoleManager() {
  const supabase = createClient();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<OrgMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  const { members, roles, loading: dataLoading, error: dataError } = useOrgMembers(activeOrganizationId, debouncedSearchTerm);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (isMounted) {
        setCurrentUserId(userData.user?.id ?? null);
        setActiveOrganizationId(userData.user?.app_metadata?.active_organization_id ?? null);
      }
    };
    fetchInitialData();
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

  const handleRoleChange = useCallback(async (userId: string, newRoleId: string) => {
    const originalMember = members.find(m => m.id === userId);
    if (!originalMember || !activeOrganizationId) return;

    setUpdatingMemberId(userId);
    
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ role_id: newRoleId })
        .eq('user_id', userId)
        .eq('organization_id', activeOrganizationId);

      if (error) throw error;

      toast({ title: 'Role updated', description: 'User role updated successfully.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error updating role', description: error.message });
    } finally {
      setUpdatingMemberId(null);
    }
  }, [members, activeOrganizationId, supabase, toast]);

  const handleBeginRemoveMember = useCallback((member: OrgMember) => {
    setRemovingMember(member);
  }, []);

  const handleConfirmRemoveMember = useCallback(async () => {
    if (!removingMember || !activeOrganizationId) return;

    setUpdatingMemberId(removingMember.id);

    try {
        const { error } = await supabase
            .from('organization_memberships')
            .delete()
            .eq('user_id', removingMember.id)
            .eq('organization_id', activeOrganizationId);

        if (error) throw error;

        toast({
            title: "Member Removed",
            description: `${removingMember.name || removingMember.email} has been removed.`,
        });

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error removing member",
            description: error.message,
        });
    } finally {
        setRemovingMember(null);
        setUpdatingMemberId(null);
    }
  }, [removingMember, activeOrganizationId, supabase, toast]);

  const handleResendInvitation = useCallback(async (memberToResend: OrgMember) => {
    if (!activeOrganizationId || !memberToResend.email || !memberToResend.role_id) {
      toast({ variant: "destructive", title: "Error", description: "Missing required information to resend invitation." });
      return;
    }

    setUpdatingMemberId(memberToResend.id);

    try {
        const { data, error } = await supabase.functions.invoke('admin-resend-invitation', {
            body: { 
              email: memberToResend.email,
              organizationId: activeOrganizationId, 
              roleId: memberToResend.role_id 
            }
          });

        if (error) throw new Error(error.message || "Function invocation failed");
        
        if (data && data.code === "USER_ALREADY_CONFIRMED") {
            try {
                const redirectTo = typeof window !== 'undefined'
                    ? `${window.location.origin}/login/reset/password#`
                    : undefined;
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                    memberToResend.email,
                    redirectTo ? { redirectTo } : {}
                );
                if (resetError) throw resetError;
                toast({
                    title: 'Password Reset Email Sent',
                    description: `User already confirmed. A password reset link has been sent to ${memberToResend.email}.`,
                });
            } catch (resetErr: any) {
                throw new Error(`Failed to send password reset: ${resetErr.message}`);
            }
        } else if (data && data.success === true) {
            toast({ 
              title: "Invitation Resent", 
              description: data.message || `A new invitation has been sent to ${memberToResend.email}.` 
            });
        } else {
           throw new Error(data?.error || "Unexpected response from function.");
        }
    } catch (e: any) {
        console.error("Error resending invitation:", e);
        toast({ 
          variant: "destructive", 
          title: "Error Resending Invitation", 
          description: e.message || "An unexpected error occurred." 
        });
    } finally {
        setUpdatingMemberId(null);
    }
  }, [activeOrganizationId, supabase, toast]);

  const handleResetPassword = useCallback(async (memberToReset: OrgMember) => {
    setUpdatingMemberId(memberToReset.id);
    try {
        const redirectTo = typeof window !== 'undefined'
            ? `${window.location.origin}/login/reset/password`
            : undefined;
            
        const { data, error } = await supabase.functions.invoke('admin-reset-password', {
            body: { email: memberToReset.email, redirectTo }
        });

        if (error) throw new Error(`Function Error: ${error.message}`);
        if (data && data.error) throw new Error(`Reset Error: ${data.error}`);
        if (data && data.success) {
            sonnerToast.success('Password Reset Email Sent', { description: `Password reset link sent to ${memberToReset.email}.` });
        } else {
            throw new Error("Unexpected response from password reset function.");
        }
    } catch (e: any) {
        console.error('Error sending password reset email:', e);
        sonnerToast.error('Error Sending Reset', { description: e.message });
    } finally {
        setUpdatingMemberId(null);
    }
  }, [supabase]);

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

      {dataLoading ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          {debouncedSearchTerm ? 'Searching members...' : 'Loading organization members...'}
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

      {removingMember && (
        <AlertDialog open={!!removingMember} onOpenChange={(isOpen) => !isOpen && setRemovingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove{" "}
                <strong>{removingMember.name || removingMember.email}</strong>{" "}
                from the organization. They will lose access to this organization's resources.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRemovingMember(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRemoveMember}
                className={buttonVariants({ variant: "destructive" })}
                disabled={updatingMemberId === removingMember.id}
              >
                {updatingMemberId === removingMember.id ? "Removing..." : "Yes, Remove Member"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

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