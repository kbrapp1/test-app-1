import type { Meta, StoryObj } from '@storybook/react';
import { RenderMetricsSection } from '@/lib/monitoring/presentation/components/performance-analysis/RenderMetricsSection';
import { PerformanceTrackingState } from '@/lib/monitoring/application/dto/PerformanceTrackingDTO';

// Mock data for different render performance scenarios
const excellentPerformanceTracking: PerformanceTrackingState = {
  renderMetrics: {
    count: 12,
    rapidCount: 2,
    lastReset: Date.now() - 300000, // 5 minutes ago
  },
  cacheHitRate: 92.5,
  avgResponseTime: 85, // Fast response
  webVitals: {
    CLS: 0.05,
    LCP: 1.8,
    FCP: 1.2,
    INP: 45,
    TTFB: 120,
  },
  pageContext: 'dam',
};

const goodPerformanceTracking: PerformanceTrackingState = {
  renderMetrics: {
    count: 28,
    rapidCount: 8,
    lastReset: Date.now() - 600000, // 10 minutes ago
  },
  cacheHitRate: 85.2,
  avgResponseTime: 145, // Good response time
  webVitals: {
    CLS: 0.08,
    LCP: 2.2,
    FCP: 1.6,
    INP: 120,
    TTFB: 180,
  },
  pageContext: 'image-generator',
};

const moderatePerformanceTracking: PerformanceTrackingState = {
  renderMetrics: {
    count: 45,
    rapidCount: 18,
    lastReset: Date.now() - 900000, // 15 minutes ago
  },
  cacheHitRate: 76.8,
  avgResponseTime: 285, // Moderate response time
  webVitals: {
    CLS: 0.12,
    LCP: 3.1,
    FCP: 2.0,
    INP: 200,
    TTFB: 350,
  },
  pageContext: 'dashboard',
};

const heavyRenderTracking: PerformanceTrackingState = {
  renderMetrics: {
    count: 89,
    rapidCount: 45,
    lastReset: Date.now() - 1200000, // 20 minutes ago
  },
  cacheHitRate: 65.4,
  avgResponseTime: 420, // Slow response time
  webVitals: {
    CLS: 0.18,
    LCP: 4.2,
    FCP: 2.8,
    INP: 350,
    TTFB: 580,
  },
  pageContext: 'team',
};

const freshSessionTracking: PerformanceTrackingState = {
  renderMetrics: {
    count: 1,
    rapidCount: 0,
    lastReset: Date.now() - 30000, // 30 seconds ago
  },
  cacheHitRate: 100,
  avgResponseTime: 65, // Very fast - first load
  webVitals: {
    CLS: 0.02,
    LCP: 1.5,
    FCP: 0.9,
    INP: 25,
    TTFB: 95,
  },
  pageContext: 'settings',
};

const meta: Meta<typeof RenderMetricsSection> = {
  title: 'Monitoring/Performance Analysis/RenderMetricsSection',
  component: RenderMetricsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A render performance metrics display showing render count and average response time. Provides insights into component re-rendering frequency and network responsiveness.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    trackingState: {
      description: 'Performance tracking state containing render metrics and response times',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ExcellentPerformance: Story = {
  args: {
    trackingState: excellentPerformanceTracking,
  },
  parameters: {
    docs: {
      description: {
        story: 'Excellent performance with minimal renders (12) and fast response time (85ms).',
      },
    },
  },
};

export const GoodPerformance: Story = {
  args: {
    trackingState: goodPerformanceTracking,
  },
  parameters: {
    docs: {
      description: {
        story: 'Good performance with moderate renders (28) and acceptable response time (145ms).',
      },
    },
  },
};

export const ModeratePerformance: Story = {
  args: {
    trackingState: moderatePerformanceTracking,
  },
  parameters: {
    docs: {
      description: {
        story: 'Moderate performance with higher renders (45) and slower response time (285ms).',
      },
    },
  },
};

export const HeavyRendering: Story = {
  args: {
    trackingState: heavyRenderTracking,
  },
  parameters: {
    docs: {
      description: {
        story: 'Heavy rendering scenario with many renders (89) and slow response time (420ms) indicating performance issues.',
      },
    },
  },
};

export const FreshSession: Story = {
  args: {
    trackingState: freshSessionTracking,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fresh session with minimal activity (1 render) and optimal response time (65ms).',
      },
    },
  },
};

export const Default: Story = {
  args: {
    trackingState: goodPerformanceTracking,
  },
};
