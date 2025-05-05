# Error Handling Patterns

This document outlines the standard patterns for handling errors across the application, covering both server-side (Server Actions, API routes) and client-side (React components) logic.

**Related Documentation:**
*   [Error Code Reference](docs/error-codes.md)
*   [Error Handling System Implementation](docs/error_handling_steps.md)
*   Error Classes: `lib/errors/base.ts`
*   Error Factory: `lib/errors/factory.ts`
*   Error Constants: `lib/errors/constants.ts`
*   Client Error Utilities: `lib/errors/client.tsx` (If exists)
*   Logging Service: `lib/logging/index.ts`

## Core Principles

1.  **Use Custom Error Classes:** Always use the custom error classes defined in `lib/errors/base.ts` (`AppError`, `ValidationError`, `AuthorizationError`, `NotFoundError`, `DatabaseError`, `ExternalServiceError`) when throwing errors programmatically within server-side code. This ensures errors have consistent properties (`message`, `code`, `statusCode`, `context`).
2.  **Leverage Error Factory:** Use the helper functions in `lib/errors/factory.ts` (`ErrorFactory`) to create instances of these custom errors easily.
3.  **Structured Server Responses:** Server Actions and API routes should return structured error responses, typically including `success: false`, a user-friendly `message`, and an error `code`.
4.  **Catch and Standardize:** Catch potential errors (especially from external calls like database queries or third-party APIs) and wrap them in appropriate custom error classes or return a standardized error response.
5.  **Log Server-Side Errors:** Log errors appropriately on the server-side using the `logger` from `lib/logging`, including relevant context.
6.  **Graceful Client Handling:** Client components should handle potential errors gracefully, displaying user-friendly feedback (e.g., toasts, inline form errors) and providing recovery options (like retry buttons) where applicable.
7.  **Error Boundary for UI:** Use the `ErrorBoundary` component (`components/error/error-boundary.tsx`) to catch rendering errors in React components and display a fallback UI.

## Server-Side Patterns

### Server Actions (`app/.../actions.ts` or `lib/actions/...`)

Server Actions should always return a consistent object shape, indicating success or failure. When an error occurs, include the relevant error `code`.

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { AppError } from '@/lib/errors/base';
import { ErrorFactory } from '@/lib/errors/factory';
import { ErrorCodes } from '@/lib/errors/constants';
import { logger } from '@/lib/logging';

interface ActionResult {
    success: boolean;
    message: string;
    code?: string; 
    data?: any; // Optional: include data on success
}

export async function performSomeAction(prevState: any, formData: FormData): Promise<ActionResult> {
    const someValue = formData.get('someValue')?.toString();

    // 1. Input Validation
    if (!someValue) {
        // Use ErrorFactory for common validation errors
        const validationError = ErrorFactory.missingField('someValue');
        // Log (optional for simple validation, but useful for complex cases)
        logger.warn({
             message: validationError.message, 
             context: { code: validationError.code, field: 'someValue' }
        }); 
        return { 
            success: false, 
            message: validationError.message, 
            code: validationError.code 
        };
    }

    const supabase = createClient();

    try {
        // 2. Authentication/Authorization Check (if needed)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            const authError = ErrorFactory.unauthorized();
            logger.error({ 
                message: 'Server Action Auth Failed', 
                error: userError, 
                context: { code: authError.code }
            });
            return { success: false, message: authError.message, code: authError.code };
        }

        // 3. Perform Core Logic (e.g., Database Operation)
        const { data, error: dbError } = await supabase
            .from('your_table')
            .insert({ value: someValue, user_id: user.id })
            .select()
            .single();

        if (dbError) {
            // Wrap DB errors
            const appError = ErrorFactory.database('Failed to insert data', { originalError: dbError });
            logger.error({ 
                message: 'Database Insert Failed', 
                error: dbError, 
                context: { code: appError.code }
            }); 
            // Check for specific DB error codes if needed (e.g., timeout, duplicate)
            const code = dbError.message.includes('timeout') 
                ? ErrorCodes.DATABASE_TIMEOUT 
                : ErrorCodes.DATABASE_ERROR;
            return { success: false, message: appError.message, code: code };
        }

        // 4. Revalidate Cache (if data changed)
        revalidatePath('/path/to/updated/data');

        // 5. Return Success
        return { success: true, message: 'Action completed successfully.', data: data };

    } catch (error) {
        // 6. Catch Unexpected Errors
        let appError: AppError;
        if (error instanceof AppError) {
            // If it's already an AppError, use it directly
            appError = error;
        } else {
            // Otherwise, wrap the unexpected error
            appError = ErrorFactory.unexpected('An unexpected error occurred during the action', { originalError: String(error) });
        }
        
        logger.error({
            message: 'Unexpected Server Action Error', 
            error: error,
            context: { code: appError.code, ...appError.context }
        });

        return { 
            success: false, 
            message: appError.message, 
            code: appError.code 
        };
    }
}
```

### API Routes (`app/api/...`)

API routes should generally use a middleware or wrapper to handle errors consistently. If not using middleware, follow a similar `try...catch` pattern as Server Actions, but return a `NextResponse` with the appropriate status code and JSON body.

```typescript
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/base';
import { ErrorFactory } from '@/lib/errors/factory';
import { createErrorResponse } from '@/lib/errors/factory'; // Helper for consistent format
import { logger } from '@/lib/logging';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ... process request ...

    if (!body.requiredField) {
      // Throw specific errors to be caught below or by middleware
      throw ErrorFactory.missingField('requiredField');
    }

    // ... perform action ...

    return NextResponse.json({ success: true, data: { id: 123 } });

  } catch (error) {
    let appError: AppError;
    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = ErrorFactory.unexpected('API Error', { originalError: String(error) });
    }

    logger.error({ 
      message: `API Error (${request.method} ${request.url})`, 
      error: error, 
      context: { code: appError.code, ...appError.context } 
    });

    // Use createErrorResponse for standard format
    const errorResponse = createErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: appError.statusCode });
  }
}
```

## Client-Side Patterns

### Handling Server Action Errors (e.g., in Forms)

Client components using Server Actions (often via `useActionState`) should inspect the returned state to handle success and error cases.

```typescript
'use client';

