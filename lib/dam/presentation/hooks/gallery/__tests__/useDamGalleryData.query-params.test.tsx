import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDamGalleryData } from '../useDamGalleryData';
import { vi } from 'vitest';

// Mock the organization provider
vi.mock('@/lib/organization/application/providers/OrganizationProvider', () => ({
  useOrganization: () => ({
    activeOrganizationId: 'test-org-123',
    isLoading: false,
  }),
}));

// Mock the API query hook
const { useApiQuery } = vi.hoisted(() => ({
  useApiQuery: vi.fn(),
}));

vi.mock('@/lib/infrastructure/query', () => ({
  useApiQuery,
  useSearchQuery: vi.fn(),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDamGalleryData Query Parameters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApiQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });
  });

  it('should map filterType to type parameter correctly', () => {
    renderHook(
      () => useDamGalleryData({
        filterType: 'image',
        currentFolderId: 'test-folder',
      }),
      { wrapper: createWrapper() }
    );

    expect(useApiQuery).toHaveBeenCalledWith(
      expect.arrayContaining(['dam-gallery']),
      expect.stringContaining('type=image'),
      expect.anything(),
      expect.anything()
    );
  });

  it('should map all filter parameters correctly', () => {
    renderHook(
      () => useDamGalleryData({
        filterType: 'image',
        filterCreationDateOption: 'week',
        filterDateStart: '2025-01-01',
        filterDateEnd: '2025-01-31',
        filterOwnerId: 'user123',
        filterSizeOption: 'medium',
        filterSizeMin: '1024',
        filterSizeMax: '10240',
        currentFolderId: 'test-folder',
      }),
      { wrapper: createWrapper() }
    );

    const lastCall = useApiQuery.mock.calls[useApiQuery.mock.calls.length - 1];
    const url = lastCall[1];

    // Check that all parameters are mapped correctly (without the 'filter' prefix)
    expect(url).toContain('type=image');
    expect(url).toContain('creationDateOption=week');
    expect(url).toContain('dateStart=2025-01-01');
    expect(url).toContain('dateEnd=2025-01-31');
    expect(url).toContain('ownerId=user123');
    expect(url).toContain('sizeOption=medium');
    expect(url).toContain('sizeMin=1024');
    expect(url).toContain('sizeMax=10240');
  });

  it('should build correct URL for image filtering', () => {
    renderHook(
      () => useDamGalleryData({
        filterType: 'image',
      }),
      { wrapper: createWrapper() }
    );

    const lastCall = useApiQuery.mock.calls[useApiQuery.mock.calls.length - 1];
    const url = lastCall[1];

    expect(url).toBe('/api/dam?type=image');
  });

  it('should handle multiple filters correctly', () => {
    renderHook(
      () => useDamGalleryData({
        filterType: 'document',
        filterSizeOption: 'large',
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      { wrapper: createWrapper() }
    );

    const lastCall = useApiQuery.mock.calls[useApiQuery.mock.calls.length - 1];
    const url = lastCall[1];

    expect(url).toContain('type=document');
    expect(url).toContain('sizeOption=large');
    expect(url).toContain('sortBy=name');
    expect(url).toContain('sortOrder=asc');
  });
}); 