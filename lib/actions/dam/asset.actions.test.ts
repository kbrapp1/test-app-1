// @ts-nocheck

import { vi } from 'vitest';

// Mock Supabase client (more complete for repository calls if not fully mocked)
var mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  containedBy: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  abortSignal: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }), // Default to prevent breaking chains
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: { getUser: vi.fn() },
  storage: {
    from: vi.fn().mockReturnThis(),
    upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
    download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'mock-url' }, error: null }),
    // Add other storage methods if necessary
  },
};

var mockGetActiveOrganizationId = vi.fn();

// Mock the NEW repository locations and their functions
const mockGetAssetByIdFromDb = vi.fn();
const mockUpdateAssetFolderInDb = vi.fn();
vi.mock('@/lib/repositories/asset-repo', () => ({
  getAssetByIdFromDb: mockGetAssetByIdFromDb,
  updateAssetFolderInDb: mockUpdateAssetFolderInDb,
  // Add other functions from asset-repo if needed by other tests in this file
}));

const mockGetFolderById = vi.fn();
vi.mock('@/lib/repositories/folder-repo', () => ({
  getFolderById: mockGetFolderById,
  // Add other functions from folder-repo if needed by other tests in this file
}));

// Module Mocks for auth and cache
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock next/cache revalidatePath
vi.mock('next/cache');

// Mock auth server action
vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: mockGetActiveOrganizationId,
}));

// Imports after mocks
import { describe, it, expect, beforeEach, afterEach, beforeAll, Mock } from 'vitest';
// Import the actions under test
let moveAsset: typeof import('@/lib/actions/dam/asset.actions').moveAsset;
let revalidatePath: typeof import('next/cache').revalidatePath;

beforeAll(async () => {
  const damModule = await import('@/lib/actions/dam/asset.actions');
  moveAsset = damModule.moveAsset;
  const cacheModule = await import('next/cache');
  revalidatePath = cacheModule.revalidatePath as Mock; // Cast to Mock
});

