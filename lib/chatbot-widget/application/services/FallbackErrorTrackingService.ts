/**
 * Fallback Error Tracking Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Track and log fallback errors
 * - Store errors in database for analysis and monitoring
 * - Provide console logging for debugging
 * - Follow @golden-rule application service patterns
 * - Keep under 200-250 lines
 */

import { DomainError } from '../../domain/errors/BusinessRuleViolationError';
import { FallbackResponseTriggeredError, ResponseExtractionError } from '../../domain/errors/ResponseProcessingErrors';
import { SupabaseClient } from '@supabase/supabase-js';

export interface FallbackErrorRecord {
  id?: string;
  error_code: string;
  error_message: string;
  error_context: Record<string, any>;
  severity: string;
  session_id?: string;
  user_id?: string;
  organization_id?: string;
  created_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export class FallbackErrorTrackingService {
  constructor(
    private readonly supabase: SupabaseClient
  ) {}

  /**
   * Track fallback error with database storage and console logging
   * 
   * AI INSTRUCTIONS:
   * - Store error details in database for analysis
   * - Log to console for immediate debugging
   * - Include session context for tracing
   * - Handle database failures gracefully
   */
  async trackFallbackError(
    error: DomainError,
    sessionId?: string,
    userId?: string,
    organizationId?: string,
    additionalContext: Record<string, any> = {}
  ): Promise<void> {
    const errorRecord: FallbackErrorRecord = {
      error_code: error.code,
      error_message: error.message,
      error_context: {
        ...error.context,
        ...additionalContext,
        stack: error.stack
      },
      severity: error.severity,
      session_id: sessionId,
      user_id: userId,
      organization_id: organizationId,
      created_at: error.timestamp.toISOString() // Use the error's original timestamp
    };

    // Console logging for immediate debugging
    this.logFallbackError(errorRecord);

    // Database storage for analysis
    try {
      await this.storeFallbackError(errorRecord);
    } catch (dbError) {
      console.error('FALLBACK_ERROR_STORAGE_FAILED', {
        originalError: errorRecord,
        storageError: dbError,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Track response extraction fallback specifically
   * 
   * AI INSTRUCTIONS:
   * - Specialized tracking for response extraction failures
   * - Include unified result structure for debugging
   * - Log both success and failure scenarios
   */
  async trackResponseExtractionFallback(
    unifiedResult: any,
    sessionId?: string,
    userId?: string,
    organizationId?: string
  ): Promise<void> {
    const error = new ResponseExtractionError(
      'Response content not found in unified result',
      {
        unifiedResultStructure: this.sanitizeUnifiedResult(unifiedResult),
        expectedPath: 'unifiedResult?.analysis?.response?.content',
        actualPaths: this.extractAvailablePaths(unifiedResult)
      }
    );

    await this.trackFallbackError(error, sessionId, userId, organizationId);
  }

  /**
   * Track generic fallback response usage
   * 
   * AI INSTRUCTIONS:
   * - Track when generic fallback messages are used
   * - Include context about why fallback was triggered
   * - Help identify patterns in fallback usage
   */
  async trackGenericFallback(
    reason: string,
    context: Record<string, any>,
    sessionId?: string,
    userId?: string,
    organizationId?: string
  ): Promise<void> {
    const error = new FallbackResponseTriggeredError(reason, context);
    await this.trackFallbackError(error, sessionId, userId, organizationId);
  }

  /**
   * Console logging with structured format
   * 
   * AI INSTRUCTIONS:
   * - Use consistent logging format
   * - Include all relevant context
   * - Make logs easily searchable
   */
  private logFallbackError(errorRecord: FallbackErrorRecord): void {
    console.warn('🚨 FALLBACK_ERROR_TRIGGERED', {
      code: errorRecord.error_code,
      message: errorRecord.error_message,
      severity: errorRecord.severity,
      sessionId: errorRecord.session_id,
      userId: errorRecord.user_id,
      organizationId: errorRecord.organization_id,
      context: errorRecord.error_context,
      timestamp: errorRecord.created_at
    });
  }

  /**
   * Store error in database
   * 
   * AI INSTRUCTIONS:
   * - Store in dedicated fallback_errors table
   * - Handle database connection failures
   * - Include all relevant metadata
   */
  private async storeFallbackError(errorRecord: FallbackErrorRecord): Promise<void> {
    const { error } = await this.supabase
      .from('fallback_errors')
      .insert([errorRecord]);

    if (error) {
      throw new Error(`Failed to store fallback error: ${error.message}`);
    }
  }

  /**
   * Sanitize unified result for logging
   * 
   * AI INSTRUCTIONS:
   * - Remove sensitive data
   * - Limit size for logging
   * - Preserve structure information
   */
  private sanitizeUnifiedResult(unifiedResult: any): any {
    if (!unifiedResult) return null;

    try {
      const sanitized = JSON.parse(JSON.stringify(unifiedResult));
      
      // Remove potentially sensitive content but keep structure
      if (sanitized.analysis?.response?.content) {
        sanitized.analysis.response.content = `[CONTENT_LENGTH: ${sanitized.analysis.response.content.length}]`;
      }
      
      return sanitized;
    } catch (error) {
      return { error: 'Failed to sanitize unified result', type: typeof unifiedResult };
    }
  }

  /**
   * Extract available paths from unified result
   * 
   * AI INSTRUCTIONS:
   * - Help debugging by showing actual structure
   * - Identify where content might be located
   * - Provide insights for fixing extraction logic
   */
  private extractAvailablePaths(obj: any, prefix = ''): string[] {
    if (!obj || typeof obj !== 'object') return [];

    const paths: string[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        paths.push(currentPath);
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          paths.push(...this.extractAvailablePaths(obj[key], currentPath));
        }
      }
    }
    
    return paths;
  }

  /**
   * Get fallback error statistics
   * 
   * AI INSTRUCTIONS:
   * - Provide insights into fallback patterns
   * - Help identify recurring issues
   * - Support monitoring and alerting
   */
  async getFallbackErrorStats(
    organizationId?: string,
    timeRange = '24 hours'
  ): Promise<{
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: FallbackErrorRecord[];
  }> {
    let query = this.supabase
      .from('fallback_errors')
      .select('*')
      .gte('created_at', new Date(Date.now() - this.parseTimeRange(timeRange)).toISOString());

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: errors, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch fallback error stats: ${error.message}`);
    }

    const errorsByCode: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    errors?.forEach((err: FallbackErrorRecord) => {
      errorsByCode[err.error_code] = (errorsByCode[err.error_code] || 0) + 1;
      errorsBySeverity[err.severity] = (errorsBySeverity[err.severity] || 0) + 1;
    });

    return {
      totalErrors: errors?.length || 0,
      errorsByCode,
      errorsBySeverity,
      recentErrors: errors?.slice(0, 10) || []
    };
  }

  private parseTimeRange(timeRange: string): number {
    const ranges: Record<string, number> = {
      '1 hour': 60 * 60 * 1000,
      '24 hours': 24 * 60 * 60 * 1000,
      '7 days': 7 * 24 * 60 * 60 * 1000,
      '30 days': 30 * 24 * 60 * 60 * 1000
    };
    
    return ranges[timeRange] || ranges['24 hours'];
  }
} 