'use client';

import Image from 'next/image';
import React, { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { deleteAsset } from '@/lib/actions/dam'; // Import the server action

interface AssetThumbnailProps {
  src: string;
  alt: string;
  assetId: string;      // Added asset ID
  storagePath: string; // Added storage path
  isPriority?: boolean; // Added optional priority flag
}

export function AssetThumbnail({
    src,
    alt,
    assetId,
    storagePath,
    isPriority = false // Default to false
}: AssetThumbnailProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fallbackSrc = '/placeholder.png';

  const handleError = () => {
    console.warn(`Failed to load image: ${src}. Falling back to placeholder.`);
    setImgSrc(fallbackSrc);
  };

  const handleDeleteConfirm = async () => {
    startTransition(async () => {
      try {
        const result = await deleteAsset(assetId, storagePath);
        if (result.success) {
          toast.success(`Asset "${alt}" deleted successfully.`);
          // No need to manually remove from UI, revalidatePath handles it
        } else {
          toast.error(result.error || 'Failed to delete asset.');
        }
      } catch (error: any) {
        console.error("Delete action failed:", error);
        toast.error(error.message || 'An unexpected error occurred during deletion.');
      }
      setIsAlertOpen(false); // Close dialog regardless of outcome
    });
  };

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      {/* Relative container for positioning the button */}
      <div className="relative w-full h-full group">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          onError={handleError}
          priority={isPriority} // Conditionally add the priority prop
        />
        {/* Delete Button - Appears on Hover */}
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            aria-label="Delete asset"
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the asset
            <span className="font-medium"> {alt} </span>
            from storage and the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 