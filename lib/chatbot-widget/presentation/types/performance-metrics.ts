export interface Performance {
  componentTimings: {
    intentClassification: number;
    entityExtraction: number;
    leadScoring: number;
    responseGeneration: number;
    total: number;
    requestPreprocessing?: number;
    functionCallExecution?: number;
    businessRuleProcessing?: number;
    responsePostprocessing?: number;
    databaseOperations?: number;
    externalApiCalls?: number;
  };
  cacheHits: number;
  dbQueries: number;
  apiCalls: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  networkMetrics?: {
    totalBytesIn: number;
    totalBytesOut: number;
    averageLatency: number;
  };
  systemHealth?: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    queueDepth: number;
  };
}

export interface PerformanceMetricsSectionProps {
  performance?: Performance;
}

export interface PerformanceStatus {
  color: string;
  status: string;
} 