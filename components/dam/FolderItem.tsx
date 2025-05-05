import React, { useState } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Folder } from '@/types/dam';

export interface FolderItemProps {
  folder: Folder;
  level: number;
  currentFolderId: string | null;
  onFetchChildren: (folderId: string) => Promise<Folder[]>;
}

/**
 * Recursive component that renders a folder item with expand/collapse functionality
 * Handles fetching children folders when expanded
 */
export function FolderItem({ 
  folder, 
  level, 
  currentFolderId, 
  onFetchChildren 
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<Folder[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const handleToggleExpand = async () => {
    const currentlyExpanded = isExpanded;
    setIsExpanded(!currentlyExpanded);

    // Fetch children only if expanding and haven't fetched yet
    if (!currentlyExpanded && children === null) {
      setIsLoading(true);
      setHasError(false); // Reset error state
      try {
        // No need to filter again as our hook already returns only folders
        const fetchedChildren = await onFetchChildren(folder.id);
        setChildren(fetchedChildren);
      } catch (error) {
        setHasError(true);
        setChildren([]); // Set empty array to prevent repeated fetches
        toast({
          variant: "destructive",
          title: "Failed to load subfolders",
          description: `Could not load subfolders for "${folder.name}". Please try again.`
        });
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
          className="p-1 h-4 w-4 mr-1 flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-spin h-4 w-4">⏳</span>
          ) : hasError ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        <Link href={`/dam?folderId=${folder.id}`} className="flex-1 flex items-center truncate">
          <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate font-medium text-sm" title={folder.name}>{folder.name}</span>
        </Link>
      </div>
      
      {/* Render Children Recursively */}
      <div className="mt-1">
        {isExpanded && children && children.map(child => (
          <FolderItem 
            key={child.id} 
            folder={child} 
            level={level + 1} 
            currentFolderId={currentFolderId}
            onFetchChildren={onFetchChildren}
          />
        ))}
      </div>
    </div>
  );
} 