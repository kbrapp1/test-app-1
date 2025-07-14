/**
 * Centralized error handling service for monitoring module
 * Replaces console.error with proper error tracking and development logging
 */
export class ErrorHandlingService {
  private static errors: Error[] = [];

  /**
   * Handle repository errors with proper logging strategy
   */
  static handleRepositoryError(
    operation: string,
    error: unknown,
    context?: Record<string, unknown>
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Store error for potential reporting
    this.errors.push(errorObj);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[MonitoringRepository] ${operation} failed:`, {
        error: errorObj.message,
        stack: errorObj.stack,
        context
      });
    }

    // In production, could send to error tracking service
    // Example: this.sendToErrorTracking(operation, errorObj, context);
  }

  /**
   * Handle component errors for error boundaries
   */
  static handleComponentError(
    componentName: string,
    error: Error,
    errorInfo?: Record<string, unknown>
  ): void {
    this.errors.push(error);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`[MonitoringComponent] ${componentName} error:`, {
        error: error.message,
        stack: error.stack,
        errorInfo
      });
    }

    // In production, report to error tracking
    // Example: this.sendToErrorTracking('component-error', error, { componentName, errorInfo });
  }

  /**
   * Handle service errors with graceful degradation
   */
  static handleServiceError(
    serviceName: string,
    operation: string,
    error: unknown,
    fallbackValue?: unknown
  ): unknown {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.errors.push(errorObj);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`[MonitoringService] ${serviceName}.${operation} failed:`, {
        error: errorObj.message,
        fallbackValue
      });
    }

    return fallbackValue;
  }

  /**
   * Get all captured errors (for debugging/testing)
   */
  static getErrors(): Error[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Check if there are any recent errors
   */
  static hasErrors(): boolean {
    return this.errors.length > 0;
  }
} 