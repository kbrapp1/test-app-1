import {
  AppError,
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
} from '../base';
import { ErrorFactory, createErrorResponse } from '../factory';
import { ErrorCodes, ErrorSeverity, ErrorSeverityMap } from '../constants';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create base error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500, { test: true });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.context).toEqual({ test: true });
      expect(error.name).toBe('AppError');
      expect(error.stack).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with default values', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with custom context', () => {
      const error = new AuthorizationError('Access denied', 'FORBIDDEN', { userId: '123' });
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
      expect(error.context).toEqual({ userId: '123' });
    });
  });
});

describe('ErrorFactory', () => {
  describe('validation', () => {
    it('should create validation error', () => {
      const error = ErrorFactory.validation('Invalid data');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid data');
    });
  });

  describe('invalidInput', () => {
    it('should create error for invalid field', () => {
      const error = ErrorFactory.invalidInput('email');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value provided for email');
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('notFound', () => {
    it('should create not found error with resource and id', () => {
      const error = ErrorFactory.notFound('User', '123');
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("User with id '123' not found");
      expect(error.context).toEqual({ resource: 'User', id: '123' });
    });
  });
});

describe('createErrorResponse', () => {
  it('should create standardized error response', () => {
    const error = new AppError('Test error', 'TEST_ERROR', 500, { test: true });
    const response = createErrorResponse(error);
    
    expect(response).toEqual({
      error: {
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 500,
        context: { test: true },
      },
    });
  });
});

describe('Error Constants', () => {
  it('should have correct severity levels', () => {
    expect(ErrorSeverityMap[ErrorCodes.VALIDATION_ERROR]).toBe(ErrorSeverity.LOW);
    expect(ErrorSeverityMap[ErrorCodes.DATABASE_ERROR]).toBe(ErrorSeverity.CRITICAL);
    expect(ErrorSeverityMap[ErrorCodes.UNAUTHORIZED]).toBe(ErrorSeverity.MEDIUM);
  });
}); 