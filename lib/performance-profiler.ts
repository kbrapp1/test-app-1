// Use browser-compatible performance API
const performanceAPI = typeof window !== 'undefined' 
  ? window.performance 
  : typeof global !== 'undefined' && global.performance 
    ? global.performance 
    : { now: () => Date.now() };

interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceReport {
  totalDuration: number;
  entries: PerformanceEntry[];
  slowestOperations: PerformanceEntry[];
  summary: {
    [category: string]: {
      totalTime: number;
      callCount: number;
      averageTime: number;
    };
  };
}

/**
 * Performance Profiler for Chatbot System
 * 
 * AI INSTRUCTIONS:
 * - Measure execution time of functions and code blocks
 * - Provide detailed performance reports
 * - Minimal overhead when disabled
 * - Thread-safe and production-ready
 */
export class PerformanceProfiler {
  private static entries: PerformanceEntry[] = [];
  private static isEnabled = process.env.CHATBOT_PERFORMANCE_PROFILING === 'true';
  private static activeTimers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  static startTimer(name: string, metadata?: Record<string, unknown>): string {
    if (!this.isEnabled) return name;
    
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeTimers.set(timerId, performanceAPI.now());
    
    if (metadata) {
      (this.activeTimers as Map<string, unknown>).set(`${timerId}_metadata`, metadata);
    }
    
    return timerId;
  }

  /**
   * End timing an operation
   */
  static endTimer(timerId: string): number {
    if (!this.isEnabled) return 0;
    
    const startTime = this.activeTimers.get(timerId);
    if (!startTime) return 0;
    
    const endTime = performanceAPI.now();
    const duration = endTime - startTime;
    const metadata = (this.activeTimers as Map<string, unknown>).get(`${timerId}_metadata`);
    
    const entry: PerformanceEntry = {
      name: timerId.split('_')[0],
      startTime,
      endTime,
      duration,
      metadata: metadata as Record<string, unknown> | undefined
    };
    
    this.entries.push(entry);
    this.activeTimers.delete(timerId);
    if (metadata) {
      (this.activeTimers as Map<string, unknown>).delete(`${timerId}_metadata`);
    }
    
    return duration;
  }

