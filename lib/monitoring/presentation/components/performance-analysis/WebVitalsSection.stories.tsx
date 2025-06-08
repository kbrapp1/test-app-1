import type { Meta, StoryObj } from '@storybook/react';
import { WebVitalsSection } from '@/lib/monitoring/presentation/components/performance-analysis/WebVitalsSection';
import { WebVitalsMetrics } from '@/lib/monitoring/domain/entities/PerformanceMetrics';

// Mock data for different Web Vitals performance scenarios
const excellentWebVitals: WebVitalsMetrics = {
  CLS: 0.05,   // Cumulative Layout Shift - Good: < 0.1
  LCP: 1.8,    // Largest Contentful Paint - Good: < 2.5s
  FCP: 1.2,    // First Contentful Paint - Good: < 1.8s
  INP: 45,     // Interaction to Next Paint - Good: < 200ms
  TTFB: 120,   // Time to First Byte - Good: < 800ms
};

const goodWebVitals: WebVitalsMetrics = {
  CLS: 0.08,   // Close to threshold
  LCP: 2.2,    // Good range
  FCP: 1.6,    // Good range
  INP: 150,    // Good range
  TTFB: 450,   // Good range
};

const needsImprovementWebVitals: WebVitalsMetrics = {
  CLS: 0.15,   // Needs Improvement: 0.1-0.25
  LCP: 3.2,    // Needs Improvement: 2.5-4.0s
  FCP: 2.1,    // Needs Improvement: 1.8-3.0s
  INP: 350,    // Needs Improvement: 200-500ms
  TTFB: 1200,  // Needs Improvement: 800-1800ms
};

const poorWebVitals: WebVitalsMetrics = {
  CLS: 0.35,   // Poor: > 0.25
  LCP: 4.8,    // Poor: > 4.0s
  FCP: 3.5,    // Poor: > 3.0s
  INP: 650,    // Poor: > 500ms
  TTFB: 2200,  // Poor: > 1800ms
};

const partialWebVitals: WebVitalsMetrics = {
  CLS: 0.08,
  LCP: 2.1,
  // FCP and INP missing - realistic scenario during data collection
  TTFB: 280,
};

const emptyWebVitals: WebVitalsMetrics = {
  // No metrics collected yet
};

const meta: Meta<typeof WebVitalsSection> = {
  title: 'Monitoring/Performance Analysis/WebVitalsSection',
  component: WebVitalsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A Web Vitals metrics display showing Core Web Vitals (CLS, LCP, FCP, INP, TTFB) with color-coded performance ratings.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    webVitals: {
      description: 'Web Vitals metrics object containing performance measurements',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Excellent: Story = {
  args: {
    webVitals: excellentWebVitals,
  },
  parameters: {
    docs: {
      description: {
        story: 'Web Vitals showing excellent performance across all Core Web Vitals metrics.',
      },
    },
  },
};

export const Good: Story = {
  args: {
    webVitals: goodWebVitals,
  },
  parameters: {
    docs: {
      description: {
        story: 'Web Vitals showing good performance within acceptable thresholds.',
      },
    },
  },
};

export const NeedsImprovement: Story = {
  args: {
    webVitals: needsImprovementWebVitals,
  },
  parameters: {
    docs: {
      description: {
        story: 'Web Vitals showing metrics that need improvement to meet performance standards.',
      },
    },
  },
};

export const Poor: Story = {
  args: {
    webVitals: poorWebVitals,
  },
  parameters: {
    docs: {
      description: {
        story: 'Web Vitals showing poor performance that requires immediate attention.',
      },
    },
  },
};

export const PartialData: Story = {
  args: {
    webVitals: partialWebVitals,
  },
  parameters: {
    docs: {
      description: {
        story: 'Web Vitals with only some metrics collected - realistic during data gathering.',
      },
    },
  },
};

export const Collecting: Story = {
  args: {
    webVitals: emptyWebVitals,
  },
  parameters: {
    docs: {
      description: {
        story: 'Web Vitals when no metrics have been collected yet - shows "Collecting metrics..." message.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    webVitals: goodWebVitals,
  },
};
