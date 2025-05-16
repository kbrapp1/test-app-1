'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { cn } from '@/lib/utils'; // Import cn for combining class names

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  confirmButtonText?: string;
  // Allow any valid ButtonProps variant for confirmButtonVariant
  confirmButtonVariant?: typeof buttonVariants.arguments.variant;
  cancelButtonText?: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'destructive', // Default to destructive for common delete use case
  cancelButtonText = 'Cancel',
  onConfirm,
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    // Caller is responsible for closing the dialog via onOpenChange if needed
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description !== undefined && description !== null && (
            <AlertDialogDescription asChild={typeof description !== 'string'}>
              {typeof description === 'string' && description === '' ? '\u00A0' : description} 
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelButtonText}</AlertDialogCancel>
          <Button
            // Use cn to apply the variant class correctly
            className={cn(buttonVariants({ variant: confirmButtonVariant }))}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmButtonText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 