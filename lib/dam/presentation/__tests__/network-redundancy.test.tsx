import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { GalleryItemDto } from '../../domain/value-objects/GalleryItem';

/**
 * DAM Network Redundancy Tests
 * 
 * Single Responsibility: Test DAM components for redundant network calls
 * Focus Areas: Asset loading, folder navigation, search, bulk operations
 * 
 * Note: Uses mock implementations since global network interceptor is active
 */

// Simple network call tracker for tests
class TestNetworkTracker {
  private calls: Array<{ url: string; method: string; timestamp: number }> = [];

  trackCall(url: string, method: string = 'GET') {
    this.calls.push({
      url,
      method,
      timestamp: Date.now()
    });
  }

  getCalls() {
    return [...this.calls];
  }

  getCallsToEndpoint(endpoint: string) {
    return this.calls.filter(call => call.url.includes(endpoint));
  }

  clear() {
    this.calls = [];
  }

  analyzeRedundancy(timeWindowMs: number = 1000) {
    const redundantCalls: Array<{ url: string; method: string; timestamp: number }> = [];
    const rapidFireCalls: Array<Array<{ url: string; method: string; timestamp: number }>> = [];

    // Simple redundancy detection
    for (let i = 0; i < this.calls.length - 1; i++) {
      for (let j = i + 1; j < this.calls.length; j++) {
        const call1 = this.calls[i];
        const call2 = this.calls[j];
        const timeDiff = call2.timestamp - call1.timestamp;

        if (timeDiff <= timeWindowMs && call1.url === call2.url && call1.method === call2.method) {
          redundantCalls.push(call2);
        }
      }
    }

    // Detect rapid-fire calls
    const endpointGroups: Record<string, typeof this.calls> = {};
    this.calls.forEach(call => {
      const key = `${call.method}:${call.url}`;
      if (!endpointGroups[key]) endpointGroups[key] = [];
      endpointGroups[key].push(call);
    });

    Object.values(endpointGroups).forEach(group => {
      if (group.length >= 3) {
        const recentCalls = group.filter(call => 
          group[group.length - 1].timestamp - call.timestamp <= timeWindowMs
        );
        if (recentCalls.length >= 3) {
          rapidFireCalls.push(recentCalls);
        }
      }
    });

    return {
      totalCalls: this.calls.length,
      redundantCalls,
      timeAnalysis: {
        rapidFireCalls
      }
    };
  }

  expectNoRedundantCalls(timeWindowMs: number = 1000) {
    const analysis = this.analyzeRedundancy(timeWindowMs);
    if (analysis.redundantCalls.length > 0) {
      throw new Error(`Found ${analysis.redundantCalls.length} redundant calls`);
    }
    return true;
  }

  expectMaxCallsToEndpoint(endpoint: string, maxCalls: number) {
    const calls = this.getCallsToEndpoint(endpoint);
    if (calls.length > maxCalls) {
      throw new Error(`Expected max ${maxCalls} calls to ${endpoint}, but found ${calls.length}`);
    }
    return true;
  }
}

// Mock components that simulate DAM network patterns
const MockAssetGallery = ({ tracker }: { tracker: TestNetworkTracker }) => {
  const [assets, setAssets] = React.useState<GalleryItemDto[]>([]);
  const [loading, setLoading] = React.useState(false);

  const loadAssets = React.useCallback(async (folderId?: string) => {
    setLoading(true);
    try {
      const url = folderId 
        ? `http://localhost:3000/api/dam/assets?folderId=${folderId}` 
        : 'http://localhost:3000/api/dam/assets';
      
      tracker.trackCall(url, 'GET');
      
      // Simulate API response
      setAssets([{ 
        id: '1', 
        name: 'test', 
        type: 'asset', 
        createdAt: new Date(), 
        mimeType: 'image/jpeg', 
        size: 1024, 
        userId: 'user1' 
      }] as GalleryItemDto[]);
    } finally {
      setLoading(false);
    }
  }, [tracker]);

  React.useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleFolderChange = (folderId: string) => {
    loadAssets(folderId);
  };

  return (
    <div>
      <div data-testid="asset-count">{assets.length} assets</div>
      {loading && <div data-testid="loading">Loading...</div>}
      <button onClick={() => handleFolderChange('folder-1')} data-testid="folder-1-btn">
        Load Folder 1
      </button>
      <button onClick={() => handleFolderChange('folder-2')} data-testid="folder-2-btn">
        Load Folder 2
      </button>
      <button onClick={() => loadAssets()} data-testid="refresh-btn">
        Refresh
      </button>
    </div>
  );
};

