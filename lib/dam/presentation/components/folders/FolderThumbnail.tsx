'use client';

import React from 'react';
import Link from 'next/link';
import { Folder as FolderIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Folder } from '../../../domain/entities/Folder';

export interface FolderThumbnailProps {
  folder: Folder & { type: 'folder' };
}

/**
 * Domain presentation component for folder thumbnail display
 * Handles folder navigation with drag & drop support
 * Uses domain patterns for consistent folder representation
 */
export const FolderThumbnail: React.FC<FolderThumbnailProps> = ({ folder }) => {
  // Initialize router for prefetch on hover
  const _router = useRouter();

  // --- DND Setup ---
  const { 
      setNodeRef, 
      isOver 
  } = useDroppable({
    id: folder.id, // Use folder.id as the droppable ID
    data: { // Pass data that might be useful
      type: folder.type, // Should be 'folder'
      name: folder.name,
      accepts: ['asset'], // Specify that this folder accepts assets
    }
  });

  // Combine base classes with conditional classes for drop target feedback
  const outerContainerClasses = cn(
    "relative group aspect-square overflow-hidden rounded-md",
    "transition-all duration-150",
    {
      'bg-primary/20 border-primary': isOver, 
      'outline-dashed outline-1 outline-primary': isOver 
    }
  );

  // This div IS the gray padded frame
  const grayPaddedFrameClasses = "p-4 h-full w-full bg-muted rounded-md"; 

  // This div is the content tile INSIDE the gray frame. It gets bg-card and flex centering.
  const contentTileClasses = "h-full w-full bg-card rounded-sm flex flex-col items-center justify-center"; 

  return (
    <div
      ref={setNodeRef}
      className={outerContainerClasses}
    >
      <div className={grayPaddedFrameClasses}> 
        <div className={contentTileClasses}> 
          <Link
            href={`/dam?folderId=${folder.id}`}
            // Link fills tile, has p-2 for its content
            className="flex flex-col items-center justify-center cursor-pointer group/link h-full w-full p-2"
            prefetch={false}
            legacyBehavior={undefined}>
            <>
              <FolderIcon
                className={cn(
                  "h-16 w-16 text-muted-foreground mb-2 transition-colors",
                  { 'text-primary': isOver }
                )}
              />
              <span
                className="text-sm font-medium text-center text-muted-foreground truncate w-full"
                title={folder.name}
              >
                {folder.name}
              </span>
            </>
          </Link>
        </div>
      </div>
    </div>
  );
}; 
