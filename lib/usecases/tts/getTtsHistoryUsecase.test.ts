import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTtsHistoryUsecase } from './getTtsHistoryUsecase';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import type { Database } from '@/types/supabase';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

// Mock Supabase client methods
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(), // This will ultimately resolve the query
};

describe('getTtsHistoryUsecase', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful mock states
    (createClient as any).mockReturnValue(mockSupabaseClient);
    (mockSupabaseClient.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
    (getActiveOrganizationId as any).mockResolvedValue('test-org-id');
    // Default query result
    (mockSupabaseClient.range as any).mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });
  });

  it('should return success: false if user is not authenticated', async () => {
    (mockSupabaseClient.auth.getUser as any).mockResolvedValueOnce({ data: {}, error: { message: 'Auth error' } });
    const result = await getTtsHistoryUsecase();
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not authenticated');
  });

  it('should return success: false if active organization is not found', async () => {
    (getActiveOrganizationId as any).mockResolvedValueOnce(null);
    const result = await getTtsHistoryUsecase();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization not found');
  });

  it('should call Supabase with correct filters and default pagination/sorting', async () => {
    await getTtsHistoryUsecase();

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('TtsPrediction');
    expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('userId', 'test-user-id');
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', 'test-org-id');
    expect(mockSupabaseClient.order).toHaveBeenCalledWith('createdAt', { ascending: false });
    expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9); // Default page 1, limit 10
  });

  it('should use provided pagination parameters', async () => {
    const params = { page: 2, limit: 5 };
    await getTtsHistoryUsecase(params);
    expect(mockSupabaseClient.range).toHaveBeenCalledWith(5, 9);
  });

  it('should use provided sorting parameters', async () => {
    const params = { sortBy: 'inputText' as keyof TtsPredictionRow, sortOrder: 'asc' as const };
    await getTtsHistoryUsecase(params);
    expect(mockSupabaseClient.order).toHaveBeenCalledWith('inputText', { ascending: true });
  });

  it('should return data and count on successful fetch', async () => {
    const mockDate = new Date().toISOString();
    const mockData: TtsPredictionRow[] = [
      { id: '1', inputText: 'Hello', createdAt: mockDate, status: 'succeeded', userId: 'test-user-id', organization_id: 'test-org-id', replicatePredictionId: 'rep1', voiceId: 'alloy', sourceAssetId: null, outputAssetId: null, outputUrl: 'http://example.com/audio1.mp3', errorMessage: null, updatedAt: mockDate },
      { id: '2', inputText: 'World', createdAt: mockDate, status: 'succeeded', userId: 'test-user-id', organization_id: 'test-org-id', replicatePredictionId: 'rep2', voiceId: 'alloy', sourceAssetId: null, outputAssetId: null, outputUrl: 'http://example.com/audio2.mp3', errorMessage: null, updatedAt: mockDate },
    ]; 
    (mockSupabaseClient.range as any).mockResolvedValueOnce({ data: mockData, error: null, count: 2 });

    const result = await getTtsHistoryUsecase();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(result.count).toBe(2);
  });

  it('should return success: false and error message on database error', async () => {
    const dbError = { message: 'Database query failed' };
    (mockSupabaseClient.range as any).mockResolvedValueOnce({ data: null, error: dbError, count: null });

    const result = await getTtsHistoryUsecase();

    expect(result.success).toBe(false);
    expect(result.error).toBe(dbError.message);
    expect(result.data).toBeUndefined();
  });

  it('should return success: false on unexpected error', async () => {
    (getActiveOrganizationId as any).mockRejectedValueOnce(new Error('Unexpected problem'));
    const result = await getTtsHistoryUsecase();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unexpected problem');
  });

  // Add more tests, e.g., for edge cases with pagination (page 0, negative limit, etc.)
  // Though the usecase itself clamps these to defaults.
}); 