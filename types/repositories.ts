/**
 * Represents the typical structure of a query result from Supabase,
 * containing either data or an error.
 */
export interface SupabaseQueryResult<T> {
  data: T | null;
  error: Error | null; // Supabase errors are typically { message: string, code: string, ... } but Error is a safe base.
} 