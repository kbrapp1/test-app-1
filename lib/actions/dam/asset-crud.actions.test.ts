import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  addTagToAsset,
  removeTagFromAsset,
  // Import other functions from asset-crud.actions if they exist and are tested here
  // For example: moveAsset, deleteAsset, renameAssetClient
  GenericActionResult // Changed from AssetTagActionResult
} from './asset-crud.actions';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
// import { createClient as createSupabaseUserClient } from '@/lib/supabase/server'; // No longer directly needed for these tests
import { revalidatePath } from 'next/cache';

// Mock Usecases
import { addTagToAssetUsecase } from '@/lib/usecases/dam/addTagToAssetUsecase';
import { removeTagFromAssetUsecase } from '@/lib/usecases/dam/removeTagFromAssetUsecase';
import { ErrorCodes } from '@/lib/errors/constants'; // Corrected path

vi.mock('@/lib/usecases/dam/addTagToAssetUsecase', () => ({
  addTagToAssetUsecase: vi.fn(),
}));

vi.mock('@/lib/usecases/dam/removeTagFromAssetUsecase', () => ({
  removeTagFromAssetUsecase: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock server-action
vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

// --- Standard Supabase Mock Setup ---
// This is primarily for getAuthenticatedUserAndOrg, which is part of executeAssetAction
const mockAuthGetUser = vi.fn();
const mockSupabaseClient = {
  auth: { getUser: mockAuthGetUser },
  // from: vi.fn(), // Not directly used by the action tests anymore for core logic
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// No longer needed:
// const mockFrom = vi.fn();
// const mockInsert = vi.fn();
// const mockDelete = vi.fn();
// const mockEq = vi.fn();

// vi.mock('@/lib/supabase/server', () => ({
//   createClient: vi.fn(() => ({
//     auth: { getUser: mockAuthGetUser },
//     from: mockFrom,
//   })),
// }));

// mockFrom.mockImplementation(() => ({
//   insert: mockInsert,
//   delete: mockDelete,
//   eq: mockEq,
// }));

// mockInsert.mockImplementation(() => ({
// }));

// mockDelete.mockImplementation(() => ({
//   eq: mockEq, 
// }));

// mockEq.mockImplementation(() => ({
//   eq: mockEq, 
//   return Promise.resolve({ error: null }); 
// }));
// --- End Supabase Mock Setup ---


describe('Asset CRUD Server Actions - Tagging', () => {
  const mockAddTagToAssetUsecase = vi.mocked(addTagToAssetUsecase);
  const mockRemoveTagFromAssetUsecase = vi.mocked(removeTagFromAssetUsecase);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mocks for auth/org
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
    vi.mocked(getActiveOrganizationId).mockResolvedValue('test-org-id');
    vi.mocked(revalidatePath).mockClear();

    // Reset usecase mocks
    mockAddTagToAssetUsecase.mockReset();
    mockRemoveTagFromAssetUsecase.mockReset();
  });

  const createMockFormData = (data: Record<string, string | null>): FormData => {
    const fd = new FormData();
    for (const key in data) {
      if (data[key] !== null) {
        fd.append(key, data[key] as string);
      }
    }
    return fd;
  };

  describe('addTagToAsset', () => {
    it('should successfully add a tag to an asset', async () => {
      mockAddTagToAssetUsecase.mockResolvedValueOnce({ success: true, data: null });
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await addTagToAsset(formData);

      expect(result.success).toBe(true);
      expect((result as any).error).toBeUndefined();
      expect(mockAddTagToAssetUsecase).toHaveBeenCalledWith({
        organizationId: 'test-org-id',
        assetId: 'asset-1',
        tagId: 'tag-1',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dam', 'layout');
    });

    it.each([
      [{ assetId: null, tagId: 'tag-1' }, 'Asset ID is required.'],
      [{ assetId: 'asset-1', tagId: null }, 'Tag ID is required.'],
    ])('should return error if %s is missing', async (data, expectedError) => {
      const formData = createMockFormData(data);
      const result = await addTagToAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(expectedError);
      }
    });

    it('should return error if user is not authenticated', async () => {
      mockAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error' } });
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await addTagToAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe('User not authenticated');
      }
    });

    it('should return error if active organization is not found', async () => {
      vi.mocked(getActiveOrganizationId).mockResolvedValueOnce(null);
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await addTagToAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe('Active organization not found.');
      }
    });

    it('should handle foreign key violation (invalid asset/tag ID) from usecase', async () => {
      mockAddTagToAssetUsecase.mockResolvedValueOnce({ 
        success: false, 
        error: 'Invalid asset or tag ID provided.', 
        errorCode: ErrorCodes.INVALID_INPUT 
      });
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'invalid-tag' });
      const result = await addTagToAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe('Invalid asset or tag ID provided.');
      }
    });

    it('should handle unique constraint violation (already tagged) from usecase', async () => {
      mockAddTagToAssetUsecase.mockResolvedValueOnce({ 
        success: false, 
        error: 'This asset is already associated with this tag.', 
        errorCode: ErrorCodes.DUPLICATE_ENTRY 
      });
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await addTagToAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe('This asset is already associated with this tag.');
      }
    });

    it('should handle other usecase errors for addTagToAsset', async () => {
      mockAddTagToAssetUsecase.mockResolvedValueOnce({ 
        success: false, 
        error: 'A generic usecase error occurred.' 
      });
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await addTagToAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe('A generic usecase error occurred.');
      }
    });
  });

  describe('removeTagFromAsset', () => {
    beforeEach(() => {
        // Mocks for auth/org are handled in the outer beforeEach
        // Usecase mocks are reset in the outer beforeEach
    });
    
    it('should successfully remove a tag from an asset', async () => {
      mockRemoveTagFromAssetUsecase.mockResolvedValueOnce({ success: true, data: null });
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await removeTagFromAsset(formData);

      expect(result.success).toBe(true);
      expect((result as any).error).toBeUndefined();
      expect(mockRemoveTagFromAssetUsecase).toHaveBeenCalledWith({
        organizationId: 'test-org-id',
        assetId: 'asset-1',
        tagId: 'tag-1',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dam', 'layout');
    });

    it.each([
      [{ assetId: null, tagId: 'tag-1' }, 'Asset ID is required.'],
      [{ assetId: 'asset-1', tagId: null }, 'Tag ID is required.'],
    ])('should return error if %s is missing', async (data, expectedError) => {
      const formData = createMockFormData(data);
      const result = await removeTagFromAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(expectedError);
      }
    });

    it('should return error if user is not authenticated', async () => {
      mockAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error' } });
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await removeTagFromAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe('User not authenticated');
      }
    });

    it('should return error if active organization is not found', async () => {
      vi.mocked(getActiveOrganizationId).mockResolvedValueOnce(null);
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await removeTagFromAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe('Active organization not found.');
      }
    });

    it('should handle usecase errors for removeTagFromAsset', async () => {
      mockRemoveTagFromAssetUsecase.mockResolvedValueOnce({ 
        success: false, 
        error: 'A generic usecase error occurred during removal.'
      });
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await removeTagFromAsset(formData);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe('A generic usecase error occurred during removal.');
      }
    });
  });
}); 