import React, { useRef, useEffect, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from "@/components/ui/toast";
import { isRetriableError } from '@/lib/errors/factory';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";

// Assuming performSomeAction is imported and matches the server action signature
// including { success: boolean; message: string; code?: string; }

const initialState = { success: false, message: '', code: undefined };

export function MyForm({ performSomeAction }) {
  const [state, formAction] = useActionState(performSomeAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) { // Check if there's a message (success or error)
      if (state.success) {
        // --- Success Case ---
        toast({
          title: 'Success',
          description: state.message,
        });
        formRef.current?.reset(); 
        // Optionally call a success callback
      } else {
        // --- Error Case ---
        const isRetryable = isRetriableError(state.code);
        toast({
          title: 'Error',
          description: state.message,
          variant: 'destructive',
          // Add retry action for specific error codes
          action: isRetryable ? (
            <ToastAction 
              altText="Retry"
              onClick={() => {
                  // Resubmit the form using the current data
                  if (formRef.current) {
                      formAction(new FormData(formRef.current));
                  }
              }}
            >
              Retry
            </ToastAction>
          ) : undefined,
        });
        // Optionally handle specific error codes differently 
        // (e.g., highlight form fields for VALIDATION_ERROR)
      }
    }
  }, [state, toast, formAction]); // Include formAction in dependency array

  return (
    <form ref={formRef} action={formAction}>
      {/* Form fields */} 
      <Input name="someValue" required />
      <Button type="submit">Submit</Button>
      {/* Optionally display state.message near the form too */}
    </form>
  );
}
```

### Handling Fetch/API Call Errors

For direct API calls using `fetch`, use standard `try...catch` blocks.

```typescript
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ErrorCodes } from '@/lib/errors/constants'; // For checking codes
import { isRetriableError } from '@/lib/errors/factory';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/some-data');

      if (!response.ok) {
        let errorData = { message: `HTTP error! status: ${response.status}`, code: ErrorCodes.UNEXPECTED_ERROR };
        try {
          // Attempt to parse structured error from API response
          const parsed = await response.json();
          if (parsed.error) {
             errorData = { 
                message: parsed.error.message || errorData.message,
                code: parsed.error.code || errorData.code
             };
          }
        } catch (parseError) {
          // Ignore if response isn't valid JSON
        }
        // Throw an object matching the structure our toast handler expects
        throw errorData; 
      }

      const data = await response.json();
      // ... process success data ...
      toast({ title: 'Data fetched successfully!' });

    } catch (error: any) {
      console.error("Fetch error:", error);
      const isRetryable = isRetriableError(error?.code);
      toast({
        title: 'Error Fetching Data',
        description: error?.message || 'An unknown error occurred.',
        variant: 'destructive',
        action: isRetryable ? (
             <ToastAction altText="Retry" onClick={fetchData}>Retry</ToastAction>
          ) : undefined,
      });
      // Log client-side error if needed (e.g., to Sentry when implemented)
      // logClientError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return <button onClick={fetchData} disabled={isLoading}>Fetch Data</button>;
}
```

### UI Rendering Errors (`ErrorBoundary`)

Wrap sections of your UI (or the entire application) with the `ErrorBoundary` component to catch errors during rendering.

```tsx
// Example usage in a layout or page component
import { ErrorBoundary } from '@/components/error/error-boundary';
import { SomeComponentThatMightThrow } from './some-component';

function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <ErrorBoundary>
        {/* Components inside the boundary are protected */}
        <SomeComponentThatMightThrow />
        {/* ... other components ... */}
      </ErrorBoundary>
    </div>
  );
}
```

The `ErrorBoundary` itself (defined in `components/error/error-boundary.tsx`) typically catches the error, logs it, and renders a fallback UI component (`ErrorFallback`). See the implementation example in `docs/error_handling_steps.md`. 