  /**
   * Measure a function execution
   */
  static async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<{ result: T; duration: number }> {
    if (!this.isEnabled) {
      const result = await fn();
      return { result, duration: 0 };
    }

    const timerId = this.startTimer(name, metadata);
    try {
      const result = await fn();
      const duration = this.endTimer(timerId);
      return { result, duration };
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Measure synchronous function execution
   */
  static measure<T>(
    name: string, 
    fn: () => T,
    metadata?: Record<string, unknown>
  ): { result: T; duration: number } {
    if (!this.isEnabled) {
      const result = fn();
      return { result, duration: 0 };
    }

    const timerId = this.startTimer(name, metadata);
    try {
      const result = fn();
      const duration = this.endTimer(timerId);
      return { result, duration };
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  static generateReport(): PerformanceReport {
    // Use the main ProcessChatMessage duration as the actual total time
    const mainEntry = this.entries.find(entry => entry.name === 'ProcessChatMessage');
    const totalDuration = mainEntry ? mainEntry.duration : this.entries.reduce((sum, entry) => sum + entry.duration, 0);
    const slowestOperations = [...this.entries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Group by operation name for summary
    const summary: Record<string, { totalTime: number; callCount: number; averageTime: number }> = {};
    
    this.entries.forEach(entry => {
      if (!summary[entry.name]) {
        summary[entry.name] = { totalTime: 0, callCount: 0, averageTime: 0 };
      }
      summary[entry.name].totalTime += entry.duration;
      summary[entry.name].callCount += 1;
    });

    // Calculate averages
    Object.keys(summary).forEach(name => {
      summary[name].averageTime = summary[name].totalTime / summary[name].callCount;
    });

    return {
      totalDuration,
      entries: this.entries,
      slowestOperations,
      summary
    };
  }

  /**
   * Print formatted performance report
   */
  static printReport(): void {
    if (!this.isEnabled) {
      console.log('Performance profiling is disabled. Set CHATBOT_PERFORMANCE_PROFILING=true to enable.');
      return;
    }

    const report = this.generateReport();
    
    console.log('\n🚀 PERFORMANCE PROFILING REPORT');
    console.log('=====================================');
    console.log(`HTTP Response Time: ${report.totalDuration.toFixed(2)}ms`);
    console.log(`Total Operations: ${report.entries.length}`);
    
    // Calculate exclusive times (subtract child operations from parent operations)
    const exclusiveTimes = this.calculateExclusiveTimes(report.entries);
    
    console.log('\n⏱️  SLOWEST OPERATIONS (Exclusive Time):');
    exclusiveTimes.slice(0, 10).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.name}: ${entry.exclusiveTime.toFixed(2)}ms (${entry.percentage.toFixed(1)}%)`);
      if (entry.metadata) {
        console.log(`   Metadata:`, entry.metadata);
      }
    });
    
    console.log('\n📊 OPERATION BREAKDOWN:');
    Object.entries(report.summary)
      .sort(([,a], [,b]) => b.totalTime - a.totalTime)
      .forEach(([name, stats]) => {
        const exclusive = exclusiveTimes.find(e => e.name === name);
        console.log(`${name}:`);
        console.log(`  Total: ${stats.totalTime.toFixed(2)}ms`);
        console.log(`  Exclusive: ${exclusive?.exclusiveTime.toFixed(2) || 'N/A'}ms`);
        console.log(`  Calls: ${stats.callCount}`);
        console.log(`  Average: ${stats.averageTime.toFixed(2)}ms`);
      });
    
    console.log('=====================================\n');
  }

  /**
   * Calculate exclusive times (subtract nested operations)
   */
  private static calculateExclusiveTimes(entries: PerformanceEntry[]): Array<{
    name: string;
    exclusiveTime: number;
    percentage: number;
    metadata?: Record<string, unknown>;
  }> {
    const operationMap = new Map<string, { totalTime: number; metadata?: Record<string, unknown> }>();
    
    // Group by operation name
    entries.forEach(entry => {
      if (!operationMap.has(entry.name)) {
        operationMap.set(entry.name, { totalTime: 0, metadata: entry.metadata });
      }
      operationMap.get(entry.name)!.totalTime += entry.duration;
    });
    
    // Define parent-child relationships
    const childOperations = new Map<string, string[]>([
      ['ProcessChatMessage', ['InitializeWorkflow', 'ProcessUserMessage', 'AnalyzeConversationContext', 'GenerateAIResponse', 'FinalizeWorkflow']],
      ['AnalyzeConversationContext', ['GetTokenAwareContext', 'AnalyzeContextEnhanced']],
      ['InitializeWorkflow', ['ImportTiktoken', 'ImportConversationContextOrchestrator']],
      ['GenerateAIResponse', ['ImportFS', 'ImportPath']]
    ]);
    
    const result: Array<{
      name: string;
      exclusiveTime: number;
      percentage: number;
      metadata?: Record<string, unknown>;
    }> = [];
    
    const totalTime = Math.max(...Array.from(operationMap.values()).map(op => op.totalTime));
    
    operationMap.forEach((op, name) => {
      let exclusiveTime = op.totalTime;
      
      // Subtract child operations
      const children = childOperations.get(name) || [];
      children.forEach(childName => {
        const childOp = operationMap.get(childName);
        if (childOp) {
          exclusiveTime -= childOp.totalTime;
        }
      });
      
      // Ensure exclusive time is not negative
      exclusiveTime = Math.max(0, exclusiveTime);
      
      result.push({
        name,
        exclusiveTime,
        percentage: (exclusiveTime / totalTime) * 100,
        metadata: op.metadata
      });
    });
    
    return result.sort((a, b) => b.exclusiveTime - a.exclusiveTime);
  }

  /**
   * Clear all performance data
   */
  static clear(): void {
    this.entries = [];
    this.activeTimers.clear();
  }

  /**
   * Enable/disable profiling
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Get current profiling status
   */
  static getStatus(): {
    enabled: boolean;
    activeTimers: number;
    completedOperations: number;
  } {
    return {
      enabled: this.isEnabled,
      activeTimers: this.activeTimers.size,
      completedOperations: this.entries.length
    };
  }
}

/**
 * Decorator for measuring method execution time
 */
export function measurePerformance(operationName?: string) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = operationName || `${(target as { constructor: { name: string } }).constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: unknown[]) {
      const { result, duration } = await PerformanceProfiler.measureAsync(
        name,
        () => method.apply(this, args),
        { className: (target as { constructor: { name: string } }).constructor.name, methodName: propertyName }
      );
      
      if (duration > 1000) { // Log slow operations (>1s)
        console.log(`⚠️  Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Simple performance measurement for code blocks
 */
export const perf = {
  start: (name: string, metadata?: Record<string, unknown>) => PerformanceProfiler.startTimer(name, metadata),
  end: (timerId: string) => PerformanceProfiler.endTimer(timerId),
  measure: <T>(name: string, fn: () => T, metadata?: Record<string, unknown>) => PerformanceProfiler.measure(name, fn, metadata),
  measureAsync: <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>) => PerformanceProfiler.measureAsync(name, fn, metadata),
  report: () => PerformanceProfiler.printReport(),
  clear: () => PerformanceProfiler.clear()
}; 