
/**
 * Next.js Server Component that renders a dialog for adding a new team member.
 * It checks if the user is an administrator and only shows the add button if they are.
 * The dialog includes a form for adding a new team member and a success message.
 */
'use client';

import React, { useState } from 'react';
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
import { useUser } from '@/lib/hooks/useUser';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AddTeamMemberDialog() {
  const [open, setOpen] = useState(false);
  const { auth, isLoading } = useUser();

  const handleSuccess = () => {
    // Close the dialog when the form submission is successful
    setOpen(false);
  };

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // If not admin, show a disabled button with tooltip
  if (!auth.isAdmin) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button 
              variant="secondary" 
              disabled 
              className="cursor-not-allowed"
              aria-label="Add Team Member (Administrators Only)"
            >
              Add Team Member
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center"
          sideOffset={8}
          className="z-[60] rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          Only administrators can add team members
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Team Member</Button>
      </DialogTrigger>
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
  );
} 