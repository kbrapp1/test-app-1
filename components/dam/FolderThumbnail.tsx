'use client'; // Make this a Client Component

import React from 'react';
import Link from 'next/link'; // Import Link
import { Folder as FolderIcon } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core'; // Import useDroppable
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import { type Folder } from './folder-sidebar'; // Reuse Folder type

interface FolderThumbnailProps {
  folder: Folder & { type: 'folder' }; // Add type from CombinedItem in AssetGallery
}

export const FolderThumbnail: React.FC<FolderThumbnailProps> = ({ folder }) => {
  // Remove router initialization
  // const router = useRouter(); 

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
  const containerClasses = cn(
    "flex flex-col items-center justify-center p-4 h-full w-full",
    "bg-secondary/50 hover:bg-secondary/70", // Remove cursor-pointer from here
    "transition-all duration-150 border border-transparent", // Added transparent border for transition
    {
      'bg-primary/20 border-primary': isOver, // Highlight when draggable is over
      'outline-dashed outline-1 outline-primary': isOver // Another visual cue
    }
  );

  return (
    // Apply DND ref to the container div
    <div 
      ref={setNodeRef} 
      className={containerClasses} 
      // Remove onClick handler
    >
      {/* Wrap content with Link component */}
      <Link 
        href={`/dam?folderId=${folder.id}`} 
        className="flex flex-col items-center justify-center h-full w-full cursor-pointer" // Add cursor-pointer to Link
        prefetch={false} // Optional: Disable prefetching just in case
      >
        <FolderIcon 
          className={cn(
            "h-16 w-16 text-muted-foreground mb-2 transition-colors",
            { 'text-primary': isOver } // Change icon color when over
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
  );
}; 