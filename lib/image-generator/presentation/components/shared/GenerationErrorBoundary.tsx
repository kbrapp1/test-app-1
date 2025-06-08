import React, { Component, ReactNode, ErrorInfo } from 'react';

interface GenerationErrorBoundaryProps {
  children: ReactNode;
}

interface GenerationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary for Image Generation Operations
 * Catches rendering and async errors within the image generator UI
 */
export class GenerationErrorBoundary extends Component<GenerationErrorBoundaryProps, GenerationErrorBoundaryState> {
  constructor(props: GenerationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): GenerationErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('GenerationErrorBoundary caught an error:', error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <h2 className="text-lg font-bold text-red-600">Uh oh! Something went wrong.</h2>
          <p className="mt-2 text-sm text-gray-700">{this.state.error?.message || 'Unknown error occurred.'}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={this.handleRetry}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 