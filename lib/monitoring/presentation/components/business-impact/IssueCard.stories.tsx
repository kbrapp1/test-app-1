import type { Meta, StoryObj } from '@storybook/react';
import { IssueCard } from '@/lib/monitoring/presentation/components/business-impact/IssueCard';
import { UnifiedIssueDto } from '@/lib/monitoring/application/dto/UnifiedIssueDto';

// Mock data for testing
const mockHighSeverityIssue: UnifiedIssueDto = {
  title: 'Critical Performance Issue',
  description: 'High CPU usage detected across multiple components causing significant slowdowns.',
  severity: 'high',
  category: 'Cross-Domain',
  icon: '🚨',
  timestamp: Date.now(),
};

const mockMediumSeverityIssue: UnifiedIssueDto = {
  title: 'Memory Leak Detected',
  description: 'Component not properly cleaning up event listeners, causing gradual memory increase.',
  severity: 'medium',
  category: 'Frontend',
  icon: '⚠️',
  timestamp: Date.now() - 300000, // 5 minutes ago
};

const mockLowSeverityIssue: UnifiedIssueDto = {
  title: 'Suboptimal Network Usage',
  description: 'Multiple API calls could be batched together for better performance.',
  severity: 'low',
  category: 'Network',
  icon: '📊',
  timestamp: Date.now() - 900000, // 15 minutes ago
};

const meta: Meta<typeof IssueCard> = {
  title: 'Monitoring/Business Impact/IssueCard',
  component: IssueCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A card component for displaying monitoring issues with different severity levels and categories.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    issue: {
      description: 'The issue data to display',
      control: { type: 'object' },
    },
    index: {
      description: 'Index of the issue in a list',
      control: { type: 'number' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const HighSeverity: Story = {
  args: {
    issue: mockHighSeverityIssue,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Issue card displaying a high severity cross-domain issue.',
      },
    },
  },
};

export const MediumSeverity: Story = {
  args: {
    issue: mockMediumSeverityIssue,
    index: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Issue card displaying a medium severity frontend issue.',
      },
    },
  },
};

export const LowSeverity: Story = {
  args: {
    issue: mockLowSeverityIssue,
    index: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Issue card displaying a low severity network issue.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    issue: mockMediumSeverityIssue,
    index: 0,
  },
};
