'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryable?: boolean;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  dismissed: boolean;
}

/**
 * Enhanced Error Boundary for Monitoring Components (Presentation Layer)
 * 
 * Single Responsibility: Handle errors in monitoring components gracefully
 * Optimizations: Error recovery, logging service integration, production-ready
 */
export class MonitoringErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    retryCount: 0,
    dismissed: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      retryCount: 0,
      dismissed: false 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Report error to error tracking service with context
   */
  private reportError = (error: Error, errorInfo: ErrorInfo): void => {
    try {
      // Enhanced error context for monitoring components
      const errorContext = {
        componentName: this.props.componentName || 'Unknown',
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        errorBoundary: true,
        monitoringModule: true,
        errorInfo: {
          componentStack: errorInfo.componentStack
        }
      };

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 [MonitoringErrorBoundary] ${this.props.componentName || 'Unknown'}`);
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('Component Stack:', errorInfo.componentStack);
        console.error('Context:', errorContext);
        console.groupEnd();
      }

      // Production error reporting (placeholder for actual service)
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to error tracking service
        // ErrorReportingService.captureException(error, errorContext);
        
        // For now, use a structured console.error that production monitoring can catch
        console.error('[MONITORING_ERROR]', JSON.stringify({
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Truncate stack
          context: errorContext
        }));
      }
    } catch (reportingError) {
      // Fail silently if error reporting itself fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('[MonitoringErrorBoundary] Failed to report error:', reportingError);
      }
    }
  };

  /**
   * Attempt to recover from error with progressive retry strategy
   */
  private handleRetry = (): void => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      // Max retries reached, permanent failure
      this.setState({ dismissed: true });
      return;
    }

    // Progressive delay: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;
    
    this.retryTimeout = setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        retryCount: retryCount + 1 
      });
    }, delay);
  };

  /**
   * Dismiss error permanently for this session
   */
  private handleDismiss = (): void => {
    this.setState({ dismissed: true });
  };

  /**
   * Render fallback UI with recovery options
   */
  private renderFallbackUI = (): ReactNode => {
    const { componentName, retryable = true, showDetails = false } = this.props;
    const { error, retryCount, dismissed } = this.state;

    if (dismissed) {
      return null; // Component is permanently dismissed
    }

    // Custom fallback UI
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isRetryable = retryable && retryCount < this.maxRetries;
    const isMaxRetries = retryCount >= this.maxRetries;

    return (
      <div className="monitoring-error-boundary border border-amber-200 rounded-lg bg-amber-50 p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">
                {isMaxRetries ? 'Monitoring Disabled' : 'Monitoring Temporarily Unavailable'}
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {componentName ? `${componentName} encountered an error` : 'A monitoring component failed'}
                {retryCount > 0 && ` (${retryCount}/${this.maxRetries} retries)`}
              </p>
            </div>
          </div>
          
          <button
            onClick={this.handleDismiss}
            className="text-amber-600 hover:text-amber-800 p-1"
            title="Dismiss monitoring error"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2">
          {isRetryable && (
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 underline"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
          
          {isMaxRetries && (
            <span className="text-xs text-amber-600">
              Maximum retries reached. Monitoring disabled for this session.
            </span>
          )}
        </div>

        {/* Development error details */}
        {(process.env.NODE_ENV === 'development' || showDetails) && error && (
          <details className="mt-2">
            <summary className="text-xs text-amber-600 cursor-pointer">
              Error Details {process.env.NODE_ENV === 'development' && '(Development Only)'}
            </summary>
            <pre className="text-xs bg-amber-100 p-2 mt-1 rounded overflow-auto max-h-32 border border-amber-200">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    );
  };

  public render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping functional components with monitoring error boundary
 */
export function withMonitoringErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    componentName?: string;
    fallback?: ReactNode;
    retryable?: boolean;
    showDetails?: boolean;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  } = {}
) {
  const { componentName, fallback, retryable, showDetails, onError } = options;
  
  return function WrappedComponent(props: P) {
    return (
      <MonitoringErrorBoundary 
        componentName={componentName || Component.displayName || Component.name}
        fallback={fallback}
        retryable={retryable}
        showDetails={showDetails}
        onError={onError}
      >
        <Component {...props} />
      </MonitoringErrorBoundary>
    );
  };
}

/**
 * Hook for creating wrapped components with error boundaries
 */
export const useMonitoringErrorBoundary = (
  componentName: string, 
  options: {
    retryable?: boolean;
    showDetails?: boolean;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  } = {}
) => {
  return React.useCallback(
    <P extends object>(Component: React.ComponentType<P>) => 
      withMonitoringErrorBoundary(Component, { componentName, ...options }),
    [componentName, options.retryable, options.showDetails, options.onError]
  );
}; 