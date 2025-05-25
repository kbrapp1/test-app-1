// Define the structure for raw folder data from the server
export interface RawFolderData {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

// Define the structure for a folder node in the tree
export interface FolderTreeNode {
  id: string;
  name: string;
  children: FolderTreeNode[];
  parent_folder_id: string | null;
}

// Helper function to build the tree (internal)
const buildFolderTree = (folders: RawFolderData[]): FolderTreeNode[] => {
  const folderMap = new Map<string, FolderTreeNode>();
  const tree: FolderTreeNode[] = [];

  // Initialize map and add children arrays
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  // Populate children
  folders.forEach(folder => {
    if (folder.parent_folder_id && folderMap.has(folder.parent_folder_id)) {
      folderMap.get(folder.parent_folder_id)!.children.push(folderMap.get(folder.id)!);
    } else if (!folder.parent_folder_id) {
      tree.push(folderMap.get(folder.id)!);
    }
  });
  
  // Sort children alphabetically at each level
  const sortChildren = (nodes: FolderTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(node => sortChildren(node.children));
  };
  sortChildren(tree);

  return tree;
};

// Helper function to get ancestors of a folder (internal)
const getAncestors = (folderId: string, allFoldersMap: Map<string, RawFolderData>): Set<string> => {
  const ancestors = new Set<string>();
  let currentId: string | null = folderId;
  while (currentId) {
    const folder = allFoldersMap.get(currentId);
    if (folder) {
      // Add the current folder's ID itself as an ancestor for filtering purposes (it needs to be included)
      // The original logic added folder.id in the loop, here we ensure parent_folder_id is what's traversed up.
      // The matchedAndAncestorIds set is intended to keep folders that either match OR are ancestors of a match.
      // So, if 'folderId' is a match, it should be in the set. If its parent is an ancestor, it should be too.
      // The original getAncestors in PickerDialog adds folder.id, which is correct. Let's stick to that.
       ancestors.add(folder.id); 
      currentId = folder.parent_folder_id;
    } else {
      currentId = null;
    }
  }
  return ancestors;
};

export const prepareTreeData = (
  rawFolders: RawFolderData[],
  searchTerm: string
): { tree: FolderTreeNode[]; idsToExpandOnSearch: Set<string> } => {
  const lowerSearchTerm = searchTerm.toLowerCase();
  const idsToExpandOnSearch = new Set<string>();

  if (!searchTerm) {
    return { tree: buildFolderTree(rawFolders), idsToExpandOnSearch };
  }

  const allFoldersMap = new Map(rawFolders.map(f => [f.id, f]));
  const matchedAndAncestorIds = new Set<string>();

  rawFolders.forEach(folder => {
    if (folder.name.toLowerCase().includes(lowerSearchTerm)) {
      // If a folder matches, add it and all its ancestors to the set
      const ancestorsOfMatch = getAncestors(folder.id, allFoldersMap);
      ancestorsOfMatch.forEach(id => matchedAndAncestorIds.add(id));
    }
  });
  
  const filteredRawFolders = rawFolders.filter(folder => matchedAndAncestorIds.has(folder.id));
  const finalTree = buildFolderTree(filteredRawFolders);
  
  // Collect IDs to expand for the search results from the final filtered tree
  // We expand a node if it's in the filtered tree and has children
  const collectIdsForExpansion = (nodes: FolderTreeNode[]) => {
    nodes.forEach(node => {
      if (node.children.length > 0) { // Only add if it has children to expand
        idsToExpandOnSearch.add(node.id);
      }
      collectIdsForExpansion(node.children); // Recurse
    });
  };
  collectIdsForExpansion(finalTree);

  return { tree: finalTree, idsToExpandOnSearch };
}; 
