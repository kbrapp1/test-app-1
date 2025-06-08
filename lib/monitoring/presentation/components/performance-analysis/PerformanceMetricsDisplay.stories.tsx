import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceMetricsDisplay } from '@/lib/monitoring/presentation/components/performance-analysis/PerformanceMetricsDisplay';

const meta: Meta<typeof PerformanceMetricsDisplay> = {
  title: 'Monitoring/Performance Analysis/PerformanceMetricsDisplay',
  component: PerformanceMetricsDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A monitoring component for performance analysis.',
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
