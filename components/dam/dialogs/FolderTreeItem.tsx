import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderIcon, ChevronRightIcon, ChevronDownIcon, Loader2 } from 'lucide-react';
// import type { TreeNode } from './FolderPickerDialog'; // REMOVED: Old import
import type { FolderNode } from '@/lib/store/folderStore'; // ADDED: New import

export interface FolderTreeItemProps {
  node: FolderNode; // MODIFIED: to use FolderNode
  level: number;
  selectedFolderId: string | null | undefined;
  currentAssetFolderId?: string | null;
  onSelect: (folderId: string) => void;
  // expandedFolders: Set<string>; // REMOVED: Prop no longer needed
  toggleExpand: (folderId: string) => void;
  isSelectable?: (node: FolderNode) => boolean; // MODIFIED: to use FolderNode
}

export const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  node,
  level,
  selectedFolderId,
  currentAssetFolderId,
  onSelect,
  // expandedFolders, // REMOVED
  toggleExpand,
  isSelectable = () => true,
}) => {
  const isCurrent = node.id === currentAssetFolderId;
  const isSelected = selectedFolderId === node.id;
  const isExpanded = node.isExpanded; // MODIFIED: Directly use node.isExpanded
  const canSelectNode = !isCurrent && isSelectable(node);

  // MODIFIED: node.has_children is from DomainFolder, node.isLoading from FolderNode (store state)
  const hasChildrenToDisplay = node.has_children || (node.children && node.children.length > 0);

  return (
    <div className='flex flex-col'>
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className={`w-full justify-start text-left h-auto py-2 pr-3 flex items-center ${
          !canSelectNode ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{ paddingLeft: `${0.75 + level * 1.25}rem` }}
        onClick={() => canSelectNode && onSelect(node.id)}
        disabled={!canSelectNode}
        aria-pressed={isSelected}
        role="treeitem"
        aria-expanded={hasChildrenToDisplay ? isExpanded : undefined}
      >
        {node.isLoading ? ( // MODIFIED: node.isLoadingChildren to node.isLoading
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : hasChildrenToDisplay ? (
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
          <span className="w-6 mr-1"></span> // Placeholder for alignment
        )}
        <FolderIcon className={`w-4 h-4 mr-2 flex-shrink-0`} />
        <span className='truncate'>{node.name}</span>
        {isCurrent && <span className="ml-auto text-xs text-muted-foreground">(Current)</span>}
      </Button>
      {isExpanded && node.children && node.children.length > 0 && (
        <div className='pl-0' role="group">
          {node.children.map(childNode => (
            <FolderTreeItem
              key={childNode.id}
              node={childNode}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              currentAssetFolderId={currentAssetFolderId}
              onSelect={onSelect}
              // expandedFolders={expandedFolders} // REMOVED
              toggleExpand={toggleExpand}
              isSelectable={isSelectable}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 