/**
 * Network Monitor Service
 * 
 * Domain service responsible for network call monitoring and interception
 * Single responsibility: Manage fetch interception and call tracking
 */

import { NetworkCallMonitor, type CallAnalysis } from '@/lib/utils/network-monitor';
import { detectActionFromPatterns } from '../NetworkMonitorConfig';

export interface NetworkCall {
  url: string;
  method: string;
  timestamp: number;
  timeString: string;
  actionContext?: string;
}

export class NetworkMonitorService {
  private monitor: NetworkCallMonitor | null = null;
  private originalFetch: typeof window.fetch | null = null;
  private isMonitoring = false;

  constructor(
    private onCallDetected: (call: NetworkCall) => void,
    private onActionDetected: (action: string) => void
  ) {}

  startMonitoring(currentAction: string): NetworkCallMonitor {
    if (this.isMonitoring) {
      return this.monitor!;
    }

    this.monitor = new NetworkCallMonitor();
    this.monitor.startMonitoring();
    this.isMonitoring = true;

    // Intercept fetch calls
    this.originalFetch = window.fetch;
    window.fetch = async (...args) => {
      // Handle different types of fetch arguments
      let url: string;
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof Request) {
        url = args[0].url;
      } else if (args[0] instanceof URL) {
        url = args[0].toString();
      } else {
        url = String(args[0]);
      }
      
      const options = args[1] || {};
      const method = options.method || 'GET';
      
      const detectedAction = detectActionFromPatterns(url, method);
      let actionContext = currentAction;
      
      // Auto-switch action if detected and different
      if (detectedAction && detectedAction !== currentAction) {
        actionContext = detectedAction;
        this.onActionDetected(detectedAction);
      }
      
      // Track the call
      const networkCall: NetworkCall = {
        url,
        method,
        timestamp: Date.now(),
        timeString: new Date().toLocaleTimeString(),
        actionContext
      };
      
      this.onCallDetected(networkCall);
      
      return this.originalFetch!(...args);
    };

    return this.monitor;
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }

    if (this.monitor) {
      this.monitor.stopMonitoring();
    }

    this.isMonitoring = false;
  }

  analyzeRedundancy(timeWindow: number = 5000): CallAnalysis | null {
    if (!this.monitor) return null;

    try {
      return this.monitor.analyzeRedundancy(timeWindow);
    } catch (error) {
      console.warn('Redundancy analysis error:', error);
      return null;
    }
  }

  resetMonitoring(): void {
    this.stopMonitoring();
    this.monitor = null;
  }
} 