# Error Handling Troubleshooting Guide

This guide helps diagnose common issues related to the application's error handling system.

**Related Documentation:**
*   [Error Handling Patterns](docs/error-handling-patterns.md)
*   [Error Code Reference](docs/error-codes.md)
*   [Error Handling System Implementation](docs/error_handling_steps.md)

## Common Issues & Solutions

### 1. Server Action / API Route Returns Generic Error (e.g., "Unexpected Error") Instead of Specific One

*   **Symptom:** You expect a `VALIDATION_ERROR` or `DATABASE_ERROR` but the client receives `UNEXPECTED_ERROR`.
*   **Diagnosis:**
    *   **Check Server Logs:** Examine the server-side logs (console or logging service) for the specific error that occurred within the action/route. The generic error often means an unexpected exception was caught.
    *   **Review `try...catch`:** Ensure the specific operation (e.g., database call, validation check) that might fail is wrapped in its own `try...catch` block *before* the final catch-all block.
    *   **Verify Error Wrapping:** Make sure that caught errors (like database errors from Supabase) are correctly wrapped using `ErrorFactory` or that the correct `code` is being returned in the `ActionResult`.
    *   **Example:** If a Supabase `insert` fails, the `catch` block should identify it and return `{ success: false, ..., code: ErrorCodes.DATABASE_ERROR }` rather than letting it fall through to the generic `catch (error)`. See the Server Action pattern in `docs/error-handling-patterns.md`.

### 2. Client Receives Error, But Toast/UI Shows Incorrect Message or No Code

*   **Symptom:** An error occurs, but the toast message is generic, or features depending on the error code (like retry) don't work.
*   **Diagnosis:**
    *   **Check Server Action/API Return:** Verify that the server-side code *is* actually returning the `code` property in the error response object (`ActionResult` for Server Actions, JSON payload for API routes).
    *   **Inspect Network Tab:** Use browser dev tools to inspect the network response for the failed Server Action or API call. Check the response body to see if the `message` and `code` fields are present and correct.
    *   **Check Client Handling Code:** Ensure the client-side code (e.g., the `useEffect` hook in a form using `useActionState`, or the `catch` block in a `fetch` call) is correctly accessing the `state.code` or `error.code` property from the response.

### 3. Retry Button Doesn't Appear for a Seemingly Retriable Error

*   **Symptom:** A network timeout or server unavailable error occurs, but the error toast doesn't show a "Retry" button.
*   **Diagnosis:**
    *   **Verify Error Code:** Confirm the specific `code` being returned by the server for this error (check server logs or network response). Is it one of the codes defined as retriable?
    *   **Check `isRetriableError` Function:** Look at `lib/errors/factory.ts` and ensure the specific error code *is included* in the `retriableCodes` array within the `isRetriableError` function.
    *   **Check Client Toast Logic:** Verify the client-side code calling `toast()` includes the `action` property conditional logic based on `isRetriableError(state.code)`. See the client-side patterns document.

### 4. Error Boundary Doesn't Catch a UI Rendering Error

*   **Symptom:** A component throws an error during rendering, causing a crash or broken UI, but the `ErrorFallback` UI doesn't appear.
*   **Diagnosis:**
    *   **Placement:** Ensure the `ErrorBoundary` component wraps the component (or section of the component tree) that is throwing the error. Error boundaries do *not* catch errors in event handlers, async code (like `useEffect`), or the error boundary component itself.
    *   **Error Type:** Error boundaries primarily catch errors during the React render phase and in lifecycle methods/constructors.
    *   **Check Console:** Look for React-specific error messages in the browser console, which might provide clues.

### 5. Errors Not Appearing in Server Logs

*   **Symptom:** An error occurs, but nothing relevant appears in the server console or configured logging service.
*   **Diagnosis:**
    *   **Check `logger` Calls:** Ensure `logger.error()`, `logger.warn()`, etc., are being called appropriately within the server-side `catch` blocks or error handling middleware. See `lib/logging/index.ts`.
    *   **Environment Configuration:** Verify that the logging level is configured correctly for the environment (e.g., development might log more verbosely than production). Check environment variables related to logging.
    *   **Check Error Handling Path:** Make sure the error isn't being caught and handled *without* logging before it reaches the intended logging point.

## Reporting New Issues

If you encounter an error scenario not covered here, please:
1.  Gather details: specific error message, code (if any), steps to reproduce, relevant code snippets.
2.  Check existing documentation first.
3.  Consider if a new `ErrorCode` or pattern is needed.
4.  Update this guide or related documentation as appropriate. 