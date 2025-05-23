import { renderHook, act } from '@testing-library/react';
import { useDamTagFilterHandler } from './useDamTagFilterHandler';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { useDamUrlManager } from '@/components/dam/hooks/useDamUrlManager';
import type { Mock } from 'vitest';
import { useSearchParams } from 'next/navigation';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

vi.mock('@/components/dam/hooks/useDamUrlManager', () => ({
  useDamUrlManager: vi.fn(),
}));

const mockUseSearchParams = vi.mocked(useSearchParams);
const mockGetActiveOrganizationId = vi.mocked(getActiveOrganizationId);
const mockUseDamUrlManager = vi.mocked(useDamUrlManager);

describe('useDamTagFilterHandler', () => {
  let mockUrlGetParam: Mock<(name: string) => string | null>;
  let mockSetTagsPreserveContext: Mock<(tags: Set<string>, searchTerm: string, folderId: string | null) => void>;

  const initialTestProps = {
    gallerySearchTerm: 'initialSearchTerm',
    currentFolderId: 'initialFolderId',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUrlGetParam = vi.fn();
    mockUseSearchParams.mockReturnValue({
      get: mockUrlGetParam,
    } as any);

    mockSetTagsPreserveContext = vi.fn();
    mockUseDamUrlManager.mockReturnValue({
      setTagsPreserveContext: mockSetTagsPreserveContext,
    } as any);

    mockGetActiveOrganizationId.mockResolvedValue('test-org-id');
  });

  describe('activeOrgId initialization', () => {
    it('should fetch and set activeOrgId on mount', async () => {
      const { result, rerender, unmount } = renderHook(
        (props) => useDamTagFilterHandler(props),
        { initialProps: initialTestProps }
      );
      
      // Wait for the async effect to complete
      await act(async () => {
        await vi.waitFor(() => expect(mockGetActiveOrganizationId).toHaveBeenCalled());
      });

      expect(mockGetActiveOrganizationId).toHaveBeenCalledTimes(1);
      expect(result.current.activeOrgId).toBe('test-org-id');
      unmount(); // cleanup
    });

    it('should set activeOrgId to null and log error if getActiveOrganizationId fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetActiveOrganizationId.mockRejectedValueOnce(new Error('API Error'));

      const { result, rerender, unmount } = renderHook(
        (props) => useDamTagFilterHandler(props),
        { initialProps: initialTestProps }
      );

      await act(async () => {
        await vi.waitFor(() => expect(mockGetActiveOrganizationId).toHaveBeenCalled());
      });
      
      expect(result.current.activeOrgId).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to get active organization ID for tag filter",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
      unmount(); // cleanup
    });
  });

  describe('selectedTagIdsFromUrl initialization and updates', () => {
    it('should initialize with tagIds from URL search params', () => {
      mockUrlGetParam.mockReturnValue('tag1,tag2,tag3');
      const { result, unmount } = renderHook((props) => useDamTagFilterHandler(props), { initialProps: initialTestProps });
      expect(result.current.selectedTagIdsFromUrl).toEqual(new Set(['tag1', 'tag2', 'tag3']));
      unmount();
    });

    it('should initialize with an empty Set if tagIds param is not present', () => {
      mockUrlGetParam.mockReturnValue(null);
      const { result, unmount } = renderHook((props) => useDamTagFilterHandler(props), { initialProps: initialTestProps });
      expect(result.current.selectedTagIdsFromUrl).toEqual(new Set());
      unmount();
    });

    it('should initialize with an empty Set if tagIds param is an empty string', () => {
      mockUrlGetParam.mockReturnValue('');
      const { result, unmount } = renderHook((props) => useDamTagFilterHandler(props), { initialProps: initialTestProps });
      expect(result.current.selectedTagIdsFromUrl).toEqual(new Set());
      unmount();
    });

    it('should trim and filter empty tagIds from URL search params', () => {
      mockUrlGetParam.mockReturnValue(' tag1 , , tag2,tag3  ,');
      const { result, unmount } = renderHook((props) => useDamTagFilterHandler(props), { initialProps: initialTestProps });
      expect(result.current.selectedTagIdsFromUrl).toEqual(new Set(['tag1', 'tag2', 'tag3']));
      unmount();
    });

    it('should update selectedTagIdsFromUrl when searchParams change', () => {
      mockUrlGetParam.mockReturnValue('tagA');
      const { result, rerender, unmount } = renderHook(
        (props) => useDamTagFilterHandler(props),
        { initialProps: initialTestProps }
      );
      expect(result.current.selectedTagIdsFromUrl).toEqual(new Set(['tagA']));

      // Simulate searchParams change by creating a new mock for useSearchParams
      const newMockUrlGetParam = vi.fn().mockReturnValue('tagB,tagC');
      mockUseSearchParams.mockReturnValue({ get: newMockUrlGetParam } as any);
      
      rerender(initialTestProps); // Rerender with the same props, but useSearchParams will provide new value

      expect(result.current.selectedTagIdsFromUrl).toEqual(new Set(['tagB', 'tagC']));
      expect(newMockUrlGetParam).toHaveBeenCalledWith('tagIds');
      unmount();
    });
  });

  describe('handleTagFilterChange', () => {
    it('should call urlManager.setTagsPreserveContext with new tagIds and current context', () => {
      const { result, unmount } = renderHook((props) => useDamTagFilterHandler(props), { initialProps: initialTestProps });
      
      const newTags = new Set(['updatedTag1', 'updatedTag2']);
      act(() => {
        result.current.handleTagFilterChange(newTags);
      });

      expect(mockSetTagsPreserveContext).toHaveBeenCalledTimes(1);
      expect(mockSetTagsPreserveContext).toHaveBeenCalledWith(
        newTags,
        initialTestProps.gallerySearchTerm,
        initialTestProps.currentFolderId
      );
      unmount();
    });

    it('should use updated gallerySearchTerm and currentFolderId from props in callback', () => {
      const { result, rerender, unmount } = renderHook(
        (props) => useDamTagFilterHandler(props),
        { initialProps: initialTestProps }
      );

      const newTestProps = {
        gallerySearchTerm: 'newSearchTerm',
        currentFolderId: 'newFolderId',
      };
      rerender(newTestProps);

      const newTags = new Set(['anotherTag']);
      act(() => {
        result.current.handleTagFilterChange(newTags);
      });

      expect(mockSetTagsPreserveContext).toHaveBeenCalledTimes(1);
      expect(mockSetTagsPreserveContext).toHaveBeenCalledWith(
        newTags,
        newTestProps.gallerySearchTerm,
        newTestProps.currentFolderId
      );
      unmount();
    });
  });
}); 