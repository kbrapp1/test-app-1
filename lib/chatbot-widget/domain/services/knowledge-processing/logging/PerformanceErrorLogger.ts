/**
 * Performance Error Logger
 * 
 * Domain service specialized for logging performance threshold violations and optimization issues.
 * Focuses on timing analysis, resource utilization, and performance degradation.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';

export interface PerformanceMetricsContext {
  actualTimeMs: number;
  maxAllowedTimeMs: number;
  operation: string;
  additionalMetrics?: Record<string, number>;
  resourceUtilization?: {
    cpuPercent?: number;
    memoryMB?: number;
    networkLatencyMs?: number;
  };
}

export class PerformanceErrorLogger {
  
  /**
   * Log performance threshold violations
   */
  static logPerformanceError(
    logger: ISessionLogger,
    operation: string,
    context: PerformanceMetricsContext
  ): void {
    const overage = context.actualTimeMs - context.maxAllowedTimeMs;
    const degradationFactor = context.actualTimeMs / context.maxAllowedTimeMs;
    
    logger.logMessage(`⚠️ Performance Threshold Exceeded [${operation}]:`);
    logger.logMessage(`  Actual Time: ${context.actualTimeMs}ms`);
    logger.logMessage(`  Max Allowed: ${context.maxAllowedTimeMs}ms`);
    logger.logMessage(`  Overage: ${overage}ms`);
    logger.logMessage(`  Degradation Factor: ${degradationFactor.toFixed(2)}x`);
    
    if (context.resourceUtilization) {
      logger.logMessage('  Resource Utilization:');
      
      if (context.resourceUtilization.cpuPercent !== undefined) {
        logger.logMessage(`    CPU: ${context.resourceUtilization.cpuPercent.toFixed(1)}%`);
      }
      
      if (context.resourceUtilization.memoryMB !== undefined) {
        logger.logMessage(`    Memory: ${context.resourceUtilization.memoryMB.toFixed(1)} MB`);
      }
      
      if (context.resourceUtilization.networkLatencyMs !== undefined) {
        logger.logMessage(`    Network Latency: ${context.resourceUtilization.networkLatencyMs}ms`);
      }
    }
    
    if (context.additionalMetrics) {
      logger.logMessage('  Additional Metrics:');
      Object.entries(context.additionalMetrics).forEach(([key, value]) => {
        logger.logMessage(`    ${key}: ${value}`);
      });
    }

    // Log performance degradation metrics
    logger.logMetrics('performance-threshold-exceeded', {
      duration: context.actualTimeMs,
      customMetrics: {
        overage: overage,
        degradationFactor: degradationFactor,
        maxAllowed: context.maxAllowedTimeMs,
        isCriticalDelay: degradationFactor > 3 ? 1 : 0,
        isMinorDelay: degradationFactor < 1.5 ? 1 : 0,
        ...context.additionalMetrics
      }
    });
  }

  /**
   * Log performance warning (approaching threshold)
   */
  static logPerformanceWarning(
    logger: ISessionLogger,
    operation: string,
    context: PerformanceMetricsContext & {
      warningThresholdPercent: number;
    }
  ): void {
    const utilizationPercent = (context.actualTimeMs / context.maxAllowedTimeMs) * 100;
    
    logger.logMessage(`⚠️ Performance Warning [${operation}]:`);
    logger.logMessage(`  Actual Time: ${context.actualTimeMs}ms`);
    logger.logMessage(`  Max Allowed: ${context.maxAllowedTimeMs}ms`);
    logger.logMessage(`  Utilization: ${utilizationPercent.toFixed(1)}%`);
    logger.logMessage(`  Warning Threshold: ${context.warningThresholdPercent}%`);
    
    const remainingBudget = context.maxAllowedTimeMs - context.actualTimeMs;
    logger.logMessage(`  Remaining Budget: ${remainingBudget}ms`);

    if (context.additionalMetrics) {
      Object.entries(context.additionalMetrics).forEach(([key, value]) => {
        logger.logMessage(`  ${key}: ${value}`);
      });
    }
  }

  /**
   * Log error recovery performance impact
   */
  static logErrorRecoveryPerformance(
    logger: ISessionLogger,
    originalError: Error,
    recoveryAction: string,
    recoveryResult: 'success' | 'failed' | 'partial',
    context: {
      attemptNumber: number;
      maxAttempts: number;
      recoveryTimeMs?: number;
      totalTimeMs: number;
      baselineTimeMs: number;
    }
  ): void {
    const performanceImpact = context.totalTimeMs - context.baselineTimeMs;
    const impactFactor = context.totalTimeMs / context.baselineTimeMs;
    
    logger.logMessage(`🔄 Error Recovery Performance Impact [${recoveryAction}]:`);
    logger.logMessage(`  Original Error: ${originalError.message}`);
    logger.logMessage(`  Recovery Result: ${recoveryResult}`);
    logger.logMessage(`  Attempt: ${context.attemptNumber}/${context.maxAttempts}`);
    logger.logMessage(`  Total Time: ${context.totalTimeMs}ms`);
    logger.logMessage(`  Baseline Time: ${context.baselineTimeMs}ms`);
    logger.logMessage(`  Performance Impact: +${performanceImpact}ms`);
    logger.logMessage(`  Impact Factor: ${impactFactor.toFixed(2)}x`);
    
    if (context.recoveryTimeMs) {
      logger.logMessage(`  Recovery Time: ${context.recoveryTimeMs}ms`);
      const recoveryEfficiency = (context.recoveryTimeMs / performanceImpact) * 100;
      logger.logMessage(`  Recovery Efficiency: ${recoveryEfficiency.toFixed(1)}%`);
    }
    
    if (recoveryResult === 'success') {
      logger.logMessage('✅ Error successfully recovered');
    } else if (recoveryResult === 'failed') {
      logger.logMessage('❌ Error recovery failed');
    } else {
      logger.logMessage('⚠️ Partial error recovery achieved');
    }

    // Log recovery performance metrics
    logger.logMetrics('error-recovery-performance', {
      duration: context.totalTimeMs,
      customMetrics: {
        recoveryTime: context.recoveryTimeMs || 0,
        performanceImpact: performanceImpact,
        impactFactor: impactFactor,
        attemptNumber: context.attemptNumber,
        isSuccessfulRecovery: recoveryResult === 'success' ? 1 : 0,
        isExpensiveRecovery: impactFactor > 2 ? 1 : 0
      }
    });
  }

  /**
   * Log batch operation performance analysis
   */
  static logBatchPerformanceAnalysis(
    logger: ISessionLogger,
    operation: string,
    context: {
      totalItems: number;
      processedItems: number;
      failedItems: number;
      totalTimeMs: number;
      averageItemTimeMs: number;
      slowestItemTimeMs: number;
      fastestItemTimeMs: number;
    }
  ): void {
    const successRate = (context.processedItems / context.totalItems) * 100;
    const failureRate = (context.failedItems / context.totalItems) * 100;
    
    logger.logMessage(`📊 Batch Performance Analysis [${operation}]:`);
    logger.logMessage(`  Total Items: ${context.totalItems}`);
    logger.logMessage(`  Processed: ${context.processedItems} (${successRate.toFixed(1)}%)`);
    logger.logMessage(`  Failed: ${context.failedItems} (${failureRate.toFixed(1)}%)`);
    logger.logMessage(`  Total Time: ${context.totalTimeMs}ms`);
    logger.logMessage(`  Average Time/Item: ${context.averageItemTimeMs.toFixed(2)}ms`);
    logger.logMessage(`  Fastest Item: ${context.fastestItemTimeMs}ms`);
    logger.logMessage(`  Slowest Item: ${context.slowestItemTimeMs}ms`);
    
    const timeVariance = context.slowestItemTimeMs - context.fastestItemTimeMs;
    const consistencyRatio = context.fastestItemTimeMs / context.slowestItemTimeMs;
    
    logger.logMessage(`  Time Variance: ${timeVariance}ms`);
    logger.logMessage(`  Consistency Ratio: ${consistencyRatio.toFixed(3)}`);

    // Log batch performance metrics
    logger.logMetrics('batch-performance-analysis', {
      duration: context.totalTimeMs,
      customMetrics: {
        totalItems: context.totalItems,
        successRate: successRate,
        failureRate: failureRate,
        averageItemTime: context.averageItemTimeMs,
        timeVariance: timeVariance,
        consistencyRatio: consistencyRatio,
        isInconsistentPerformance: consistencyRatio < 0.5 ? 1 : 0
      }
    });
  }
}