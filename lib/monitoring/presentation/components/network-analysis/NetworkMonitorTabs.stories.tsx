import type { Meta, StoryObj } from '@storybook/react';
import { NetworkMonitorTabs } from '@/lib/monitoring/presentation/components/network-analysis/NetworkMonitorTabs';

const meta: Meta<typeof NetworkMonitorTabs> = {
  title: 'Monitoring/Network Analysis/NetworkMonitorTabs',
  component: NetworkMonitorTabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A monitoring component for network analysis.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Add specific prop controls here based on the component
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Add default props here
  },
};

export const WithMockData: Story = {
  args: {
    // Add mock data props here
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with sample monitoring data for demonstration.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    // Add loading state props here if component supports it
  },
  parameters: {
    docs: {
      description: {
        story: 'Component in loading state.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    // Add error state props here if component supports it
  },
  parameters: {
    docs: {
      description: {
        story: 'Component in error state.',
      },
    },
  },
};
