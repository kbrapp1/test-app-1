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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SaveAsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (assetName: string) => void;
  defaultAssetName: string;
  // currentAssetName?: string; // Optional: if you want to display the original name for context
}

export function SaveAsDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  defaultAssetName,
}: SaveAsDialogProps) {
  const [assetName, setAssetName] = useState(defaultAssetName);

  useEffect(() => {
    if (isOpen) {
      setAssetName(defaultAssetName); // Reset to default when dialog opens
    }
  }, [isOpen, defaultAssetName]);

  const handleSubmit = () => {
    if (assetName.trim()) {
      onSubmit(assetName.trim());
    } else {
      // Maybe show a small inline error or disable submit if name is empty
      // For now, just don't submit if empty.
      console.warn('Asset name cannot be empty');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save As New Asset</DialogTitle>
          <DialogDescription>
            Enter a name for the new asset copy in the DAM. 
            {/* {currentAssetName && ` Original name: ${currentAssetName}`} */}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="asset-name" className="text-right">
              Asset Name
            </Label>
            <Input
              id="asset-name"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="col-span-3"
              placeholder="Enter asset name"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={!assetName.trim()}>
            Save Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 