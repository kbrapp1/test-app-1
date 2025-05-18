import { describe, it, expect } from 'vitest';
import { prepareTreeData, RawFolderData, FolderTreeNode } from './folderPickerUtils';

describe('folderPickerUtils - prepareTreeData', () => {
  const createRawFolder = (id: string, name: string, parent_folder_id: string | null = null): RawFolderData => ({
    id,
    name,
    parent_folder_id,
  });

  it('should return an empty tree and empty expansion set for empty rawFolders', () => {
    const { tree, idsToExpandOnSearch } = prepareTreeData([], '');
    expect(tree).toEqual([]);
    expect(idsToExpandOnSearch).toEqual(new Set());
  });

  it('should return the full, sorted tree when no search term is provided', () => {
    const rawFolders: RawFolderData[] = [
      createRawFolder('folderC', 'Folder C'),
      createRawFolder('folderA', 'Folder A'),
      createRawFolder('folderB', 'Folder B', 'folderA'),
    ];
    const { tree, idsToExpandOnSearch } = prepareTreeData(rawFolders, '');
    expect(tree).toEqual([
      {
        id: 'folderA',
        name: 'Folder A',
        parent_folder_id: null,
        children: [
          {
            id: 'folderB',
            name: 'Folder B',
            parent_folder_id: 'folderA',
            children: [],
          },
        ],
      },
      {
        id: 'folderC',
        name: 'Folder C',
        parent_folder_id: null,
        children: [],
      },
    ]);
    expect(idsToExpandOnSearch).toEqual(new Set()); // No search term, so no specific expansion needed beyond default
  });

  it('should sort folders alphabetically at each level', () => {
    const rawFolders: RawFolderData[] = [
      createRawFolder('root1', 'Z Root'),
      createRawFolder('root2', 'A Root'),
      createRawFolder('child1B', 'B Child', 'root1'),
      createRawFolder('child1A', 'A Child', 'root1'),
      createRawFolder('child2C', 'C Child', 'root2'),
    ];
    const { tree } = prepareTreeData(rawFolders, '');
    expect(tree[0].name).toBe('A Root');
    expect(tree[1].name).toBe('Z Root');
    expect(tree[1].children[0].name).toBe('A Child');
    expect(tree[1].children[1].name).toBe('B Child');
  });

  describe('Search Functionality', () => {
    const rawFolders: RawFolderData[] = [
      createRawFolder('f1', 'Root Alpha'),
      createRawFolder('f2', 'Root Beta', 'f1'),
      createRawFolder('f3', 'Child Beta Gamma', 'f2'),
      createRawFolder('f4', 'Root Delta'),
      createRawFolder('f5', 'Another Alpha', 'f4'),
      createRawFolder('f6', 'Unique Term Here', 'f4'),
    ];

    it('should filter tree based on search term (match in root)', () => {
      const { tree, idsToExpandOnSearch } = prepareTreeData(rawFolders, 'Alpha');
      expect(tree.length).toBe(2);
      expect(tree.find(f => f.id === 'f1')).toBeDefined();
      expect(tree.find(f => f.id === 'f4')).toBeDefined();
      expect(tree.find(f => f.id === 'f1')?.children.length).toBe(0);
      expect(tree.find(f => f.id === 'f4')?.children.length).toBe(1);
      expect(tree.find(f => f.id === 'f4')?.children[0].id).toBe('f5');
      
      expect(idsToExpandOnSearch).toEqual(new Set(['f4']));
    });

    it('should filter tree and include ancestors (match in child)', () => {
      const { tree, idsToExpandOnSearch } = prepareTreeData(rawFolders, 'Gamma');
      expect(tree.length).toBe(1); 
      expect(tree[0].id).toBe('f1'); // Root Alpha
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].id).toBe('f2'); // Root Beta
      expect(tree[0].children[0].children.length).toBe(1);
      expect(tree[0].children[0].children[0].id).toBe('f3'); // Child Beta Gamma

      // f1 and f2 should be expanded as they are ancestors of the match and have children
      expect(idsToExpandOnSearch).toEqual(new Set(['f1', 'f2']));
    });

    it('should return an empty tree if no folder matches the search term', () => {
      const { tree, idsToExpandOnSearch } = prepareTreeData(rawFolders, 'NonExistent');
      expect(tree).toEqual([]);
      expect(idsToExpandOnSearch).toEqual(new Set());
    });

    it('should perform case-insensitive search', () => {
      const { tree, idsToExpandOnSearch } = prepareTreeData(rawFolders, 'alpha');
      expect(tree.length).toBe(2);
      expect(tree.find(f => f.id === 'f1')).toBeDefined(); // Root Alpha
      expect(tree.find(f => f.id === 'f4')).toBeDefined(); // Root Delta (parent of Another Alpha)
      expect(idsToExpandOnSearch).toEqual(new Set(['f4']));
    });

    it('should correctly identify idsToExpandOnSearch for a filtered tree', () => {
      const { idsToExpandOnSearch } = prepareTreeData(rawFolders, 'Unique');
      // f4 is parent of 'Unique Term Here', so f4 should be expanded.
      // The matched node f6 has no children, so it's not in the set.
      expect(idsToExpandOnSearch).toEqual(new Set(['f4']));
    });
  });

  it('should handle a more complex tree structure with search and expansion', () => {
    const rawFolders: RawFolderData[] = [
      createRawFolder('r1', 'Photos'),
      createRawFolder('r1_c1', 'Summer 2023', 'r1'),
      createRawFolder('r1_c1_gc1', 'Beach Days', 'r1_c1'),
      createRawFolder('r1_c2', 'Winter 2023', 'r1'),
      createRawFolder('r1_c2_gc1', 'Ski Trip', 'r1_c2'), // Match 'Ski'
      createRawFolder('r2', 'Documents'),
      createRawFolder('r2_c1', 'Work', 'r2'),
      createRawFolder('r2_c1_gc1', 'Project Ski Reports', 'r2_c1'), // Match 'Ski'
      createRawFolder('r3', 'Empty Folder'),
      createRawFolder('r4', 'Another Ski Folder', 'r2'), // Direct match 'Ski'
    ];

    const { tree, idsToExpandOnSearch } = prepareTreeData(rawFolders, 'Ski');
    
    // Expected structure: 
    // Photos (r1) -> Winter 2023 (r1_c2) -> Ski Trip (r1_c2_gc1)
    // Documents (r2) -> Work (r2_c1) -> Project Ski Reports (r2_c1_gc1)
    // Documents (r2) -> Another Ski Folder (r4)

    expect(tree.length).toBe(2); // Photos and Documents roots
    const photosRoot = tree.find(f => f.id === 'r1');
    const documentsRoot = tree.find(f => f.id === 'r2');

    expect(photosRoot).toBeDefined();
    expect(photosRoot!.children.length).toBe(1);
    expect(photosRoot!.children[0].id).toBe('r1_c2'); // Winter 2023
    expect(photosRoot!.children[0].children.length).toBe(1);
    expect(photosRoot!.children[0].children[0].id).toBe('r1_c2_gc1'); // Ski Trip

    expect(documentsRoot).toBeDefined();
    expect(documentsRoot!.children.length).toBe(2); // Work and Another Ski Folder
    const workFolder = documentsRoot!.children.find(f => f.id === 'r2_c1');
    const anotherSkiFolder = documentsRoot!.children.find(f => f.id === 'r4');

    expect(workFolder).toBeDefined();
    expect(workFolder!.children.length).toBe(1);
    expect(workFolder!.children[0].id).toBe('r2_c1_gc1'); // Project Ski Reports

    expect(anotherSkiFolder).toBeDefined();
    expect(anotherSkiFolder!.children.length).toBe(0);

    // Expected expansions: r1, r1_c2, r2, r2_c1
    // r4 is not expanded as it has no children in the filtered tree.
    // r1_c2_gc1 and r2_c1_gc1 are leaf nodes in the filtered tree.
    expect(idsToExpandOnSearch).toEqual(new Set(['r1', 'r1_c2', 'r2', 'r2_c1']));
  });

   it('should not include folders in idsToExpandOnSearch if they have no children in the filtered tree', () => {
    const rawFolders: RawFolderData[] = [
      createRawFolder('f1', 'Root Alpha'),
      createRawFolder('f2', 'Alpha Child', 'f1'), // This matches, but has no children
    ];
    const { tree, idsToExpandOnSearch } = prepareTreeData(rawFolders, 'Alpha');
    
    // Tree will be: Root Alpha -> Alpha Child
    expect(tree.length).toBe(1);
    expect(tree[0].id).toBe('f1');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].id).toBe('f2');

    // f1 should be in expand set because it has 'Alpha Child'
    // f2 ('Alpha Child') should NOT be because it has no children itself.
    expect(idsToExpandOnSearch).toEqual(new Set(['f1']));
  });

}); 