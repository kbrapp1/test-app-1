"use client";

/**
 * Organization Member Actions Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - Presentation layer component for organization member management
 * - Uses composition root for dependency injection
 * - Maintains all existing functionality with proper DDD structure
 * - Single responsibility: Member action coordination for UI
 */

import { useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import type { OrgMember } from '@/types/settings';
import { AuthCompositionRoot } from '../../infrastructure/composition/AuthCompositionRoot';

interface UseOrgMemberActionsProps {
  activeOrganizationId: string | null;
  supabase: SupabaseClient;
  members: OrgMember[]; // Needed for role change original member lookup
}

export function useOrgMemberActions({ activeOrganizationId, supabase, members }: UseOrgMemberActionsProps) {
  const { toast } = useToast();
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      toast({ variant: 'destructive', title: 'Error updating role', description: errorMessage });
    } finally {
      setUpdatingMemberId(null);
    }
  }, [members, activeOrganizationId, supabase, toast]);

  const handleConfirmRemoveMember = useCallback(async (removingMember: OrgMember) => {
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
        return true; // Indicate success

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
        toast({
            variant: "destructive",
            title: "Error removing member",
            description: errorMessage,
        });
        return false; // Indicate failure
    } finally {
        setUpdatingMemberId(null);
    }
  }, [activeOrganizationId, supabase, toast]);

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
            } catch (resetErr: unknown) {
                const resetErrorMessage = resetErr instanceof Error ? resetErr.message : 'Unknown error';
                throw new Error(`Failed to send password reset: ${resetErrorMessage}`);
            }
        } else if (data && data.success === true) {
            toast({ 
              title: "Invitation Resent", 
              description: data.message || `A new invitation has been sent to ${memberToResend.email}.` 
            });
        } else {
           throw new Error(data?.error || "Unexpected response from function.");
        }
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        console.error("Error resending invitation:", errorMessage);
        toast({ 
          variant: "destructive", 
          title: "Error Resending Invitation", 
          description: errorMessage 
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
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to send password reset';
        console.error('Error sending password reset email:', errorMessage);
        sonnerToast.error('Error Sending Reset', { description: errorMessage });
    } finally {
        setUpdatingMemberId(null);
    }
  }, [supabase]);


  return {
    updatingMemberId,
    handleRoleChange,
    handleConfirmRemoveMember,
    handleResendInvitation,
    handleResetPassword,
  };
} 