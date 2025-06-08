import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceQuickStats } from '@/lib/monitoring/presentation/components/performance-analysis/PerformanceQuickStats';
import { PerformanceTrackingState } from '@/lib/monitoring/application/dto/PerformanceTrackingDTO';
import { NetworkStats } from '@/lib/monitoring/domain/network-efficiency/entities/NetworkCall';

// Mock data for stories
const createMockFrontendState = (overrides: Partial<PerformanceTrackingState> = {}): PerformanceTrackingState => ({
  renderMetrics: {
    count: 12,
    rapidCount: 3,
    lastReset: Date.now() - 8000,
  },
  cacheHitRate: 78.5,
  avgResponseTime: 145,
  webVitals: {
    LCP: 2100,
    CLS: 0.06,
    FCP: 950,
    INP: 120,
    TTFB: 160,
  },
  pageContext: 'image-generator',
  ...overrides,
});

const createMockNetworkStats = (overrides: Partial<NetworkStats> = {}): NetworkStats => ({
  totalCalls: 25,
  redundantCalls: 3,
  redundancyRate: 12,
  sessionRedundancyRate: 8.5,
  persistentRedundantCount: 1,
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 15,
    'api-route': 8,
    'fetch': 2,
  },
  ...overrides,
});

const meta: Meta<typeof PerformanceQuickStats> = {
  title: 'Monitoring/Performance Analysis/PerformanceQuickStats',
  component: PerformanceQuickStats,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A quick stats component showing performance metrics including render counts, cache hit rates, API calls, and efficiency bars for frontend, network, and bundle performance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    frontendState: {
      description: 'Frontend performance tracking state with render metrics and cache data',
    },
    networkStats: {
      description: 'Network performance statistics including call counts and redundancy rates',
    },
    isPaused: {
      control: 'boolean',
      description: 'Whether performance monitoring is paused',
      defaultValue: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    frontendState: createMockFrontendState(),
    networkStats: createMockNetworkStats(),
    isPaused: false,
  },
};

export const WithMockData: Story = {
  args: {
    frontendState: createMockFrontendState({
      renderMetrics: {
        count: 18,
        rapidCount: 6,
        lastReset: Date.now() - 15000,
      },
      cacheHitRate: 92.3,
      pageContext: 'dam',
    }),
    networkStats: createMockNetworkStats({
      totalCalls: 45,
      redundantCalls: 8,
      redundancyRate: 17.8,
      callsByType: {
        'server-action': 28,
        'api-route': 12,
        'fetch': 5,
      },
    }),
    isPaused: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with comprehensive sample data showing higher activity levels and good cache performance.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    frontendState: createMockFrontendState({
      renderMetrics: {
        count: 2,
        rapidCount: 0,
        lastReset: Date.now() - 500,
      },
      cacheHitRate: 0,
      webVitals: {},
      pageContext: 'dashboard',
    }),
    networkStats: createMockNetworkStats({
      totalCalls: 3,
      redundantCalls: 0,
      redundancyRate: 0,
      callsByType: {
        'server-action': 2,
        'api-route': 1,
      },
    }),
    isPaused: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component in initial loading state with minimal activity and no cache data yet.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    frontendState: createMockFrontendState({
      renderMetrics: {
        count: 55,
        rapidCount: 25,
        lastReset: Date.now() - 45000,
      },
      cacheHitRate: 23.1,
      avgResponseTime: 2800,
      webVitals: {
        LCP: 4500,
        CLS: 0.42,
        FCP: 3200,
      },
      pageContext: 'other',
    }),
    networkStats: createMockNetworkStats({
      totalCalls: 120,
      redundantCalls: 45,
      redundancyRate: 37.5,
      sessionRedundancyRate: 42.8,
      persistentRedundantCount: 12,
      callsByType: {
        'server-action': 75,
        'api-route': 35,
        'fetch': 10,
      },
    }),
    isPaused: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component showing poor performance with high render counts, low cache hit rate, and significant network redundancy.',
      },
    },
  },
};
