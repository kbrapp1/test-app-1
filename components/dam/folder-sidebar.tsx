"use client"; // Make it a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// Assuming CombinedItem type is available or defined elsewhere if needed for API response
// import type { CombinedItem } from './AssetGrid'; 

// Base Folder type (adjust path if needed)
export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  parent_folder_id: string | null;
}

// Type for fetched children (might only be folders)
// Adjust this based on what your API returns for folder children
type FetchedChild = Folder & { type: 'folder' }; 

// Props for the main sidebar component
export interface FolderSidebarProps {
  initialFolders: Folder[]; // Changed prop name
  currentFolderId: string | null;
}

// Props for the recursive FolderItem component
interface FolderItemProps {
  folder: Folder;
  level: number;
  currentFolderId: string | null;
  onFetchChildren: (folderId: string) => Promise<FetchedChild[]>; // Callback to fetch
}

// --- Recursive Folder Item Component ---
const FolderItem: React.FC<FolderItemProps> = ({ 
  folder, 
  level, 
  currentFolderId, 
  onFetchChildren 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FetchedChild[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleExpand = async () => {
    const currentlyExpanded = isExpanded;
    setIsExpanded(!currentlyExpanded);

    // Fetch children only if expanding and haven't fetched yet
    if (!currentlyExpanded && children === null) {
      setIsLoading(true);
      try {
        const fetchedChildren = await onFetchChildren(folder.id);
        // Filter for folders only if API returns mixed types
        setChildren(fetchedChildren.filter(item => item.type === 'folder') as FetchedChild[]); 
      } catch (error) {
        console.error(`Error fetching children for folder ${folder.id}:`, error);
        // Optionally set children to an empty array or show an error state
        setChildren([]); 
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isActive = folder.id === currentFolderId;

  return (
    <div>
      <div className={cn(
        "flex items-center justify-between px-1 py-1 rounded-md",
        isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
      )} style={{ paddingLeft: `${level * 1.5}rem` }}>
         {/* Expand/Collapse Button - shows loading or chevron */}
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToggleExpand}
            className="p-1 h-auto mr-1" // Adjust padding/size
            disabled={isLoading} // Disable while loading
        >
          {isLoading ? (
            <span className="animate-spin h-4 w-4">⏳</span> // Simple spinner
          ) : isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        <Link href={`/dam?folderId=${folder.id}`} className="flex-1 flex items-center truncate">
          <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate font-medium" title={folder.name}>{folder.name}</span>
        </Link>
      </div>
      {/* Render Children Recursively */}
      {isExpanded && children && (
        <div className="mt-1">
          {children.map(child => (
            <FolderItem 
              key={child.id} 
              folder={child} 
              level={level + 1} 
              currentFolderId={currentFolderId}
              onFetchChildren={onFetchChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Folder Sidebar Component ---
export const FolderSidebar: React.FC<FolderSidebarProps> = ({ initialFolders = [], currentFolderId }) => {
  const [isRootExpanded, setIsRootExpanded] = useState(true); // Start expanded

  // Function to fetch children for a specific folder ID
  const fetchChildren = async (folderId: string): Promise<FetchedChild[]> => {
      console.log(`Fetching children for folder: ${folderId}`);
      const res = await fetch(`/api/dam?folderId=${folderId}`); // Use existing API route
      if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
      }
      const data = await res.json();
      // Assuming the API returns CombinedItem[] or similar, filter if needed
      // For now, let's assume it returns items with a 'type' property
      const folderChildren = data.filter((item: any) => item.type === 'folder');
      console.log(`Fetched ${folderChildren.length} children for folder: ${folderId}`);
      return folderChildren as FetchedChild[]; // Cast or validate type
  };

  return (
    <aside className="w-64 border-r bg-background p-4 flex flex-col h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Folders</h2>
      
      {/* Root Item - Now with Expander */}
      <div className={cn(
            "flex items-center px-1 py-1 rounded-md mb-1",
            currentFolderId === null ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
         )}
      >
        {/* Expand/Collapse Button for Root */}
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsRootExpanded(!isRootExpanded)}
            className="p-1 h-auto mr-1" // Adjust padding/size
        >
          {isRootExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        {/* Link part of Root */}
        <Link href="/dam" className="flex-1 flex items-center truncate">
          <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" /> 
          <span className="font-medium">(Root)</span>
        </Link>
     </div>

     {/* Conditionally Render Root Folders based on isRootExpanded */}
     {isRootExpanded && (
       <div className="mt-1 pl-4"> {/* Add slight indent for children of Root */}
         {initialFolders.map(folder => (
           <FolderItem 
             key={folder.id} 
             folder={folder} 
             level={0} // Start at level 0
             currentFolderId={currentFolderId}
             onFetchChildren={fetchChildren} // Pass fetch function
           />
         ))}
       </div>
     )}

      {/* Optional: Add New Folder Button */}
      {/* 
      <div className="mt-auto pt-4 border-t">
          <Button variant="outline" className="w-full">
              New Folder
          </Button>
      </div> 
      */}
    </aside>
  );
}; 