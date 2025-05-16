'use client';

import React from 'react';
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
import { Asset } from '@/types/dam'; // Corrected import path
import { format as formatDateFns } from 'date-fns'; // Aliased to avoid conflict if any
import { formatBytes } from '@/lib/utils'; // Corrected import

interface AssetDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  asset: Asset | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
    <dt className="text-muted-foreground font-medium col-span-1">{label}</dt>
    <dd className="col-span-2">{value || 'N/A'}</dd>
  </div>
);

export const AssetDetailsDialog: React.FC<AssetDetailsDialogProps> = ({
  isOpen,
  onOpenChange,
  asset,
}) => {
  if (!asset) {
    return null; // Or some loading/error state if asset is fetched async within dialog
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asset Details</DialogTitle>
          <DialogDescription>
            Viewing details for the asset: {asset.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <DetailItem label="Name" value={asset.name} />
          <DetailItem label="Type" value={asset.mime_type} />
          <DetailItem label="Size" value={formatBytes(asset.size)} />
          {/* Width, Height, and Updated At are not on the base Asset type from types/dam.ts */}
          {/* Consider adding these if a more detailed asset type is fetched */}
          {/* asset.width && asset.height && (
            <DetailItem label="Dimensions" value={`${asset.width} x ${asset.height}px`} />
          )*/}
          <DetailItem 
            label="Uploaded" 
            value={asset.created_at ? formatDateFns(new Date(asset.created_at), 'PPpp') : 'N/A'} 
          />
          {/* <DetailItem 
            label="Last Updated" 
            value={asset.updated_at ? formatDateFns(new Date(asset.updated_at), 'PPpp') : 'N/A'} 
          /> */}
          {/* Add more details as needed */}
        </div>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 