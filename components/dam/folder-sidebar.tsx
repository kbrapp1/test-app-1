'use client'; // Make this a Client Component

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { NewFolderDialog } from './new-folder-dialog';
import { Folder as FolderIcon, FolderPlus, ChevronRight, ChevronDown } from 'lucide-react'; // Import the icon and chevron icons
import { cn } from '@/lib/utils'; // Import cn utility

// Define the type for a Folder object (adjust based on your actual schema if different)
// We'll likely fetch this type from generated Supabase types later.
export type Folder = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  parent_folder_id?: string | null; // Add parent folder ID
};

// Define type for hierarchical structure
export interface HierarchicalFolder extends Folder {
  children: HierarchicalFolder[];
}

// Recursive component to render folder items
interface FolderTreeItemProps {
  folder: HierarchicalFolder;
  level: number;
  onFolderClick: (folderId: string) => void;
  currentFolderId: string | null;
}

function FolderTreeItem({ folder, level, onFolderClick, currentFolderId }: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const paddingLeft = `${level * 1.5}rem`;
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = folder.id === currentFolderId;

  // Toggle handler - only changes state if there are children
  const handleToggle = () => {
    if (hasChildren) {
        setIsExpanded(!isExpanded);
    }
  };

  return (
    <li>
      <div 
        className={cn(
          "w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm flex items-center gap-1 cursor-pointer",
          isSelected && "bg-indigo-100 dark:bg-indigo-800/50" // Use indigo for highlight
        )}
        style={{ paddingLeft }}
        onClick={handleToggle} // Allow clicking the whole row to toggle if children exist
      >
        {/* Toggle Button Area */}
        <span className="p-0.5 flex items-center justify-center flex-shrink-0 w-4 h-4">
          {hasChildren && (
              <span className={cn("transition-transform duration-200", isExpanded ? "rotate-90" : "rotate-0")}>
                <ChevronRight className="h-3 w-3" />
              </span>
          )}
         </span>
         
         {/* Folder Icon and Name Button */}
         <span 
          className="flex items-center gap-1.5 flex-grow truncate"
          onClick={(e) => {
            e.stopPropagation();
            onFolderClick(folder.id);
          }}
          role="button"
          tabIndex={0} 
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onFolderClick(folder.id); } }}
         >
           <FolderIcon className="h-4 w-4 flex-shrink-0" />
           <span className="truncate">{folder.name}</span>
         </span>
       </div>
       {/* Conditionally render children container, still inside the li */}
       {hasChildren && (
         <div className={cn(
             "transition-all duration-300 ease-in-out overflow-hidden",
              isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0' // Animate max-height and opacity
              )}>
           <ul className="pt-1"> {/* Removed space-y-1 */}
             {folder.children.map((child) => (
               <FolderTreeItem 
                 key={child.id} 
                 folder={child} 
                 level={level + 1} 
                 onFolderClick={onFolderClick} 
                 currentFolderId={currentFolderId}
               />
             ))}
           </ul>
         </div>
       )}
    </li>
  );
}

interface FolderSidebarProps {
  folders: HierarchicalFolder[]; // Update prop type
  currentFolderId: string | null; // Add prop for current folder
}

export function FolderSidebar({ folders, currentFolderId }: FolderSidebarProps) {
  const router = useRouter(); // Initialize router

  const handleFolderClick = (folderId: string) => {
    router.push(`/dam?folderId=${folderId}`);
  };

  const handleGoToRoot = () => {
    router.push('/dam'); // Navigate to root
  };

  return (
    <aside className="w-64 p-4 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Folders</h2>
      
      {/* Add button to go to Root */}
      <button 
        className="w-full text-left px-2 py-1 mb-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        onClick={handleGoToRoot}
      >
        (Root)
      </button>
      
      <ul className="space-y-1 flex-grow overflow-y-auto">
        {folders.length === 0 && (
          <li className="text-sm text-gray-500 dark:text-gray-400">No folders yet.</li>
        )}
        {/* Render top-level folders using the recursive component */}
        {folders.map((folder) => (
          <FolderTreeItem 
            key={folder.id} 
            folder={folder} 
            level={0} // Start top-level folders at level 0
            onFolderClick={handleFolderClick} 
            currentFolderId={currentFolderId}
          />
        ))}
      </ul>
      {/* Add "New Folder" button */}
      <div className="mt-auto pt-4">
        <NewFolderDialog currentFolderId={currentFolderId} />
      </div>
    </aside>
  );
} 