import { useState } from 'react';

/**
 * useCollapsibleSections Hook
 * Single Responsibility: Manage collapsible section open/closed states
 * Presentation Layer - State coordination for collapsible UI sections
 */
export function useCollapsibleSections() {
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const toggleStyleSection = () => setIsStyleOpen(!isStyleOpen);
  const toggleAdvancedSection = () => setIsAdvancedOpen(!isAdvancedOpen);

  const openAllSections = () => {
    setIsStyleOpen(true);
    setIsAdvancedOpen(true);
  };

  const closeAllSections = () => {
    setIsStyleOpen(false);
    setIsAdvancedOpen(false);
  };

  return {
    isStyleOpen,
    isAdvancedOpen,
    toggleStyleSection,
    toggleAdvancedSection,
    openAllSections,
    closeAllSections
  };
} 