import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceIssueSummary } from './PerformanceIssueSummary';
import { OptimizationGap } from '../../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../../domain/network-efficiency/value-objects/NetworkIssue';
import { CrossDomainInsight } from '../../../domain/cross-domain/services/PerformanceCorrelationService';

// Mock data for testing
const mockFrontendIssues: OptimizationGap[] = [
  new OptimizationGap(
    'memoization',
    'Component Re-renders',
    'Excessive re-renders detected in UserProfile component',
    'high',
    true
  )
];

const mockNetworkIssues: NetworkIssue[] = [
  new NetworkIssue(
    'redundancy',
    'Multiple duplicate requests',
    'API endpoint /api/users called multiple times unnecessarily',
    'medium',
    3,
    true
  )
];

const mockCrossDomainInsights: CrossDomainInsight[] = [
  {
    type: 'correlation',
    title: 'Database Query Optimization',
    description: 'Multiple N+1 queries detected affecting frontend performance',
    severity: 'high',
    domains: ['frontend', 'network'],
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
      type: 'optimization',
      title: 'Optimal Performance',
      description: 'All systems are running efficiently with no detected issues',
      severity: 'low',
      domains: ['frontend', 'network'],
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
