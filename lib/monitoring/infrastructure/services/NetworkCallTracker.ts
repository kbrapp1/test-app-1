/**
 * Network Call Tracker Service (Infrastructure Layer)
 * 
 * Single Responsibility: Track and store network call data efficiently
 * Optimizations: Circular buffer, efficient lookups, memory management
 */

import { NetworkCall } from '../../domain/network-efficiency/entities/NetworkCall';

/**
 * Circular buffer for efficient call storage
 */
class CircularCallBuffer {
  private buffer: (NetworkCall | undefined)[];
  private head = 0;
  private size = 0;
  private readonly capacity: number;
  
  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }
  
  add(call: NetworkCall): void {
    this.buffer[this.head] = call;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }
  
  getAll(): NetworkCall[] {
    if (this.size === 0) return [];
    
    const result: NetworkCall[] = [];
    let bufferIndex = this.size === this.capacity 
      ? this.head 
      : 0;
    
    for (let i = 0; i < this.size; i++) {
      const call = this.buffer[bufferIndex];
      if (call) {
        result.push(call);
      }
      bufferIndex = (bufferIndex + 1) % this.capacity;
    }
    
    // Return newest first
    return result.reverse();
  }
  
  findById(id: string): NetworkCall | undefined {
    for (let i = 0; i < this.size; i++) {
      if (this.buffer[i]?.id === id) {
        return this.buffer[i];
      }
    }
    return undefined;
  }
  
  clear(): void {
    this.head = 0;
    this.size = 0;
    this.buffer.fill(undefined);
  }
  
  getSize(): number {
    return this.size;
  }
}

export class NetworkCallTracker {
  private readonly callBuffer: CircularCallBuffer;
  private readonly callLookup = new Map<string, NetworkCall>();
  private readonly maxCallHistory = 1000;
  
  constructor() {
    this.callBuffer = new CircularCallBuffer(this.maxCallHistory);
  }
  
  /**
   * Track a single network call with efficient storage
   */
  trackCall(call: Omit<NetworkCall, 'id' | 'timestamp'>): string {
    const networkCall: NetworkCall = {
      ...call,
      id: this.generateCallId(),
      timestamp: Date.now(),
    };
    
    // Add to circular buffer
    this.callBuffer.add(networkCall);
    
    // Maintain fast lookup map
    this.callLookup.set(networkCall.id, networkCall);
    
    // Keep lookup map size manageable
    if (this.callLookup.size > this.maxCallHistory) {
      this.cleanupOldLookupEntries();
    }
    
    return networkCall.id;
  }
  
  /**
   * Update call with completion data using efficient lookup
   */
  completeCall(
    callId: string, 
    data: { duration?: number; status?: number; response?: unknown; error?: string }
  ): void {
    const call = this.callLookup.get(callId);
    if (call) {
      Object.assign(call, data);
    }
  }
  
  /**
   * Get all tracked calls from circular buffer
   */
  getAllCalls(): NetworkCall[] {
    return this.callBuffer.getAll();
  }
  
  /**
   * Get recent calls within time window (optimized)
   */
  getRecentCalls(windowMs: number): NetworkCall[] {
    const now = Date.now();
    const allCalls = this.callBuffer.getAll();
    
    // Since calls are ordered newest first, we can break early
    const result: NetworkCall[] = [];
    for (const call of allCalls) {
      if (now - call.timestamp <= windowMs) {
        result.push(call);
      } else {
        // Calls are chronologically ordered, so we can stop here
        break;
      }
    }
    
    return result;
  }
  
  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    bufferSize: number;
    lookupSize: number;
    memoryEfficiency: number;
  } {
    const bufferSize = this.callBuffer.getSize();
    const lookupSize = this.callLookup.size;
    
    return {
      bufferSize,
      lookupSize,
      memoryEfficiency: bufferSize > 0 ? lookupSize / bufferSize : 1
    };
  }
  
  /**
   * Clear all tracked calls and reset data structures
   */
  clear(): void {
    this.callBuffer.clear();
    this.callLookup.clear();
  }
  
  /**
   * Cleanup old entries from lookup map to prevent memory growth
   */
  private cleanupOldLookupEntries(): void {
    const currentCalls = new Set(this.callBuffer.getAll().map(call => call.id));
    
    // Remove lookup entries that are no longer in the buffer
    this.callLookup.forEach((call, callId) => {
      if (!currentCalls.has(callId)) {
        this.callLookup.delete(callId);
      }
    });
  }
  
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 