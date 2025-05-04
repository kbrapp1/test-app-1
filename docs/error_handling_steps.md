# Error Handling System Migration Guide

This document outlines the plan for implementing a comprehensive error handling system across the application.

## Implementation Benefits

- ✅ Consistent error handling patterns across the codebase
- ✅ Type-safe error creation and propagation
- ✅ Improved user experience with meaningful error messages
- ✅ Better debugging through standardized error logging
- ✅ Centralized error handling logic for easier maintenance
- ✅ Proper recovery mechanisms for critical operations

## Error Components Available

- ✅ `AppError` - Base error class for all application errors
- ✅ `ValidationError` - For input/data validation errors
- ✅ `AuthorizationError` - For permission and access issues
- ✅ `NotFoundError` - For resource not found scenarios
- ✅ `DatabaseError` - For database-related errors
- ✅ `ExternalServiceError` - For third-party service failures
- ✅ `ErrorBoundary` - React component for UI error containment
- ✅ `ErrorFallback` - UI component for displaying friendly error messages

## Migration Process

### Phase 1: Foundation & Setup

- [x] **Base Error Classes** (`lib/errors/base.ts`)
  - [x] Create `AppError` base class with code, statusCode, and context
  - [x] Implement `ValidationError` class for form/input validations
  - [x] Add `AuthorizationError` for permission issues
  - [x] Create `NotFoundError` for missing resources
  - [x] Implement `DatabaseError` for data persistence issues
  - [x] Add `ExternalServiceError` for third-party API failures
  - [x] Write tests for all error classes

- [x] **Error Factory** (`lib/errors/factory.ts`)
  - [x] Create factory functions for common error scenarios
  - [x] Implement type definitions for error responses
  - [x] Add helper functions for error code generation
  - [x] Write tests for factory functions

- [x] **Error Constants** (`lib/errors/constants.ts`)
  - [x] Define standard error codes
  - [x] Create common error messages
  - [x] Add error severity levels
  - [x] Create HTTP status code mappings

### Phase 2: Server-Side Error Handling

- [x] **Error Middleware** (`lib/middleware/error.ts`)
  - [x] Implement middleware for API routes
  - [x] Add error logging integration
  - [x] Structure consistent error responses
  - [x] Write tests for middleware

- [x] **Server Actions Integration**
  - [x] Update server actions with try-catch blocks
  - [x] Use custom error classes
  - [x] Implement proper error returns
  - [x] Add tests for error cases

- [x] **Logging Service** (`lib/logging/index.ts`)
  - [x] Set up error logging service
  - [x] Configure different log levels
  - [x] Add context gathering
  - [x] Test logging functionality

### Phase 3: Client-Side Error Handling

- [x] **Error Boundary** (`components/error/error-boundary.tsx`)
  - [x] Implement React Error Boundary component
  - [x] Create fallback UI for errors
  - [x] Add recovery actions
  - [x] Test with simulated errors

- [x] **Form Error Handling** (`lib/forms/error-handling.ts`)
  - [x] Enhance form error handling utilities
  - [x] Add field-level error mapping
  - [x] Implement consistent validation feedback
  - [x] Test with form validation scenarios

- [x] **Toast Notifications** (`components/ui/toast-error.tsx`)
  - [x] Set up consistent error notifications
  - [x] Define different styles per error type
  - [x] Add retry mechanisms where applicable
  - [x] Test notification behavior

### Phase 4: Database & Authentication Integration

- [x] **Database Error Handling**
  - [x] Enhance database operations with error handling
  - [x] Implement retry logic for transient errors
  - [~] Add transaction error handling # Deferred
  - [x] Test database operation failures

- [x] **Authentication Error Handling**
  - [x] Update authentication flows
  - [~] Add session error recovery # Added informed sign-out, full recovery TBD
  - [~] Implement token refresh logic # Deferred, client library handles basics
  - [x] Test authentication failures

- [N/A] **External Services Integration**
  - [N/A] Add error handling for external APIs # Only Supabase used currently
  - [N/A] Implement circuit breaker pattern
  - [N/A] Add timeout handling
  - [N/A] Test service failures

### Phase 5: Monitoring & Documentation

- [~] **Error Monitoring** # Deferred pending Sentry account access/setup
  - [~] Set up error tracking service
  - [~] Configure alerts and notifications
  - [~] Implement error analytics
  - [~] Test monitoring system

- [ ] **Recovery Mechanisms**
  - [ ] Add data recovery options
  - [ ] Implement state recovery flows
  - [ ] Create recovery UI components
  - [ ] Test recovery scenarios

- [ ] **Documentation**
  - [ ] Document error handling patterns
  - [ ] Create troubleshooting guides
  - [ ] Add error code reference
  - [ ] Verify documentation accuracy

## Implementation Patterns

### Server Action Error Handling

```typescript
// Before:
export async function serverAction(data) {
  try {
    // Action logic
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

// After:
export async function serverAction(data) {
  try {
    // Action logic
    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      // Structured error with proper context
      console.error(`[${error.code}] ${error.message}`, error.context);
      return { error: error.message, code: error.code };
    }
    
    // Create and log AppError for unexpected errors
    const appError = new AppError(
      'An unexpected error occurred',
      'UNEXPECTED_ERROR',
      500,
      { originalError: String(error) }
    );
    console.error(`[${appError.code}] ${appError.message}`, appError.context);
    return { error: appError.message, code: appError.code };
  }
}
```

### Client-Side Error Handling

```typescript
// Before:
try {
  const result = await serverAction();
  if (result.error) {
    toast.error(result.error);
    return;
  }
  // Success logic
} catch (error) {
  toast.error('Failed to complete action');
}

// After:
try {
  const result = await serverAction();
  if (result.error) {
    // Handle structured errors
    toast({
      title: 'Error',
      description: result.error,
      variant: result.code?.includes('VALIDATION') ? 'warning' : 'destructive',
      // Show retry button for retriable errors
      action: isRetriableError(result.code) 
        ? <ToastAction altText="Retry" onClick={handleRetry}>Retry</ToastAction>
        : undefined
    });
    return;
  }
  // Success logic
} catch (error) {
  // Handle unexpected client errors
  toast({
    title: 'System Error',
    description: 'An unexpected error occurred. Please try again.',
    variant: 'destructive'
  });
  // Log to client-side error tracking
  logClientError(error);
}
```

## Error Boundary Implementation

```tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error service
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetError={() => {
        this.setState({ hasError: false, error: null });
      }} />;
    }
    return this.props.children;
  }
}
```

## Progress Tracking

- Phase 1: Foundation & Setup - 3/3 complete
- Phase 2: Server-Side Error Handling - 3/3 complete  
- Phase 3: Client-Side Error Handling - 3/3 complete
- Phase 4: Database & Authentication Integration - 1/3 complete
- Phase 5: Monitoring & Documentation - 0/3 complete

## Testing Strategy

- Unit tests for error classes and utilities
- Integration tests for error handling flows
- E2E tests for critical error scenarios
- Performance testing for error handling overhead
- Load testing for error handling at scale

## Resources

- Error handling documentation: `lib/errors/README.md`
- Example implementations: `examples/error-handling/`
- Error codes reference: `lib/errors/constants.ts`
- Testing utilities: `test/error-helpers.ts` 