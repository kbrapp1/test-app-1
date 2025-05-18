/// <reference types="vitest/globals" />
import { NextRequest, NextResponse } from 'next/server';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { getHandler } from './route'; // Assuming getHandler is exported for testing
import { CombinedItem, Folder, Asset } from '@/types/dam';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

vi.mock('@/lib/supabase/db-queries', () => ({
  queryData: vi.fn(),
}));

vi.mock('./dam-api.helpers', () => ({
  getAssetIdsForTagFilter: vi.fn(),
  buildAssetBaseQueryInternal: vi.fn(),
  transformAndEnrichData: vi.fn(),
  applyQuickSearchLimits: vi.fn(),
}));

// Import mocked functions to spy on them or set their implementation
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { queryData } from '@/lib/supabase/db-queries';
import {
  getAssetIdsForTagFilter,
  buildAssetBaseQueryInternal,
  transformAndEnrichData,
  applyQuickSearchLimits,
  RawAssetFromApi, // Import if needed for mock data typing
  TransformedDataReturn
} from './dam-api.helpers';


describe('API GET /api/dam', () => {
  let mockRequest: NextRequest;
  let mockUser: User;
  let mockSupabaseClient: SupabaseClient;

  const createMockQueryBuilder = (defaultResponse: { data: any[] | null, error: any | null } = { data: [], error: null }) => {
    let currentResponse = { ...defaultResponse };
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      resolvesTo: (data: any[] | null, error: any | null = null) => {
        currentResponse = { data, error };
      },
      then: (onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) =>
        Promise.resolve(currentResponse).then(onFulfilled, onRejected),
    };
    return builder;
  };

  let folderQueryMockBuilder: ReturnType<typeof createMockQueryBuilder>;
  let assetQueryMockBuilder: ReturnType<typeof createMockQueryBuilder>;


  beforeEach(() => {
    vi.resetAllMocks(); // Reset mocks for each test

    mockUser = { id: 'user-123' } as User; // Simplified mock user

    folderQueryMockBuilder = createMockQueryBuilder();
    assetQueryMockBuilder = createMockQueryBuilder();
    
    mockSupabaseClient = {
      from: vi.fn((tableName: string) => {
        if (tableName === 'folders') return folderQueryMockBuilder;
        if (tableName === 'assets') return assetQueryMockBuilder; // Though typically buildAssetBaseQueryInternal handles assets
        return createMockQueryBuilder(); // Fallback
      }),
    } as unknown as SupabaseClient;

    (buildAssetBaseQueryInternal as Mock).mockReturnValue(assetQueryMockBuilder);
    (getActiveOrganizationId as Mock).mockResolvedValue('org-123');
    (transformAndEnrichData as Mock).mockImplementation(async (_supabase: SupabaseClient, _orgId: string, folders: any[] | null, assets: RawAssetFromApi[] | null) => ({
      foldersWithDetails: (folders || []).map((f: any) => ({ ...f, type: 'folder', ownerName: 'Mock Owner' } as unknown as Folder)),
      assetsWithDetails: (assets || []).map((a: RawAssetFromApi) => ({ ...a, type: 'asset', ownerName: 'Mock Owner', publicUrl: 'mock://url' } as unknown as Asset)),
    }));
    (applyQuickSearchLimits as Mock).mockImplementation((folders: Folder[], assets: Asset[]) => [...folders, ...assets]);
    (queryData as Mock).mockResolvedValue({ data: [], error: null });
    (getAssetIdsForTagFilter as Mock).mockResolvedValue(null);


    // Default request (can be overridden in tests)
    mockRequest = new NextRequest('http://localhost/api/dam') as NextRequest;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockRawAssets: RawAssetFromApi[] = [
    { id: 'asset-1', name: 'Asset 1', user_id: 'user-a', created_at: '2023-01-01T00:00:00Z', storage_path: '/a1.jpg', mime_type: 'image/jpeg', size: 100, folder_id: null, asset_tags: [], organization_id: 'org-123' },
  ];
  const mockRawFolders: any[] = [ // Using any[] for mockRawFolders as its elements are used directly in transformAndEnrichData mock
    { id: 'folder-1', name: 'Folder 1', user_id: 'user-b', created_at: '2023-01-02T00:00:00Z', parent_folder_id: null },
  ];

  it('should throw ValidationError if no active organization ID is found', async () => {
    (getActiveOrganizationId as Mock).mockResolvedValue(null);
    await expect(getHandler(mockRequest, mockUser, mockSupabaseClient))
      .rejects
      .toThrow('Active organization ID not found. Cannot fetch DAM data.');
  });

  describe('Browse Mode (no search term)', () => {
    it('should fetch root folder contents successfully', async () => {
      mockRequest = new NextRequest('http://localhost/api/dam?folderId=') as NextRequest;
      (queryData as Mock).mockResolvedValueOnce({ data: mockRawFolders, error: null }); // For folders in root
      assetQueryMockBuilder.resolvesTo(mockRawAssets);

      const response = await getHandler(mockRequest, mockUser, mockSupabaseClient);
      const result = await response.json();

      expect(queryData).toHaveBeenCalledWith(expect.anything(), 'folders', expect.any(String), expect.objectContaining({ isNull: 'parent_folder_id' }));
      expect(buildAssetBaseQueryInternal).toHaveBeenCalledWith(mockSupabaseClient, 'org-123', null);
      expect(assetQueryMockBuilder.is).toHaveBeenCalledWith('folder_id', null);
      expect(transformAndEnrichData).toHaveBeenCalledWith(mockSupabaseClient, 'org-123', mockRawFolders, mockRawAssets);
      expect(result.length).toBe(2); // 1 folder, 1 asset from mocks
      expect(result[0].name).toBe('Folder 1');
      expect(result[1].name).toBe('Asset 1');
    });

    it('should fetch specific folder contents successfully', async () => {
      mockRequest = new NextRequest('http://localhost/api/dam?folderId=folder-xyz') as NextRequest;
      const subfolderData = [{ id: 'subfolder-1', name: 'Subfolder' }];
      const assetInFolderData = [{ id: 'asset-in-folder', name: 'Asset in Folder' }];
      (queryData as Mock).mockResolvedValueOnce({ data: subfolderData, error: null });
      assetQueryMockBuilder.resolvesTo(assetInFolderData as RawAssetFromApi[]);
      
      (transformAndEnrichData as Mock).mockImplementationOnce(async (_supabase: SupabaseClient, _orgId: string, fd: any[] | null, ad: RawAssetFromApi[] | null) => ({
        foldersWithDetails: (fd || []).map(f => ({ ...f, type: 'folder' }) as any),
        assetsWithDetails: (ad || []).map(a => ({ ...a, type: 'asset' }) as any),
      }));

      const response = await getHandler(mockRequest, mockUser, mockSupabaseClient);
      const result = await response.json();

      expect(queryData).toHaveBeenCalledWith(expect.anything(), 'folders', expect.any(String), expect.objectContaining({ matchValue: 'folder-xyz' }));
      expect(assetQueryMockBuilder.eq).toHaveBeenCalledWith('folder_id', 'folder-xyz');
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Subfolder');
      expect(result[1].name).toBe('Asset in Folder');
    });
    
    it('should apply query limits in browse mode with quicksearch', async () => {
      mockRequest = new NextRequest('http://localhost/api/dam?quicksearch=true&limit=1') as NextRequest;
      (queryData as Mock).mockResolvedValueOnce({ data: mockRawFolders, error: null });
      assetQueryMockBuilder.resolvesTo(mockRawAssets);
      // applyQuickSearchLimits is NOT called in browse mode by design
      // (applyQuickSearchLimits as Mock).mockReturnValueOnce([ { id: 'folder-1', name: 'Folder 1', type: 'folder' } as unknown as CombinedItem ]);

      await getHandler(mockRequest, mockUser, mockSupabaseClient);
      
      expect((queryData as Mock).mock.calls[0][3].limit).toBe(1); // Math.ceil(1/2) = 1
      expect(assetQueryMockBuilder.limit).toHaveBeenCalledWith(1);
      expect(applyQuickSearchLimits).not.toHaveBeenCalled();
    });
  });

  describe('Search Mode (with search term)', () => {
    beforeEach(() => {
      mockRequest = new NextRequest('http://localhost/api/dam?q=test') as NextRequest;
      folderQueryMockBuilder.resolvesTo(mockRawFolders);
      assetQueryMockBuilder.resolvesTo(mockRawAssets);
    });

    it('should fetch search results successfully', async () => {
      const response = await getHandler(mockRequest, mockUser, mockSupabaseClient);
      const result = await response.json();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('folders');
      expect(folderQueryMockBuilder.ilike).toHaveBeenCalledWith('name', '%test%');
      expect(buildAssetBaseQueryInternal).toHaveBeenCalled();
      expect(assetQueryMockBuilder.ilike).toHaveBeenCalledWith('name', '%test%');
      expect(transformAndEnrichData).toHaveBeenCalledWith(mockSupabaseClient, 'org-123', mockRawFolders, mockRawAssets);
      expect(result.length).toBe(2);
    });

    it('should handle tagIds in search mode', async () => {
      mockRequest = new NextRequest('http://localhost/api/dam?q=test&tagIds=tag1,tag2') as NextRequest;
      (getAssetIdsForTagFilter as Mock).mockResolvedValueOnce(['asset-id-for-tag']);

      await getHandler(mockRequest, mockUser, mockSupabaseClient);

      expect(getAssetIdsForTagFilter).toHaveBeenCalledWith(mockSupabaseClient, 'tag1,tag2');
      expect(buildAssetBaseQueryInternal).toHaveBeenCalledWith(mockSupabaseClient, 'org-123', ['asset-id-for-tag']);
    });

    it('should apply quick search limits in search mode', async () => {
      mockRequest = new NextRequest('http://localhost/api/dam?q=test&quicksearch=true&limit=1') as NextRequest;
      const limitedCombinedItem = { id: 'asset-1', name: 'Asset 1', type: 'asset' } as unknown as CombinedItem;
      (applyQuickSearchLimits as Mock).mockReturnValueOnce([limitedCombinedItem]);
      (transformAndEnrichData as Mock).mockResolvedValueOnce({
        foldersWithDetails: mockRawFolders.map(f => ({ ...f, type: 'folder' }) as any),
        assetsWithDetails: mockRawAssets.map(a => ({ ...a, type: 'asset' }) as any),
      });

      const response = await getHandler(mockRequest, mockUser, mockSupabaseClient);
      const result = await response.json();
      
      expect(folderQueryMockBuilder.limit).toHaveBeenCalledWith(1); 
      expect(assetQueryMockBuilder.limit).toHaveBeenCalledWith(1);
      
      const transformedDataResult = await (transformAndEnrichData as Mock).mock.results[0].value;
      expect(applyQuickSearchLimits).toHaveBeenCalledWith(
        transformedDataResult.foldersWithDetails,
        transformedDataResult.assetsWithDetails,
        1
      );
      expect(result).toEqual([limitedCombinedItem]);
    });
  });
  
  it('should handle database errors for folders gracefully', async () => {
    (queryData as Mock).mockResolvedValueOnce({ data: null, error: new Error('Folder query failed') });
    assetQueryMockBuilder.resolvesTo(mockRawAssets);

    mockRequest = new NextRequest('http://localhost/api/dam') as NextRequest;

    await expect(getHandler(mockRequest, mockUser, mockSupabaseClient))
        .rejects
        .toThrow('Folder query failed');
  });

  it('should handle database errors for assets gracefully in browse mode', async () => {
    (queryData as Mock).mockResolvedValueOnce({ data: mockRawFolders, error: null }); 
    assetQueryMockBuilder.resolvesTo(null, new Error('Asset query failed in browse'));

    mockRequest = new NextRequest('http://localhost/api/dam') as NextRequest;

    await expect(getHandler(mockRequest, mockUser, mockSupabaseClient))
        .rejects
        .toThrow('Asset query failed in browse');
  });
  
  it('should handle database errors for assets gracefully in search mode', async () => {
    folderQueryMockBuilder.resolvesTo(mockRawFolders);
    assetQueryMockBuilder.resolvesTo(null, new Error('Asset query failed in search'));

    mockRequest = new NextRequest('http://localhost/api/dam?q=searchterm') as NextRequest;

    await expect(getHandler(mockRequest, mockUser, mockSupabaseClient))
        .rejects
        .toThrow('Asset query failed in search');
  });

  it('should return a NextResponse with JSON data', async () => {
    (queryData as Mock).mockResolvedValueOnce({ data: [], error: null });
    assetQueryMockBuilder.resolvesTo([]);
    (transformAndEnrichData as Mock).mockResolvedValueOnce({ foldersWithDetails: [], assetsWithDetails: [] });

    const response = await getHandler(mockRequest, mockUser, mockSupabaseClient);
    expect(response).toBeInstanceOf(NextResponse);
    const jsonData = await response.json();
    expect(jsonData).toEqual([]);
  });

});

// Note: To run these tests, you might need to export getHandler from './route.ts'
// e.g., in route.ts: export { getHandler }; (if not already)
// Or, test the exported GET method by mocking withAuth and withErrorHandling wrappers.
// Testing getHandler directly is generally simpler for unit tests. 