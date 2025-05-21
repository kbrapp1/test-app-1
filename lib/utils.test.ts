import { describe, it, expect } from 'vitest';
import { cn, formatBytes, retryAsyncFunction } from './utils';

describe('formatBytes', () => {
  it('should convert 1024 bytes to "1 KB"', () => {
    expect(formatBytes(1024)).toBe('1.00 KB'); // Vitest default for toFixed is often 2 decimal places
  });

  it('should return "0 Bytes" for 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should handle negative bytes', () => {
    expect(formatBytes(-100)).toBe('Invalid Size');
  });

  it('should format bytes into MB and GB correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
  });

  it('should handle decimals correctly', () => {
    expect(formatBytes(2048, 0)).toBe('2 KB');
    expect(formatBytes(1500, 2)).toBe('1.46 KB');
  });
});

describe('cn', () => {
  it.todo('should correctly merge class names');
  // Example: expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  // Example: expect(cn("bg-red-500", { "text-white": true, "font-bold": false })).toBe("bg-red-500 text-white");
});

describe('retryAsyncFunction', () => {
  it.todo('should resolve on first attempt if successful');
  it.todo('should retry if shouldRetry returns true and eventually succeed');
  it.todo('should throw error if maxAttempts is reached');
  it.todo('should throw error if shouldRetry returns false');
  it.todo('should use exponential backoff for delays');
});
