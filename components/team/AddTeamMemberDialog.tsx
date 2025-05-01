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

export function AddTeamMemberDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    // Close the dialog when the form submission is successful
    setOpen(false);
  };

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