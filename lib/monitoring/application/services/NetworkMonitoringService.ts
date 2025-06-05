/**
 * Network Monitoring Service (Application Layer)
 * 
 * Single Responsibility: Coordinate network monitoring use cases
 * Orchestrates domain and infrastructure services
 */

import { NetworkCall, NetworkStats, RedundantCall } from '../../domain/network-efficiency/entities/NetworkCall';
import { RedundancyDetector } from '../../domain/network-efficiency/services/RedundancyDetector';
import { NetworkCallTracker } from '../../infrastructure/services/NetworkCallTracker';
import { SourceTracker, CallSource } from '../../infrastructure/services/SourceTracker';
import { NetworkIssueDetectionService } from '../../domain/network-efficiency/services/NetworkIssueDetectionService';
import { NetworkIssue } from '../../domain/network-efficiency/value-objects/NetworkIssue';

export class NetworkMonitoringService {
  private readonly callTracker: NetworkCallTracker;
  private readonly redundancyDetector: RedundancyDetector;
  private detectedRedundancies: RedundantCall[] = [];
  private persistentIssues: NetworkIssue[] = [];
  private readonly maxRedundancyHistory = 100;
  private readonly maxIssueHistory = 50;
  
  // Session-level tracking (never drops)
  private sessionTotalCalls = 0;
  private sessionRedundantCalls = 0;

  constructor() {
    this.callTracker = new NetworkCallTracker();
    this.redundancyDetector = new RedundancyDetector();
  }

  /**
   * Track a new network call with source information
   */
  trackCall(call: Omit<NetworkCall, 'id' | 'timestamp'>): string {
    // Use pre-captured source if available, otherwise capture fresh
    let source = call.source;
    if (!source) {
      // Fallback: capture source if not provided (for backward compatibility)
      source = SourceTracker.captureSource();
    }
    
    // Create enhanced call with source
    const enhancedCall = {
      ...call,
      source
    };

    const callId = this.callTracker.trackCall(enhancedCall);
    
    // Increment session counters
    this.sessionTotalCalls++;
    
    // Check for new redundancies and issues
    this.detectAndStoreRedundancies();
    this.detectAndStoreIssues();
    
    return callId;
  }

  /**
   * Complete a tracked call
   */
  completeCall(
    callId: string, 
    data: { duration?: number; status?: number; response?: any; error?: string }
  ): void {
    this.callTracker.completeCall(callId, data);
    
    // Re-check for issues after call completion
    this.detectAndStoreIssues();
  }

  /**
   * Get comprehensive network statistics with persistent issues
   */
  getNetworkStats(): NetworkStats {
    const allCalls = this.callTracker.getAllCalls();
    
    // Calculate statistics based on current calls
    const totalCalls = allCalls.length;
    const currentPatterns = this.redundancyDetector.detectRedundancy(allCalls);
    const currentRedundantCount = currentPatterns.reduce(
      (count, pattern) => count + pattern.duplicateCalls.length, 
      0
    );
    
    const callsByType = allCalls.reduce((acc, call) => {
      acc[call.type] = (acc[call.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgDuration = allCalls
      .filter(call => call.duration)
      .reduce((sum, call) => sum + (call.duration || 0), 0) / Math.max(1, allCalls.length);

    return {
      totalCalls,
      redundantCalls: currentRedundantCount, // Current active redundant calls for "Active Issues" count
      redundancyRate: this.calculateSessionRedundancyRate(), // Use SESSION rate for efficiency bars
      sessionRedundancyRate: this.calculateSessionRedundancyRate(),
      persistentRedundantCount: this.getTotalDetectedRedundancies(),
      recentCalls: allCalls.slice(0, 10),
      redundantPatterns: [...this.detectedRedundancies], // Use PERSISTENT patterns, not current!
      callsByType,
      // Add persistent issues to the stats
      persistentIssues: [...this.persistentIssues]
    };
  }

  /**
   * Get all detected redundancy patterns
   */
  getAllRedundancies(): RedundantCall[] {
    return [...this.detectedRedundancies];
  }

  /**
   * Get all persistent issues
   */
  getPersistentIssues(): NetworkIssue[] {
    return [...this.persistentIssues];
  }

  /**
   * Clear all monitoring data including persistent issues
   */
  clear(): void {
    this.callTracker.clear();
    this.detectedRedundancies = [];
    this.persistentIssues = [];
    // Reset session counters
    this.sessionTotalCalls = 0;
    this.sessionRedundantCalls = 0;
  }

  /**
   * Detect and store new redundancies
   */
  private detectAndStoreRedundancies(): void {
    const allCalls = this.callTracker.getAllCalls();
    const newPatterns = this.redundancyDetector.detectRedundancy(allCalls);
    
    // Add new patterns that haven't been detected before
    newPatterns.forEach(pattern => {
      const exists = this.detectedRedundancies.find(existing => 
        existing.originalCall.id === pattern.originalCall.id
      );
      
      if (!exists) {
        this.detectedRedundancies.unshift(pattern);
        
        // Update session redundant call count
        this.sessionRedundantCalls += pattern.duplicateCalls.length;
        
        // Keep history manageable
        if (this.detectedRedundancies.length > this.maxRedundancyHistory) {
          this.detectedRedundancies = this.detectedRedundancies.slice(0, this.maxRedundancyHistory);
        }
      }
    });
  }

  /**
   * Detect and store new persistent issues
   */
  private detectAndStoreIssues(): void {
    const allCalls = this.callTracker.getAllCalls();
    
    // Create temporary stats for issue detection
    const tempStats = {
      totalCalls: allCalls.length,
      redundantCalls: this.redundancyDetector.detectRedundancy(allCalls).reduce(
        (count, pattern) => count + pattern.duplicateCalls.length, 
        0
      ),
      redundancyRate: 0,
      sessionRedundancyRate: 0,
      persistentRedundantCount: 0,
      recentCalls: allCalls.slice(0, 10),
      redundantPatterns: [],
      callsByType: {}
    };
    
    const newIssues = NetworkIssueDetectionService.detectIssues(tempStats);
    
    // Add new issues that haven't been detected before
    newIssues.forEach(newIssue => {
      const exists = this.persistentIssues.find(existing => 
        existing.type === newIssue.type && 
        existing.severity === newIssue.severity &&
        Math.abs(existing.timestamp - newIssue.timestamp) < 30000 // Within 30 seconds
      );
      
      if (!exists) {
        this.persistentIssues.unshift(newIssue);
        
        // Keep issue history manageable
        if (this.persistentIssues.length > this.maxIssueHistory) {
          this.persistentIssues = this.persistentIssues.slice(0, this.maxIssueHistory);
        }
      }
    });
  }

  /**
   * Calculate overall session redundancy rate
   */
  private calculateSessionRedundancyRate(): number {
    // Use persistent session counts, not current tracker data
    return this.sessionTotalCalls > 0 ? (this.sessionRedundantCalls / this.sessionTotalCalls) * 100 : 0;
  }

  /**
   * Get total number of redundant calls ever detected
   */
  private getTotalDetectedRedundancies(): number {
    return this.detectedRedundancies.reduce(
      (count, pattern) => count + pattern.duplicateCalls.length, 
      0
    );
  }
} 