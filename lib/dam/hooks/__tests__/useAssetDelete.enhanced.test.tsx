import { renderHook, waitFor, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssetDelete } from '../useAssets';
import { describe, it, expect, beforeEach } from 'vitest';
import { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/lib/test/mocks/server';

// Test wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Example component to test UI feedback
const AssetDeleteButton = ({ assetId }: { assetId: string }) => {
  const deleteAsset = useAssetDelete();

  const handleDelete = () => {
    deleteAsset.mutate(assetId);
  };

  return (
    <div>
      <button 
        onClick={handleDelete}
        disabled={deleteAsset.isPending}
        data-testid="delete-button"
      >
        {deleteAsset.isPending ? 'Deleting...' : 'Delete Asset'}
      </button>
      
      {deleteAsset.isSuccess && (
        <div data-testid="success-message">Asset deleted successfully!</div>
      )}
      
      {deleteAsset.isError && (
        <div data-testid="error-message">
          Error: {deleteAsset.error?.message}
        </div>
      )}
    </div>
  );
};

describe('Enhanced Asset Delete Testing with MSW + User Events', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Hook-Level Tests', () => {
    it('should return success data when API returns success', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAssetDelete(), { wrapper });

      result.current.mutate('asset-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // ✅ NEW: Testing the actual return data structure
      expect(result.current.data).toEqual({
        success: true,
        message: 'Asset deleted successfully'
      });
    });

    it('should handle API errors correctly', async () => {
      // ✅ NEW: Runtime API response mocking with MSW
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

      result.current.mutate('nonexistent-asset');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Asset not found');
    });

    it('should handle network failures gracefully', async () => {
      // ✅ NEW: Simulating network failures
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

      expect(result.current.error?.message).toContain('Failed to fetch');
    });
  });

  describe('Component Integration Tests', () => {
    it('should show correct loading state during deletion', async () => {
      // ✅ NEW: Testing UI feedback during async operations
      server.use(
        http.delete('/api/dam/asset/:assetId', async () => {
          // Simulate slow network
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true, message: 'Asset deleted successfully' });
        })
      );

      const wrapper = createWrapper();
      render(<AssetDeleteButton assetId="asset-123" />, { wrapper });

      const deleteButton = screen.getByTestId('delete-button');
      
      // ✅ NEW: More realistic user interactions
      await user.click(deleteButton);

      // Should show loading state immediately
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveTextContent('Deleting...');

      // Should show success after completion
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });

      expect(screen.getByTestId('success-message')).toHaveTextContent('Asset deleted successfully!');
      expect(deleteButton).not.toBeDisabled();
      expect(deleteButton).toHaveTextContent('Delete Asset');
    });

    it('should show correct error message on failure', async () => {
      // ✅ NEW: Testing error UI feedback
      server.use(
        http.delete('/api/dam/asset/:assetId', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { status: 403 }
          );
        })
      );

      const wrapper = createWrapper();
      render(<AssetDeleteButton assetId="asset-123" />, { wrapper });

      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent('Insufficient permissions');
      expect(deleteButton).not.toBeDisabled();
    });

    it('should handle rapid successive clicks correctly', async () => {
      // ✅ NEW: Testing edge cases that cause UI issues
      const wrapper = createWrapper();
      render(<AssetDeleteButton assetId="asset-123" />, { wrapper });

      const deleteButton = screen.getByTestId('delete-button');
      
      // Multiple rapid clicks
      await user.click(deleteButton);
      await user.click(deleteButton);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });

      // Should only show one success message (React Query deduplicates)
      expect(screen.getAllByTestId('success-message')).toHaveLength(1);
    });

    it('should provide accessible loading states', async () => {
      // ✅ NEW: Testing accessibility during async operations
      server.use(
        http.delete('/api/dam/asset/:assetId', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return HttpResponse.json({ success: true, message: 'Asset deleted successfully' });
        })
      );

      const wrapper = createWrapper();
      render(<AssetDeleteButton assetId="asset-123" />, { wrapper });

      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);

      // Should be properly accessible during loading
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveTextContent('Deleting...');
      
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle server timeout correctly', async () => {
      // ✅ NEW: Testing realistic failure scenarios
      server.use(
        http.delete('/api/dam/asset/:assetId', async () => {
          // Simulate timeout
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.error();
        })
      );

      const wrapper = createWrapper();
      render(<AssetDeleteButton assetId="asset-123" />, { wrapper });

      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);

      expect(deleteButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(deleteButton).not.toBeDisabled();
    });

    it('should work correctly with malformed server responses', async () => {
      // ✅ NEW: Testing edge cases that weren't caught before
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

      // Should handle JSON parsing errors gracefully
      expect(result.current.error?.message).toContain('Unexpected token');
    });
  });
}); 