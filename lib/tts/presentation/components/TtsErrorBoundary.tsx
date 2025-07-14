/**
 * TTS Error Boundary - Security Context Error Handling
 * 
 * AI INSTRUCTIONS:
 * - Handles security context errors gracefully without triggering additional validation
 * - Provides fallback UI for authentication and organization context failures
 * - Prevents cascade failures that cause multiple validation calls
 * - Integrates with existing error handling patterns
 * - Follows @golden-rule patterns exactly
 */

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TtsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  errorType: 'security' | 'validation' | 'network' | 'unknown';
}

interface TtsErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export class TtsErrorBoundary extends Component<TtsErrorBoundaryProps, TtsErrorBoundaryState> {
  constructor(props: TtsErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<TtsErrorBoundaryState> {
    // Classify error type for appropriate handling
    let errorType: TtsErrorBoundaryState['errorType'] = 'unknown';
    
    if (error.message.includes('Authentication') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('Token')) {
      errorType = 'security';
    } else if (error.message.includes('Organization') || 
               error.message.includes('Permission') ||
               error.message.includes('Access')) {
      errorType = 'validation';
    } else if (error.message.includes('Network') || 
               error.message.includes('fetch') ||
               error.message.includes('timeout')) {
      errorType = 'network';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring without triggering additional validation
    console.error('[TTS_ERROR_BOUNDARY]', {
      error: error.message,
      errorType: this.state.errorType,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleRetry = () => {
    // Reset error state and trigger retry if callback provided
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-4">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              {this.state.errorType === 'security' && <Shield className="h-4 w-4" />}
              {this.props.fallbackTitle || this.getErrorTitle()}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-3">
                <p>{this.getErrorMessage()}</p>
                
                {this.state.errorType === 'security' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Security Notice:</strong> This appears to be an authentication or authorization issue. 
                      Please ensure you&apos;re logged in and have proper access to this organization.
                    </p>
                  </div>
                )}

                {this.state.errorType === 'validation' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Organization Context:</strong> There may be an issue with your organization context. 
                      Try refreshing the page or switching organizations.
                    </p>
                  </div>
                )}

                {this.state.errorType === 'network' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                    <p className="text-sm text-orange-800">
                      <strong>Network Issue:</strong> There was a problem connecting to the server. 
                      Please check your internet connection and try again.
                    </p>
                  </div>
                )}

                {(this.props.showRetryButton !== false) && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={this.handleRetry}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Try Again
                    </Button>
                    
                    <Button 
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                    >
                      Refresh Page
                    </Button>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="text-sm font-medium cursor-pointer">
                      Developer Details
                    </summary>
                    <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded overflow-auto">
                      <p><strong>Error:</strong> {this.state.error?.message}</p>
                      <p><strong>Type:</strong> {this.state.errorType}</p>
                      {this.state.errorInfo && (
                        <div className="mt-2">
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs">
                            {this.state.errorInfo}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorTitle(): string {
    switch (this.state.errorType) {
      case 'security':
        return 'Authentication Required';
      case 'validation':
        return 'Organization Access Issue';
      case 'network':
        return 'Connection Problem';
      default:
        return 'TTS Service Error';
    }
  }

  private getErrorMessage(): string {
    switch (this.state.errorType) {
      case 'security':
        return 'There was an authentication issue. Please ensure you are logged in and have proper permissions.';
      case 'validation':
        return 'There was an issue with your organization context. Please verify you have access to this organization.';
      case 'network':
        return 'Unable to connect to the TTS service. Please check your internet connection and try again.';
      default:
        return this.state.error?.message || 'An unexpected error occurred in the TTS service.';
    }
  }
}

// Convenience wrapper for functional components
export function withTtsErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<TtsErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <TtsErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </TtsErrorBoundary>
    );
  };
} 