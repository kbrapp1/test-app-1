# Error Code Reference

This document provides a reference for the standardized error codes used throughout the application. These codes help categorize errors and ensure consistent handling.

See `lib/errors/constants.ts` for the source definitions.

## Error Codes Table

| Code                             | Description                                                      | Typical HTTP Status | Severity   | Retriable |
| :------------------------------- | :--------------------------------------------------------------- | :------------------ | :--------- | :-------- |
| **Validation Errors**            |                                                                  | **400**             |            |           |
| `VALIDATION_ERROR`               | General data validation failure.                                 | 400                 | Low        | No        |
| `INVALID_INPUT`                  | A specific input field value was invalid.                        | 400                 | Low        | No        |
| `MISSING_FIELD`                  | A required input field was missing.                              | 400                 | Low        | No        |
| `INVALID_FORMAT`                 | Input data was in an unexpected or invalid format.               | 400                 | Low        | No        |
| **Authentication Errors**        |                                                                  | **401**             |            |           |
| `UNAUTHORIZED`                   | User is not authenticated (not logged in).                       | 401                 | Medium     | No        |
| `INVALID_CREDENTIALS`            | Provided credentials (e.g., password) are incorrect.             | 401                 | Medium     | No        |
| `TOKEN_EXPIRED`                  | Authentication token or session has expired.                     | 401                 | Medium     | No        |
| `INVALID_TOKEN`                  | Authentication token is invalid or corrupt.                      | 401                 | Medium     | No        |
| **Authorization Errors**         |                                                                  | **403**             |            |           |
| `FORBIDDEN`                      | User is authenticated but lacks permission for the action.       | 403                 | High       | No        |
| `INSUFFICIENT_PERMISSIONS`       | User lacks specific permissions required.                        | 403                 | High       | No        |
| `ACCOUNT_DISABLED`               | The user's account has been disabled or suspended.               | 403                 | High       | No        |
| **Not Found Errors**             |                                                                  | **404**             |            |           |
| `RESOURCE_NOT_FOUND`             | A specific requested resource (e.g., user, document) was not found. | 404                 | Low        | No        |
| `ROUTE_NOT_FOUND`                | The requested API route or page does not exist.                  | 404                 | Low        | No        |
| **Conflict Errors**              |                                                                  | **409**             |            |           |
| `RESOURCE_CONFLICT`              | Action conflicts with the current state (e.g., edit conflict).    | 409                 | Medium     | No        |
| `DUPLICATE_ENTRY`                | Attempt to create a resource that already exists (unique constraint). | 409                 | Medium     | No        |
| **Server Errors**                |                                                                  | **500**             |            |           |
| `DATABASE_ERROR`                 | A general error occurred during a database operation.            | 500                 | Critical   | No        |
| `UNEXPECTED_ERROR`               | An unknown or unexpected server-side error occurred.             | 500                 | High       | No        |
| `INTERNAL_SERVER_ERROR`          | A critical, unrecoverable server error occurred.                 | 500                 | Critical   | No        |
| **External Service/Network Errors** |                                                                  | **50x / 429**       |            |           |
| `EXTERNAL_SERVICE_ERROR`         | An error occurred while communicating with a third-party service. | 502/503/504         | High       | Maybe     |
| `API_ERROR`                      | General error interacting with an external API.                  | 502/503/504         | High       | Maybe     |
| `INTEGRATION_ERROR`              | Error related to the integration between services.               | 502/503/504         | High       | Maybe     |
| `SERVER_UNAVAILABLE`             | The server or an upstream service is temporarily unavailable.    | 503                 | High       | Yes       |
| `NETWORK_ERROR`                  | A network-level error occurred (e.g., timeout, connection refused). | 504 / Network Layer | High       | Yes       |
| `DATABASE_TIMEOUT`               | The database operation timed out.                                | 504 / 500           | Critical   | Yes       |
| `RATE_LIMIT_EXCEEDED`            | Too many requests were made in a given amount of time.           | 429                 | Medium     | Yes       |

**Notes:**

*   **Severity:** Defined in `ErrorSeverityMap` in `lib/errors/constants.ts`. Helps prioritize logging and alerting.
*   **Retriable:** Indicates whether an operation resulting in this error might succeed if attempted again. Based on the `isRetriableError` function in `lib/errors/factory.ts`. Note that some errors like `EXTERNAL_SERVICE_ERROR` are marked "Maybe" as retrying might depend on the specific external service issue.
*   **Descriptions:** Primarily based on `ErrorMessages` in `constants.ts` or inferred from the code name and category.
*   **HTTP Status:** Typical associated status code. The actual status code returned might vary slightly based on context within the `AppError` instances created by `ErrorFactory`. 