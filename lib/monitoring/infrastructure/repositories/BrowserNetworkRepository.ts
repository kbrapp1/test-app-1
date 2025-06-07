import { NetworkMonitoringRepository } from '../../domain/repositories/NetworkMonitoringRepository';
import { NetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';
import { ErrorHandlingService } from '../services/ErrorHandlingService';

/**
 * Browser-based implementation of NetworkMonitoringRepository
 * Handles network monitoring data through browser APIs and local storage
 */
export class BrowserNetworkRepository implements NetworkMonitoringRepository {
  private readonly storageKey = 'monitoring_network_data';
  private readonly historyKey = 'monitoring_network_history';

  async getNetworkStats(): Promise<NetworkStats> {
    try {
      // Get from session storage or return default
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      
      return this.getDefaultNetworkStats();
    } catch (error) {
      ErrorHandlingService.handleRepositoryError('BrowserNetworkRepository.getNetworkStats', error, {});
      return this.getDefaultNetworkStats();
    }
  }

  async storeNetworkCall(callData: any): Promise<void> {
    try {
      // Store call data in session storage for current session analysis
      const existing = await this.getNetworkStats();
      const updated = this.addCallToStats(existing, callData);
      sessionStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (error) {
      ErrorHandlingService.handleRepositoryError('BrowserNetworkRepository.storeNetworkCall', error, { callData });
    }
  }

  async getNetworkHistory(timeRange: { start: Date; end: Date }): Promise<NetworkStats[]> {
    try {
      const stored = localStorage.getItem(this.historyKey);
      if (!stored) return [];

      const history: NetworkStats[] = JSON.parse(stored);
      // For now, return all history - timestamp filtering would need to be added to NetworkStats interface
      return history;
    } catch (error) {
      ErrorHandlingService.handleRepositoryError('BrowserNetworkRepository.getNetworkHistory', error, { timeRange });
      return [];
    }
  }

  async clearNetworkData(): Promise<void> {
    try {
      sessionStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.historyKey);
    } catch (error) {
      ErrorHandlingService.handleRepositoryError('BrowserNetworkRepository.clearNetworkData', error, {});
    }
  }

  async getRedundantPatterns(): Promise<any[]> {
    try {
      const stats = await this.getNetworkStats();
      return stats.redundantPatterns || [];
    } catch (error) {
      ErrorHandlingService.handleRepositoryError('BrowserNetworkRepository.getRedundantPatterns', error, {});
      return [];
    }
  }

  private getDefaultNetworkStats(): NetworkStats {
    return {
      totalCalls: 0,
      redundantCalls: 0,
      redundancyRate: 0,
      sessionRedundancyRate: 0,
      persistentRedundantCount: 0,
      recentCalls: [],
      redundantPatterns: [],
      callsByType: {},
      persistentIssues: []
    };
  }

  private addCallToStats(stats: NetworkStats, callData: any): NetworkStats {
    // Simple implementation - would be enhanced with real pattern detection
    return {
      ...stats,
      totalCalls: stats.totalCalls + 1,
      recentCalls: [...stats.recentCalls.slice(-49), callData] // Keep last 50 calls
    };
  }
} 