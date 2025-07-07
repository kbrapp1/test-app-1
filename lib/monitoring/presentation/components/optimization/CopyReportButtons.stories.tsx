import type { Meta, StoryObj } from '@storybook/react';
import { CopyReportButtons } from './CopyReportButtons';
import { useState } from 'react';
import { OptimizationGap } from '../../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../../domain/network-efficiency/value-objects/NetworkIssue';

// Mock data for different types of issues
const mockFrontendIssues: OptimizationGap[] = [
  new OptimizationGap(
    'memoization',
    'Component Re-renders',
    'Excessive re-renders detected in UserProfile component',
    'high',
    false
  ),
  new OptimizationGap(
    'lazy-loading',
    'Bundle Size',
    'Large bundle detected for user dashboard',
    'medium',
    true
  )
];

const mockNetworkIssues: NetworkIssue[] = [
  NetworkIssue.createRedundancyIssue(5),
  NetworkIssue.createSlowResponseIssue(2500)
];

const mockCrossDomainInsights = [
  {
    type: 'correlation' as const,
    title: 'Database Query Optimization',
    description: 'Multiple N+1 queries detected affecting frontend performance',
    severity: 'high' as const,
    domains: ['frontend', 'network'] as ('frontend' | 'network')[],
  },
  {
    type: 'cascade' as const,
    title: 'Cache Miss Rate High',
    description: 'Frontend components fetching uncached backend data',
    severity: 'medium' as const,
    domains: ['frontend', 'network'] as ('frontend' | 'network')[],
  }
];

const mockMetrics = {
  cacheSize: 150,
  activeMutations: 3,
  isOptimized: false,
  lastUpdate: new Date().toISOString(),
  webVitals: {
    CLS: 0.1,
    LCP: 2.3,
    FCP: 1.2,
    INP: 8,
    TTFB: 150,
  },
};

const mockTrackingState = {
  renderMetrics: {
    count: 25,
    rapidCount: 8,
    lastReset: Date.now() - 30000,
  },
  cacheHitRate: 0.75,
  avgResponseTime: 1200,
  webVitals: {
    CLS: 0.1,
    LCP: 2.3,
    FCP: 1.2,
    INP: 8,
    TTFB: 150,
  },
  pageContext: 'dam' as const,
};

// Component wrapper to handle state
const CopyReportButtonsWithState = (props: any) => {
  const [copyButtonState, setCopyButtonState] = useState({
    frontend: 'default' as const,
    crossDomain: 'default' as const,
    backend: 'default' as const,
  });

  return (
    <CopyReportButtons
      {...props}
      copyButtonState={copyButtonState}
      onCopyStateChange={setCopyButtonState}
    />
  );
};

const meta: Meta<typeof CopyReportButtons> = {
  title: 'Monitoring/Optimization/CopyReportButtons',
  component: CopyReportButtonsWithState,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A set of buttons for copying performance reports to clipboard. Shows buttons for Frontend (FE), Cross-Domain (CD), and Backend (BE) reports based on available issues.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    frontendIssues: {
      description: 'Array of frontend optimization gaps',
      control: { type: 'object' },
    },
    networkIssues: {
      description: 'Array of network performance issues',
      control: { type: 'object' },
    },
    crossDomainInsights: {
      description: 'Array of cross-domain performance insights',
      control: { type: 'object' },
    },
    metrics: {
      description: 'Performance metrics data',
      control: { type: 'object' },
    },
    trackingState: {
      description: 'Current performance tracking state',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllButtonsVisible: Story = {
  args: {
    frontendIssues: mockFrontendIssues,
    networkIssues: mockNetworkIssues,
    crossDomainInsights: mockCrossDomainInsights,
    metrics: mockMetrics,
    trackingState: mockTrackingState,
  },
  parameters: {
    docs: {
      description: {
        story: 'All three report buttons visible when issues exist in all categories.',
      },
    },
  },
};

export const FrontendOnly: Story = {
  args: {
    frontendIssues: mockFrontendIssues,
    networkIssues: [],
    crossDomainInsights: [],
    metrics: mockMetrics,
    trackingState: mockTrackingState,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only Frontend (FE) button visible when only frontend issues exist.',
      },
    },
  },
};

export const NetworkOnly: Story = {
  args: {
    frontendIssues: [],
    networkIssues: mockNetworkIssues,
    crossDomainInsights: [],
    metrics: mockMetrics,
    trackingState: mockTrackingState,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only Backend (BE) button visible when only network issues exist.',
      },
    },
  },
};

export const CrossDomainOnly: Story = {
  args: {
    frontendIssues: [],
    networkIssues: [],
    crossDomainInsights: mockCrossDomainInsights,
    metrics: mockMetrics,
    trackingState: mockTrackingState,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only Cross-Domain (CD) button visible when only cross-domain issues exist.',
      },
    },
  },
};

export const NoIssues: Story = {
  args: {
    frontendIssues: [],
    networkIssues: [],
    crossDomainInsights: [],
    metrics: mockMetrics,
    trackingState: mockTrackingState,
  },
  parameters: {
    docs: {
      description: {
        story: 'No buttons visible when no issues exist.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    frontendIssues: mockFrontendIssues,
    networkIssues: mockNetworkIssues,
    crossDomainInsights: mockCrossDomainInsights,
    metrics: mockMetrics,
    trackingState: mockTrackingState,
  },
};
