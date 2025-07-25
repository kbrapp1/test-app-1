import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility function to retry an asynchronous operation with exponential backoff.
 * 
 * @param fn The asynchronous function to retry.
 * @param shouldRetry A function that takes the error and attempt number, and returns true if the operation should be retried.
 * @param maxAttempts The maximum number of attempts (including the initial one).
 * @param initialDelayMs The initial delay in milliseconds before the first retry.
 * @returns A Promise that resolves with the result of the function if successful, or rejects with the last error if all attempts fail.
 */
export async function retryAsyncFunction<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: unknown, attempt: number) => boolean,
  maxAttempts: number = 3,
  initialDelayMs: number = 100
): Promise<T> {
  let attempt = 1;
  while (attempt <= maxAttempts) {
    try {
      return await fn(); // Attempt the operation
    } catch (error: unknown) {
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        // If it's the last attempt or shouldRetry returns false, throw the error
        throw error;
      }

      // Calculate delay using exponential backoff
      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Attempt ${attempt} failed. Retrying in ${delayMs}ms... Error: ${errorMessage}`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      attempt++; // Increment attempt counter
    }
  }
  // This line should technically be unreachable if maxAttempts >= 1
  throw new Error('Retry logic failed unexpectedly.'); 
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes < 0) return 'Invalid Size'; // Handle negative byte values
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Utility function to create a delay (sleep) for a specified duration.
 * 
 * @param ms The delay in milliseconds.
 * @returns A Promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
