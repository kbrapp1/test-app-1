import { useState, useEffect, useRef, RefObject } from 'react';

interface GridDimensions {
  width: number;
  height: number;
}

interface UseGridDimensionsOptions {
  /** Top offset to subtract from viewport height (for header, nav etc.) */
  topOffset?: number;
  /** Minimum height in pixels */
  minHeight?: number;
}

/**
 * Custom hook to calculate and maintain grid dimensions
 * Handles window resize events and container width detection
 */
export function useGridDimensions({ 
  topOffset = 200, 
  minHeight = 300
}: UseGridDimensionsOptions = {}): {
  ref: RefObject<HTMLDivElement>;
  dimensions: GridDimensions;
  hasMounted: boolean;
} {
  const gridContainerRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const [hasMounted, setHasMounted] = useState(false);
  const [dimensions, setDimensions] = useState<GridDimensions>({ 
    width: 0, 
    height: 0 
  });

  // Effect to calculate dimensions and update on resize
  useEffect(() => {
    if (!hasMounted) return;

    const calculateDimensions = () => {
      if (gridContainerRef.current) {
        // Get container width
        const containerWidth = gridContainerRef.current.offsetWidth;
        
        // Calculate available height (viewport height minus provided offset)
        const viewportHeight = window.innerHeight;
        const availableHeight = Math.max(minHeight, viewportHeight - topOffset);
        
        setDimensions({
          width: containerWidth,
          height: availableHeight
        });
      }
    };

    // Calculate on mount
    calculateDimensions();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateDimensions);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', calculateDimensions);
    };
  }, [hasMounted, topOffset, minHeight]);

  // Effect for mounting state
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return {
    ref: gridContainerRef,
    dimensions,
    hasMounted
  };
} 