import React from 'react';
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
import { buttonVariants } from '@/components/ui/button';
import type { OrgMember } from '@/types/settings';

interface RemoveMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  memberToRemove: OrgMember | null;
  onConfirmRemove: () => Promise<boolean | void>; // Allow void for cases where success/failure isn't explicitly returned
  isRemoving: boolean;
}

export function RemoveMemberDialog({
  isOpen,
  onOpenChange,
  memberToRemove,
  onConfirmRemove,
  isRemoving,
}: RemoveMemberDialogProps) {
  if (!memberToRemove) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove{" "}
            <strong>{memberToRemove.name || memberToRemove.email}</strong>{" "}
            from the organization. They will lose access to this organization&apos;s resources.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmRemove}
            className={buttonVariants({ variant: "destructive" })}
            disabled={isRemoving}
          >
            {isRemoving ? "Removing..." : "Yes, Remove Member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 