'use client';

import React from 'react';
import { toast } from 'sonner';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Enhanced Error Boundary with Session Management
 * 
 * Single Responsibility: Catch React errors and handle session-related issues
 * 
 * Features:
 * - Detects session/auth errors and redirects to login immediately
 * - Handles React hook errors during logout
 * - Provides user-friendly error messages
 * - Auto-redirect for session issues instead of error screens
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Check if this is a React hook error (likely due to stale session)
    const isHookError = error.message.includes('Invalid hook call') || 
                       error.message.includes('Cannot read properties of null');
    
    const isSessionError = error.message.includes('session') || 
                          error.message.includes('auth') ||
                          error.message.includes('JWT') ||
                          error.message.includes('Invalid Refresh Token') ||
                          error.message.includes('expired');

    if (isHookError || isSessionError) {
      // For session errors, redirect immediately instead of showing error UI
      toast.error('Session Error', {
        description: 'Your session has expired. Redirecting to login...',
        duration: 3000,
      });

      // Immediate redirect for session issues
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      // Don't render error UI for session issues - user will be redirected
      return;
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
      // Check if this is a session error - if so, show minimal loading state while redirecting
      const isSessionError = this.state.error?.message.includes('session') || 
                             this.state.error?.message.includes('auth') ||
                             this.state.error?.message.includes('JWT') ||
                             this.state.error?.message.includes('Invalid hook call') ||
                             this.state.error?.message.includes('expired');

      if (isSessionError) {
        return (
          <div className="flex items-center justify-center min-h-[200px] p-6">
            <div className="text-center space-y-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm text-muted-foreground">
                Session expired - redirecting to login...
              </div>
            </div>
          </div>
        );
      }

      // If a custom fallback component is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} reset={this.handleReset} />;
      }

      // Default fallback UI for non-session errors
      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center space-y-4">
            <div className="text-destructive text-lg font-medium">
              Something went wrong
            </div>
            <div className="text-muted-foreground text-sm max-w-md">
              An unexpected error occurred. Please try again.
            </div>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 