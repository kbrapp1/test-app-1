import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderIcon, ChevronRightIcon, ChevronDownIcon } from 'lucide-react';
import type { FolderTreeNode } from './folderPickerUtils'; // Import the tree node type

export interface FolderTreeItemProps {
  node: FolderTreeNode;
  level: number;
  selectedFolderId: string | null | undefined;
  currentAssetFolderId?: string | null;
  onSelect: (folderId: string) => void;
  expandedFolders: Set<string>;
  toggleExpand: (folderId: string) => void;
  // searchTerm is not directly used by FolderTreeItem for filtering its own display,
  // as filtering is handled by prepareTreeData which constructs the tree passed to FolderTreeItem.
  // If searchTerm were used for highlighting, it could be kept.
  // For now, removing it if it's not used for highlighting or other direct logic here.
  // searchTerm: string; 
}

export const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  node,
  level,
  selectedFolderId,
  currentAssetFolderId,
  onSelect,
  expandedFolders,
  toggleExpand,
}) => {
  const isCurrent = node.id === currentAssetFolderId;
  const isSelected = selectedFolderId === node.id;
  const isExpanded = expandedFolders.has(node.id);

  return (
    <div className='flex flex-col'>
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className={`w-full justify-start text-left h-auto py-2 pr-3 flex items-center ${
          isCurrent ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{ paddingLeft: `${0.75 + level * 1.25}rem` }}
        onClick={() => !isCurrent && onSelect(node.id)}
        disabled={isCurrent}
        aria-pressed={isSelected}
        role="treeitem"
        aria-expanded={node.children.length > 0 ? isExpanded : undefined}
      >
        {node.children.length > 0 ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            onClick={(e) => { 
              e.stopPropagation(); 
              toggleExpand(node.id); 
            }}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.stopPropagation();
                toggleExpand(node.id);
              }
            }}
            className="h-6 w-6 mr-1 p-0 flex items-center justify-center cursor-pointer rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </span>
        ) : (
          <span className="w-6 mr-1"></span> // Placeholder for alignment if no children
        )}
        <FolderIcon className={`w-4 h-4 mr-2 flex-shrink-0`} />
        <span className='truncate'>{node.name}</span>
        {isCurrent && <span className="ml-auto text-xs text-muted-foreground">(Current)</span>}
      </Button>
      {isExpanded && node.children.length > 0 && (
        <div className='pl-0' role="group"> {/* pl-0 as padding is handled by child items */}
          {node.children.map(childNode => (
            <FolderTreeItem
              key={childNode.id}
              node={childNode}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              currentAssetFolderId={currentAssetFolderId}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 