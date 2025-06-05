export interface NetworkIssue {
  id: string;
  type: 'slow-response' | 'redundancy' | 'timeout' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  occurrenceCount: number;
  firstDetected: Date;
  lastDetected: Date;
  persistent: boolean;
  
  // ✅ ACTUAL endpoint tracking
  actualEndpoint: string;           // Real endpoint that had the issue
  httpMethod: string;               // GET, POST, etc.
  requestId?: string;               // Unique request identifier
  userAgent?: string;               // Client information
  
  // Performance metrics
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  
  // Request details
  requestSize?: number;
  responseSize?: number;
  cacheHit?: boolean;
  
  // Context (keep for analysis)
  pageContext?: string;
  userId?: string;
  organizationId?: string;
} 