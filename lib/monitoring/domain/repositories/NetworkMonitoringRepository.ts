import { NetworkStats } from '../network-efficiency/entities/NetworkCall';

/**
 * Repository interface for network monitoring operations
 * Defines contracts for accessing network monitoring data
 * without coupling to specific infrastructure implementations
 */
export interface NetworkMonitoringRepository {
  /**
   * Get current network statistics
   */
  getNetworkStats(): Promise<NetworkStats>;

  /**
   * Store network call data for analysis
   */
  storeNetworkCall(callData: any): Promise<void>;

  /**
   * Get network performance history
   */
  getNetworkHistory(timeRange: { start: Date; end: Date }): Promise<NetworkStats[]>;

  /**
   * Clear network monitoring data
   */
  clearNetworkData(): Promise<void>;

  /**
   * Get redundant patterns for optimization analysis
   */
  getRedundantPatterns(): Promise<any[]>;
} 