'use client';

import { useEffect } from 'react';

/**
 * React Scan Integration for Development Environment
 * Single responsibility: Initialize React Scan for performance visualization during development
 * 
 * Enabled for development use - works alongside React Query dev tools positioned at top
 */
export function ReactScanIntegration() {
  useEffect(() => {
    // Only load in development environment
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    // Dynamically import React Scan to avoid bundling in production
    const loadReactScan = async () => {
      try {
        const { scan } = await import('react-scan');
        
        // Initialize React Scan with optimal settings
        scan({
          enabled: true,
          log: false, // Reduce console noise
          showToolbar: true,
          dangerouslyForceRunInProduction: false, // Safety check
        });

          } catch (error) {
      // Silent fail for development tool
    }
    };

    loadReactScan();
  }, []);

  // This component renders nothing
  return null;
}

export default ReactScanIntegration; 