/**
 * Performance Configuration
 * 
 * AI INSTRUCTIONS:
 * - Configure performance profiling settings
 * - Enable/disable profiling based on environment
 * - Provide performance thresholds and alerts
 */

export const PerformanceConfig = {
  // Enable performance profiling
  enabled: process.env.CHATBOT_PERFORMANCE_PROFILING === 'true' || process.env.NODE_ENV === 'development',
  
  // Performance thresholds (in milliseconds)
  thresholds: {
    // Slow operation warning threshold
    slowOperationWarning: 1000,
    
    // Critical operation threshold  
    criticalOperationWarning: 5000,
    
    // Individual step thresholds
    steps: {
      initializeWorkflow: 2000,
      processUserMessage: 1000,
      analyzeConversationContext: 8000,
      generateAIResponse: 10000,
      finalizeWorkflow: 1000
    },
    
    // Substep thresholds
    substeps: {
      getTokenAwareContext: 2000,
      analyzeContextEnhanced: 6000,
      vectorEmbeddings: 3000,
      intentClassification: 1000,
      knowledgeRetrieval: 2000
    }
  },
  
  // Reporting configuration
  reporting: {
    // Print report after each operation
    printAfterEachOperation: true,
    
    // Include detailed metadata in reports
    includeMetadata: true,
    
    // Maximum number of slowest operations to show
    maxSlowOperations: 10,
    
    // Clear performance data after each report
    clearAfterReport: false
  },
  
  // Alert configuration
  alerts: {
    // Log slow operations to console
    logSlowOperations: true,
    
    // Log critical operations to console
    logCriticalOperations: true,
    
    // Include stack traces for slow operations
    includeStackTraces: false
  }
} as const;

export type PerformanceConfigType = typeof PerformanceConfig; 