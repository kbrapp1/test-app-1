import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssetDelete } from '../useAssets';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/lib/test/mocks/server';

// Mock cache invalidation
vi.mock('@/lib/infrastructure/query', async () => {
  const actual = await vi.importActual('@/lib/infrastructure/query');
  return {
    ...actual,
    useCacheInvalidation: () => ({
      invalidateByPattern: vi.fn(),
    }),
  };
});

// Test wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useAssetDelete - UI Feedback Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return success data when deletion succeeds', async () => {
    // MSW already provides success response via default handlers
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAssetDelete(), { wrapper });

    // Trigger the mutation
    result.current.mutate('asset-123');

    // Wait for mutation to complete successfully
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // This test would have caught our bug! 
    // Before the fix, result.current.data would be undefined
    expect(result.current.data).toEqual({
      success: true,
      message: 'Asset deleted successfully'
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('should handle API errors correctly', async () => {
    // Override MSW with error response
    server.use(
      http.delete('/api/dam/asset/:assetId', () => {
        return new HttpResponse(
          JSON.stringify({ error: 'Asset not found' }),
          { status: 404 }
        );
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAssetDelete(), { wrapper });

    result.current.mutate('asset-123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Asset not found');
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it('should handle network errors correctly', async () => {
    // Simulate network failure with MSW
    server.use(
      http.delete('/api/dam/asset/:assetId', () => {
        return HttpResponse.error();
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAssetDelete(), { wrapper });

    result.current.mutate('asset-123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Network errors typically show as "Failed to fetch"
    expect(result.current.error?.message).toContain('Failed to fetch');
    expect(result.current.data).toBeUndefined();
  });

  it('should handle malformed success responses', async () => {
    // Mock API returning 200 but invalid JSON
    server.use(
      http.delete('/api/dam/asset/:assetId', () => {
        return new HttpResponse('Invalid JSON{', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAssetDelete(), { wrapper });

    result.current.mutate('asset-123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // JSON parsing errors show as syntax errors
    expect(result.current.error?.message).toContain('Unexpected token');
  });

  it('should handle state transitions correctly', async () => {
    // Test that mutation starts idle, becomes success
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAssetDelete(), { wrapper });

    // Should start idle
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Start mutation - MSW provides success response
    result.current.mutate('asset-123');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should be successful and no longer pending
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});

describe('useAssetDelete - Real-world Scenarios', () => {
  it('should handle 500 server errors with proper error message', async () => {
    server.use(
      http.delete('/api/dam/asset/:assetId', () => {
        return new HttpResponse(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500 }
        );
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAssetDelete(), { wrapper });

    result.current.mutate('asset-123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Internal server error');
  });

  it('should handle unauthorized access (401)', async () => {
    server.use(
      http.delete('/api/dam/asset/:assetId', () => {
        return new HttpResponse(
          JSON.stringify({ error: 'Unauthorized access' }),
          { status: 401 }
        );
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAssetDelete(), { wrapper });

    result.current.mutate('asset-123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Unauthorized access');
  });

  it('should provide fallback error message when API returns no error details', async () => {
    server.use(
      http.delete('/api/dam/asset/:assetId', () => {
        return new HttpResponse('', { status: 500 });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAssetDelete(), { wrapper });

    result.current.mutate('asset-123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('Failed to delete asset (500)');
  });
}); 