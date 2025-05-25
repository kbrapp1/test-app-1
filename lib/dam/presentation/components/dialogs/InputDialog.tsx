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
import { Label } from '@/components/ui/label';

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
  isLoading?: boolean;
  validation?: (value: string) => string | null | undefined;
}

/**
 * Domain presentation component for input dialogs
 * 
 * Generic reusable dialog for collecting text input with:
 * - Validation support
 * - Loading states
 * - Customizable labels and buttons
 * - Form submission handling
 * 
 * Used for asset renaming, folder creation, etc.
 */
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
  isLoading: parentIsLoading,
  validation,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null | undefined>(null);

  const currentIsLoading = parentIsLoading !== undefined ? parentIsLoading : internalIsLoading;

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
      setValidationError(null);
      if (parentIsLoading === undefined && !internalIsLoading) {
        setInternalIsLoading(false);
      }
    }
  }, [isOpen, initialValue]);

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
    } catch (error) {
      console.error(`Error in InputDialog submission:`, error);
    } finally {
      if (parentIsLoading === undefined) {
        setInternalIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
