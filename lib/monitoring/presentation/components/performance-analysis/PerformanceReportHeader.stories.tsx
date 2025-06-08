import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceReportHeader } from '@/lib/monitoring/presentation/components/performance-analysis/PerformanceReportHeader';
import { PerformanceMetrics } from '@/lib/monitoring/domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '@/lib/monitoring/application/dto/PerformanceTrackingDTO';
import { OptimizationGap } from '@/lib/monitoring/domain/value-objects/OptimizationGap';

// Mock data for stories
const createMockMetrics = (overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics => ({
  cacheSize: 18,
  activeMutations: 2,
  isOptimized: true,
  lastUpdate: new Date().toISOString(),
  webVitals: {
    LCP: 2300,
    CLS: 0.09,
    FCP: 1200,
    INP: 140,
    TTFB: 170,
  },
  ...overrides,
});

const createMockTrackingState = (overrides: Partial<PerformanceTrackingState> = {}): PerformanceTrackingState => ({
  renderMetrics: {
    count: 14,
    rapidCount: 4,
    lastReset: Date.now() - 12000,
  },
  cacheHitRate: 82.7,
  avgResponseTime: 135,
  webVitals: {
    LCP: 2300,
    CLS: 0.09,
    FCP: 1200,
    INP: 140,
    TTFB: 170,
  },
  pageContext: 'image-generator',
  ...overrides,
});

const mockOptimizations: OptimizationGap[] = [
  OptimizationGap.createMemoizationGap(20),
  OptimizationGap.createDebouncingGap(),
];

const meta: Meta<typeof PerformanceReportHeader> = {
  title: 'Monitoring/Performance Analysis/PerformanceReportHeader',
  component: PerformanceReportHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A performance report header component that displays frontend performance metrics and provides a copy button to export detailed performance reports.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    metrics: {
      description: 'Performance metrics including cache size, mutations, and web vitals',
    },
    trackingState: {
      description: 'Current tracking state with render metrics and performance data',
    },
    frontendOptimizations: {
      description: 'Array of frontend optimization gaps for the report',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    metrics: createMockMetrics(),
    trackingState: createMockTrackingState(),
    frontendOptimizations: [],
  },
};

export const WithMockData: Story = {
  args: {
    metrics: createMockMetrics({
      cacheSize: 32,
      activeMutations: 3,
      webVitals: {
        LCP: 1800,
        CLS: 0.05,
        FCP: 900,
        INP: 100,
        TTFB: 120,
      },
    }),
    trackingState: createMockTrackingState({
      renderMetrics: {
        count: 22,
        rapidCount: 8,
        lastReset: Date.now() - 25000,
      },
      cacheHitRate: 91.4,
      avgResponseTime: 98,
      pageContext: 'dam',
    }),
    frontendOptimizations: mockOptimizations,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with comprehensive sample data showing good performance metrics and some optimization opportunities.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    metrics: createMockMetrics({
      cacheSize: 5,
      activeMutations: 0,
      webVitals: {
        LCP: 0,
        CLS: 0,
      },
    }),
    trackingState: createMockTrackingState({
      renderMetrics: {
        count: 3,
        rapidCount: 0,
        lastReset: Date.now() - 1000,
      },
      cacheHitRate: 0,
      webVitals: {},
      pageContext: 'dashboard',
    }),
    frontendOptimizations: [OptimizationGap.createCachingGap()],
  },
  parameters: {
    docs: {
      description: {
        story: 'Component in loading state with minimal metrics and basic optimization suggestions.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    metrics: createMockMetrics({
      cacheSize: 8,
      activeMutations: 12,
      isOptimized: false,
      webVitals: {
        LCP: 5200,
        CLS: 0.48,
        FCP: 3800,
        INP: 450,
        TTFB: 2100,
      },
    }),
    trackingState: createMockTrackingState({
      renderMetrics: {
        count: 68,
        rapidCount: 35,
        lastReset: Date.now() - 60000,
      },
      cacheHitRate: 18.3,
      avgResponseTime: 3200,
      webVitals: {
        LCP: 5200,
        CLS: 0.48,
        FCP: 3800,
        INP: 450,
        TTFB: 2100,
      },
      pageContext: 'other',
    }),
    frontendOptimizations: [
      OptimizationGap.createMemoizationGap(68),
      OptimizationGap.createLazyLoadingGap(),
      OptimizationGap.createBatchingGap(),
      OptimizationGap.createRedundancyGap(),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Component showing poor performance state with high render counts, poor web vitals, and multiple optimization needs.',
      },
    },
  },
};
