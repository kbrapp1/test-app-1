'use client';

import React from 'react';
import { toast } from 'sonner';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Check if this is a React hook error (likely due to stale session)
    const isHookError = error.message.includes('Invalid hook call') || 
                       error.message.includes('Cannot read properties of null');
    
    const isSessionError = error.message.includes('session') || 
                          error.message.includes('auth') ||
                          error.message.includes('JWT');

    if (isHookError || isSessionError) {
      // Show user-friendly message for session issues
      toast.error('Session Error', {
        description: 'Your session may have expired. Please refresh the page or log in again.',
        duration: 5000,
      });

      // Auto-refresh the page after a short delay for hook errors
      if (isHookError) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else {
      // Show generic error message for other errors
      toast.error('Application Error', {
        description: 'Something went wrong. Please try again.',
        duration: 5000,
      });
    }

    this.setState({ 
      hasError: true, 
      error, 
      errorInfo 
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback component is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} reset={this.handleReset} />;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center space-y-4">
            <div className="text-destructive text-lg font-medium">
              Something went wrong
            </div>
            <div className="text-muted-foreground text-sm max-w-md">
              {this.state.error?.message.includes('Invalid hook call') 
                ? 'Session expired - page will refresh automatically'
                : 'An unexpected error occurred. Please try again.'}
            </div>
            {!this.state.error?.message.includes('Invalid hook call') && (
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 