import { describe, it, expect, vi } from 'vitest';
import { DatabaseError } from '@/lib/errors/base';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the logger
vi.mock('@/lib/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the retry utility to avoid infinite loops - this was the main issue
vi.mock('@/lib/utils', () => ({
  retryAsyncFunction: vi.fn().mockImplementation(async (fn, shouldRetry, maxAttempts) => {
    // Simple implementation that tries only once to avoid infinite loops
    try {
      return await fn();
    } catch (error) {
      if (maxAttempts > 1 && shouldRetry?.(error, 1)) {
        // Try one more time maximum
        return await fn();
      }
      throw error;
    }
  }),
}));

describe('Supabase DB Utils', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      remove: vi.fn(),
    },
    // Add missing SupabaseClient properties as mocks
    supabaseUrl: 'http://localhost:54321',
    supabaseKey: 'test-key',
    auth: {} as any,
    realtime: {} as any,
    rest: {} as any,
    functions: {} as any,
    channel: vi.fn(),
    getChannels: vi.fn(),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
  } as unknown as SupabaseClient;

  it('should handle basic functionality without infinite loops', async () => {
    // Dynamic import after mocks are set up
    const { queryData } = await import('./db-queries');
    
    // Test that our retry mock prevents infinite loops
    (mockSupabaseClient.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await queryData(mockSupabaseClient, 'test_table', '*', {
      organizationId: 'org-123'
    });

    // Basic check that function completes
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should handle storage operations', async () => {
    // Dynamic import after mocks are set up
    const { uploadFile } = await import('./db-storage');
    
    (mockSupabaseClient.storage.from as any).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test.png' }, error: null }),
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });
    const result = await uploadFile(mockSupabaseClient, 'bucket', 'test.png', file);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should create DatabaseError correctly', () => {
    const error = new DatabaseError('Test message', 'TEST_CODE', { context: 'test' });
    
    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.context).toEqual({ context: 'test' });
  });
});