import { useState, useEffect, useCallback } from 'react';

export interface UseHistoryPanelReturn {
  showHistory: boolean;
  panelVisible: boolean;
  toggleHistory: () => void;
  closeHistory: () => void;
}

export const useHistoryPanel = (): UseHistoryPanelReturn => {
  // isOpen controls whether the panel should be open
  const [isOpen, setIsOpen] = useState(false);
  // isMounted controls DOM mounting
  const [isMounted, setIsMounted] = useState(false);
  // isPanelVisible controls the slide-in/out animation
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Manage mount, animation, and unmount like TTS panel
  useEffect(() => {
    if (isOpen) {
      // On open: mount then animate in
      setIsMounted(true);
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsPanelVisible(true);
        });
      }, 50);
      return () => clearTimeout(timer);
    } else if (isMounted) {
      // On close: animate out then unmount
      setIsPanelVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 200); // match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMounted]);

  const toggleHistory = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeHistory = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    showHistory: isPanelVisible,
    panelVisible: isMounted,
    toggleHistory,
    closeHistory,
  };
}; 