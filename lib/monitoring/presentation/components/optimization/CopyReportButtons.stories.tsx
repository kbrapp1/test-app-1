import type { Meta, StoryObj } from '@storybook/react';
import { CopyReportButtons } from '@/lib/monitoring/presentation/components/optimization/CopyReportButtons';
import { useState } from 'react';

// Mock data for different types of issues
const mockFrontendIssues = [
  {
    impactArea: 'Component Re-renders',
    description: 'Excessive re-renders detected in UserProfile component',
    severity: 'high' as const,
    recommendation: 'Use React.memo() or useMemo for optimization',
    businessImpact: 'Poor user experience, increased CPU usage',
  },
  {
    impactArea: 'Bundle Size',
    description: 'Large bundle detected for user dashboard',
    severity: 'medium' as const,
    recommendation: 'Implement code splitting and lazy loading',
    businessImpact: 'Slower initial page load times',
  }
];

const mockNetworkIssues = [
  {
    requestPath: '/api/users',
    issue: 'Multiple duplicate requests',
    severity: 'medium' as const,
    recommendation: 'Implement request deduplication',
    businessImpact: 'Increased server load and slower response times',
  },
  {
    requestPath: '/api/assets',
    issue: 'Large payload without compression',
    severity: 'high' as const,
    recommendation: 'Enable gzip compression',
    businessImpact: 'Slow data transfer and increased bandwidth costs',
  }
];

const mockCrossDomainInsights = [
  {
    title: 'Database Query Optimization',
    description: 'Multiple N+1 queries detected affecting frontend performance',
    severity: 'high' as const,
    category: 'Backend Impact' as const,
    recommendation: 'Implement batch loading for related data',
    businessImpact: 'Slow page loads affecting user engagement',
  },
  {
    title: 'Cache Miss Rate High',
    description: 'Frontend components fetching uncached backend data',
    severity: 'medium' as const,
    category: 'Cross-Domain' as const,
    recommendation: 'Implement better cache strategy',
    businessImpact: 'Increased server load and response times',
  }
];

const mockMetrics = {
  firstContentfulPaint: 1.2,
  largestContentfulPaint: 2.3,
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 8,
  totalBlockingTime: 150,
  timeToInteractive: 2.8,
};

const mockTrackingState = {
  pageContext: 'dam' as const,
  isTracking: true,
  startTime: Date.now() - 30000, // 30 seconds ago
  metrics: mockMetrics,
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
