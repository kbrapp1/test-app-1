import { describe, it, expect } from 'vitest';
import { 
  detectActionFromPatterns, 
  DAM_ACTION_PATTERNS, 
  addCustomActionPattern,
  updateActionPattern 
} from '../NetworkMonitorConfig';

describe('NetworkMonitorConfig', () => {
  describe('detectActionFromPatterns', () => {
    it('should detect upload actions correctly', () => {
      expect(detectActionFromPatterns('/api/dam/upload', 'POST')).toBe('Upload Asset');
      expect(detectActionFromPatterns('/api/v2/assets/create', 'POST')).toBe('Upload Asset');
      expect(detectActionFromPatterns('/dam/asset/new', 'POST')).toBe('Upload Asset');
      expect(detectActionFromPatterns('/api/asset/123', 'GET')).toBeNull(); // Wrong method
    });

    it('should detect search actions correctly', () => {
      expect(detectActionFromPatterns('/api/dam/search?q=test', 'GET')).toBe('Search');
      expect(detectActionFromPatterns('/dam/search', 'POST')).toBe('Search');
      expect(detectActionFromPatterns('/api/v1/search/assets', 'GET')).toBe('Search');
    });

    it('should detect folder navigation correctly', () => {
      expect(detectActionFromPatterns('/api/dam/folders/123', 'GET')).toBe('Navigate Folder');
      expect(detectActionFromPatterns('/dam/folders', 'GET')).toBe('Navigate Folder');
      expect(detectActionFromPatterns('/api/navigation/folder', 'GET')).toBe('Navigate Folder');
    });

    it('should respect method restrictions', () => {
      expect(detectActionFromPatterns('/api/saved-searches', 'POST')).toBe('Save Search');
      expect(detectActionFromPatterns('/api/saved-searches', 'GET')).toBeNull(); // Wrong method for Save Search
      
      expect(detectActionFromPatterns('/api/bulk-delete', 'POST')).toBe('Bulk Operations');
      expect(detectActionFromPatterns('/api/bulk-delete', 'GET')).toBeNull(); // Wrong method
    });

    it('should handle regex patterns correctly', () => {
      expect(detectActionFromPatterns('/api/v1/assets/create', 'POST')).toBe('Upload Asset');
      expect(detectActionFromPatterns('/api/v2/assets/upload', 'POST')).toBe('Upload Asset');
      expect(detectActionFromPatterns('/api/v1/search', 'GET')).toBe('Search');
      expect(detectActionFromPatterns('/api/v2/tags', 'GET')).toBe('Filter');
    });

    it('should return null for unmatched patterns', () => {
      expect(detectActionFromPatterns('/api/unknown/endpoint', 'GET')).toBeNull();
      expect(detectActionFromPatterns('/some/random/url', 'POST')).toBeNull();
    });
  });

  describe('addCustomActionPattern', () => {
    it('should add new action patterns', () => {
      const originalLength = DAM_ACTION_PATTERNS.length;
      
      addCustomActionPattern({
        name: 'AI Analysis',
        urlPatterns: ['/api/ai/analyze'],
        methods: ['POST'],
        description: 'AI-powered analysis'
      });

      expect(DAM_ACTION_PATTERNS).toHaveLength(originalLength + 1);
      expect(detectActionFromPatterns('/api/ai/analyze', 'POST')).toBe('AI Analysis');
    });
  });

  describe('updateActionPattern', () => {
    it('should update existing patterns', () => {
      updateActionPattern('Upload Asset', ['/api/new-upload-endpoint']);
      expect(detectActionFromPatterns('/api/new-upload-endpoint', 'POST')).toBe('Upload Asset');
    });

    it('should handle non-existent patterns gracefully', () => {
      expect(() => {
        updateActionPattern('Non Existent Action', ['/api/test']);
      }).not.toThrow();
    });
  });

  describe('pattern coverage', () => {
    it('should have patterns for common DAM operations', () => {
      const actionNames = DAM_ACTION_PATTERNS.map(p => p.name);
      
      expect(actionNames).toContain('Upload Asset');
      expect(actionNames).toContain('Search');
      expect(actionNames).toContain('Navigate Folder');
      expect(actionNames).toContain('Filter');
      expect(actionNames).toContain('Download');
      expect(actionNames).toContain('Save Search');
    });

    it('should have descriptions for all patterns', () => {
      DAM_ACTION_PATTERNS.forEach(pattern => {
        expect(pattern.description).toBeTruthy();
        expect(pattern.description.length).toBeGreaterThan(5);
      });
    });

    it('should have at least one URL pattern per action', () => {
      DAM_ACTION_PATTERNS.forEach(pattern => {
        expect(pattern.urlPatterns.length).toBeGreaterThan(0);
      });
    });
  });
}); 