import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DatabaseError } from '@/lib/errors/base';
import { logger } from '@/lib/logging';
import {
  queryData,
  insertData,
  deleteData,
} from './db-queries'; // Updated import path
import {
  uploadFile,
  removeFile
} from './db-storage'; // Updated import path

// Mock the logger
vi.mock('@/lib/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase client instance methods needed by db.ts functions
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(), // Chainable
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(), // Used in insertData
  storage: {
    from: vi.fn().mockReturnThis(),
    upload: vi.fn(),
    remove: vi.fn(),
  },
} as any; // Use any for easier mocking initially

describe('Supabase DB Utils', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Reset mock implementations to defaults if needed
    // Example: mockSupabaseClient.from.mockReturnThis(); 
    // (Currently redundant as we re-mock in tests)
  });

  // --- queryData ---
  describe('queryData', () => {
    it('should return DatabaseError on Supabase query error', async () => {
      // Arrange
      const supabaseError = { message: 'Query failed', code: 'PGRST000', details: '', hint: '' };
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: supabaseError }),
      });
      
      // Act
      const { data, error } = await queryData(mockSupabaseClient, 'test_table', '*');

      // Assert
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('DB_QUERY_FAILED_PGRST000');
      expect(error?.message).toContain('Failed querying table test_table after retries: Query failed');
      expect(error?.context?.originalError).toBe(supabaseError);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({
        code: 'DB_QUERY_FAILED_PGRST000',
        message: expect.stringContaining('Failed querying table test_table after retries: Query failed'),
        context: expect.objectContaining({ originalError: supabaseError })
      }));
    });

    it('should return DatabaseError on unexpected catch error', async () => {
      // Arrange
      const unexpectedError = new Error('Network issue');
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(unexpectedError), // Throw error
      });

      // Act
      const { data, error } = await queryData(mockSupabaseClient, 'test_table', '*');

      // Assert
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('DB_QUERY_FAILED_UNKNOWN_DB_ERROR');
      expect(error?.message).toContain('Failed querying table test_table after retries: Network issue');
      expect(error?.context?.originalError).toBe(unexpectedError);
      expect(logger.error).toHaveBeenCalledTimes(1);
       expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({
        code: 'DB_QUERY_FAILED_UNKNOWN_DB_ERROR',
        message: expect.stringContaining('Failed querying table test_table after retries: Network issue'),
        context: expect.objectContaining({ originalError: unexpectedError })
      }));
    });

    it('should succeed after one retry on a transient error', async () => {
      // Arrange
      const transientError = { message: 'Temporary issue', code: 'ECONNRESET' };
      const successData = [{ id: 1, name: 'Test' }];
      const mockSelect = vi.fn()
        .mockRejectedValueOnce(transientError) // Fail first time
        .mockResolvedValueOnce({ data: successData, error: null }); // Succeed second time
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });
      const consoleWarnSpy = vi.spyOn(console, 'warn'); // Spy on console.warn for retry message

      // Act
      const { data, error } = await queryData(mockSupabaseClient, 'test_table', '*');

      // Assert
      expect(data).toEqual(successData);
      expect(error).toBeNull();
      expect(mockSelect).toHaveBeenCalledTimes(2); // Called initial + 1 retry
      expect(logger.info).toHaveBeenCalledTimes(1); // Logged info about retry attempt
      expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Potential transient error on attempt 1') }));
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // Logged warning about retry
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Attempt 1 failed. Retrying in 200ms'));
      expect(logger.error).not.toHaveBeenCalled(); // Final error logger not called
      
      consoleWarnSpy.mockRestore(); // Clean up spy
    });

    it('should fail after max retries on persistent transient error', async () => {
      // Arrange
      const transientError = { message: 'Persistent temporary issue', code: 'ETIMEDOUT' };
      const mockSelect = vi.fn().mockRejectedValue(transientError); // Always fail
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      // Act
      const { data, error } = await queryData(mockSupabaseClient, 'test_table', '*');

      // Assert
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('DB_QUERY_FAILED_ETIMEDOUT');
      expect(error?.message).toContain('Failed querying table test_table after retries: Persistent temporary issue');
      expect(error?.context?.originalError).toBe(transientError);
      expect(mockSelect).toHaveBeenCalledTimes(3); // Called initial + 2 retries
      expect(logger.info).toHaveBeenCalledTimes(2); // Logged info for 2 retry attempts
      expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Potential transient error on attempt 1') }));
      expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Potential transient error on attempt 2') }));
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2); // Logged warning for 2 retries
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Attempt 1 failed. Retrying in 200ms'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Attempt 2 failed. Retrying in 400ms'));
      expect(logger.error).toHaveBeenCalledTimes(1); // Final error logger called once
      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ code: 'DB_QUERY_FAILED_ETIMEDOUT' }));
      
      consoleWarnSpy.mockRestore();
    });

    it('should not retry on a non-retryable error code (e.g., PGRST116)', async () => {
       // Arrange
      const nonRetryableError = { message: 'Syntax error', code: 'PGRST116' }; 
      const mockSelect = vi.fn().mockRejectedValue(nonRetryableError); // Fail once
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      // Act
      const { data, error } = await queryData(mockSupabaseClient, 'test_table', '*');

      // Assert
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('DB_QUERY_FAILED_PGRST116');
      expect(error?.message).toContain('Failed querying table test_table after retries: Syntax error'); // Final error message
      expect(error?.context?.originalError).toBe(nonRetryableError);
      expect(mockSelect).toHaveBeenCalledTimes(1); // Only called once
      expect(logger.info).not.toHaveBeenCalled(); // No retry attempt logged
      expect(logger.warn).toHaveBeenCalledTimes(1); // Logged warning about non-retryable error
      expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Non-retryable error encountered on attempt 1') }));
      expect(consoleWarnSpy).not.toHaveBeenCalled(); // No retry warning logged
      expect(logger.error).toHaveBeenCalledTimes(1); // Final error logger called once

      consoleWarnSpy.mockRestore();
    });

    // Add more tests for options, success cases etc. if needed
  });

  // --- insertData ---
  describe('insertData', () => {
    it('should return DatabaseError on Supabase insert error', async () => {
      // Arrange
      const supabaseError = { message: 'Insert failed', code: '23505' }; // Example: unique constraint
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: supabaseError }),
      });
      const values = { name: 'test' };

      // Act
      const { data, error } = await insertData(mockSupabaseClient, 'test_table', values);

      // Assert
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('DB_INSERT_ERROR');
      expect(error?.message).toContain('Error inserting into table test_table: Insert failed');
      expect(error?.context?.originalError).toBe(supabaseError);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

     it('should return DatabaseError on unexpected catch error during insert', async () => {
       // Arrange
      const unexpectedError = new Error('Insert network issue');
       mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(), // Keep insert chainable
        select: vi.fn().mockReturnThis(), // Keep select chainable
        maybeSingle: vi.fn().mockRejectedValue(unexpectedError), // Reject on the awaited call
      });
      const values = { name: 'test' };

       // Act
      const { data, error } = await insertData(mockSupabaseClient, 'test_table', values);

       // Assert
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('DB_UNEXPECTED_INSERT_ERROR');
      expect(error?.message).toContain('Unexpected error inserting into table test_table: Insert network issue');
      expect(error?.context?.originalError).toBe(unexpectedError);
      expect(logger.error).toHaveBeenCalledTimes(1);
     });
  });

  // --- deleteData ---
  describe('deleteData', () => {
     it('should return DatabaseError on Supabase delete error', async () => {
      // Arrange
      const supabaseError = { message: 'Delete failed', code: 'PGRST001' }; 
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: supabaseError }), // Error on final operation
      });

      // Act
      const { success, error } = await deleteData(mockSupabaseClient, 'test_table', 'id', 1);

      // Assert
      expect(success).toBe(false);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('DB_DELETE_ERROR');
      expect(error?.message).toContain('Error deleting from table test_table: Delete failed');
      expect(error?.context?.originalError).toBe(supabaseError);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

     it('should return DatabaseError on unexpected catch error during delete', async () => {
       // Arrange
      const unexpectedError = new Error('Delete network issue');
       mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(), // Keep delete chainable
        eq: vi.fn().mockRejectedValue(unexpectedError), // Reject on the awaited call
      });

       // Act
      const { success, error } = await deleteData(mockSupabaseClient, 'test_table', 'id', 1);

       // Assert
      expect(success).toBe(false);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('DB_UNEXPECTED_DELETE_ERROR');
      expect(error?.message).toContain('Unexpected error deleting from table test_table: Delete network issue');
      expect(error?.context?.originalError).toBe(unexpectedError);
      expect(logger.error).toHaveBeenCalledTimes(1);
     });
  });

  // --- uploadFile ---
  describe('uploadFile', () => {
    it('should return DatabaseError on Supabase upload error', async () => {
       // Arrange
      const supabaseError = { message: 'Upload failed', statusCode: '400' }; // Storage errors often have statusCode
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: supabaseError }), 
      });
      const file = new File(['content'], 'test.png', { type: 'image/png' });

      // Act
      const { path, error } = await uploadFile(mockSupabaseClient, 'test_bucket', 'test.png', file);

      // Assert
      expect(path).toBeNull();
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('STORAGE_UPLOAD_ERROR');
      expect(error?.message).toContain('Error uploading to bucket test_bucket: Upload failed');
      expect(error?.context?.originalError).toBe(supabaseError);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
    
     it('should return DatabaseError on unexpected catch error during upload', async () => {
       // Arrange
      const unexpectedError = new Error('Upload network issue');
       mockSupabaseClient.storage.from.mockReturnValue({
        upload: vi.fn().mockRejectedValue(unexpectedError), // Throw error during upload
      });
      const file = new File(['content'], 'test.png', { type: 'image/png' });

       // Act
      const { path, error } = await uploadFile(mockSupabaseClient, 'test_bucket', 'test.png', file);

       // Assert
      expect(path).toBeNull();
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('STORAGE_UNEXPECTED_UPLOAD_ERROR');
      expect(error?.message).toContain('Unexpected error uploading to bucket test_bucket: Upload network issue');
      expect(error?.context?.originalError).toBe(unexpectedError);
      expect(logger.error).toHaveBeenCalledTimes(1);
     });
  });

  // --- removeFile ---
  describe('removeFile', () => {
     it('should return DatabaseError on Supabase remove error', async () => {
       // Arrange
      const supabaseError = { message: 'Remove failed', statusCode: '404' }; 
      mockSupabaseClient.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ data: null, error: supabaseError }), 
      });

      // Act
      const { success, error } = await removeFile(mockSupabaseClient, 'test_bucket', 'test.png');

      // Assert
      expect(success).toBe(false);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('STORAGE_REMOVE_ERROR');
      expect(error?.message).toContain('Error removing from bucket test_bucket: Remove failed');
      expect(error?.context?.originalError).toBe(supabaseError);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

     it('should return DatabaseError on unexpected catch error during remove', async () => {
       // Arrange
      const unexpectedError = new Error('Remove network issue');
       mockSupabaseClient.storage.from.mockReturnValue({
        remove: vi.fn().mockRejectedValue(unexpectedError), // Throw error during remove
      });

       // Act
      const { success, error } = await removeFile(mockSupabaseClient, 'test_bucket', 'test.png');

       // Assert
      expect(success).toBe(false);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error?.code).toBe('STORAGE_UNEXPECTED_REMOVE_ERROR');
      expect(error?.message).toContain('Unexpected error removing from bucket test_bucket: Remove network issue');
      expect(error?.context?.originalError).toBe(unexpectedError);
      expect(logger.error).toHaveBeenCalledTimes(1);
     });
  });
}); 