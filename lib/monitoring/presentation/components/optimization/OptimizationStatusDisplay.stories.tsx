import type { Meta, StoryObj } from '@storybook/react';
import { OptimizationStatusDisplay } from '@/lib/monitoring/presentation/components/optimization/OptimizationStatusDisplay';
import { PerformanceMetrics } from '@/lib/monitoring/domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '@/lib/monitoring/application/dto/PerformanceTrackingDTO';
import { OptimizationGap } from '@/lib/monitoring/domain/value-objects/OptimizationGap';

// Mock data for stories
const createMockMetrics = (overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics => ({
  cacheSize: 15,
  activeMutations: 1,
  isOptimized: true,
  lastUpdate: new Date().toISOString(),
  ...overrides,
});

const createMockTrackingState = (overrides: Partial<PerformanceTrackingState> = {}): PerformanceTrackingState => ({
  renderMetrics: {
    count: 8,
    rapidCount: 2,
    lastReset: Date.now() - 5000,
  },
  cacheHitRate: 85.5,
  avgResponseTime: 120,
  webVitals: {
    LCP: 2200,
    CLS: 0.08,
    FCP: 1100,
    INP: 150,
    TTFB: 180,
  },
  pageContext: 'image-generator',
  ...overrides,
});

const mockOptimizations: OptimizationGap[] = [
  OptimizationGap.createMemoizationGap(25),
  OptimizationGap.createDebouncingGap(),
];

const meta: Meta<typeof OptimizationStatusDisplay> = {
  title: 'Monitoring/Optimization/OptimizationStatusDisplay',
  component: OptimizationStatusDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive optimization status display showing performance metrics, tracking state, and missing optimizations for the current page context.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    metrics: {
      description: 'Performance metrics including cache size and active mutations',
    },
    trackingState: {
      description: 'Current tracking state with render metrics, cache hit rate, and web vitals',
    },
    missingOptimizations: {
      description: 'Array of optimization gaps that could improve performance',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    metrics: createMockMetrics(),
    trackingState: createMockTrackingState(),
    missingOptimizations: [],
  },
};

export const WithMockData: Story = {
  args: {
    metrics: createMockMetrics({
      cacheSize: 25,
      activeMutations: 2,
    }),
    trackingState: createMockTrackingState({
      renderMetrics: {
        count: 15,
        rapidCount: 5,
        lastReset: Date.now() - 10000,
      },
      cacheHitRate: 72.3,
      pageContext: 'dam',
    }),
    missingOptimizations: mockOptimizations,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with comprehensive sample data showing optimization status for DAM context with some missing optimizations.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    metrics: createMockMetrics({
      cacheSize: 0,
      activeMutations: 0,
    }),
    trackingState: createMockTrackingState({
      renderMetrics: {
        count: 1,
        rapidCount: 0,
        lastReset: Date.now() - 100,
      },
      cacheHitRate: 0,
      webVitals: {},
      pageContext: 'dashboard',
    }),
    missingOptimizations: [OptimizationGap.createCachingGap()],
  },
  parameters: {
    docs: {
      description: {
        story: 'Component in loading state with minimal metrics and a caching optimization gap.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    metrics: createMockMetrics({
      cacheSize: 5,
      activeMutations: 8,
      isOptimized: false,
    }),
    trackingState: createMockTrackingState({
      renderMetrics: {
        count: 45,
        rapidCount: 20,
        lastReset: Date.now() - 30000,
      },
      cacheHitRate: 15.2,
      avgResponseTime: 2500,
      webVitals: {
        LCP: 4200,
        CLS: 0.35,
        FCP: 3100,
      },
      pageContext: 'other',
    }),
    missingOptimizations: [
      OptimizationGap.createMemoizationGap(45),
      OptimizationGap.createLazyLoadingGap(),
      OptimizationGap.createBatchingGap(),
      OptimizationGap.createRedundancyGap(),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Component showing poor performance state with high render counts, low cache hit rate, and multiple missing optimizations.',
      },
    },
  },
};
