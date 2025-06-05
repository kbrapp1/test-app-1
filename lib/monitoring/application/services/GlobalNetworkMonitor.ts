/**
 * Global Network Monitor Instance
 * 
 * Singleton instance of NetworkMonitoringService for global access
 * Maintains backward compatibility while following DDD principles
 */

import { NetworkMonitoringService } from './NetworkMonitoringService';

// Global singleton instance
export const globalNetworkMonitor = new NetworkMonitoringService();

// Export types for backward compatibility
export type { NetworkStats, NetworkCall, RedundantCall } from '../../domain/network-efficiency/entities/NetworkCall'; 