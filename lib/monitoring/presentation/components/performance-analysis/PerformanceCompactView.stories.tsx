import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceCompactView } from '@/lib/monitoring/presentation/components/performance-analysis/PerformanceCompactView';
import { OptimizationGap } from '@/lib/monitoring/domain/value-objects/OptimizationGap';
import { NetworkIssue } from '@/lib/monitoring/domain/network-efficiency/value-objects/NetworkIssue';

// Mock data for stories
const mockFrontendIssues: OptimizationGap[] = [
  OptimizationGap.createMemoizationGap(15),
  OptimizationGap.createDebouncingGap(),
];

const mockNetworkIssues: NetworkIssue[] = [
  NetworkIssue.createRedundancyIssue(3),
  NetworkIssue.createSlowResponseIssue(1200),
];

const mockHighSeverityIssues: OptimizationGap[] = [
  OptimizationGap.createMemoizationGap(35),
  OptimizationGap.createLazyLoadingGap(),
];

const mockCriticalNetworkIssues: NetworkIssue[] = [
  NetworkIssue.createRedundancyIssue(8),
  NetworkIssue.createFailedRequestIssue(5),
  NetworkIssue.createHighVolumeIssue(25),
];

const meta: Meta<typeof PerformanceCompactView> = {
  title: 'Monitoring/Performance Analysis/PerformanceCompactView',
  component: PerformanceCompactView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A compact floating performance view that shows overall score and issue counts for frontend and network performance. Displays as a floating button with expansion capability.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    overallScore: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Overall performance score (0-100)',
    },
    frontendIssues: {
      description: 'Array of frontend optimization issues',
    },
    networkIssues: {
      description: 'Array of network performance issues',
    },
    onExpand: {
      description: 'Callback function when expand button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    overallScore: 85,
    frontendIssues: [],
    networkIssues: [],
    onExpand: () => console.log('expand-clicked'),
  },
};

export const WithMockData: Story = {
  args: {
    overallScore: 72,
    frontendIssues: mockFrontendIssues,
    networkIssues: mockNetworkIssues,
    onExpand: () => console.log('expand-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with moderate performance score and some frontend and network issues.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    overallScore: 95,
    frontendIssues: [],
    networkIssues: [],
    onExpand: () => console.log('expand-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Component showing excellent performance with no issues detected.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    overallScore: 45,
    frontendIssues: mockHighSeverityIssues,
    networkIssues: mockCriticalNetworkIssues,
    onExpand: () => console.log('expand-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Component showing poor performance with multiple high-severity frontend and network issues.',
      },
    },
  },
};
