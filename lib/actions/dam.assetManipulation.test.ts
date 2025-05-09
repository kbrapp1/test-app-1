import { vi } from 'vitest';

// Mocks defined before vi.mock calls
var mockSupabaseClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn(function(this: any) { return this; }),
  select: vi.fn(function(this: any) { return this; }),
  match: vi.fn(function(this: any) { return this; }),
  update: vi.fn(function(this: any) { return this; }),
  insert: vi.fn(function(this: any) { return this; }),
  delete: vi.fn(function(this: any) { return this; }),
  single: vi.fn(),
  rpc: vi.fn(function(this: any) { return this; }),
  storage: {
    from: vi.fn(function(this: any) { return this; }),
    upload: vi.fn(),
    download: vi.fn(),
    remove: vi.fn(),
    getPublicUrl: vi.fn(),
  },
};
(mockSupabaseClient.storage.from as import('vitest').Mock).mockImplementation(function(this: any) { return this; });

var mockGetActiveOrganizationId = vi.fn();

// Module Mocks
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}));

// Use the manual mock for next/cache
vi.mock('next/cache'); 

vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: mockGetActiveOrganizationId,
}));

// Imports after mocks
import { describe, it, expect, beforeEach, afterEach, beforeAll, Mock } from 'vitest';
// Dynamically import modules after mocks
let moveAsset: typeof import('@/lib/actions/dam').moveAsset;
let revalidatePath: typeof import('next/cache').revalidatePath;
beforeAll(async () => {
  const damModule = await import('@/lib/actions/dam');
  moveAsset = damModule.moveAsset;
  const cacheModule = await import('next/cache');
  revalidatePath = cacheModule.revalidatePath;
});

// Constants
const MOCK_USER_ID = 'test-user-uuid';
const MOCK_ORG_ID = 'test-org-uuid-1';
const MOCK_OTHER_ORG_ID = 'test-org-uuid-2';
const MOCK_ASSET_ID = 'test-asset-uuid';
const MOCK_FOLDER_ID = 'test-folder-uuid';
const MOCK_ROOT_FOLDER_ID = null;

const mockUser = { id: MOCK_USER_ID, email: 'user@example.com' };
const mockAsset = {
  id: MOCK_ASSET_ID,
  name: 'Test Asset.png',
  folder_id: MOCK_FOLDER_ID,
  user_id: MOCK_USER_ID,
  organization_id: MOCK_ORG_ID
};
const mockFolder = {
  id: MOCK_FOLDER_ID,
  name: 'Test Folder',
  user_id: MOCK_USER_ID,
  organization_id: MOCK_ORG_ID
};

