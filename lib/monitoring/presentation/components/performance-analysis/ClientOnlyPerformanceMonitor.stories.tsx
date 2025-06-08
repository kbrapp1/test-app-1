import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ClientOnlyPerformanceMonitor } from '@/lib/monitoring/presentation/components/performance-analysis/ClientOnlyPerformanceMonitor';

// Create a mock QueryClient for stories
const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });
};

// Wrapper component to provide QueryClient context
const QueryWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createMockQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const meta: Meta<typeof ClientOnlyPerformanceMonitor> = {
  title: 'Monitoring/Performance Analysis/ClientOnlyPerformanceMonitor',
  component: ClientOnlyPerformanceMonitor,
  decorators: [
    (Story: React.ComponentType) => (
      <QueryWrapper>
        <Story />
      </QueryWrapper>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A client-only performance monitoring component that dynamically loads performance monitoring tools in development mode. Requires React Query context.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isEnabled: {
      control: 'boolean',
      description: 'Whether performance monitoring is enabled',
      defaultValue: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isEnabled: true,
  },
};

export const WithMockData: Story = {
  args: {
    isEnabled: true,
  },
  decorators: [
    (Story: React.ComponentType) => {
      // Create a query client with some mock cached data
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 1000 * 60 * 5,
          },
        },
      });

      // Pre-populate with some mock queries
      queryClient.setQueryData(['user'], { id: 1, name: 'Test User' });
      queryClient.setQueryData(['dashboard'], { widgets: 5, performance: 'good' });

      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Component with a QueryClient that has some pre-cached data to demonstrate performance monitoring.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isEnabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component in disabled state - should render nothing as monitoring is turned off.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    isEnabled: true,
  },
  decorators: [
    (Story: React.ComponentType) => {
      // Create a query client with failed mutations
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 1000 * 60 * 5,
          },
        },
      });

      // Simulate some failed queries/mutations
      queryClient.setQueryData(['failed-query'], undefined);

      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Component in error scenario with QueryClient containing failed operations.',
      },
    },
  },
};