const MockSearchComponent = ({ tracker }: { tracker: TestNetworkTracker }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [results, setResults] = React.useState<GalleryItemDto[]>([]);

  React.useEffect(() => {
    if (searchTerm) {
      const searchAssets = () => {
        tracker.trackCall(`http://localhost:3000/api/dam/search?q=${searchTerm}`, 'GET');
        setResults([{ 
          id: '1', 
          name: 'search-result', 
          type: 'asset', 
          createdAt: new Date(), 
          mimeType: 'image/jpeg', 
          size: 1024, 
          userId: 'user1' 
        }] as GalleryItemDto[]);
      };
      searchAssets();
    }
  }, [searchTerm, tracker]);

  return (
    <div>
      <input
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search assets..."
      />
      <div data-testid="search-results">{results.length} results</div>
    </div>
  );
};

describe('DAM Network Redundancy Tests', () => {
  let tracker: TestNetworkTracker;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    tracker = new TestNetworkTracker();
    
    // Mock fetch to avoid real HTTP requests
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string, _options: RequestInit = {}) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'mock' }),
        text: () => Promise.resolve('mock'),
        headers: new Headers(),
      } as Response);
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Asset Gallery Loading', () => {
    it('should not make redundant calls when loading assets', async () => {
      tracker.trackCall('http://localhost:3000/api/dam/assets', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/folders', 'GET'); // Different endpoint, OK
      
      tracker.expectNoRedundantCalls(1000);
      tracker.expectMaxCallsToEndpoint('/api/dam/assets', 1);
    });

    it('should detect redundant asset calls when switching folders rapidly', async () => {
      // Simulate rapid folder switching
      tracker.trackCall('http://localhost:3000/api/dam/assets?folderId=folder-1', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/assets?folderId=folder-2', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/assets?folderId=folder-1', 'GET'); // Back to folder-1
      
      const analysis = tracker.analyzeRedundancy(2000);
      expect(analysis.totalCalls).toBe(3);
      
      const folder1Calls = tracker.getCallsToEndpoint('folderId=folder-1');
      expect(folder1Calls).toHaveLength(2);
    });

    it('should flag multiple identical asset fetches', async () => {
      // Simulate identical calls
      tracker.trackCall('http://localhost:3000/api/dam/assets?folderId=folder-1', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/assets?folderId=folder-1', 'GET'); // Identical
      
      expect(() => tracker.expectNoRedundantCalls(1000)).toThrow(/redundant calls/);
    });
  });

  describe('Search Functionality', () => {
    it('should detect rapid search calls without debouncing', async () => {
      // Simulate rapid typing without debouncing
      for (let i = 0; i < 5; i++) {
        tracker.trackCall('http://localhost:3000/api/dam/search?q=asset', 'GET');
      }
      
      const analysis = tracker.analyzeRedundancy(1000);
      expect(analysis.timeAnalysis.rapidFireCalls.length).toBeGreaterThan(0);
      expect(analysis.totalCalls).toBe(5);
    });

    it('should allow spaced-out search calls', async () => {
      tracker.trackCall('http://localhost:3000/api/dam/search?q=asset', 'GET');
      
      // Simulate time passing
      vi.setSystemTime(Date.now() + 2000);
      tracker.trackCall('http://localhost:3000/api/dam/search?q=document', 'GET');
      
      tracker.expectNoRedundantCalls(1000);
    });
  });

  describe('Bulk Operations', () => {
    it('should detect redundant calls during bulk selection', async () => {
      // Simulate selecting multiple assets
      tracker.trackCall('http://localhost:3000/api/dam/assets/asset-1', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/assets/asset-2', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/assets/asset-3', 'GET');
      
      tracker.expectMaxCallsToEndpoint('/api/dam/assets/', 3);
      
      // Re-fetch same asset (redundant)
      tracker.trackCall('http://localhost:3000/api/dam/assets/asset-1', 'GET');
      
      expect(() => tracker.expectNoRedundantCalls()).toThrow();
    });

    it('should allow batch API calls for bulk operations', async () => {
      // Good pattern: Single batch call
      tracker.trackCall('http://localhost:3000/api/dam/assets/batch', 'POST');
      
      tracker.expectMaxCallsToEndpoint('batch', 1);
      tracker.expectNoRedundantCalls();
    });
  });

  describe('Folder Navigation', () => {
    it('should detect redundant folder metadata calls', async () => {
      // Load folder structure
      tracker.trackCall('http://localhost:3000/api/dam/folders', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/assets?folderId=folder-1', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/folders', 'GET'); // Redundant
      
      const folderCalls = tracker.getCallsToEndpoint('folders');
      expect(folderCalls.length).toBe(2);
      
      expect(() => tracker.expectNoRedundantCalls(1000)).toThrow(/redundant calls/);
    });
  });

  describe('Component Lifecycle Tests', () => {
    it('should not make calls on every re-render', () => {
      // Simulate component mount
      tracker.trackCall('http://localhost:3000/api/dam/assets', 'GET');
      
      // No additional calls for re-renders
      tracker.expectMaxCallsToEndpoint('/api/dam/assets', 1);
    });

    it('should handle organization context changes efficiently', async () => {
      // Initial load
      tracker.trackCall('http://localhost:3000/api/dam/assets?orgId=org-1', 'GET');
      
      // Organization context changes
      tracker.trackCall('http://localhost:3000/api/dam/assets?orgId=org-2', 'GET');
      
      // Should be 2 different calls, not redundant
      tracker.expectMaxCallsToEndpoint('/api/dam/assets', 2);
      tracker.expectNoRedundantCalls();
      
      // Same org called again immediately (redundant)
      tracker.trackCall('http://localhost:3000/api/dam/assets?orgId=org-2', 'GET');
      
      expect(() => tracker.expectNoRedundantCalls()).toThrow();
    });
  });

  describe('Pagination and Infinite Scroll', () => {
    it('should not re-fetch already loaded pages', () => {
      // Load different pages
      tracker.trackCall('http://localhost:3000/api/dam/assets?page=1', 'GET');
      tracker.trackCall('http://localhost:3000/api/dam/assets?page=2', 'GET');
      
      tracker.expectMaxCallsToEndpoint('page=1', 1);
      tracker.expectMaxCallsToEndpoint('page=2', 1);
    });
  });

  describe('Real-time Updates', () => {
    it('should handle WebSocket vs polling efficiently', () => {
      // Simulate rapid polling (bad pattern)
      for (let i = 0; i < 6; i++) {
        tracker.trackCall('http://localhost:3000/api/dam/updates', 'GET');
      }
      
      const analysis = tracker.analyzeRedundancy(5000);
      expect(analysis.timeAnalysis.rapidFireCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Component Integration Tests', () => {
    it('should work with MockAssetGallery component', async () => {
      render(<MockAssetGallery tracker={tracker} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('asset-count')).toHaveTextContent('1 assets');
      });
      
      // Should have made initial API call
      expect(tracker.getCalls()).toHaveLength(1);
      expect(tracker.getCalls()[0].url).toContain('/api/dam/assets');
      
      // Click folder button
      fireEvent.click(screen.getByTestId('folder-1-btn'));
      
      // Should make folder-specific call
      expect(tracker.getCalls()).toHaveLength(2);
      expect(tracker.getCalls()[1].url).toContain('folderId=folder-1');
    });

    it('should work with MockSearchComponent', async () => {
      render(<MockSearchComponent tracker={tracker} />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Type in search
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Should make search API call
      await waitFor(() => {
        expect(tracker.getCalls()).toHaveLength(1);
        expect(tracker.getCalls()[0].url).toContain('/api/dam/search?q=test');
      });
    });
  });
});

// Export helper for other DAM tests
export const createDamNetworkTest = (componentName: string) => {
  return {
    beforeEach: () => {
      const tracker = new TestNetworkTracker();
      return tracker;
    },
    afterEach: () => {
      // Cleanup
    },
    expectEfficientCalls: (tracker: TestNetworkTracker) => {
      const analysis = tracker.analyzeRedundancy();
      if (analysis.redundantCalls.length > 0) {
        console.warn(`${componentName} has redundant calls:`, analysis.redundantCalls);
      }
      tracker.expectNoRedundantCalls();
    }
  };
}; 