// Constants for testing
describe('moveAsset - core logic', () => {
  const MOCK_USER_ID = 'user-123';
  const MOCK_ORG_ID = 'org-123';
  const MOCK_ASSET_ID = 'asset-123';
  const MOCK_FOLDER_ID = 'folder-123';
  const mockUser = { id: MOCK_USER_ID };
  const mockAssetDbRecord = { id: MOCK_ASSET_ID, folder_id: 'some-other-folder', organization_id: MOCK_ORG_ID, storage_path: 'path/asset.jpg' };
  const mockFolderDbRecord = { id: MOCK_FOLDER_ID, organization_id: MOCK_ORG_ID, name: 'Test Folder' };

  beforeEach(() => {
    vi.resetAllMocks(); 
    // Reset Supabase client mocks that return promises or specific values
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSupabaseClient.single.mockReset().mockResolvedValue({ data: null, error: null }); // Reset and provide default
    mockSupabaseClient.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.rpc.mockReset().mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.storage.upload.mockReset().mockResolvedValue({ data: { path: 'mock-path' }, error: null });
    mockSupabaseClient.storage.download.mockReset().mockResolvedValue({ data: new Blob(), error: null });
    mockSupabaseClient.storage.remove.mockReset().mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.storage.createSignedUrl.mockReset().mockResolvedValue({ data: { signedUrl: 'mock-url' }, error: null });

    // Reset and re-mock chainable methods on the main client
    Object.keys(mockSupabaseClient).forEach(key => {
        if (typeof mockSupabaseClient[key] === 'function' && key !== 'auth' && key !== 'storage' && key !== 'rpc' && key !== 'single' && key !== 'maybeSingle') {
            (mockSupabaseClient[key] as Mock).mockReset().mockReturnThis();
        }
    });
     // Reset and re-mock chainable methods on storage.from()
    (mockSupabaseClient.storage.from as Mock).mockReset().mockReturnThis();


    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);
    
    // Ensure revalidatePath is a mock function for assertions
    if (typeof revalidatePath !== 'function' || !revalidatePath.mock) {
        revalidatePath = vi.fn() as Mock;
    }
    (revalidatePath as Mock).mockClear();


    // Reset specific repo function mocks
    mockGetAssetByIdFromDb.mockReset();
    mockGetFolderById.mockReset();
    mockUpdateAssetFolderInDb.mockReset();
  });

  it('fails if user not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });
    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not authenticated');
  });

  it('fails if active organization not found', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(null);
    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization not found.');
  });

  it('fails if asset not in organization (repo returns no data)', async () => {
    mockGetAssetByIdFromDb.mockResolvedValue({ data: null, error: null });
    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Asset not found in this organization.');
    expect(mockGetAssetByIdFromDb).toHaveBeenCalledWith(MOCK_ASSET_ID, MOCK_ORG_ID, 'id, folder_id, organization_id');
    expect(mockGetFolderById).not.toHaveBeenCalled();
  });

  it('fails if asset fetch from repo errors', async () => {
    mockGetAssetByIdFromDb.mockResolvedValue({ data: null, error: new Error('Repo down') });
    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Error finding asset: Repo down');
    expect(mockGetAssetByIdFromDb).toHaveBeenCalledWith(MOCK_ASSET_ID, MOCK_ORG_ID, 'id, folder_id, organization_id');
    expect(mockGetFolderById).not.toHaveBeenCalled();
  });

  it('fails if target folder not in organization (repo returns no data for folder)', async () => {
    mockGetAssetByIdFromDb.mockResolvedValue({ data: mockAssetDbRecord, error: null });
    mockGetFolderById.mockResolvedValue({ data: null, error: null }); 

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Target folder not found in this organization.');
    expect(mockGetAssetByIdFromDb).toHaveBeenCalledWith(MOCK_ASSET_ID, MOCK_ORG_ID, 'id, folder_id, organization_id');
    expect(mockGetFolderById).toHaveBeenCalledWith(MOCK_FOLDER_ID, MOCK_ORG_ID);
  });
  
  it('fails if target folder fetch from repo errors', async () => {
    mockGetAssetByIdFromDb.mockResolvedValue({ data: mockAssetDbRecord, error: null });
    mockGetFolderById.mockResolvedValue({ data: null, error: new Error('Folder repo down') });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Error finding target folder: Folder repo down');
    expect(mockGetFolderById).toHaveBeenCalledWith(MOCK_FOLDER_ID, MOCK_ORG_ID);
  });

  it('succeeds when moving asset to new folder', async () => {
    mockGetAssetByIdFromDb.mockResolvedValue({ data: mockAssetDbRecord, error: null });
    mockGetFolderById.mockResolvedValue({ data: mockFolderDbRecord, error: null });
    mockUpdateAssetFolderInDb.mockResolvedValue({ data: null, error: null });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockGetAssetByIdFromDb).toHaveBeenCalledWith(MOCK_ASSET_ID, MOCK_ORG_ID, 'id, folder_id, organization_id');
    expect(mockGetFolderById).toHaveBeenCalledWith(MOCK_FOLDER_ID, MOCK_ORG_ID);
    expect(mockUpdateAssetFolderInDb).toHaveBeenCalledWith(MOCK_ASSET_ID, MOCK_FOLDER_ID, MOCK_ORG_ID);
    expect(revalidatePath).toHaveBeenCalledWith('/dam', 'layout');
  });
  
  it('succeeds when moving asset to root (targetFolderId is null)', async () => {
    mockGetAssetByIdFromDb.mockResolvedValue({ data: mockAssetDbRecord, error: null });
    mockUpdateAssetFolderInDb.mockResolvedValue({ data: null, error: null });

    const result = await moveAsset(MOCK_ASSET_ID, null);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockGetAssetByIdFromDb).toHaveBeenCalledWith(MOCK_ASSET_ID, MOCK_ORG_ID, 'id, folder_id, organization_id');
    expect(mockGetFolderById).not.toHaveBeenCalled();
    expect(mockUpdateAssetFolderInDb).toHaveBeenCalledWith(MOCK_ASSET_ID, null, MOCK_ORG_ID);
    expect(revalidatePath).toHaveBeenCalledWith('/dam', 'layout');
  });

  it('fails if updateAssetFolderInDb repo call fails', async () => {
    mockGetAssetByIdFromDb.mockResolvedValue({ data: mockAssetDbRecord, error: null });
    mockGetFolderById.mockResolvedValue({ data: mockFolderDbRecord, error: null });
    mockUpdateAssetFolderInDb.mockResolvedValue({ data: null, error: new Error('DB update failed') });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to update asset folder: DB update failed');
  });
});
// Add describe blocks for deleteAsset, listTextAssets, getAssetContent, updateAssetText, saveAsNewTextAsset, getAssetDownloadUrl
// They will also need to mock the corresponding repository functions.
// For example, for deleteAsset:
// const mockDeleteAssetRecordFromDb = vi.fn();
// const mockRemoveAssetFromStorage = vi.fn();
// vi.mock('@/lib/repositories/dam-repo', async (importOriginal) => {
//   const original = await importOriginal();
//   return {
//     ...original,
//     getAssetByIdFromDb: mockGetAssetByIdFromDb,
//     deleteAssetRecordFromDb: mockDeleteAssetRecordFromDb,
//     removeAssetFromStorage: mockRemoveAssetFromStorage,
//   };
// });
// And then in tests:
// mockGetAssetByIdFromDb.mockResolvedValue({ data: mockAssetDbRecord, error: null });
// mockRemoveAssetFromStorage.mockResolvedValue({ data: null, error: null });
// mockDeleteAssetRecordFromDb.mockResolvedValue({ data: null, error: null });
// ... test deleteAsset ...