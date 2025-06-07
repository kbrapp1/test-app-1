import { PerformanceDataRepository } from '../../domain/repositories/PerformanceDataRepository';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { ErrorHandlingService } from '../services/ErrorHandlingService';

/**
 * Browser-based implementation of PerformanceDataRepository
 * Handles performance data through browser APIs and local storage
 */
export class BrowserPerformanceRepository implements PerformanceDataRepository {
  private readonly storageKey = 'monitoring_performance_data';
  private readonly historyKey = 'monitoring_performance_history';

  async getPerformanceData(): Promise<PerformanceMetrics> {
    try {
      // Get from session storage or return default
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      
      return this.getDefaultPerformanceMetrics();
    } catch (error) {
      ErrorHandlingService.handleRepositoryError('getPerformanceData', error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  async storePerformanceData(metrics: PerformanceMetrics): Promise<void> {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(metrics));
      
      // Also store in history for trend analysis
      await this.addToHistory(metrics);
    } catch (error) {
      console.error('Failed to store performance data:', error);
    }
  }

  async getPerformanceTrends(timeRange: { start: Date; end: Date }): Promise<PerformanceMetrics[]> {
    try {
      const stored = localStorage.getItem(this.historyKey);
      if (!stored) return [];

      const history: PerformanceMetrics[] = JSON.parse(stored);
      return history.filter(metrics => {
        const timestamp = new Date(metrics.lastUpdate);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      });
    } catch (error) {
      console.error('Failed to get performance trends:', error);
      return [];
    }
  }

  async clearPerformanceData(): Promise<void> {
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear performance data:', error);
    }
  }

  private async addToHistory(metrics: PerformanceMetrics): Promise<void> {
    try {
      const stored = localStorage.getItem(this.historyKey);
      const history: PerformanceMetrics[] = stored ? JSON.parse(stored) : [];
      
      // Keep last 100 entries
      const updatedHistory = [...history.slice(-99), metrics];
      localStorage.setItem(this.historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to add to performance history:', error);
    }
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      cacheSize: 0,
      activeMutations: 0,
      isOptimized: false,
      lastUpdate: new Date().toISOString(),
      webVitals: {}
    };
  }
} 