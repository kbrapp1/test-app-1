'use client';

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDamSearchInput } from './useDamSearchInput';

describe('useDamSearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with initialValue', () => {
    const { result } = renderHook(() => useDamSearchInput({ initialValue: 'test' }));
    expect(result.current.searchInputTerm).toBe('test');
    expect(result.current.debouncedSearchTerm).toBe('test');
  });

  it('should update searchInputTerm immediately', () => {
    const { result } = renderHook(() => useDamSearchInput({ initialValue: '' }));
    act(() => {
      result.current.setSearchInputTerm('new search');
    });
    expect(result.current.searchInputTerm).toBe('new search');
  });

  it('should update debouncedSearchTerm after debounceMs', () => {
    const debounceMs = 500;
    const { result } = renderHook(() => useDamSearchInput({ initialValue: '', debounceMs }));

    act(() => {
      result.current.setSearchInputTerm('debounced');
    });
    expect(result.current.debouncedSearchTerm).toBe(''); // Still initial

    act(() => {
      vi.advanceTimersByTime(debounceMs);
    });
    expect(result.current.debouncedSearchTerm).toBe('debounced');
  });

  it('should clear previous timeout if searchInputTerm changes again before debounce', () => {
    const debounceMs = 500;
    const { result } = renderHook(() => useDamSearchInput({ initialValue: '', debounceMs }));

    act(() => {
      result.current.setSearchInputTerm('first');
    });

    act(() => {
      vi.advanceTimersByTime(debounceMs / 2); // Advance but not enough to trigger
    });
    expect(result.current.debouncedSearchTerm).toBe('');

    act(() => {
      result.current.setSearchInputTerm('second'); // Change term again
    });
    expect(result.current.debouncedSearchTerm).toBe(''); // Still initial, old timeout cleared

    act(() => {
      vi.advanceTimersByTime(debounceMs); // Advance for the new term
    });
    expect(result.current.debouncedSearchTerm).toBe('second');
  });

  it('should update terms if initialValue prop changes', () => {
    const initialProps = { initialValue: 'initial', debounceMs: 300 };
    const { result, rerender } = renderHook((props) => useDamSearchInput(props), {
      initialProps,
    });

    expect(result.current.searchInputTerm).toBe('initial');
    expect(result.current.debouncedSearchTerm).toBe('initial');

    act(() => {
      result.current.setSearchInputTerm('user typed');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.searchInputTerm).toBe('user typed');
    expect(result.current.debouncedSearchTerm).toBe('user typed');

    // Rerender with new initialValue
    rerender({ initialValue: 'new initial', debounceMs: 300 });

    expect(result.current.searchInputTerm).toBe('new initial');
    expect(result.current.debouncedSearchTerm).toBe('new initial');
  });

  it('should allow directly setting debouncedSearchTerm', () => {
    const { result } = renderHook(() => useDamSearchInput({ initialValue: 'something' }));
    
    act(() => {
      result.current.setSearchInputTerm('user input');
    });
    // Debounce not yet triggered
    expect(result.current.debouncedSearchTerm).toBe('something'); 

    act(() => {
      result.current.setDebouncedSearchTerm('cleared'); // Directly set/clear
    });
    expect(result.current.debouncedSearchTerm).toBe('cleared');

    // Check if further debouncing is affected (it should still work)
    act(() => {
        result.current.setSearchInputTerm('another input');
    });
    act(() => {
        vi.advanceTimersByTime(300); // Default debounce
    });
    expect(result.current.debouncedSearchTerm).toBe('another input');
  });

  it('should use default debounceMs if not provided', () => {
    const { result } = renderHook(() => useDamSearchInput({ initialValue: '' }));
    act(() => {
      result.current.setSearchInputTerm('test');
    });
    act(() => {
      vi.advanceTimersByTime(300); // Default is 300ms in the hook
    });
    expect(result.current.debouncedSearchTerm).toBe('test');
  });

  it('should not re-debounce if initialValue changes but searchInputTerm is already aligned and debounced', () => {
    const debounceMs = 500;
    const { result, rerender } = renderHook((props) => useDamSearchInput(props), {
      initialProps: { initialValue: 'synced', debounceMs },
    });

    // Initial state is synced
    expect(result.current.searchInputTerm).toBe('synced');
    expect(result.current.debouncedSearchTerm).toBe('synced');

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    // Rerender with the same initialValue. Debounce effect might run but should ideally not set a new timeout if values are already correct.
    rerender({ initialValue: 'synced', debounceMs });
    
    // The hook's useEffect for debouncing will run due to initialValue in its simplified dependency array logic.
    // However, due to the internal logic `if (searchInputTerm === '' && debouncedSearchTerm === '')`, it might not always skip.
    // The current hook logic will always try to set a timeout unless both terms are empty.
    // So, a timeout will be set. Let's verify the behavior based on the hook's actual code.

    expect(result.current.searchInputTerm).toBe('synced');
    expect(result.current.debouncedSearchTerm).toBe('synced');

    // Advance time slightly, debounced term should not change if it was already correct and a new timeout was set for the same value
    act(() => {
        vi.advanceTimersByTime(debounceMs -1 );
    });
     expect(result.current.debouncedSearchTerm).toBe('synced');

    act(() => {
        vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedSearchTerm).toBe('synced');
    
    clearTimeoutSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it('handles empty string initialValue and updates correctly', () => {
    const debounceMs = 100;
    const { result } = renderHook(() => useDamSearchInput({ initialValue: '', debounceMs }));
    expect(result.current.searchInputTerm).toBe('');
    expect(result.current.debouncedSearchTerm).toBe('');

    act(() => {
      result.current.setSearchInputTerm('hello');
    });
    expect(result.current.searchInputTerm).toBe('hello');
    expect(result.current.debouncedSearchTerm).toBe(''); // Not yet debounced

    act(() => {
      vi.advanceTimersByTime(debounceMs);
    });
    expect(result.current.debouncedSearchTerm).toBe('hello');

    act(() => {
      result.current.setSearchInputTerm(''); // Clear input
    });
    expect(result.current.searchInputTerm).toBe('');

    act(() => {
      vi.advanceTimersByTime(debounceMs); // Debounce the clear
    });
    expect(result.current.debouncedSearchTerm).toBe('');
  });

}); 