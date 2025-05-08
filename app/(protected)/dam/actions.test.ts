import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFolder, updateFolder, deleteFolder } from '@/lib/actions/dam/index';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// --- Set up dummy environment variables for Supabase client initialization during tests ---
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'; // Dummy URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummykey'; // Dummy key

// --- Mocking Next.js and Supabase dependencies ---

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  match: vi.fn().mockReturnThis(),
  single: vi.fn(),
  then: vi.fn(),
};

// Mock @/lib/supabase/server instead of @supabase/ssr directly
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient as unknown as SupabaseClient),
}));

// next/headers is still needed as @/lib/supabase/server uses it internally
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
};
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

interface FolderActionState {
  success: boolean;
  error?: string;
  folderId?: string;
}

// -- Test Suite for createFolder ---
describe('DAM Server Actions - createFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
    vi.mocked(getActiveOrganizationId).mockResolvedValue('test-org-id');
  });

  it('should successfully create a folder for an authenticated user with organization_id', async () => {
    const expectedFolderData = { id: 'new-folder-id' };
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedFolderData, error: null });
    const formData = new FormData();
    formData.append('name', '  Test Folder  ');
    formData.append('parentFolderId', '');
    const prevState: FolderActionState = { success: false, error: undefined, folderId: undefined };
    const result = await createFolder(prevState, formData);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.folderId).toBe(expectedFolderData.id);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('folders');
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Folder', 
      user_id: 'test-user-id', 
      organization_id: 'test-org-id',
    }));
    expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
  });

  it('should return an error if folder name is empty (createFolder)', async () => {
    const formData = new FormData();
    formData.append('name', '   ');
    formData.append('parentFolderId', '');
    const prevState: FolderActionState = { success: false, error: undefined, folderId: undefined };
    const result = await createFolder(prevState, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Folder name cannot be empty.');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should return an error if user is not authenticated (createFolder)', async () => {
    // Reset mocks specifically for this test
    vi.clearAllMocks();
    // Mock createClient to return a client where getUser specifically fails
    const specificMockClient = {
      ...mockSupabaseClient, // Include other methods if needed by early returns
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } })
      }
    };
    vi.mocked(createClient).mockReturnValue(specificMockClient as unknown as SupabaseClient);
    // No need to mock getActiveOrganizationId here as auth fails first

    const formData = new FormData();
    formData.append('name', 'Test Folder');
    formData.append('parentFolderId', '');
    const prevState: FolderActionState = { success: false, error: undefined, folderId: undefined };
    const result = await createFolder(prevState, formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not authenticated.');
    // Verify that DB operations were not attempted
    expect(specificMockClient.from).not.toHaveBeenCalled();
  });

  it('should return an error if active organization ID is not found (createFolder)', async () => {
    vi.mocked(getActiveOrganizationId).mockReset().mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.append('name', 'Test Folder');
    formData.append('parentFolderId', '');
    const prevState: FolderActionState = { success: false, error: undefined, folderId: undefined };
    const result = await createFolder(prevState, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization not found. Cannot create folder.');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should return an error if Supabase insert fails (createFolder)', async () => {
    const dbError = { message: 'Database insert failed', code: '23505' };
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: dbError });
    const formData = new FormData();
    formData.append('name', 'Test Folder');
    formData.append('parentFolderId', '');
    const prevState: FolderActionState = { success: false, error: undefined, folderId: undefined };
    const result = await createFolder(prevState, formData);
    expect(result.success).toBe(false);
    if (dbError.code === '23505') {
      expect(result.error).toBe('A folder with this name already exists in this location. Please use a different name.');
    } else {
      expect(result.error).toBe(`Failed to create folder: ${dbError.message}`);
    }
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('folders');
    expect(mockSupabaseClient.insert).toHaveBeenCalled();
  });
});

