import { type FolderNode } from './folderStore';
import { type Folder } from '@/types/dam';

// Helper to recursively find a node by ID
export const findNodeById = (nodes: FolderNode[], folderId: string): FolderNode | null => {
  for (const node of nodes) {
    if (node.id === folderId) return node;
    if (node.children) {
      const foundInChildren = findNodeById(node.children, folderId);
      if (foundInChildren) return foundInChildren;
    }
  }
  return null;
};

// Helper to recursively find and update a folder node
export const findAndUpdateNode = (
  nodes: FolderNode[], 
  folderId: string, 
  updateFn: (node: FolderNode) => Partial<FolderNode>
): FolderNode[] => {
  return nodes.map(node => {
    if (node.id === folderId) {
      return { ...node, ...updateFn(node) };
    }
    if (node.children) {
      return { ...node, children: findAndUpdateNode(node.children, folderId, updateFn) };
    }
    return node;
  });
};

// Helper to recursively find and remove a folder node
export const findAndRemoveNode = (nodes: FolderNode[], folderId: string): FolderNode[] => {
  return nodes.filter(node => {
    if (node.id === folderId) {
      return false; // Remove this node
    }
    if (node.children) {
      node.children = findAndRemoveNode(node.children, folderId);
    }
    return true; // Keep other nodes
  });
};

// Helper to add a folder to the correct parent
export const addNodeToParent = (
    nodes: FolderNode[], 
    newFolder: FolderNode,
    folderMapForAncestors?: Map<string, FolderNode> // Optional, for finding parents by ID
): FolderNode[] => {
    if (newFolder.parent_folder_id === null) {
        const newNodes = [...nodes, newFolder];
        return newNodes.sort((a, b) => a.name.localeCompare(b.name));
    }
    return nodes.map(node => {
        if (node.id === newFolder.parent_folder_id) {
            const updatedChildren = node.children ? [...node.children, newFolder].sort((a, b) => a.name.localeCompare(b.name)) : [newFolder];
            return { ...node, children: updatedChildren };
        }
        if (node.children) {
            return { ...node, children: addNodeToParent(node.children, newFolder, folderMapForAncestors) };
        }
        return node;
    });
};

// Helper to build a map of all nodes for quick lookup
export const buildNodeMap = (nodes: FolderNode[]): Map<string, FolderNode> => {
  const map = new Map<string, FolderNode>();
  const recurse = (currentNodes: FolderNode[]) => {
    for (const node of currentNodes) {
      map.set(node.id, node);
      if (node.children) {
        recurse(node.children);
      }
    }
  };
  recurse(nodes);
  return map;
}; 