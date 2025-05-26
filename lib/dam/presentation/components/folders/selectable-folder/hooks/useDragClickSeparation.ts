'use client';

import { useRef, useCallback } from 'react';

/**
 * Drag vs Click Separation Hook
 * 
 * Provides enhanced UX by distinguishing between intentional drags
 * and accidental mouse movements during clicks.
 */
export const useDragClickSeparation = () => {
  const dragStarted = useRef(false);
  const startPosition = useRef<{ x: number; y: number } | null>(null);
  
  // Minimum distance to consider it a drag (in pixels)
  const DRAG_THRESHOLD = 5;
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStarted.current = false;
    startPosition.current = { x: e.clientX, y: e.clientY };
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!startPosition.current) return;
    
    const deltaX = Math.abs(e.clientX - startPosition.current.x);
    const deltaY = Math.abs(e.clientY - startPosition.current.y);
    
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      dragStarted.current = true;
    }
  }, []);
  
  const handleMouseUp = useCallback(() => {
    const wasDrag = dragStarted.current;
    dragStarted.current = false;
    startPosition.current = null;
    return wasDrag;
  }, []);
  
  const handleClick = useCallback((e: React.MouseEvent, onClick?: () => void) => {
    // Only trigger click if it wasn't a drag
    if (!dragStarted.current && onClick) {
      onClick();
    }
  }, []);
  
  return {
    dragStarted: dragStarted.current,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick
  };
}; 