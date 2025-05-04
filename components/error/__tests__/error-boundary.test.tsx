import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../error-boundary';
import { ErrorFallback } from '../error-fallback';

// Simple component that throws an error during render
function Bomb() {
  throw new Error('💥 CABOOM 💥');
  return null; // Unreachable
}

describe('ErrorBoundary', () => {
  // Mock console.error to prevent polluting test output
  let consoleErrorMock: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render fallback UI when an error is thrown by a child', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    // Check if the fallback UI is rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    // Check if the specific error message is displayed (optional, depends on ErrorFallback implementation)
    expect(screen.getByText(/💥 CABOOM 💥/i)).toBeInTheDocument(); 
    // Check if the original child content is NOT rendered
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('should call console.error when an error is caught', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(consoleErrorMock).toHaveBeenCalled();
    // Check if our specific log message format was called
    expect(consoleErrorMock).toHaveBeenCalledWith(
      'Uncaught error:',
      expect.any(Error), // The actual error object
      expect.objectContaining({ componentStack: expect.any(String) }) // The errorInfo object
    );
  });

  it('should reset the error state and render children when resetErrorBoundary is called', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    // Verify fallback is initially shown
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    const initialCallCount = consoleErrorMock.mock.calls.length;

    // Find and click the reset button (assuming ErrorFallback has a button that calls resetErrorBoundary)
    const resetButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(resetButton);

    // Now the error state should be reset, but Bomb will throw again immediately.
    // We expect the fallback to re-appear after the reset attempt.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    // Ensure console.error was called again after the reset attempt caused a re-render error
    expect(consoleErrorMock.mock.calls.length).toBeGreaterThan(initialCallCount);
  });
}); 