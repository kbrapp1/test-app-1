import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  addTagToAsset,
  removeTagFromAsset,
  GenericActionResult
} from './asset-crud.actions';

// Simple mock for auth/org checks 
vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn().mockResolvedValue('test-org-id'),
}));

// Simple mock for revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Simple mock for Supabase client
const mockAuthGetUser = vi.fn();
const mockSupabaseClient = {
  auth: { getUser: mockAuthGetUser },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('Asset CRUD Server Actions - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful auth
    mockAuthGetUser.mockResolvedValue({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    });
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
    it('should validate required parameters', async () => {
      const formData = createMockFormData({ assetId: null, tagId: 'tag-1' });
      const result = await addTagToAsset(formData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Asset ID is required.');
      }
    });

    it('should validate tagId parameter', async () => {
      const formData = createMockFormData({ assetId: 'asset-1', tagId: null });
      const result = await addTagToAsset(formData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Tag ID is required.');
      }
    });

    it('should handle authentication error', async () => {
      mockAuthGetUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: { message: 'Auth error' } 
      });
      
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await addTagToAsset(formData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User not authenticated');
      }
    });
  });

  describe('removeTagFromAsset', () => {
    it('should validate required parameters', async () => {
      const formData = createMockFormData({ assetId: null, tagId: 'tag-1' });
      const result = await removeTagFromAsset(formData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Asset ID is required.');
      }
    });

    it('should validate tagId parameter', async () => {
      const formData = createMockFormData({ assetId: 'asset-1', tagId: null });
      const result = await removeTagFromAsset(formData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Tag ID is required.');
      }
    });

    it('should handle authentication error', async () => {
      mockAuthGetUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: { message: 'Auth error' } 
      });
      
      const formData = createMockFormData({ assetId: 'asset-1', tagId: 'tag-1' });
      const result = await removeTagFromAsset(formData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User not authenticated');
      }
    });
  });
}); 