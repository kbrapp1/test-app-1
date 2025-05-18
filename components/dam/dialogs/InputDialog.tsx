'use client';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'; // Added for inputLabel

export interface InputDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description?: string | React.ReactNode;
  initialValue: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  onSubmit: (inputValue: string) => Promise<void> | void;
  isLoading?: boolean; // Controlled by parent or internal
  validation?: (value: string) => string | null | undefined; // Returns error message or null/undefined
}

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  initialValue,
  inputLabel,
  inputPlaceholder = 'Enter value',
  submitButtonText = 'Save',
  cancelButtonText = 'Cancel',
  onSubmit,
  isLoading: parentIsLoading, // Rename to avoid conflict with internal state if used
  validation,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null | undefined>(null);

  const currentIsLoading = parentIsLoading !== undefined ? parentIsLoading : internalIsLoading;

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue); // Reset value when dialog opens/initialValue changes
      setValidationError(null); // Reset validation error
      // If parentIsLoading is not defined, we are using internal loading.
      // Reset internal loading state only when the dialog is newly opened and not already loading.
      if (parentIsLoading === undefined && !internalIsLoading) {
        // Check if internalIsLoading needs reset. Typically, it's set to false in handleSubmit's finally block.
        // For safety, ensure it's false when dialog opens if not parent-controlled.
        setInternalIsLoading(false);
      }
    }
  }, [isOpen, initialValue]); // Removed parentIsLoading from dependency array

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (validation) {
      setValidationError(validation(newValue));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validation) {
      const error = validation(inputValue);
      setValidationError(error);
      if (error) return;
    }
    
    if (!validation && !inputValue.trim()) { 
      setValidationError('Input cannot be empty.');
      return;
    }

    if (parentIsLoading === undefined) {
      setInternalIsLoading(true);
    }

    try {
      await onSubmit(inputValue.trim());
      // onOpenChange(false); // Caller is responsible for closing the dialog on success
    } catch (error) {
      console.error(`Error in InputDialog submission:`, error);
      // Error should be handled by the onSubmit handler (e.g., via toast)
    } finally {
      if (parentIsLoading === undefined) {
        setInternalIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>{title || '\u00A0'}</DialogTitle>
          {description !== undefined && description !== null && (
            <DialogDescription 
              asChild={typeof description !== 'string'}
            >
              {description === '' ? '\u00A0' : description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {inputLabel && <Label htmlFor="dialog-input">{inputLabel}</Label>}
            <Input
              id="dialog-input"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={inputPlaceholder}
              autoFocus
            />
            {validationError && <p className="text-sm text-red-500 dark:text-red-400">{validationError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={currentIsLoading}>
                {cancelButtonText}
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={currentIsLoading || !!validationError}
            >
              {currentIsLoading ? 'Processing...' : submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 