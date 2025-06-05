'use client';

import React from 'react';
import { NetworkMonitorContainer } from '../presentation/components/NetworkMonitorContainer';

/**
 * Generic Network Monitor UI
 * 
 * Universal network monitoring component that can track:
 * - Server Actions
 * - API Routes  
 * - Fetch requests
 * - XMLHttpRequest calls
 * - Any HTTP requests
 * 
 * @deprecated Use NetworkMonitorContainer directly for new implementations
 */

interface GenericNetworkMonitorUIProps {
  isFullPage?: boolean;
}

export function GenericNetworkMonitorUI({ isFullPage = false }: GenericNetworkMonitorUIProps) {
  return <NetworkMonitorContainer isFullPage={isFullPage} />;
} 