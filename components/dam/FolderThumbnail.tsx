'use client'; // Make this a Client Component

import React from 'react';
import Link from 'next/link'; // Import Link
import { Folder as FolderIcon } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import router for prefetch
import { useDroppable } from '@dnd-kit/core'; // Import useDroppable
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import type { Folder } from '@/types/dam'; // Corrected import

interface FolderThumbnailProps {
  folder: Folder & { type: 'folder' }; // Add type from CombinedItem in AssetGallery
}

export const FolderThumbnail: React.FC<FolderThumbnailProps> = ({ folder }) => {
  // Initialize router for prefetch on hover
  const router = useRouter();

  // --- DND Setup ---
  const { 
      setNodeRef, 
      isOver 
  } = useDroppable({
    id: folder.id, // Use folder.id as the droppable ID
    data: { // Pass data that might be useful
      type: folder.type, // Should be 'folder'
      name: folder.name,
    }
  });

  // Remove handleClick handler
  // const handleClick = () => {
  //   router.push(`/dam?folderId=${folder.id}`); 
  // };

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
            legacyBehavior>
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
          </Link>
        </div>
      </div>
    </div>
  );
}; 