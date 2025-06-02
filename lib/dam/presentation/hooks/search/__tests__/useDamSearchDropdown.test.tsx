'use client';

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDamSearchDropdown } from '../useDamSearchDropdown';
import { server } from '@/lib/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { 
          session: { 
            access_token: 'mock-token',
            user: { id: 'mock-user-id' }
          } 
        }
      }),
    },
  }),
}));

// Mock React hooks for testing
const mockRef = { current: document.createElement('div') };

// Set up MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        gcTime: 0, // Disable garbage collection for immediate cleanup
        staleTime: 0, // Always consider data stale in tests
      },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDamSearchDropdown', () => {
  beforeEach(() => {
    // Reset MSW handlers before each test
    server.resetHandlers();
  });

  describe('URL Construction', () => {
    it('should construct valid URLs with proper query parameters', async () => {
      // Track the actual API calls made
      const capturedUrls: string[] = [];
      
      server.use(
        http.get('/api/dam', ({ request }) => {
          capturedUrls.push(request.url);
          return HttpResponse.json({
            data: [
              { type: 'asset', id: '1', name: 'test-script.js', createdAt: '2025-01-01' }
            ]
          });
        })
      );

      const { result } = renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'script',
          currentFolderId: 'folder123',
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      // Wait for the query to be enabled and executed
      await waitFor(() => {
        expect(capturedUrls.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Critical test: URL should NOT have double ? characters
      expect(capturedUrls.length).toBeGreaterThan(0);
      const capturedUrl = capturedUrls[0]; // Use the first URL captured
      
      // Should have exactly one ? character
      const questionMarkCount = (capturedUrl.match(/\?/g) || []).length;
      expect(questionMarkCount).toBe(1);
      
      // Should have proper parameters
      expect(capturedUrl).toContain('folderId=folder123');
      expect(capturedUrl).toContain('q=script');
      expect(capturedUrl).toContain('limit=5');
      expect(capturedUrl).toContain('quickSearch=true');
      
      // Should NOT contain malformed parameter combinations
      expect(capturedUrl).not.toContain('quickSearch=true?');
      expect(capturedUrl).not.toContain('true?search=');

      // Verify dropdown is working
      await waitFor(() => {
        expect(result.current.isDropdownLoading).toBe(false);
        expect(result.current.dropdownResults).toHaveLength(1);
        expect(result.current.isDropdownOpen).toBe(true);
      });
    });

    it('should handle empty folder ID correctly', async () => {
      const capturedUrls: string[] = [];
      
      server.use(
        http.get('/api/dam', ({ request }) => {
          capturedUrls.push(request.url);
          return HttpResponse.json({ data: [] });
        })
      );

      renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'test',
          currentFolderId: undefined,
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(capturedUrls.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const url = capturedUrls[0];
      expect(url).toContain('folderId=');
      expect(url).toContain('&q=test');
    });

    it('should not make API calls when search term is empty', async () => {
      const capturedUrls: string[] = [];
      
      server.use(
        http.get('/api/dam', ({ request }) => {
          capturedUrls.push(request.url);
          return HttpResponse.json({ data: [] });
        })
      );

      const { result } = renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: '',
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      // Wait a moment to ensure no API calls are made
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(capturedUrls).toHaveLength(0);
      expect(result.current.isDropdownLoading).toBe(false);
    });
  });

  describe('Search Filtering Behavior', () => {
    it('should only return results matching the search term', async () => {
      server.use(
        http.get('/api/dam', ({ request }) => {
          const url = new URL(request.url);
          const searchTerm = url.searchParams.get('q');
          
          // Simulate proper server-side filtering
          const allItems = [
            { type: 'asset', id: '1', name: 'script.js', createdAt: '2025-01-01' },
            { type: 'asset', id: '2', name: 'image.png', createdAt: '2025-01-01' },
            { type: 'folder', id: '3', name: 'scripts', createdAt: '2025-01-01' },
            { type: 'folder', id: '4', name: 'images', createdAt: '2025-01-01' },
          ];

          // Filter items that contain the search term (case-insensitive)
          const filteredItems = searchTerm 
            ? allItems.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : allItems;

          return HttpResponse.json({ data: filteredItems });
        })
      );

      const { result } = renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'script',
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      // Wait for the API call and results
      await waitFor(() => {
        expect(result.current.dropdownResults).toHaveLength(2);
      }, { timeout: 3000 });

      // Should only return items containing "script"
      expect(result.current.dropdownResults[0].name).toBe('script.js');
      expect(result.current.dropdownResults[1].name).toBe('scripts');
      expect(result.current.isDropdownLoading).toBe(false);
    });

    it('should handle case-insensitive search', async () => {
      server.use(
        http.get('/api/dam', ({ request }) => {
          const url = new URL(request.url);
          const searchTerm = url.searchParams.get('q');
          
          const items = [
            { type: 'asset', id: '1', name: 'MyScript.JS', createdAt: '2025-01-01' },
          ];

          const filteredItems = searchTerm 
            ? items.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : items;

          return HttpResponse.json({ data: filteredItems });
        })
      );

      const { result } = renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'script',
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.dropdownResults).toHaveLength(1);
        expect(result.current.dropdownResults[0].name).toBe('MyScript.JS');
      }, { timeout: 3000 });
    });
  });

  describe('Dropdown State Management', () => {
    it('should open dropdown when search term is provided and input is focused', async () => {
      server.use(
        http.get('/api/dam', () => {
          return HttpResponse.json({ data: [
            { type: 'asset', id: '1', name: 'test.js', createdAt: '2025-01-01' }
          ]});
        })
      );

      const { result } = renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'test',
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      // Wait for the query to complete and dropdown to open
      await waitFor(() => {
        expect(result.current.isDropdownLoading).toBe(false);
        expect(result.current.dropdownResults).toHaveLength(1);
        expect(result.current.isDropdownOpen).toBe(true);
      }, { timeout: 3000 });
    });

    it('should not open dropdown when input is not focused', () => {
      const { result } = renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'test',
          inputFocused: false,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isDropdownOpen).toBe(false);
    });

    it('should close dropdown when search term becomes empty', async () => {
      server.use(
        http.get('/api/dam', () => {
          return HttpResponse.json({ data: [] });
        })
      );

      const { result, rerender } = renderHook(
        ({ searchTerm }) => useDamSearchDropdown({
          debouncedSearchTerm: searchTerm,
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { 
          wrapper: createWrapper(),
          initialProps: { searchTerm: 'test' }
        }
      );

      // Initially should attempt to open
      expect(result.current.isDropdownOpen).toBe(false); // Starts closed

      // Clear search term
      rerender({ searchTerm: '' });

      expect(result.current.isDropdownOpen).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('/api/dam', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'test',
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isDropdownLoading).toBe(false);
      });

      expect(result.current.isDropdownOpen).toBe(false);
      expect(result.current.dropdownResults).toEqual([]);
    });

    it('should handle malformed API responses', async () => {
      server.use(
        http.get('/api/dam', () => {
          return HttpResponse.json({ unexpected: 'format' });
        })
      );

      const { result } = renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'test',
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isDropdownLoading).toBe(false);
      });

      expect(result.current.dropdownResults).toEqual([]);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle rapid search term changes without race conditions', async () => {
      let callCount = 0;
      
      server.use(
        http.get('/api/dam', () => {
          callCount++;
          return HttpResponse.json({ data: [] });
        })
      );

      const { rerender } = renderHook(
        ({ searchTerm }) => useDamSearchDropdown({
          debouncedSearchTerm: searchTerm,
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { 
          wrapper: createWrapper(),
          initialProps: { searchTerm: 'a' }
        }
      );

      // Rapidly change search terms
      rerender({ searchTerm: 'ab' });
      rerender({ searchTerm: 'abc' });
      rerender({ searchTerm: 'abcd' });

      await waitFor(() => {
        // Should eventually make a call for the final term
        expect(callCount).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should work correctly in folder context', async () => {
      const capturedRequests: Array<{ url: string; folderId: string }> = [];
      
      server.use(
        http.get('/api/dam', ({ request }) => {
          const url = new URL(request.url);
          capturedRequests.push({
            url: request.url,
            folderId: url.searchParams.get('folderId') || ''
          });
          
          return HttpResponse.json({ data: [
            { type: 'asset', id: '1', name: 'test.js', createdAt: '2025-01-01' }
          ]});
        })
      );

      renderHook(
        () => useDamSearchDropdown({
          debouncedSearchTerm: 'test',
          currentFolderId: 'specific-folder',
          inputFocused: true,
          searchContainerRef: mockRef,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(capturedRequests.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      expect(capturedRequests[0].folderId).toBe('specific-folder');
    });
  });
}); 