import { renderHook, act, RenderHookResult } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGridDimensions } from './useGridDimensions';

// Mock the implementation to handle actual DOM interactions
const mockGetBoundingClientRect = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Define the return type of our hook
type UseGridDimensionsReturn = ReturnType<typeof useGridDimensions>;

describe('useGridDimensions', () => {
  beforeEach(() => {
    // Mock window innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000
    });
    
    // Override the element methods to simulate dimensions
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect.mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600
    });
    
    // Mock offsetWidth
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 800
    });

    // Mock window event listeners
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct initial dimensions', async () => {
    // Initialize with the renderHook result
    const { result, unmount } = renderHook(() => useGridDimensions());
    
    // Need to wait for useEffect to complete
    await act(async () => {
      // Just wait for effects to run
    });
    
    expect(result.current.dimensions).toEqual({
      width: 0,
      height: 0
    });
    
    // Verify the ref was created
    expect(result.current.ref).toBeDefined();
  });
  
  it('should set hasMounted to true after mount', async () => {
    const { result } = renderHook(() => useGridDimensions());
    
    await act(async () => {
      // Wait for effects to run
    });
    
    // hasMounted should be true after mounting
    expect(result.current.hasMounted).toBe(true);
  });
  
  it('should clean up event listeners on unmount', async () => {
    const { result, unmount } = renderHook(() => useGridDimensions());
    
    await act(async () => {
      // Wait for effects to run
    });
    
    // Verify event listener was added
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    
    await act(async () => {
      unmount();
    });
    
    // Verify event listener was removed
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
}); 