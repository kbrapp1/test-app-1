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
import { Badge } from '@/components/ui/badge'; // Import Badge
import type { Tag } from '@/lib/actions/dam/tag.actions'; // Import Tag
import { TagEditor } from '@/components/dam/TagEditor'; // Import TagEditor
import { toast } from 'sonner'; // New import for sonner
import { removeTagFromAsset } from '@/lib/actions/dam/asset-crud.actions'; // Import removeTagFromAsset
import { X as XIcon, Loader2 } from 'lucide-react'; // Import XIcon and Loader2

interface AssetDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  asset: Asset | null;
  // Optional: callback if the parent needs to know about asset data changes (e.g. for re-fetch)
  onAssetDataChange?: () => void; 
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
  onAssetDataChange,
}) => {
  // Local state to manage the asset being displayed, allowing optimistic updates for tags
  const [displayedAsset, setDisplayedAsset] = React.useState<Asset | null>(asset);
  const [isUpdatingTag, setIsUpdatingTag] = React.useState(false); // For loading state during add/remove

  React.useEffect(() => {
    setDisplayedAsset(asset); // Sync with prop changes
  }, [asset]);

  if (!displayedAsset) {
    return null; 
  }

  const handleTagAdded = (newlyAddedTag: Tag, allCurrentTagsForAsset: Tag[]) => {
    setDisplayedAsset(prevAsset => {
      if (!prevAsset) return null;
      const existingTagIds = new Set((prevAsset.tags || []).map(t => t.id));
      const updatedTags = [...(prevAsset.tags || [])];
      if (!existingTagIds.has(newlyAddedTag.id)) {
        updatedTags.push(newlyAddedTag);
      }
      return { ...prevAsset, tags: updatedTags };
    });
    toast.success('Tag added', { description: `Tag "${newlyAddedTag.name}" has been successfully added.` });
    if (onAssetDataChange) {
      onAssetDataChange();
    }
  };

  const handleRemoveTag = async (tagToRemove: Tag) => {
    if (!displayedAsset) return;
    setIsUpdatingTag(true);
    const formData = new FormData();
    formData.append('assetId', displayedAsset.id);
    formData.append('tagId', tagToRemove.id);

    try {
      const result = await removeTagFromAsset(formData);
      if (result.success) {
        setDisplayedAsset(prevAsset => {
          if (!prevAsset) return null;
          return {
            ...prevAsset,
            tags: (prevAsset.tags || []).filter(tag => tag.id !== tagToRemove.id),
          };
        });
        toast.success('Tag removed', { description: `Tag "${tagToRemove.name}" has been successfully removed.` });
        if (onAssetDataChange) {
          onAssetDataChange();
        }
      } else {
        toast.error('Error removing tag', { description: result.error || 'Failed to remove tag.' });
      }
    } catch (e: any) {
      toast.error('An unexpected error occurred', { description: e.message || 'Could not remove tag.' });
    }
    setIsUpdatingTag(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asset Details</DialogTitle>
          <DialogDescription>
            Viewing details for the asset: {displayedAsset.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <DetailItem label="Name" value={displayedAsset.name} />
          <DetailItem label="Type" value={displayedAsset.mime_type} />
          <DetailItem label="Size" value={formatBytes(displayedAsset.size)} />
          {/* Width, Height, and Updated At are not on the base Asset type from types/dam.ts */}
          {/* Consider adding these if a more detailed asset type is fetched */}
          {/* displayedAsset.width && displayedAsset.height && (
            <DetailItem label="Dimensions" value={`${displayedAsset.width} x ${displayedAsset.height}px`} />
          )*/}
          <DetailItem 
            label="Uploaded" 
            value={displayedAsset.created_at ? formatDateFns(new Date(displayedAsset.created_at), 'PPpp') : 'N/A'} 
          />
          {/* <DetailItem 
            label="Last Updated" 
            value={displayedAsset.updated_at ? formatDateFns(new Date(displayedAsset.updated_at), 'PPpp') : 'N/A'} 
          /> */}
          {/* Add more details as needed */}
          
          {/* Tags Display */}
          <DetailItem 
            label="Tags"
            value={(
              (displayedAsset.tags && displayedAsset.tags.length > 0) ? (
                <div className="flex flex-wrap gap-1">
                  {displayedAsset.tags.map((tag: Tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs group/badge relative pr-7">
                      {tag.name}
                      <button 
                        onClick={() => !isUpdatingTag && handleRemoveTag(tag)}
                        disabled={isUpdatingTag}
                        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted-foreground/20 disabled:opacity-50"
                        aria-label={`Remove tag ${tag.name}`}
                      >
                        {isUpdatingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <XIcon className="h-3 w-3" />}
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : "No tags assigned"
            )}
          />

          {/* Tag Editor */}
          <div className="pt-2">
            <TagEditor 
              assetId={displayedAsset.id} 
              organizationId={displayedAsset.organization_id} 
              currentTags={displayedAsset.tags || []} 
              onTagAdded={handleTagAdded} 
            />
          </div>

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