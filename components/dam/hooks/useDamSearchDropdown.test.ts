/// <reference types="vitest/globals" />
'use client';

import { renderHook, act, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { useDamSearchDropdown } from './useDamSearchDropdown';
import type { CombinedItem } from '@/types/dam';

// Mock global fetch
global.fetch = vi.fn();

const mockSearchContainerRef = {
  current: document.createElement('div'), // Mock a div element
};

const mockItem: CombinedItem = {
  id: 'item1',
  name: 'Test Item 1',
  type: 'asset',
  // Add other required fields for CombinedItem (Asset or Folder)
  user_id: 'user1',
  organization_id: 'org1',
  created_at: '2023-01-01T00:00:00Z',
  ownerName: 'Test User',
  // Asset specific (if type is asset)
  storage_path: '/items/item1.jpg',
  mime_type: 'image/jpeg',
  size: 1024,
  folder_id: null,
  publicUrl: 'http://example.com/item1.jpg',
  parentFolderName: null,
  tags: [],
};

const defaultProps = {
  debouncedSearchTerm: '',
  currentFolderId: null,
  mainSearchedTerm: null,
  gallerySearchTerm: '',
  inputFocused: false,
  searchContainerRef: mockSearchContainerRef as React.RefObject<HTMLDivElement>,
};

describe('useDamSearchDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the ref's content for click-outside tests if needed, or ensure it's fresh
    mockSearchContainerRef.current = document.createElement('div');
    document.body.appendChild(mockSearchContainerRef.current);
  });

  afterEach(() => {
    if (mockSearchContainerRef.current && mockSearchContainerRef.current.parentNode) {
      mockSearchContainerRef.current.parentNode.removeChild(mockSearchContainerRef.current);
    }
  });

  it('should initialize with dropdown closed and no results', () => {
    const { result } = renderHook(() => useDamSearchDropdown(defaultProps));
    expect(result.current.isDropdownOpen).toBe(false);
    expect(result.current.dropdownResults).toEqual([]);
    expect(result.current.isDropdownLoading).toBe(false);
  });

  it('should not fetch or open if debouncedSearchTerm is empty', () => {
    const { result } = renderHook(() => useDamSearchDropdown(defaultProps));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.isDropdownOpen).toBe(false);
  });

  it('should fetch results and open dropdown if term exists and input is focused', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [mockItem] }),
    });
    const { result } = renderHook(() => 
      useDamSearchDropdown({ ...defaultProps, debouncedSearchTerm: 'test', inputFocused: true })
    );

    expect(result.current.isDropdownLoading).toBe(true);
    await waitFor(() => expect(result.current.isDropdownLoading).toBe(false));
    
    expect(fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (fetch as Mock).mock.calls[0];
    const fetchUrl = fetchCall[0] as string;
    expect(fetchUrl).toContain('/api/dam?');
    expect(fetchUrl).toContain('folderId=');
    expect(fetchUrl).toContain('q=test');
    expect(fetchUrl).toContain('limit=5');
    expect(fetchUrl).toContain('quickSearch=true');
    expect(fetchUrl).toMatch(/&_=\d+$/);
    expect(fetchCall[1]).toEqual({ cache: 'no-store' });

    expect(result.current.dropdownResults).toEqual([mockItem]);
    expect(result.current.isDropdownOpen).toBe(true);
  });

  it('should open dropdown with no results message if term exists, focused, but API returns empty', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });
    const { result } = renderHook(() => 
      useDamSearchDropdown({ ...defaultProps, debouncedSearchTerm: 'empty', inputFocused: true })
    );
    await waitFor(() => expect(result.current.isDropdownLoading).toBe(false));
    expect(result.current.dropdownResults).toEqual([]);
    expect(result.current.isDropdownOpen).toBe(true);
  });

  it('should close dropdown if API returns empty and input is not focused', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });
    const { result } = renderHook(() => 
      useDamSearchDropdown({ ...defaultProps, debouncedSearchTerm: 'empty', inputFocused: false })
    );
    await waitFor(() => expect(result.current.isDropdownLoading).toBe(false));
    expect(result.current.isDropdownOpen).toBe(false);
  });

  it('should handle fetch error and open dropdown with no results if focused', async () => {
    (fetch as Mock).mockRejectedValueOnce(new Error('API Error'));
    const { result } = renderHook(() => 
      useDamSearchDropdown({ ...defaultProps, debouncedSearchTerm: 'error', inputFocused: true })
    );
    await waitFor(() => expect(result.current.isDropdownLoading).toBe(false));
    expect(result.current.dropdownResults).toEqual([]);
    expect(result.current.isDropdownOpen).toBe(true);
  });

  it('should not open dropdown and clear results if debouncedSearchTerm matches mainSearchedTerm', () => {
    const { result } = renderHook(() => 
      useDamSearchDropdown({ ...defaultProps, debouncedSearchTerm: 'submitted', mainSearchedTerm: 'submitted', inputFocused: true })
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.isDropdownOpen).toBe(false);
    expect(result.current.dropdownResults).toEqual([]);
  });

  it('should close dropdown on click outside', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [mockItem] }),
    });
    const { result } = renderHook(() => 
      useDamSearchDropdown({ ...defaultProps, debouncedSearchTerm: 'test', inputFocused: true })
    );
    await waitFor(() => expect(result.current.isDropdownOpen).toBe(true));

    // Simulate click outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    act(() => {
      fireEvent.mouseDown(outsideElement);
    });
    expect(result.current.isDropdownOpen).toBe(false);
    document.body.removeChild(outsideElement);
  });

  it('should not close dropdown on click inside searchContainerRef', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [mockItem] }),
    });
    const { result } = renderHook(() => 
      useDamSearchDropdown({ ...defaultProps, debouncedSearchTerm: 'test', inputFocused: true })
    );
    await waitFor(() => expect(result.current.isDropdownOpen).toBe(true));

    act(() => {
      fireEvent.mouseDown(mockSearchContainerRef.current);
    });
    expect(result.current.isDropdownOpen).toBe(true); // Should remain open
  });
  
  it('should allow manually setting isDropdownOpen', () => {
    const { result } = renderHook(() => useDamSearchDropdown(defaultProps));
    expect(result.current.isDropdownOpen).toBe(false);
    act(() => {
      result.current.setIsDropdownOpen(true);
    });
    expect(result.current.isDropdownOpen).toBe(true);
    act(() => {
      result.current.setIsDropdownOpen(false);
    });
    expect(result.current.isDropdownOpen).toBe(false);
  });

  it('should handle stale fetch requests', async () => {
    const fetchMock = fetch as Mock;
    const firstCallResults = [{ ...mockItem, id: 'first', name: 'First Call' }];
    const secondCallResults = [{ ...mockItem, id: 'second', name: 'Second Call' }];

    let firstResolve: any, secondResolve: any;
    fetchMock
      .mockImplementationOnce(() => new Promise(resolve => { firstResolve = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { secondResolve = resolve; }));

    const { result, rerender } = renderHook((props) => useDamSearchDropdown(props), {
      initialProps: { ...defaultProps, debouncedSearchTerm: 'first', inputFocused: true },
    });

    // First fetch initiated
    expect(result.current.isDropdownLoading).toBe(true);

    // Trigger a second fetch by changing the search term before the first one resolves
    rerender({ ...defaultProps, debouncedSearchTerm: 'second', inputFocused: true });
    expect(result.current.isDropdownLoading).toBe(true);

    // Resolve second fetch first
    act(() => {
      secondResolve({ ok: true, json: async () => ({ data: secondCallResults }) });
    });
    await waitFor(() => expect(result.current.dropdownResults).toEqual(secondCallResults));
    expect(result.current.isDropdownOpen).toBe(true);
    // isDropdownLoading should eventually be false
    await waitFor(() => expect(result.current.isDropdownLoading).toBe(false));
    
    // Now resolve the first (stale) fetch
    act(() => {
      firstResolve({ ok: true, json: async () => ({ data: firstCallResults }) });
    });

    // Wait for any potential state updates, results should NOT change to firstCallResults
    await new Promise(r => setTimeout(r, 0)); // allow microtasks to flush
    expect(result.current.dropdownResults).toEqual(secondCallResults); // Should remain second results
  });

   it('should not re-fetch if debouncedSearchTerm matches gallerySearchTerm and dropdown is closed/input not focused', () => {
    renderHook(() => 
      useDamSearchDropdown({ 
        ...defaultProps, 
        debouncedSearchTerm: 'gallery', 
        gallerySearchTerm: 'gallery', 
        inputFocused: false, // Not focused, should keep dropdown closed
      })
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should not re-fetch if debouncedSearchTerm matches gallerySearchTerm and dropdown is already open with results', async () => {
     (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [mockItem] }),
    });
    // Initial fetch to populate results and open dropdown
    const { result, rerender } = renderHook((props) => useDamSearchDropdown(props), {
      initialProps: { ...defaultProps, debouncedSearchTerm: 'gallery', gallerySearchTerm: '', inputFocused: true },
    });
    await waitFor(() => expect(result.current.dropdownResults.length).toBeGreaterThan(0));
    expect(result.current.isDropdownOpen).toBe(true);
    expect((fetch as Mock).mock.calls.length).toBe(1);

    // Now, simulate gallerySearchTerm catching up, dropdown still open
    rerender({ ...defaultProps, debouncedSearchTerm: 'gallery', gallerySearchTerm: 'gallery', inputFocused: true });
    
    // No new fetch should be called
    expect((fetch as Mock).mock.calls.length).toBe(1);
  });

}); 