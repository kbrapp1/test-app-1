import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '@/lib/errors/base';
import { logger } from '@/lib/logging';
import { retryAsyncFunction } from '@/lib/utils';

export type QueryOptions = {
  matchColumn?: string;
  matchValue?: string | null;
  isNull?: string;
  userId?: string;
  organizationId?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
};

// Generic database query function
export const queryData = async <T = any>(
  supabase: SupabaseClient,
  table: string,
  selectFields: string,
  options: QueryOptions = {}
): Promise<{ data: T[] | null; error: DatabaseError | null }> => {
  const executeQuery = async () => {
    // This inner function contains the actual Supabase call
    let queryBuilder = supabase.from(table).select(selectFields);

    // Apply filters
    if (options.matchColumn && options.matchValue !== undefined) {
      queryBuilder = queryBuilder.eq(options.matchColumn, options.matchValue);
    }
    if (options.isNull) {
      queryBuilder = queryBuilder.is(options.isNull, null);
    }
    if (options.userId) {
      queryBuilder = queryBuilder.eq('user_id', options.userId);
    }
    if (options.organizationId) {
      queryBuilder = queryBuilder.eq('organization_id', options.organizationId);
    }
    // Apply ordering
    if (options.orderBy) {
      queryBuilder = queryBuilder.order(options.orderBy, {
        ascending: options.ascending ?? true
      });
    }
    // Apply limit
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    // Execute the final query builder
    const { data, error } = await queryBuilder;

    // If Supabase returns an error, throw it to be caught by retry logic or final catch block
    if (error) {
      // We can potentially enrich the error here before throwing if needed
      throw error; 
    }
    
    return data; // Return only data on success
  };

  try {
    // Define the shouldRetry logic
    const shouldRetryQuery = (error: any, attempt: number): boolean => {
      // Basic check: Retry up to 3 times if it's not a clear client/query error
      // Supabase errors often have a 'code' property (e.g., Postgres error codes like 'PGRSTxxx')
      // Avoid retrying on common query issues like 'PGRST116' (invalid syntax/param) or auth errors (401/403 status)
      const isAuthError = error?.status === 401 || error?.status === 403;
      const isQuerySyntaxError = error?.code === 'PGRST116'; // Example, add more known non-retryable codes if found
      
      if (isAuthError || isQuerySyntaxError) {
        logger.warn({ message: `Non-retryable error encountered on attempt ${attempt}`, code: error?.code, context: { table, error } });
        return false; // Do not retry auth or syntax errors
      }
      
      // Otherwise, assume it might be transient (network, temp load) and retry up to 3 times
       logger.info({ message: `Potential transient error on attempt ${attempt}. Retrying queryData.`, code: error?.code, context: { table, error } });
      return attempt < 3; // Retry up to 2 times (total 3 attempts)
    };

    // Wrap the execution with retry logic
    const data = await retryAsyncFunction(
      executeQuery, 
      shouldRetryQuery, 
      3, // Max attempts
      200 // Initial delay 200ms
    );
    
    // If retry succeeded, return data
    return { data: data as T[] | null, error: null };

  } catch (error: any) {
    // This block now catches errors after retries failed or if shouldRetry returned false
    // Or catches unexpected errors from executeQuery setup itself (less likely)
    
    const errorCode = error?.code || 'UNKNOWN_DB_ERROR';
    const errorMessage = error?.message || 'An unknown database error occurred';

    const dbError = new DatabaseError(
      `Failed querying table ${table} after retries: ${errorMessage}`,
      error instanceof DatabaseError ? error.code : `DB_QUERY_FAILED_${errorCode}`,
      {
        originalError: error,
        table,
        selectFields,
        options,
        stack: error?.stack,
        status: error?.status, // Include status if available
      }
    );
    
    logger.error({ 
      message: dbError.message,
      code: dbError.code,
      statusCode: dbError.statusCode,
      context: dbError.context,
      stack: dbError.stack
    });
    
    return { data: null, error: dbError };
  }
};

// Insert data utility
export const insertData = async <T = any>(
  supabase: SupabaseClient,
  table: string,
  insertValues: Record<string, any>,
  options?: { organizationId?: string }
): Promise<{ data: T | null; error: DatabaseError | null }> => {
  try {
    // Inject organization_id if provided to enforce tenant-scope
    if (options?.organizationId) {
      insertValues.organization_id = options.organizationId;
    }
    const { data: result, error } = await supabase.from(table).insert(insertValues).select().maybeSingle();

    if (error) {
      const dbError = new DatabaseError(
        `Error inserting into table ${table}: ${error.message}`,
        'DB_INSERT_ERROR',
        { originalError: error, table, insertValues }
      );
      // Log the structured error context
      logger.error({ 
        message: dbError.message,
        code: dbError.code,
        statusCode: dbError.statusCode,
        context: dbError.context,
        stack: dbError.stack
      });
      return { data: null, error: dbError };
    }
    return { data: result as T | null, error: null };
  } catch (error: any) {
    const dbError = new DatabaseError(
      `Unexpected error inserting into table ${table}: ${error.message}`,
      'DB_UNEXPECTED_INSERT_ERROR',
      { originalError: error, table, insertValues, stack: error.stack }
    );
    // Log the structured error context
    logger.error({ 
      message: dbError.message,
      code: dbError.code,
      statusCode: dbError.statusCode,
      context: dbError.context,
      stack: dbError.stack
    });
    return { data: null, error: dbError };
  }
};

// Delete data utility
export const deleteData = async (
  supabase: SupabaseClient,
  table: string,
  matchColumn: string,
  matchValue: string | number,
  options?: { organizationId?: string }
): Promise<{ success: boolean; error: DatabaseError | null }> => {
  try {
    // Build delete query with optional organization filter for tenant-scope
    let query = supabase.from(table).delete().eq(matchColumn, matchValue);
    if (options?.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }
    const { error } = await query;

    if (error) {
      const dbError = new DatabaseError(
        `Error deleting from table ${table}: ${error.message}`,
        'DB_DELETE_ERROR',
        { originalError: error, table, matchColumn, matchValue }
      );
      // Log the structured error context
      logger.error({ 
        message: dbError.message,
        code: dbError.code,
        statusCode: dbError.statusCode,
        context: dbError.context,
        stack: dbError.stack
      });
      return { success: false, error: dbError };
    }
    return { success: true, error: null };
  } catch (error: any) {
    const dbError = new DatabaseError(
      `Unexpected error deleting from table ${table}: ${error.message}`,
      'DB_UNEXPECTED_DELETE_ERROR',
      { originalError: error, table, matchColumn, matchValue, stack: error.stack }
    );
    // Log the structured error context
    logger.error({ 
      message: dbError.message,
      code: dbError.code,
      statusCode: dbError.statusCode,
      context: dbError.context,
      stack: dbError.stack
    });
    return { success: false, error: dbError };
  }
}; 