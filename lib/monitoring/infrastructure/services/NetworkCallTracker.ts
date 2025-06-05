/**
 * Network Call Tracker Service (Infrastructure Layer)
 * 
 * Single Responsibility: Track and store network call data
 * Part of Infrastructure layer - handles external monitoring concerns
 */

import { NetworkCall } from '../../domain/network-efficiency/entities/NetworkCall';

export class NetworkCallTracker {
  private calls: NetworkCall[] = [];
  private readonly maxCallHistory = 1000;
  
  /**
   * Track a single network call
   */
  trackCall(call: Omit<NetworkCall, 'id' | 'timestamp'>): string {
    const networkCall: NetworkCall = {
      ...call,
      id: this.generateCallId(),
      timestamp: Date.now(),
    };
    
    this.calls.unshift(networkCall);
    
    // Keep only recent calls
    if (this.calls.length > this.maxCallHistory) {
      this.calls = this.calls.slice(0, this.maxCallHistory);
    }
    
    return networkCall.id;
  }
  
  /**
   * Update call with completion data
   */
  completeCall(
    callId: string, 
    data: { duration?: number; status?: number; response?: any; error?: string }
  ): void {
    const call = this.calls.find(c => c.id === callId);
    if (call) {
      Object.assign(call, data);
    }
  }
  
  /**
   * Get all tracked calls
   */
  getAllCalls(): NetworkCall[] {
    return [...this.calls];
  }
  
  /**
   * Get recent calls within time window
   */
  getRecentCalls(windowMs: number): NetworkCall[] {
    const now = Date.now();
    return this.calls.filter(call => now - call.timestamp <= windowMs);
  }
  
  /**
   * Clear all tracked calls
   */
  clear(): void {
    this.calls = [];
  }
  
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 