// --- Test Suite for updateFolder ---
describe('DAM Server Actions - updateFolder', () => {
  const testUserId = 'user-abc-123';
  const testOrgId = 'org-xyz-789';
  const testFolderId = 'folder-def-456';
  const newFolderName = 'New Updated Name';
  const mockPrevState: FolderActionState = { success: false, error: undefined, folderId: undefined };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
    vi.mocked(getActiveOrganizationId).mockResolvedValue(testOrgId);
  });

  it('should successfully rename a folder', async () => {
    const mockCurrentFolder = { id: testFolderId, parent_folder_id: null, name: 'Old Name', organization_id: testOrgId };
    const mockUpdatedFolder = { ...mockCurrentFolder, name: newFolderName, type: 'folder' as const };

    // Mock for the first call: fetch current folder
    const fetchSingleMock = vi.fn().mockResolvedValueOnce({ data: mockCurrentFolder, error: null });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { // Object returned by from()
        select: vi.fn().mockImplementationOnce((cols: string) => {
          expect(cols).toBe('id, parent_folder_id');
          return { // Object returned by select()
            match: vi.fn().mockImplementationOnce((query: object) => {
              expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
              return { single: fetchSingleMock }; // Object returned by match()
            }),
          };
        }),
      };
    });

    // Mock for the second call: update folder and select result
    const updateSingleMock = vi.fn().mockResolvedValueOnce({ data: mockUpdatedFolder, error: null });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { // Object returned by from()
        update: vi.fn().mockImplementationOnce((dataToUpdate: object) => {
          expect(dataToUpdate).toEqual({ name: newFolderName });
          return { // Object returned by update()
            match: vi.fn().mockImplementationOnce((query: object) => {
              expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
              return { // Object returned by match()
                select: vi.fn().mockImplementationOnce((cols: string) => {
                  expect(cols).toBe('*');
                  return { single: updateSingleMock }; // Object returned by select()
                }),
              };
            }),
          };
        }),
      };
    });

    const formData = new FormData();
    formData.append('folderId', testFolderId);
    formData.append('newName', `  ${newFolderName}  `);
    const result = await updateFolder(mockPrevState, formData);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.folderId).toBeUndefined();
    expect(result.folder).toEqual(mockUpdatedFolder);
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/dam', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith(`/dam/folders/${testFolderId}`, 'layout');
  });

  it('should return error if folder not found during initial fetch', async () => {
    const fetchSingleMock = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { // Object returned by from()
        select: vi.fn().mockImplementationOnce((cols: string) => {
          expect(cols).toBe('id, parent_folder_id');
          return { // Object returned by select()
            match: vi.fn().mockImplementationOnce((query: object) => {
              expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
              return { single: fetchSingleMock }; // Object returned by match()
            }),
          };
        }),
      };
    });

    const formData = new FormData();
    formData.append('folderId', testFolderId);
    formData.append('newName', newFolderName);
    const result = await updateFolder(mockPrevState, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Error finding folder: Not found');
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
  });

  it('should return error if user is not authenticated (updateFolder)', async () => {
    mockSupabaseClient.auth.getUser.mockReset().mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error' } });
    const formData = new FormData();
    formData.append('folderId', testFolderId);
    formData.append('newName', newFolderName);
    const result = await updateFolder(mockPrevState, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not authenticated.');
  });

  it('should return error if active organization ID is not found (updateFolder)', async () => {
    vi.mocked(getActiveOrganizationId).mockReset().mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.append('folderId', testFolderId);
    formData.append('newName', newFolderName);
    const result = await updateFolder(mockPrevState, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization not found. Cannot update folder.');
  });

  it('should return error if database update fails', async () => {
    const mockCurrentFolder = { id: testFolderId, parent_folder_id: null, name: 'Old Name', organization_id: testOrgId };
    const dbError = { message: 'DB update failed' };

    // Mock for the first call: fetch current folder (succeeds)
    const fetchSelectMock = vi.fn().mockReturnThis();
    const fetchMatchMock = vi.fn().mockReturnThis();
    const fetchSingleMock = vi.fn().mockResolvedValueOnce({ data: mockCurrentFolder, error: null });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return {
        select: fetchSelectMock.mockImplementationOnce((cols: string) => {
          expect(cols).toBe('id, parent_folder_id');
          return { match: fetchMatchMock.mockImplementationOnce((query: object) => {
            expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
            return { single: fetchSingleMock };
          }) };
        }),
      };
    });

    // Mock for the second call: update folder (fails at select().single())
    const updateMock = vi.fn().mockReturnThis();
    const updateMatchMock = vi.fn().mockReturnThis();
    const updateSelectMock = vi.fn().mockReturnThis();
    // This is the crucial part: the .single() call after .select() should return an error
    const updateSingleMock = vi.fn().mockResolvedValueOnce({ data: null, error: dbError }); 
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return {
        update: updateMock.mockImplementationOnce((dataToUpdate: object) => {
          expect(dataToUpdate).toEqual({ name: newFolderName });
          return { match: updateMatchMock.mockImplementationOnce((query: object) => {
            expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
            // Ensure this chain leads to the failing single mock
            return { select: updateSelectMock.mockImplementationOnce((cols: string) => {
              expect(cols).toBe('*');
              return { single: updateSingleMock }; 
            }) };
          }) };
        }),
      };
    });

    const formData = new FormData();
    formData.append('folderId', testFolderId);
    formData.append('newName', newFolderName);
    const result = await updateFolder(mockPrevState, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe(`Failed to update folder: ${dbError.message}`);
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2); // Both fetch and update calls attempted
  });

  it('should return error if new folder name is empty', async () => {
    const formData = new FormData();
    formData.append('folderId', testFolderId);
    formData.append('newName', '   ');
    const result = await updateFolder(mockPrevState, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('New folder name cannot be empty.');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });
  
  it('should prevent updating folder if it does not belong to the active org', async () => {
    // Mock for the fetch current folder call - returns null data (simulating not found for org)
    const fetchSingleMock = vi.fn().mockResolvedValueOnce({ data: null, error: null });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { select: vi.fn().mockImplementationOnce((cols: string) => {
          expect(cols).toBe('id, parent_folder_id');
          return { match: vi.fn().mockImplementationOnce((query: object) => {
            expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
            return { single: fetchSingleMock }; 
          }) };
        }) };
    });

    const formData = new FormData();
    formData.append('folderId', testFolderId); 
    formData.append('newName', newFolderName);
    const result = await updateFolder(mockPrevState, formData);

    expect(result.success).toBe(false);
    // Correct expected message for folder not found/permission issue after fetch
    expect(result.error).toBe('Folder not found or you do not have permission to update it.');
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
  });
});

