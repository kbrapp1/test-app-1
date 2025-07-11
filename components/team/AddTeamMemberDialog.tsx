/**
 * Team Member Addition Dialog Component
 * 
 * AI INSTRUCTIONS:
 * - Uses permission-based access control (CREATE_TEAM_MEMBER)
 * - Fail-secure rendering (hidden if no permission)
 * - Provides user feedback via tooltips for disabled state
 * - Follows @golden-rule DDD patterns with single responsibility
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddTeamMemberForm } from './AddTeamMemberForm';
import { useTeamMemberPermissions } from '@/lib/shared/access-control/hooks/usePermissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle } from 'lucide-react';

export function AddTeamMemberDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // AI: Use permission-based access control
  const { canCreate, isLoading } = useTeamMemberPermissions();

  // AI: Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // AI: Don't render until mounted (fail-secure)
  if (!mounted) {
    return null;
  }

  // AI: Hide component entirely if no CREATE_TEAM_MEMBER permission
  if (!isLoading && !canCreate) {
    return null;
  }

  const handleSuccess = () => {
    setOpen(false);
  };

  // AI: Button disabled during loading or if no permission
  const isButtonDisabled = isLoading || !canCreate;
  const canOpenDialog = !isButtonDisabled;

  const buttonContent = (
    <Button
      disabled={isButtonDisabled}
      className={isButtonDisabled ? 'cursor-not-allowed' : ''}
      aria-label="Add Team Member"
    >
      {/* <PlusCircle className="mr-2 h-4 w-4" /> Optional Icon */}
      Add Team Member
    </Button>
  );

  return (
    <div className="inline-block">
      <Dialog open={open && canOpenDialog} onOpenChange={canOpenDialog ? setOpen : undefined}>
        {
          // Always render DialogTrigger, but wrap with Tooltip if disabled
          isButtonDisabled ? (
            <Tooltip>
              <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
              <TooltipContent side="top" align="center" sideOffset={8}>
                {isLoading ? 'Loading permissions...' : 'Insufficient permissions to add team members'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <DialogTrigger asChild>{buttonContent}</DialogTrigger>
          )
        }
        <DialogContent className="sm:max-w-[425px] md:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new team member. Both primary and hover images are required.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 pb-2">
            <AddTeamMemberForm onSuccess={handleSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 