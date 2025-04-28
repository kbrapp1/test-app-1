import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast, toast as standaloneToast, reducer } from './use-toast' // Import reducer too
import type { ToastActionElement, ToastProps } from '@/components/ui/toast' // Import ToastProps

// Define ToasterToast type locally for test usage if not exported
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// Mock UI components
vi.mock('@/components/ui/toast', () => ({}));

describe('useToast Hook', () => {
  beforeEach(() => {
    // Get the dismiss function from the hook to reset global state
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.dismiss(); // Call dismiss without ID to clear all
    });
    // Only clear timers, don't manipulate them here
    vi.clearAllTimers(); 
  });

  afterEach(() => {
    vi.useRealTimers(); // Ensure real timers are restored
  });

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('should add a toast when toast() is called', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      standaloneToast({ title: 'Test Toast' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Toast',
      open: true,
    })
    expect(result.current.toasts[0].id).toBeDefined()
  })

  it('should return id, dismiss, and update from toast()', () => {
    let toastControls: { id: string; dismiss: () => void; update: (props: any) => void; } | undefined;
    
    act(() => {
      toastControls = standaloneToast({ title: 'Another Toast' })
    })

    expect(toastControls).toBeDefined()
    expect(toastControls?.id).toEqual(expect.any(String))
    expect(toastControls?.dismiss).toEqual(expect.any(Function))
    expect(toastControls?.update).toEqual(expect.any(Function))
  })

  it('should dismiss a toast using the dismiss function from the hook', () => {
    const { result } = renderHook(() => useToast())
    let toastId: string | undefined;

    act(() => {
      const { id } = standaloneToast({ title: 'Dismiss Me' })
      toastId = id;
    })

    expect(result.current.toasts[0]?.open).toBe(true)

    act(() => {
      result.current.dismiss(toastId)
    })

    expect(result.current.toasts[0]?.open).toBe(false)
  })

  it('should dismiss a toast using the dismiss function returned by toast()', () => {
    const { result } = renderHook(() => useToast())
    let toastControls: { dismiss: () => void } | undefined;

    act(() => {
      toastControls = standaloneToast({ title: 'Dismiss Me Too' })
    })

    expect(result.current.toasts[0]?.open).toBe(true)

    act(() => {
      toastControls?.dismiss()
    })

    expect(result.current.toasts[0]?.open).toBe(false)
  })

  it('should dismiss a toast when onOpenChange(false) is called', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      standaloneToast({ title: 'Auto Dismiss' })
    })

    expect(result.current.toasts[0]?.open).toBe(true)

    // Simulate the onOpenChange call
    act(() => {
      result.current.toasts[0]?.onOpenChange?.(false)
    })

    expect(result.current.toasts[0]?.open).toBe(false)
  })

  it('should only keep TOAST_LIMIT (1) toasts', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      standaloneToast({ title: 'Toast 1' })
      standaloneToast({ title: 'Toast 2' })
    })

    expect(result.current.toasts).toHaveLength(1)
    // The newest toast should be the one remaining
    expect(result.current.toasts[0]?.title).toBe('Toast 2')
  })

  it('should update a toast using the update function', () => {
    const { result } = renderHook(() => useToast())
    // Update type annotation to match actual signature (expects full ToasterToast)
    let toastControls: { id: string; update: (props: ToasterToast) => void } | undefined;

    act(() => {
      toastControls = standaloneToast({ title: 'Initial Title' })
    })

    expect(result.current.toasts[0]?.title).toBe('Initial Title')

    act(() => {
      // Pass the required fields for ToasterToast
      toastControls?.update({ 
        ...result.current.toasts[0], // Spread existing toast data
        id: toastControls.id, 
        title: 'Updated Title' 
      })
    })

    expect(result.current.toasts[0]?.title).toBe('Updated Title')
    expect(result.current.toasts[0]?.open).toBe(true)
  })

  it('should remove the toast after TOAST_REMOVE_DELAY when dismissed', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useToast())
    let toastControls: { id: string; dismiss: () => void } | undefined;

    act(() => {
      toastControls = standaloneToast({ title: 'Disappear Me' })
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      toastControls?.dismiss()
    })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]?.open).toBe(false)

    // Advance timers within act
    act(() => {
       vi.advanceTimersByTime(1000000 + 100)
    })
    
    // Check state directly - removal should be synchronous with fake timers
    expect(result.current.toasts).toHaveLength(0)
  })
}); 