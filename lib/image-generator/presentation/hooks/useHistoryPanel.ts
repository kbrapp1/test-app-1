import { useState, useEffect, useCallback } from 'react';

export interface UseHistoryPanelReturn {
  showHistory: boolean;
  panelVisible: boolean;
  toggleHistory: () => void;
  closeHistory: () => void;
}

export const useHistoryPanel = (): UseHistoryPanelReturn => {
  const [showHistory, setShowHistory] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  // Handle unmount after slide-out animation
  useEffect(() => {
    if (!showHistory && panelVisible) {
      const id = setTimeout(() => setPanelVisible(false), 200);
      return () => clearTimeout(id);
    }
  }, [showHistory, panelVisible]);

  const toggleHistory = useCallback(() => {
    if (!panelVisible) {
      setPanelVisible(true);
      setTimeout(() => setShowHistory(true), 10);
    } else {
      setShowHistory(false);
    }
  }, [panelVisible]);

  const closeHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  return {
    showHistory,
    panelVisible,
    toggleHistory,
    closeHistory,
  };
}; 