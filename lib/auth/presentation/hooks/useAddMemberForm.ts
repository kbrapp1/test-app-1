'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { inviteMemberToOrganization } from '@/lib/auth';

interface RoleOption {
  id: string;
  name: string;
}

interface UseAddMemberFormProps {
  roles: RoleOption[];
  organizationId: string | null;
  onMemberInvited: (email: string, name?: string) => void;
  onFormSubmitSuccess: () => void; // Callback to close dialog, etc.
}

export function useAddMemberForm({
  roles,
  organizationId,
  onMemberInvited,
  onFormSubmitSuccess,
}: UseAddMemberFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setEmail('');
    setName('');
    setSelectedRoleId('');
    setValidationError(null);
    // Set default role again after reset, if roles are available
    if (roles.length > 0) {
      const defaultRole = roles.find(role => role.name !== 'admin' && role.name !== 'super-admin');
      setSelectedRoleId(defaultRole?.id || roles[0].id);
    }
  }, [roles]);

  // Set first non-admin role as default when roles load or change
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      const defaultRole = roles.find(role => role.name !== 'admin' && role.name !== 'super-admin');
      setSelectedRoleId(defaultRole?.id || roles[0].id);
    }
  }, [roles, selectedRoleId]); // selectedRoleId is included to re-run if it gets cleared externally

  const validateForm = useCallback((): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    const emailRegex = /^[^ -\s@"]+@[^ -\s@"]+\.[^ -\s@"]+$/; // More robust regex
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    if (!selectedRoleId) {
      setValidationError('Please select a role');
      return false;
    }
    if (!organizationId) {
      setValidationError('Organization ID is missing. Please ensure you are in an organization context.');
      return false;
    }
    setValidationError(null);
    return true;
  }, [email, selectedRoleId, organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const result = await inviteMemberToOrganization({
        email,
        name: name || undefined,
        organizationId: organizationId!, // Already validated by validateForm
        roleId: selectedRoleId,
      });

      if (result.success) {
        onMemberInvited(email, name);
        if (result.isNewUser) {
          toast({
            title: "Invitation Email Sent",
            description: `${email} will receive an email to join the organization.`,
          });
        } else {
          toast({
            title: "Member Added",
            description: `${email} has been added to the organization.`,
          });
        }
        onFormSubmitSuccess(); // Close dialog on success
        resetForm(); // Reset form for next potential opening
      } else {
        throw new Error(result.error || 'Failed to invite member');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      console.error('Error inviting member (hook):', errorMessage);
      toast({
        title: "Error Inviting Member",
        description: errorMessage,
        variant: "destructive",
      });
      // Don't close, don't reset form on error. User might want to correct and resubmit.
    } finally {
      setSubmitting(false);
    }
  };

  return {
    email,
    setEmail,
    name,
    setName,
    selectedRoleId,
    setSelectedRoleId,
    submitting,
    validationError,
    handleSubmit,
    resetForm, // Expose resetForm to be called when dialog opens
  };
} 