// --- Test Suite for deleteFolder ---
describe('DAM Server Actions - deleteFolder', () => {
  const testUserId = 'user-abc-123';
  const testOrgId = 'org-xyz-789';
  const testFolderId = 'folder-def-456';
  const mockPrevState: FolderActionState = { success: false, error: undefined, folderId: undefined };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
    vi.mocked(getActiveOrganizationId).mockResolvedValue(testOrgId);

    // Reset .from mock for specific implementations in tests
    mockSupabaseClient.from = vi.fn(); 
  });

  it('should successfully delete an empty folder at root', async () => {
    const mockFolderToDelete = { id: testFolderId, parent_folder_id: null, organization_id: testOrgId };

    // Mock for the first call: fetch folder (succeeds)
    const fetchSingleMock = vi.fn().mockResolvedValueOnce({ data: mockFolderToDelete, error: null });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { // Object returned by from()
        select: vi.fn().mockImplementationOnce((cols: string) => {
          expect(cols).toBe('id, parent_folder_id, organization_id');
          return { // Object returned by select()
            match: vi.fn().mockImplementationOnce((query: object) => {
              expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
              return { single: fetchSingleMock }; // Object returned by match()
            }),
          };
        }),
      };
    });

    // Mock for the second call: delete folder (succeeds)
    const deleteMatchMock = vi.fn().mockResolvedValueOnce({ error: null }); // delete().match() resolves directly
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { // Object returned by from()
        delete: vi.fn().mockImplementationOnce(() => { 
          return { // Object returned by delete()
            match: deleteMatchMock.mockImplementationOnce((query: object) => {
              expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
              // match() itself resolves the promise in this chain for delete
              return deleteMatchMock;
            }),
          };
        }),
      };
    });

    const formData = new FormData();
    formData.append('folderId', testFolderId);
    const result = await deleteFolder(mockPrevState, formData);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.folderId).toBe(testFolderId);
    expect(result.parentFolderId).toBeNull(); // Matches mockFolderToDelete
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2); // Fetch and delete
    expect(revalidatePath).toHaveBeenCalledWith('/dam', 'layout');
    // Since parent_folder_id is null, only /dam layout should be revalidated twice essentially (check logic)
    // Let's check it was called at least once with /dam, layout
    expect(revalidatePath).toHaveBeenCalledWith('/dam', 'layout');
  });

  it('should return error if folder not found', async () => {
    // Mock for the first call: fetch folder (fails)
    const fetchSingleMock = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { // Object returned by from()
        select: vi.fn().mockImplementationOnce((cols: string) => {
          expect(cols).toBe('id, parent_folder_id, organization_id');
          return { // Object returned by select()
            match: vi.fn().mockImplementationOnce((query: object) => {
              expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
              return { single: fetchSingleMock }; // Object returned by match()
            }),
          };
        }),
      };
    });

    const formData = new FormData();
    formData.append('folderId', testFolderId);
    const result = await deleteFolder(mockPrevState, formData);
    expect(result.success).toBe(false);
    // Error message comes from the action: `Error finding folder to delete: ${fetchError.message}`
    expect(result.error).toBe('Error finding folder to delete: Not found');
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1); // Only fetch attempt
  });

  // Note: The 'subfolders exist' and 'assets exist' tests are likely outdated.
  // The current deleteFolder action relies on the DB foreign key constraint (23503)
  // to determine if a folder cannot be deleted due to references.
  // We should test *that* scenario instead.
  it.skip('should return error if subfolders exist', async () => {
    // ... (Keep skipped or remove/replace)
  });

  it.skip('should return error if assets exist', async () => {
    // ... (Keep skipped or remove/replace)
  });

  // Test for Foreign Key Constraint Error (23503)
  it('should return error if delete fails due to foreign key constraint (folder not empty)', async () => {
    const mockFolderToDelete = { id: testFolderId, parent_folder_id: null, organization_id: testOrgId };
    const dbError = { message: 'Foreign key violation', code: '23503' };

    // Mock for the first call: fetch folder (succeeds)
    const fetchSingleMock = vi.fn().mockResolvedValueOnce({ data: mockFolderToDelete, error: null });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return {
        select: vi.fn().mockImplementationOnce((cols: string) => {
          expect(cols).toBe('id, parent_folder_id, organization_id');
          return { match: vi.fn().mockImplementationOnce((query: object) => {
            expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
            return { single: fetchSingleMock };
          }) };
        }),
      };
    });

    // Mock for the second call: delete folder (fails with 23503 error)
    const deleteMatchMock = vi.fn().mockResolvedValueOnce({ error: dbError }); // delete().match() resolves with error
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { delete: vi.fn().mockImplementationOnce(() => { 
          return { match: deleteMatchMock.mockImplementationOnce((query: object) => {
            expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
            return deleteMatchMock; 
          }) };
        }) };
    });

    const formData = new FormData();
    formData.append('folderId', testFolderId);
    const result = await deleteFolder(mockPrevState, formData);

    expect(result.success).toBe(false);
    // Check against the specific error message returned by the action for 23503
    expect(result.error).toBe('Cannot delete folder. It may not be empty or is referenced elsewhere.');
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2); 
  });

  it('should return error if user not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error' } });
    const formData = new FormData();
    formData.append('folderId', testFolderId);
    const result = await deleteFolder(mockPrevState, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not authenticated.');
  });

  it('should return error if active organization ID not found', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: testUserId } }, error: null });
    vi.mocked(getActiveOrganizationId).mockReset().mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.append('folderId', testFolderId);
    const result = await deleteFolder(mockPrevState, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization not found. Cannot delete folder.');
  });

  it('should return error if delete fails', async () => {
    const mockFolderToDelete = { id: testFolderId, parent_folder_id: null, organization_id: testOrgId };
    const dbError = { message: 'Generic delete error' }; // Simulate a different error

    // Mock for the first call: fetch folder (succeeds)
    const fetchSingleMock = vi.fn().mockResolvedValueOnce({ data: mockFolderToDelete, error: null });
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { select: vi.fn().mockImplementationOnce((cols: string) => {
          expect(cols).toBe('id, parent_folder_id, organization_id');
          return { match: vi.fn().mockImplementationOnce((query: object) => {
            expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
            return { single: fetchSingleMock };
          }) };
        }) };
    });

    // Mock for the second call: delete folder (fails with generic error)
    const deleteMatchMock = vi.fn().mockResolvedValueOnce({ error: dbError }); // delete().match() resolves with error
    mockSupabaseClient.from.mockImplementationOnce((table: string) => {
      expect(table).toBe('folders');
      return { delete: vi.fn().mockImplementationOnce(() => { 
          return { match: deleteMatchMock.mockImplementationOnce((query: object) => {
            expect(query).toEqual({ id: testFolderId, organization_id: testOrgId });
            return deleteMatchMock; 
          }) };
        }) };
    });

    const formData = new FormData();
    formData.append('folderId', testFolderId);
    const result = await deleteFolder(mockPrevState, formData);

    expect(result.success).toBe(false);
    // Check against the generic error message pattern
    expect(result.error).toBe(`Failed to delete folder: ${dbError.message}`);
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2); 
  });
});
