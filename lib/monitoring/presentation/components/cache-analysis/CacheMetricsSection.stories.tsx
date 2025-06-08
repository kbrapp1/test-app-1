import type { Meta, StoryObj } from '@storybook/react';
import { CacheMetricsSection } from '@/lib/monitoring/presentation/components/cache-analysis/CacheMetricsSection';
import { PerformanceMetrics } from '@/lib/monitoring/domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '@/lib/monitoring/application/dto/PerformanceTrackingDTO';

// Mock data for different cache scenarios
const mockOptimizedMetrics: PerformanceMetrics = {
  cacheSize: 25.6, // MB
  activeMutations: 2,
  isOptimized: true,
  lastUpdate: new Date().toISOString(),
  webVitals: {
    CLS: 0.05,
    LCP: 1.8,
    FCP: 1.2,
    INP: 45,
    TTFB: 120,
  },
};

const mockUnoptimizedMetrics: PerformanceMetrics = {
  cacheSize: 45.8, // MB - larger cache
  activeMutations: 8, // more active mutations
  isOptimized: false,
  lastUpdate: new Date().toISOString(),
  webVitals: {
    CLS: 0.15,
    LCP: 3.2,
    FCP: 2.1,
    INP: 125,
    TTFB: 350,
  },
};

const mockHighPerformanceTracking: PerformanceTrackingState = {
  renderMetrics: {
    count: 145,
    rapidCount: 12,
    lastReset: Date.now() - 300000, // 5 minutes ago
  },
  cacheHitRate: 89.5, // High hit rate
  avgResponseTime: 125, // ms
  webVitals: {
    CLS: 0.05,
    LCP: 1.8,
    FCP: 1.2,
    INP: 45,
    TTFB: 120,
  },
  pageContext: 'dam',
};

const mockLowPerformanceTracking: PerformanceTrackingState = {
  renderMetrics: {
    count: 89,
    rapidCount: 35,
    lastReset: Date.now() - 600000, // 10 minutes ago
  },
  cacheHitRate: 62.3, // Lower hit rate
  avgResponseTime: 285, // ms - slower
  webVitals: {
    CLS: 0.15,
    LCP: 3.2,
    FCP: 2.1,
    INP: 125,
    TTFB: 350,
  },
  pageContext: 'image-generator',
};

const mockEmptyTracking: PerformanceTrackingState = {
  renderMetrics: {
    count: 0,
    rapidCount: 0,
    lastReset: Date.now(),
  },
  cacheHitRate: 0,
  avgResponseTime: 0,
  webVitals: {},
  pageContext: 'dashboard',
};

const meta: Meta<typeof CacheMetricsSection> = {
  title: 'Monitoring/Cache Analysis/CacheMetricsSection',
  component: CacheMetricsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A React Query cache metrics display showing cache size, hit rate, active mutations, and optimization status.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    metrics: {
      description: 'Performance metrics including cache data',
      control: { type: 'object' },
    },
    trackingState: {
      description: 'Current performance tracking state with cache hit rate',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Optimized: Story = {
  args: {
    metrics: mockOptimizedMetrics,
    trackingState: mockHighPerformanceTracking,
  },
  parameters: {
    docs: {
      description: {
        story: 'Cache metrics showing an optimized state with high hit rate and low mutations.',
      },
    },
  },
};

export const Unoptimized: Story = {
  args: {
    metrics: mockUnoptimizedMetrics,
    trackingState: mockLowPerformanceTracking,
  },
  parameters: {
    docs: {
      description: {
        story: 'Cache metrics showing an unoptimized state with lower hit rate and more mutations.',
      },
    },
  },
};

export const HighCacheActivity: Story = {
  args: {
    metrics: {
      ...mockOptimizedMetrics,
      activeMutations: 15,
      cacheSize: 38.2,
    },
    trackingState: {
      ...mockHighPerformanceTracking,
      cacheHitRate: 76.8,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Cache metrics during high activity with many active mutations.',
      },
    },
  },
};

export const EmptyCache: Story = {
  args: {
    metrics: {
      cacheSize: 0,
      activeMutations: 0,
      isOptimized: true,
      lastUpdate: new Date().toISOString(),
      webVitals: {},
    },
    trackingState: mockEmptyTracking,
  },
  parameters: {
    docs: {
      description: {
        story: 'Cache metrics when cache is empty or just initialized.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    metrics: mockOptimizedMetrics,
    trackingState: mockHighPerformanceTracking,
  },
};