describe('moveAsset - Multi-Tenancy & Core Logic', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // This should now reset the manual mock via Vitest's internals

    // Reset supabase client mocks
    mockSupabaseClient.auth.getUser.mockReset();
    (mockSupabaseClient.from as Mock).mockReset().mockImplementation(function(this: any) { return this; });
    (mockSupabaseClient.select as Mock).mockReset().mockImplementation(function(this: any) { return this; });
    (mockSupabaseClient.match as Mock).mockReset().mockImplementation(function(this: any) { return this; });
    (mockSupabaseClient.update as Mock).mockReset().mockImplementation(function(this: any) { return this; });
    (mockSupabaseClient.insert as Mock).mockReset().mockImplementation(function(this: any) { return this; });
    (mockSupabaseClient.delete as Mock).mockReset().mockImplementation(function(this: any) { return this; });
    (mockSupabaseClient.single as Mock).mockReset();
    (mockSupabaseClient.rpc as Mock).mockReset().mockImplementation(function(this: any) { return this; });
    (mockSupabaseClient.storage.from as Mock).mockReset().mockImplementation(function(this: any) { return this; });
    (mockSupabaseClient.storage.upload as Mock).mockReset();
    (mockSupabaseClient.storage.download as Mock).mockReset();
    (mockSupabaseClient.storage.remove as Mock).mockReset();
    (mockSupabaseClient.storage.getPublicUrl as Mock).mockReset();

    // Reset other mocks 
    // (revalidatePath from the manual mock is reset by resetAllMocks)
    mockGetActiveOrganizationId.mockReset();

    // Default setup
    (mockSupabaseClient.auth.getUser as Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);
  });

  // --- Test cases --- 
  // Tests now use the imported `revalidatePath` mock

  it('should FAIL to move an asset if the asset belongs to a DIFFERENT organization', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);

    (mockSupabaseClient.from as Mock).mockImplementationOnce((table: string) => {
      if (table === 'assets') {
        const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });
        const matchMock = vi.fn((matchArgs) => {
          if (matchArgs.id === MOCK_ASSET_ID && matchArgs.organization_id === MOCK_ORG_ID) {
            return { single: singleMock };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Unexpected match' } }) };
        });
        const selectMock = vi.fn().mockReturnValue({ match: matchMock });
        return { select: selectMock };
      }
      return { select: vi.fn().mockReturnThis(), match: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({data: null, error: null}) };
    });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Asset not found in this organization.');
    expect((mockSupabaseClient.update as Mock)).not.toHaveBeenCalled();
  });

  it('should FAIL to move an asset if the TARGET FOLDER belongs to a DIFFERENT organization', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);

    (mockSupabaseClient.from as Mock).mockImplementation((table: string) => {
      if (table === 'assets') {
        // Simulate asset in a different folder to avoid no-op
        const singleMock = vi.fn().mockResolvedValue({ data: { ...mockAsset, folder_id: 'different-folder-id', organization_id: MOCK_ORG_ID }, error: null });
        const matchMock = vi.fn((matchArgs) => {
          if (matchArgs.id === MOCK_ASSET_ID && matchArgs.organization_id === MOCK_ORG_ID) {
            return { single: singleMock };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Asset fallback'} }) };
        });
        const selectMock = vi.fn().mockReturnValue({ match: matchMock });
        return { select: selectMock, update: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'folders') {
        const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });
        const singleMockOtherOrg = vi.fn().mockResolvedValue({ data: { ...mockFolder, id: MOCK_FOLDER_ID, organization_id: MOCK_OTHER_ORG_ID }, error: null });
        const matchMock = vi.fn((matchArgs) => {
          if (matchArgs.id === MOCK_FOLDER_ID && matchArgs.organization_id === MOCK_ORG_ID) {
            return { single: singleMock };
          }
          if (matchArgs.id === MOCK_FOLDER_ID && matchArgs.organization_id === MOCK_OTHER_ORG_ID) {
            return { single: singleMockOtherOrg };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Folder fallback' } }) };
        });
        const selectMock = vi.fn().mockReturnValue({ match: matchMock });
        return { select: selectMock };
      }
      return {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({data: null, error: null})
      };
    });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Target folder not found in this organization.');
    expect((mockSupabaseClient.update as Mock)).not.toHaveBeenCalled();
  });

  it('should SUCCEED in moving an asset to a target folder within the SAME organization', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);
    const mockAssetUpdateMethod = vi.fn().mockResolvedValue({ error: null });

    (mockSupabaseClient.from as Mock).mockImplementation((table: string) => {
      if (table === 'assets') {
        const singleMock = vi.fn().mockResolvedValue({ data: { ...mockAsset, folder_id: 'some-other-folder-id', organization_id: MOCK_ORG_ID }, error: null });
        const matchMockAsset = vi.fn((matchArgs) => {
          if (matchArgs.id === MOCK_ASSET_ID && matchArgs.organization_id === MOCK_ORG_ID) {
            return { single: singleMock };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Asset fallback'} }) };
        });
        const selectMock = vi.fn().mockReturnValue({ match: matchMockAsset });

        const updateMatchMock = vi.fn((updateMatchArgs) => {
          expect(updateMatchArgs.id).toBe(MOCK_ASSET_ID);
          expect(updateMatchArgs.organization_id).toBe(MOCK_ORG_ID);
          return mockAssetUpdateMethod({ folder_id: MOCK_FOLDER_ID }); 
        });
        const updateMock = vi.fn().mockReturnValue({ match: updateMatchMock });

        return { select: selectMock, update: updateMock };
      }
      if (table === 'folders') {
        const singleMock = vi.fn().mockResolvedValue({ data: { ...mockFolder, organization_id: MOCK_ORG_ID }, error: null });
        const matchMockFolder = vi.fn((matchArgs) => {
          if (matchArgs.id === MOCK_FOLDER_ID && matchArgs.organization_id === MOCK_ORG_ID) {
            return { single: singleMock };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Folder fallback'} }) };
        });
        const selectMock = vi.fn().mockReturnValue({ match: matchMockFolder });
        return { select: selectMock };
      }
      return {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({data: null, error: null})
      };
    });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockAssetUpdateMethod).toHaveBeenCalledWith({ folder_id: MOCK_FOLDER_ID });
    expect(revalidatePath).toHaveBeenCalledWith('/dam'); // Use imported mock
  });

  it('should SUCCEED in moving an asset to the ROOT (null targetFolderId) within the SAME organization', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);
    const mockAssetUpdateMethod = vi.fn().mockResolvedValue({ error: null });

    (mockSupabaseClient.from as Mock).mockImplementation((table: string) => {
      if (table === 'assets') {
        const singleMock = vi.fn().mockResolvedValue({ data: { ...mockAsset, folder_id: MOCK_FOLDER_ID, organization_id: MOCK_ORG_ID }, error: null });
        const matchMockAsset = vi.fn((matchArgs) => {
          if (matchArgs.id === MOCK_ASSET_ID && matchArgs.organization_id === MOCK_ORG_ID) {
            return { single: singleMock };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Asset fallback' } }) };
        });
        const selectMock = vi.fn().mockReturnValue({ match: matchMockAsset });

        const updateMatchMock = vi.fn((updateMatchArgs) => {
          expect(updateMatchArgs.id).toBe(MOCK_ASSET_ID);
          expect(updateMatchArgs.organization_id).toBe(MOCK_ORG_ID);
          return mockAssetUpdateMethod({ folder_id: MOCK_ROOT_FOLDER_ID });
        });
        const updateMock = vi.fn().mockReturnValue({ match: updateMatchMock });

        return { select: selectMock, update: updateMock };
      }
      return {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({data: null, error: null})
      };
    });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_ROOT_FOLDER_ID);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockAssetUpdateMethod).toHaveBeenCalledWith({ folder_id: MOCK_ROOT_FOLDER_ID });
    expect(revalidatePath).toHaveBeenCalledWith('/dam'); // Use imported mock
  });

  it('should return success without DB write if asset is already in the target folder', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);

    (mockSupabaseClient.from as Mock).mockImplementationOnce((table: string) => {
      if (table === 'assets') {
        const singleMock = vi.fn().mockResolvedValue({ data: { ...mockAsset, folder_id: MOCK_FOLDER_ID, organization_id: MOCK_ORG_ID }, error: null });
        const matchMockAsset = vi.fn((matchArgs) => {
          if (matchArgs.id === MOCK_ASSET_ID && matchArgs.organization_id === MOCK_ORG_ID) {
            return { single: singleMock };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: null }) };
        });
        const selectMock = vi.fn().mockReturnValue({ match: matchMockAsset });
        return { select: selectMock }; 
      }
      return {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({data: null, error: null})
      };
    });

    const updateSpy = (mockSupabaseClient.update as Mock);

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(updateSpy).not.toHaveBeenCalled();
    const fromMock = mockSupabaseClient.from as Mock;
    const folderFromCall = fromMock.mock.calls.find(call => call[0] === 'folders');
    expect(folderFromCall).toBeUndefined();
    expect(revalidatePath).not.toHaveBeenCalled(); // Use imported mock
  });

  it('should FAIL if user is not authenticated', async () => {
    (mockSupabaseClient.auth.getUser as Mock).mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not authenticated');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should FAIL if active organization ID cannot be retrieved', async () => {
    (mockSupabaseClient.auth.getUser as Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetActiveOrganizationId.mockResolvedValue(null);

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization not found.');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should FAIL if asset fetch fails', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);
    (mockSupabaseClient.from as Mock).mockImplementation((table: string) => {
      if (table === 'assets') {
        const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB fetch error' } });
        const matchMock = vi.fn().mockReturnValue({ single: singleMock });
        const selectMock = vi.fn().mockReturnValue({ match: matchMock });
        return { select: selectMock };
      }
      return {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({data: null, error: null})
      };
    });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error finding asset: DB fetch error');
  });

  it('should FAIL if target folder fetch fails (when targetFolderId is not null)', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);

    (mockSupabaseClient.from as Mock)
      .mockImplementationOnce((table: string) => { // assets fetch - success
        if (table === 'assets') {
            const singleMock = vi.fn().mockResolvedValue({ data: { ...mockAsset, folder_id: 'some-other-id' }, error: null });
            const matchMock = vi.fn().mockReturnValue({ single: singleMock });
            const selectMock = vi.fn().mockReturnValue({ match: matchMock });
            return { select: selectMock };
        }
        return mockSupabaseClient;
      })
      .mockImplementationOnce((table: string) => { // folders fetch - failure
        if (table === 'folders') {
            const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Folder DB error' } });
            const matchMock = vi.fn().mockReturnValue({ single: singleMock });
            const selectMock = vi.fn().mockReturnValue({ match: matchMock });
            return { select: selectMock };
        }
         return mockSupabaseClient;
      });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error finding target folder: Folder DB error');
  });

  it('should FAIL if asset update fails', async () => {
    mockGetActiveOrganizationId.mockResolvedValue(MOCK_ORG_ID);

    // Mock supabase.from to handle both fetch and update for assets and folders
    (mockSupabaseClient.from as Mock).mockImplementation((table: string) => {
      if (table === 'assets') {
        const singleMock = vi.fn().mockResolvedValue({ data: { ...mockAsset, folder_id: 'another-folder' }, error: null });
        const matchMock = vi.fn().mockReturnValue({ single: singleMock });
        const selectMock = vi.fn().mockReturnValue({ match: matchMock });
        const failingUpdateMatch = vi.fn().mockReturnValue({ error: { message: 'DB update error' } });
        const updateMock = vi.fn().mockReturnValue({ match: failingUpdateMatch });
        return { select: selectMock, update: updateMock };
      }
      if (table === 'folders') {
        const singleMock = vi.fn().mockResolvedValue({ data: mockFolder, error: null });
        const matchMock = vi.fn().mockReturnValue({ single: singleMock });
        const selectMock = vi.fn().mockReturnValue({ match: matchMock });
        return { select: selectMock };
      }
      return mockSupabaseClient;
    });

    const result = await moveAsset(MOCK_ASSET_ID, MOCK_FOLDER_ID);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to update asset folder: DB update error');
  });
}); 