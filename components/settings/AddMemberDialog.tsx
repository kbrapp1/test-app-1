import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
}

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleOption[];
  onMemberInvited: (email: string, name?: string) => void;
  organizationId: string | null;
}

export function AddMemberDialog({ isOpen, onClose, roles, onMemberInvited, organizationId }: AddMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setName('');
      setSelectedRoleId('');
      setValidationError(null);
    }
  }, [isOpen]);

  // Set first non-admin role as default when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      // Find the first role that isn't 'admin' or 'super-admin'
      const defaultRole = roles.find(role => 
        role.name !== 'admin' && role.name !== 'super-admin'
      );
      // If no non-admin roles found, use the first role
      setSelectedRoleId(defaultRole?.id || roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const validateForm = (): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    if (!selectedRoleId) {
      setValidationError('Please select a role');
      return false;
    }
    
    if (!organizationId) {
      setValidationError('Organization ID is missing');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    setSubmitting(true);
    
    try {
      // Get auth token for the Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to invite members');
      }
      
      // Call the Edge Function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email,
            name: name || undefined,
            organization_id: organizationId,
            role_id: selectedRoleId
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to invite member');
      }
      
      // Call the parent callback with success
      onMemberInvited(email, name);
      
      // Show additional toast based on whether this was a new user or existing user
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
      
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to invite member',
        variant: "destructive"
      });
      // Don't close the dialog on error so user can try again
      setSubmitting(false);
      return;
    }
    
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Organization Member</DialogTitle>
          <DialogDescription>
            Invite someone to join your organization. If they don't have an account,
            they'll be sent an invitation email.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Full name (optional)</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={submitting || roles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.filter(role => role.name !== 'super-admin').map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {validationError && (
            <div className="text-sm font-medium text-destructive">{validationError}</div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 