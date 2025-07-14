import { NetworkIssue } from '../../domain/entities/NetworkIssue';

interface NetworkRequestData {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  status?: number;
  error?: string;
  requestId: string;
  userAgent?: string;
  requestSize?: number;
  responseSize?: number;
  cacheHit?: boolean;
}

export class NetworkTrackingService {
  private static activeRequests = new Map<string, NetworkRequestData>();
  private static completedRequests: NetworkRequestData[] = [];

  /**
   * Track the start of a network request
   */
  static startTracking(requestId: string, url: string, method: string, options?: {
    userAgent?: string;
    requestSize?: number;
  }): void {
    this.activeRequests.set(requestId, {
      requestId,
      url,
      method,
      startTime: Date.now(),
      userAgent: options?.userAgent,
      requestSize: options?.requestSize
    });
  }

  /**
   * Track the completion of a network request
   */
  static endTracking(requestId: string, result: {
    status?: number;
    error?: string;
    responseSize?: number;
    cacheHit?: boolean;
  }): NetworkIssue | null {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      return null;
    }

    const endTime = Date.now();
    const responseTime = endTime - request.startTime;

    const completedRequest: NetworkRequestData = {
      ...request,
      endTime,
      status: result.status,
      error: result.error,
      responseSize: result.responseSize,
      cacheHit: result.cacheHit
    };

    this.completedRequests.push(completedRequest);
    this.activeRequests.delete(requestId);

    // Analyze for performance issues
    return this.analyzeRequest(completedRequest, responseTime);
  }

  /**
   * Get network issues for a specific endpoint
   */
  static getIssuesForEndpoint(endpoint: string): NetworkIssue[] {
    return this.completedRequests
      .filter(req => this.matchesEndpoint(req.url, endpoint))
      .map(req => this.requestToIssue(req))
      .filter(issue => issue !== null) as NetworkIssue[];
  }

  /**
   * Get all network issues grouped by endpoint
   */
  static getAllIssuesByEndpoint(): Map<string, NetworkIssue[]> {
    const issuesByEndpoint = new Map<string, NetworkIssue[]>();
    
    for (const request of this.completedRequests) {
      const endpoint = this.extractEndpointPattern(request.url);
      const issue = this.requestToIssue(request);
      
      if (issue) {
        if (!issuesByEndpoint.has(endpoint)) {
          issuesByEndpoint.set(endpoint, []);
        }
        issuesByEndpoint.get(endpoint)!.push(issue);
      }
    }
    
    return issuesByEndpoint;
  }

  /**
   * Analyze a request for performance issues
   */
  private static analyzeRequest(request: NetworkRequestData, responseTime: number): NetworkIssue | null {
    const issues: Partial<NetworkIssue>[] = [];

    // Slow response detection
    if (responseTime > 1000) { // 1 second threshold
      issues.push({
        type: 'slow-response',
        severity: responseTime > 3000 ? 'high' : 'medium',
        impact: `Response time: ${responseTime}ms`,
        responseTime
      });
    }

    // Error detection
    if (request.error || (request.status && request.status >= 400)) {
      issues.push({
        type: 'error',
        severity: request.status && request.status >= 500 ? 'high' : 'medium',
        impact: request.error || `HTTP ${request.status}`,
        statusCode: request.status,
        errorMessage: request.error
      });
    }

    // Timeout detection
    if (responseTime > 30000) { // 30 second timeout
      issues.push({
        type: 'timeout',
        severity: 'high',
        impact: `Request timed out after ${responseTime}ms`,
        responseTime
      });
    }

    // Return the most severe issue
    if (issues.length === 0) return null;

    const primaryIssue = issues.sort((a, b) => {
      const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      return severityOrder[b.severity || 'low'] - severityOrder[a.severity || 'low'];
    })[0];

    return {
      id: `issue_${request.requestId}`,
      type: primaryIssue.type!,
      severity: primaryIssue.severity!,
      impact: primaryIssue.impact!,
      occurrenceCount: 1,
      firstDetected: new Date(request.startTime),
      lastDetected: new Date(request.endTime || request.startTime),
      persistent: false,
      
      // ✅ ACTUAL endpoint data
      actualEndpoint: request.url,
      httpMethod: request.method,
      requestId: request.requestId,
      userAgent: request.userAgent,
      
      // Performance metrics
      responseTime: primaryIssue.responseTime || responseTime,
      statusCode: primaryIssue.statusCode || request.status,
      errorMessage: primaryIssue.errorMessage || request.error,
      
      // Request details
      requestSize: request.requestSize,
      responseSize: request.responseSize,
      cacheHit: request.cacheHit
    };
  }

  /**
   * Convert endpoint URL to pattern (e.g., /api/dam/asset/123 -> /api/dam/asset/[id])
   */
  private static extractEndpointPattern(url: string): string {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;
      
      // Convert specific IDs to patterns
      pathname = pathname.replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '/[id]');
      pathname = pathname.replace(/\/\d+/g, '/[id]');
      pathname = pathname.replace(/\/[a-zA-Z0-9]{20,}/g, '/[id]');
      
      return pathname;
    } catch {
      return url;
    }
  }

  /**
   * Check if a request URL matches an endpoint pattern
   */
  private static matchesEndpoint(requestUrl: string, endpointPattern: string): boolean {
    const requestPattern = this.extractEndpointPattern(requestUrl);
    return requestPattern === endpointPattern;
  }

  /**
   * Convert request data to network issue if it has problems
   */
  private static requestToIssue(request: NetworkRequestData): NetworkIssue | null {
    if (!request.endTime) return null;
    
    const responseTime = request.endTime - request.startTime;
    return this.analyzeRequest(request, responseTime);
  }

  /**
   * Detect redundant requests
   */
  static detectRedundantRequests(timeWindow: number = 5000): NetworkIssue[] {
    const redundantIssues: NetworkIssue[] = [];
    const requestGroups = new Map<string, NetworkRequestData[]>();
    
    // Group requests by endpoint pattern and time window
    for (const request of this.completedRequests) {
      const pattern = this.extractEndpointPattern(request.url);
      const key = `${pattern}_${request.method}`;
      
      if (!requestGroups.has(key)) {
        requestGroups.set(key, []);
      }
      requestGroups.get(key)!.push(request);
    }
    
    // Find redundant requests within time windows
    for (const [_endpoint, requests] of requestGroups) {
      const sorted = requests.sort((a, b) => a.startTime - b.startTime);
      
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        
        if (next.startTime - current.startTime < timeWindow) {
          redundantIssues.push({
            id: `redundant_${current.requestId}_${next.requestId}`,
            type: 'redundancy',
            severity: 'medium',
            impact: `Duplicate requests within ${timeWindow}ms`,
            occurrenceCount: 2,
            firstDetected: new Date(current.startTime),
            lastDetected: new Date(next.startTime),
            persistent: false,
            
            // ✅ ACTUAL endpoint data
            actualEndpoint: current.url,
            httpMethod: current.method,
            requestId: current.requestId
          });
        }
      }
    }
    
    return redundantIssues;
  }

  /**
   * Clear old tracking data
   */
  static cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.completedRequests = this.completedRequests.filter(
      req => (req.endTime || req.startTime) > cutoff
    );
  }
} 