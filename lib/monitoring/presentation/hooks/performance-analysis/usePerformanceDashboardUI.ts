'use client';

import { useState, useRef, useCallback, useEffect, startTransition } from 'react';

/**
 * Expandable Dashboard Sections Configuration
 * @interface ExpandableSections
 */
interface ExpandableSections {
  /** Whether the frontend performance section is expanded */
  frontend: boolean;
  /** Whether the network monitoring section is expanded */
  network: boolean;
  /** Whether the bundle optimization section is expanded */
  bundle: boolean;
}

/**
 * Performance Dashboard UI State Hook (Presentation Layer)
 * 
 * Responsibility: Manage UI state and user interactions for performance dashboard
 * Bounded Context: Performance Monitoring UI
 * 
 * Single Responsibility: Focus solely on UI state management and user interactions
 * 
 * @returns {object} UI state and interaction handlers
 */
export function usePerformanceDashboardUI() {
  // UI State Management
  const [expandedSections, setExpandedSections] = useState<ExpandableSections>({
    frontend: false,
    network: false,
    bundle: false
  });

  const [showFullResetConfirm, setShowFullResetConfirm] = useState(false);
  const fullResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Toggles the expansion state of dashboard sections
   * 
   * Uses React 18's startTransition for optimal performance.
   * Marks section toggling as low-priority to avoid blocking
   * performance-critical renders.
   * 
   * @param {keyof ExpandableSections} sectionKey - Section to toggle
   * @callback
   */
  const toggleDashboardSection = useCallback((sectionKey: keyof ExpandableSections) => {
    // Use startTransition to mark this as a low-priority update
    startTransition(() => {
      setExpandedSections(previousSections => ({
        ...previousSections,
        [sectionKey]: !previousSections[sectionKey]
      }));
    });
  }, []);

  /**
   * Handles full dashboard reset confirmation flow
   * 
   * Implements a two-step confirmation process:
   * 1. First click shows confirmation
   * 2. Confirmation state auto-resets after 3 seconds if not confirmed
   * 
   * @param {() => void} onConfirmedReset - Callback to execute when reset is confirmed
   * @callback
   */
  const handleFullResetConfirmation = useCallback((onConfirmedReset: () => void) => {
    if (showFullResetConfirm) {
      onConfirmedReset();
      setShowFullResetConfirm(false);
      if (fullResetTimeoutRef.current) {
        clearTimeout(fullResetTimeoutRef.current);
        fullResetTimeoutRef.current = null;
      }
    } else {
      setShowFullResetConfirm(true);
      fullResetTimeoutRef.current = setTimeout(() => {
        setShowFullResetConfirm(false);
        fullResetTimeoutRef.current = null;
      }, 3000);
    }
  }, [showFullResetConfirm]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (fullResetTimeoutRef.current) {
        clearTimeout(fullResetTimeoutRef.current);
      }
    };
  }, []);

  return {
    // UI State
    expandedSections,
    showFullResetConfirm,
    
    // Interaction Handlers
    toggleSection: toggleDashboardSection,
    handleResetConfirmation: handleFullResetConfirmation,
    
    // Cleanup References
    fullResetTimeoutRef
  };
} 