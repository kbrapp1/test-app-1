/**
 * Next.js Server Component that renders a dialog for adding a new team member.
 * It checks if the user is an administrator and only shows the add button if they are.
 * The dialog includes a form for adding a new team member and a success message.
 */
'use client';

import { useState } from 'react';
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
import { PlusCircle } from 'lucide-react';

export function AddTeamMemberDialog() {
  const [open, setOpen] = useState(false);
  const { auth, isLoading } = useUser();

  const handleSuccess = () => {
    setOpen(false);
  };

  const isButtonDisabled = isLoading || !auth.isAdmin;
  // The dialog should only open if the button is NOT disabled
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
                {isLoading ? 'Loading...' : 'Only administrators can add team members'}
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