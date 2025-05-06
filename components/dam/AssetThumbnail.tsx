'use client';

import Image from 'next/image';
import React, { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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
import { deleteAsset } from '@/lib/actions/dam';

interface AssetThumbnailProps {
  src: string;
  alt: string;
  assetId: string;
  storagePath: string;
  folderId: string | null;
  type: 'asset';
  isPriority?: boolean;
  mimeType?: string;
}

function getPlaceholderForMimeType(mimeType: string | undefined): string {
  if (!mimeType) return '/placeholder.png';
  
  if (mimeType.startsWith('audio/')) {
    return '/placeholders/audio.svg';
  } else if (
    mimeType.startsWith('text/') || 
    mimeType === 'application/pdf' || 
    mimeType.includes('document') ||
    mimeType.includes('msword')
  ) {
    return '/placeholders/document.svg';
  }
  
  return '/placeholders/generic.svg';
}

export function AssetThumbnail({
    src,
    alt,
    assetId,
    storagePath,
    folderId,
    type,
    isPriority = false,
    mimeType
}: AssetThumbnailProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const fallbackSrc = getPlaceholderForMimeType(mimeType);

  const { 
      attributes, 
      listeners, 
      setNodeRef, 
      transform, 
      isDragging 
  } = useDraggable({
    id: assetId,
    data: {
      type: type,
      folderId: folderId,
      name: alt,
    },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: 10,
    cursor: 'grabbing',
  } : undefined;

  const handleError = () => {
    console.warn(`Failed to load image: ${src}. Falling back to placeholder.`);
    if (mimeType && !mimeType.startsWith('image/')) {
    setImgSrc(fallbackSrc);
    } else {
      setImgSrc('/placeholder.png');
    }
  };

  React.useEffect(() => {
    if (mimeType && !mimeType.startsWith('image/')) {
      setImgSrc(fallbackSrc);
    }
  }, [mimeType, fallbackSrc]);

  const handleDeleteConfirm = async () => {
    startTransition(async () => {
      try {
        const result = await deleteAsset(assetId, storagePath);
        if (result.success) {
          toast.success(`Asset "${alt}" deleted successfully.`);
        } else {
          toast.error(result.error || 'Failed to delete asset.');
        }
      } catch (error: any) {
        console.error("Delete action failed:", error);
        toast.error(error.message || 'An unexpected error occurred during deletion.');
      }
      setIsAlertOpen(false);
    });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      {...listeners}
      className={`relative w-full h-full aspect-square group ${isDragging ? 'opacity-50' : 'cursor-grab'}`}
    >
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <div className="relative group aspect-square overflow-hidden rounded-md bg-muted border border-gray-200 dark:border-gray-700">
          <Image
            src={imgSrc}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            className={`object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 ${isDragging ? 'cursor-grabbing' : ''}`}
            onError={handleError}
            priority={isPriority}
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
          />
          {!isDragging && (
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Delete asset"
                disabled={isPending}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          )}
        </div>

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
    </div>
  );
} 