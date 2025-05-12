// types/services.ts

// For specific error handling if needed, maps to ErrorCodes (e.g., from @/lib/errors/constants)
// Consider importing ErrorCodes type here if you want to strictly type errorCode.
// import type { ErrorCodeValues } from '@/lib/errors/constants'; // Example path

export interface ServiceResult<T = null> {
  success: boolean;
  data?: T;
  error?: string; // User-friendly error message
  errorCode?: string; // Consider: ErrorCodeValues | string;
} 