import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { deleteAsset } from './dam'; // Adjust path if needed
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Mock Supabase client and its methods
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// --- Mock Data ---
const mockAssetId = 'test-asset-id';
const mockStoragePath = 'user-123/test-asset.png';
const mockUserId = 'user-123';
const otherUserId = 'user-456';

// --- Mock Supabase Client Implementation ---
const mockSupabase = {
    auth: {
        getUser: vi.fn(),
    },
    storage: {
        from: vi.fn().mockReturnThis(),
        remove: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    match: vi.fn(),
};

describe('deleteAsset Server Action', () => {

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Setup mock createClient to return our mock Supabase instance
        (createClient as Mock).mockReturnValue(mockSupabase);

        // Default successful mocks (can be overridden in specific tests)
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: mockUserId } }, error: null });
        mockSupabase.from.mockReturnThis(); // Reset chaining
        mockSupabase.select.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.single.mockResolvedValue({ data: { user_id: mockUserId }, error: null });
        mockSupabase.storage.from.mockReturnThis();
        mockSupabase.storage.remove.mockResolvedValue({ data: {}, error: null });
        mockSupabase.delete.mockReturnThis();
        mockSupabase.match.mockResolvedValue({ error: null });
    });

    it('should return error if assetId is missing', async () => {
        const result = await deleteAsset('', mockStoragePath);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing asset ID or storage path.');
        expect(createClient).not.toHaveBeenCalled();
    });

    it('should return error if storagePath is missing', async () => {
        const result = await deleteAsset(mockAssetId, '');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing asset ID or storage path.');
        expect(createClient).not.toHaveBeenCalled();
    });

    it('should return error if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
        const result = await deleteAsset(mockAssetId, mockStoragePath);
        expect(result.success).toBe(false);
        expect(result.error).toBe('User not authenticated');
        expect(mockSupabase.storage.remove).not.toHaveBeenCalled();
        expect(mockSupabase.match).not.toHaveBeenCalled();
    });

    it('should return error if fetching asset fails', async () => {
        const fetchError = { message: 'Fetch failed' };
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: fetchError });
        const result = await deleteAsset(mockAssetId, mockStoragePath);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Error finding asset: Fetch failed');
        expect(mockSupabase.storage.remove).not.toHaveBeenCalled();
        expect(mockSupabase.match).not.toHaveBeenCalled();
    });

     it('should return error if asset data is not found', async () => {
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: null }); // No data, no error
        const result = await deleteAsset(mockAssetId, mockStoragePath);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Asset not found.');
        expect(mockSupabase.storage.remove).not.toHaveBeenCalled();
        expect(mockSupabase.match).not.toHaveBeenCalled();
    });

    it('should return error if user is not authorized (different user ID)', async () => {
        mockSupabase.single.mockResolvedValueOnce({ data: { user_id: otherUserId }, error: null });
        const result = await deleteAsset(mockAssetId, mockStoragePath);
        expect(result.success).toBe(false);
        expect(result.error).toBe('User not authorized to delete this asset');
        expect(mockSupabase.storage.remove).not.toHaveBeenCalled();
        expect(mockSupabase.match).not.toHaveBeenCalled();
    });

    it('should return error if database deletion fails', async () => {
        const dbError = { message: 'DB delete failed' };
        mockSupabase.match.mockResolvedValueOnce({ error: dbError });
        const result = await deleteAsset(mockAssetId, mockStoragePath);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to delete database record: DB delete failed');
        expect(mockSupabase.storage.remove).toHaveBeenCalledWith([mockStoragePath]); // Storage remove should still be called
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should attempt database deletion even if storage deletion fails', async () => {
        const storageError = { message: 'Storage delete failed' };
        mockSupabase.storage.remove.mockResolvedValueOnce({ data: null, error: storageError });
        // DB delete succeeds
        mockSupabase.match.mockResolvedValueOnce({ error: null });

        const result = await deleteAsset(mockAssetId, mockStoragePath);

        expect(result.success).toBe(true); // Still returns success as DB record is gone
        expect(result.error).toBeUndefined();
        expect(mockSupabase.storage.remove).toHaveBeenCalledWith([mockStoragePath]);
        expect(mockSupabase.match).toHaveBeenCalledWith({ id: mockAssetId, user_id: mockUserId });
        expect(revalidatePath).toHaveBeenCalledWith('/dam');
        // Note: We no longer log to console as part of error handling
    });

    it('should successfully delete asset, remove from storage, and revalidate path', async () => {
        const result = await deleteAsset(mockAssetId, mockStoragePath);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();

        // Verify auth and fetch
        expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
        expect(mockSupabase.from).toHaveBeenCalledWith('assets');
        expect(mockSupabase.select).toHaveBeenCalledWith('user_id');
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockAssetId);
        expect(mockSupabase.single).toHaveBeenCalledTimes(1);

        // Verify storage delete
        expect(mockSupabase.storage.from).toHaveBeenCalledWith('assets');
        expect(mockSupabase.storage.remove).toHaveBeenCalledWith([mockStoragePath]);

        // Verify DB delete
        expect(mockSupabase.from).toHaveBeenCalledWith('assets');
        expect(mockSupabase.delete).toHaveBeenCalledTimes(1);
        expect(mockSupabase.match).toHaveBeenCalledWith({ id: mockAssetId, user_id: mockUserId });

        // Verify revalidation
        expect(revalidatePath).toHaveBeenCalledWith('/dam');
        expect(revalidatePath).toHaveBeenCalledTimes(1);
    });
}); 