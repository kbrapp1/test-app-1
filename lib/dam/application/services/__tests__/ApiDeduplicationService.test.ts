/**
 * ApiDeduplicationService Tests
 * 
 * Verifies that the service prevents redundant Server Action calls
 * as detected by NetworkCallMonitor analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiDeduplicationService } from '../ApiDeduplicationService';

describe('ApiDeduplicationService', () => {
  let service: ApiDeduplicationService;

  beforeEach(() => {
    service = new ApiDeduplicationService();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  describe('Basic Deduplication', () => {
    it('should execute action once for identical calls', async () => {
      const mockAction = vi.fn().mockResolvedValue('result');
      
      // Make two identical calls rapidly
      const promise1 = service.deduplicateServerAction('testAction', ['param1'], mockAction);
      const promise2 = service.deduplicateServerAction('testAction', ['param1'], mockAction);
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should allow calls with different parameters', async () => {
      const mockAction = vi.fn()
        .mockResolvedValueOnce('result1')
        .mockResolvedValueOnce('result2');
      
      const promise1 = service.deduplicateServerAction('testAction', ['param1'], mockAction);
      const promise2 = service.deduplicateServerAction('testAction', ['param2'], mockAction);
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(mockAction).toHaveBeenCalledTimes(2);
    });

    it('should allow calls after timeout window', async () => {
      const mockAction = vi.fn()
        .mockResolvedValueOnce('result1')
        .mockResolvedValueOnce('result2');
      
      // First call
      const result1 = await service.deduplicateServerAction('testAction', ['param1'], mockAction, 500);
      
      // Advance time beyond timeout window
      vi.advanceTimersByTime(600);
      
      // Second call with same parameters
      const result2 = await service.deduplicateServerAction('testAction', ['param1'], mockAction, 500);
      
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(mockAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('DAM Specific Cases', () => {
    it('should deduplicate getRootFolders calls', async () => {
      const mockGetRootFolders = vi.fn().mockResolvedValue([{ id: '1', name: 'Folder 1' }]);
      
      // Simulate rapid folder sidebar loading
      const calls = [
        service.deduplicateServerAction('getRootFolders', [], mockGetRootFolders),
        service.deduplicateServerAction('getRootFolders', [], mockGetRootFolders),
        service.deduplicateServerAction('getRootFolders', [], mockGetRootFolders)
      ];
      
      const results = await Promise.all(calls);
      
      expect(results).toHaveLength(3);
      expect(results.every((r: any) => Array.isArray(r) && r.length === 1)).toBe(true);
      expect(mockGetRootFolders).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate folder navigation calls', async () => {
      const mockNavigation = vi.fn().mockResolvedValue({ breadcrumbs: [] });
      
      // Simulate rapid navigation to same folder
      const folderId = 'folder-123';
      const calls = [
        service.deduplicateServerAction('getFolderNavigation', [folderId], mockNavigation),
        service.deduplicateServerAction('getFolderNavigation', [folderId], mockNavigation)
      ];
      
      await Promise.all(calls);
      
      expect(mockNavigation).toHaveBeenCalledTimes(1);
    });

    it('should allow different folder navigation calls', async () => {
      const mockNavigation = vi.fn()
        .mockResolvedValueOnce({ breadcrumbs: [{ id: 'folder1', name: 'Folder 1' }] })
        .mockResolvedValueOnce({ breadcrumbs: [{ id: 'folder2', name: 'Folder 2' }] });
      
      const calls = [
        service.deduplicateServerAction('getFolderNavigation', ['folder1'], mockNavigation),
        service.deduplicateServerAction('getFolderNavigation', ['folder2'], mockNavigation)
      ];
      
      const results = await Promise.all(calls);
      
      expect((results[0] as any).breadcrumbs[0].id).toBe('folder1');
      expect((results[1] as any).breadcrumbs[0].id).toBe('folder2');
      expect(mockNavigation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Monitoring', () => {
    it('should track pending request count', async () => {
      const slowAction = () => new Promise(resolve => {
        vi.advanceTimersByTime(100);
        resolve('done');
      });
      
      expect(service.getPendingCount()).toBe(0);
      
      const promise = service.deduplicateServerAction('slowAction', [], slowAction);
      expect(service.getPendingCount()).toBe(1);
      
      await promise;
      expect(service.getPendingCount()).toBe(0);
    });

    it('should clear all pending requests', () => {
      const slowAction = () => new Promise(resolve => {
        vi.advanceTimersByTime(100);
        resolve('done');
      });
      
      service.deduplicateServerAction('slowAction', [], slowAction);
      expect(service.getPendingCount()).toBe(1);
      
      service.clear();
      expect(service.getPendingCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from actions', async () => {
      const errorAction = vi.fn().mockRejectedValue(new Error('Action failed'));
      
      await expect(
        service.deduplicateServerAction('errorAction', [], errorAction)
      ).rejects.toThrow('Action failed');
      
      expect(errorAction).toHaveBeenCalledTimes(1);
    });

    it('should clean up after errors', async () => {
      const errorAction = vi.fn().mockRejectedValue(new Error('Action failed'));
      
      try {
        await service.deduplicateServerAction('errorAction', [], errorAction);
      } catch {
        // Ignore error
      }
      
      expect(service.getPendingCount()).toBe(0);
    });
  });
}); 