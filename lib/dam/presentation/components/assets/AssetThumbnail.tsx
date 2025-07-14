'use client';

import Image from 'next/image';
import React, { useState, useTransition, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DeleteAssetUseCase } from '../../../application/use-cases/assets/DeleteAssetUseCase';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseStorageService } from '../../../infrastructure/storage/SupabaseStorageService';
import { createClient } from '@/lib/supabase/client';
import { CircleX as _CircleX, CheckCircle as _CheckCircle, AlertTriangle as _AlertTriangle, Loader as _Loader } from 'lucide-react';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface AssetThumbnailProps {
  src: string;
  alt: string;
  assetId: string;
  folderId: string | null;
  type: 'asset';
  isPriority?: boolean;
  mimeType?: string;
  onDataChange: () => Promise<void>;
}

export interface AssetThumbnailRef {
  triggerDeleteDialog: () => void;
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

/**
 * Domain presentation component for asset thumbnail display
 * Handles asset preview with proper MIME type support and delete functionality
 * Uses domain patterns for error handling and state management
 */
export const AssetThumbnail = forwardRef<AssetThumbnailRef, AssetThumbnailProps>(({
    src,
    alt,
    assetId,
    folderId: _folderId,
    type: _type,
    isPriority = false,
    mimeType,
    onDataChange
}, ref) => {
  const fallbackSrc = getPlaceholderForMimeType(mimeType);
  const [imgSrc, setImgSrc] = useState(() => {
    if (mimeType && !mimeType.startsWith('image/')) {
      return fallbackSrc;
    }
    return src;
  });
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Use organization context to avoid duplicate RPC calls
  const { activeOrganizationId } = useOrganization();
  
  useImperativeHandle(ref, () => ({
    triggerDeleteDialog: () => {
      setIsAlertOpen(true);
    }
  }));

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
    } else {
      setImgSrc(src);
    }
  }, [src, mimeType, fallbackSrc]);

  // Simplified auth function - no more RPC calls
  const getAuthContext = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!activeOrganizationId) {
      throw new Error('No active organization found');
    }

    return { supabase, user, activeOrgId: activeOrganizationId };
  }, [activeOrganizationId]);

  const handleDeleteConfirm = async () => {
    startTransition(async () => {
      try {
        const { supabase, activeOrgId } = await getAuthContext();
        const assetRepository = new SupabaseAssetRepository(supabase);
        const storageService = new SupabaseStorageService(supabase);
        const deleteUseCase = new DeleteAssetUseCase(assetRepository, storageService);

        await deleteUseCase.execute({
          assetId,
          organizationId: activeOrgId,
        });

        toast.success(`Asset "${alt}" deleted successfully.`);
        await onDataChange();
      } catch (error: unknown) {
        console.error("Delete action failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during deletion.';
        toast.error(errorMessage);
      } finally {
        setIsAlertOpen(false);
      }
    });
  };

  return (
    <div className="relative aspect-square group">
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <div className="p-4 h-full w-full flex items-center justify-center bg-muted rounded-md">
          <div className="relative h-full w-full overflow-hidden rounded-md">
            <Image
              src={imgSrc}
              alt={alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              onError={handleError}
              priority={isPriority}
              draggable="false"
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
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
});

AssetThumbnail.displayName = 'AssetThumbnail'; 
