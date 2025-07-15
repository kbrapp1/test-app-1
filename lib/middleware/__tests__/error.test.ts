import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { withErrorHandling, withServerActionErrorHandling } from '../error';
import { AppError as _AppError, ValidationError } from '@/lib/errors/base';
import { logger } from '@/lib/logging';

// Mock the logger
vi.mock('@/lib/logging', () => ({
  logger: {
    error: vi.fn(),
  },
}));

type ActionResult = {
  success?: boolean;
  error?: {
    message: string;
    code: string;
    statusCode: number;
  };
};

describe('Error Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withErrorHandling', () => {
    it('should pass through successful responses', async () => {
      const handler = () => NextResponse.json({ success: true });
      const wrappedHandler = withErrorHandling(handler);
      const response = await wrappedHandler();
      
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle AppError with correct status code', async () => {
      const handler = () => {
        throw new ValidationError('Invalid input');
      };
      const wrappedHandler = withErrorHandling(handler);
      const response = await wrappedHandler();
      
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Invalid input');
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle unknown errors', async () => {
      const handler = () => {
        throw new Error('Unknown error');
      };
      const wrappedHandler = withErrorHandling(handler);
      const response = await wrappedHandler();
      
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error.message).toBe('An unexpected error occurred');
      expect(data.error.code).toBe('UNEXPECTED_ERROR');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should respect config options', async () => {
      const handler = () => {
        throw new ValidationError('Invalid input');
      };
      const wrappedHandler = withErrorHandling(handler, { logErrors: false });
      await wrappedHandler();
      
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('withServerActionErrorHandling', () => {
    it('should pass through successful responses', async () => {
      const action = async (): Promise<ActionResult> => ({ success: true });
      const wrappedAction = withServerActionErrorHandling(action);
      const result = await wrappedAction();
      
      expect(result).toEqual({ success: true });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle AppError and return error object', async () => {
      const action = async (): Promise<ActionResult> => {
        throw new ValidationError('Invalid input');
      };
      const wrappedAction = withServerActionErrorHandling(action);
      const result = await wrappedAction();
      
      expect(result).toHaveProperty('error');
      expect(result.error?.message).toBe('Invalid input');
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.statusCode).toBe(400);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle unknown errors in server actions', async () => {
      const action = async (): Promise<ActionResult> => {
        throw new Error('Unknown error');
      };
      const wrappedAction = withServerActionErrorHandling(action);
      const result = await wrappedAction();
      
      expect(result).toHaveProperty('error');
      expect(result.error?.message).toBe('An unexpected error occurred');
      expect(result.error?.code).toBe('UNEXPECTED_ERROR');
      expect(result.error?.statusCode).toBe(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 