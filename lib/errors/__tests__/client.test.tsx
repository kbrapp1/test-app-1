import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';
import { handleClientError, withErrorHandling } from '../client';
import { AppError, ValidationError, AuthorizationError } from '../base';
import { ErrorCodes, ErrorSeverity } from '../constants';
import React from 'react';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Client Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleClientError', () => {
    it('should handle AppError with correct severity', () => {
      const error = new AppError('Test error', ErrorCodes.UNEXPECTED_ERROR, 500);
      (error as any).severity = ErrorSeverity.HIGH;
      
      handleClientError(error);
      
      expect(toast.error).toHaveBeenCalledWith('Test error', expect.any(Object));
    });

    it('should handle ValidationError', () => {
      const error = new ValidationError('Invalid input');
      handleClientError(error);
      
      expect(toast.error).toHaveBeenCalledWith('Invalid input', expect.any(Object));
    });

    it('should handle AuthorizationError', () => {
      const error = new AuthorizationError('Not authorized');
      handleClientError(error);
      
      expect(toast.error).toHaveBeenCalledWith('Not authorized', expect.any(Object));
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      handleClientError(error);
      
      expect(toast.error).toHaveBeenCalledWith(
        'An unexpected error occurred',
        expect.objectContaining({
          description: expect.any(String),
        })
      );
    });

    it('should respect showToast config', () => {
      const error = new Error('Test error');
      handleClientError(error, { showToast: false });
      
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should respect toastDuration config', () => {
      const error = new Error('Test error');
      const duration = 10000;
      
      handleClientError(error, { toastDuration: duration });
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ duration })
      );
    });
  });

  describe('withErrorHandling HOC', () => {
    // Create a component that throws an error
    const ThrowingComponent = () => {
      throw new Error('Test error');
      return null;
    };

    // Create a normal component
    const NormalComponent = () => <div>Normal component</div>;

    it('should render wrapped component normally', () => {
      const WrappedComponent = withErrorHandling(NormalComponent);
      render(<WrappedComponent />);
      
      expect(screen.getByText('Normal component')).toBeInTheDocument();
    });

    it('should catch errors and show fallback UI', () => {
      const WrappedComponent = withErrorHandling(ThrowingComponent);
      
      // Suppress console.error for this test as React will log the error
      const consoleSpy = vi.spyOn(console, 'error');
      consoleSpy.mockImplementation(() => {});
      
      render(<WrappedComponent />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(
        'An unexpected error occurred',
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('should preserve component display name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';
      
      const WrappedComponent = withErrorHandling(TestComponent);
      expect(WrappedComponent.displayName).toBe('WithErrorHandling(TestComponent)');
    });
  });
}); 