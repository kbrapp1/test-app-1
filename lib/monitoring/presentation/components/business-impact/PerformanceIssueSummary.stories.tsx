import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceIssueSummary } from '@/lib/monitoring/presentation/components/business-impact/PerformanceIssueSummary';

// Mock data for testing
const mockFrontendIssues = [
  {
    impactArea: 'Component Re-renders',
    description: 'Excessive re-renders detected in UserProfile component',
    severity: 'high' as const,
    recommendation: 'Use React.memo() or useMemo for optimization',
    businessImpact: 'Poor user experience, increased CPU usage',
  }
];

const mockNetworkIssues = [
  {
    requestPath: '/api/users',
    issue: 'Multiple duplicate requests',
    severity: 'medium' as const,
    recommendation: 'Implement request deduplication',
    businessImpact: 'Increased server load and slower response times',
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
  }
];

const meta: Meta<typeof PerformanceIssueSummary> = {
  title: 'Monitoring/Business Impact/PerformanceIssueSummary',
  component: PerformanceIssueSummary,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive summary component displaying performance issues across frontend, network, and cross-domain areas.',
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
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIssues: Story = {
  args: {
    frontendIssues: mockFrontendIssues,
    networkIssues: mockNetworkIssues,
    crossDomainInsights: mockCrossDomainInsights,
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance summary showing multiple issues across different domains.',
      },
    },
  },
};

export const NoIssues: Story = {
  args: {
    frontendIssues: [],
    networkIssues: [],
    crossDomainInsights: [{
      title: 'Optimal Performance',
      description: 'All systems are running efficiently with no detected issues',
      severity: 'low' as const,
      category: 'Positive Insight' as const,
      recommendation: 'Maintain current optimization strategies',
      businessImpact: 'Excellent user experience and system performance',
    }],
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance summary when no issues are detected - shows positive feedback.',
      },
    },
  },
};

export const FrontendIssuesOnly: Story = {
  args: {
    frontendIssues: mockFrontendIssues,
    networkIssues: [],
    crossDomainInsights: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance summary showing only frontend-related issues.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    frontendIssues: mockFrontendIssues,
    networkIssues: mockNetworkIssues,
    crossDomainInsights: mockCrossDomainInsights,
  },
};
