import type { Meta, StoryObj } from '@storybook/react';
import { NetworkAlertSection } from '@/lib/monitoring/presentation/components/network-analysis/NetworkAlertSection';
import { NetworkStats } from '@/lib/monitoring/domain/network-efficiency/entities/NetworkCall';

// Mock data for different network alert scenarios
const criticalRedundancyStats: NetworkStats = {
  totalCalls: 150,
  redundantCalls: 45,
  redundancyRate: 30.0,
  sessionRedundancyRate: 28.5,
  persistentRedundantCount: 12, // Triggers alert display
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 25,
    'api-route': 85,
    'fetch': 30,
    'xhr': 10,
  },
};

const moderateRedundancyStats: NetworkStats = {
  totalCalls: 200,
  redundantCalls: 20,
  redundancyRate: 10.0,
  sessionRedundancyRate: 9.2,
  persistentRedundantCount: 6, // Triggers alert display
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 35,
    'api-route': 120,
    'fetch': 35,
    'xhr': 10,
  },
};

const lowRedundancyStats: NetworkStats = {
  totalCalls: 180,
  redundantCalls: 5,
  redundancyRate: 2.8,
  sessionRedundancyRate: 3.1,
  persistentRedundantCount: 2, // Triggers alert display
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 40,
    'api-route': 100,
    'fetch': 30,
    'xhr': 10,
  },
};

const noRedundancyStats: NetworkStats = {
  totalCalls: 120,
  redundantCalls: 0,
  redundancyRate: 0.0,
  sessionRedundancyRate: 0.0,
  persistentRedundantCount: 1, // Still triggers display for positive message
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 30,
    'api-route': 70,
    'fetch': 15,
    'xhr': 5,
  },
};

const hiddenAlertStats: NetworkStats = {
  totalCalls: 95,
  redundantCalls: 0,
  redundancyRate: 0.0,
  sessionRedundancyRate: 0.0,
  persistentRedundantCount: 0, // No alert displayed
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 20,
    'api-route': 50,
    'fetch': 20,
    'xhr': 5,
  },
};

const meta: Meta<typeof NetworkAlertSection> = {
  title: 'Monitoring/Network Analysis/NetworkAlertSection',
  component: NetworkAlertSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'An alert component that displays network redundancy warnings or success messages based on network call statistics. Shows destructive alerts for redundant calls and positive feedback for optimal performance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    stats: {
      description: 'Network statistics including redundancy metrics',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CriticalRedundancy: Story = {
  args: {
    stats: criticalRedundancyStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Alert showing critical network redundancy (30% redundancy rate) requiring immediate attention.',
      },
    },
  },
};

export const ModerateRedundancy: Story = {
  args: {
    stats: moderateRedundancyStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Alert showing moderate network redundancy (10% redundancy rate) that should be investigated.',
      },
    },
  },
};

export const LowRedundancy: Story = {
  args: {
    stats: lowRedundancyStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Alert showing low network redundancy (2.8% redundancy rate) with minor optimization opportunities.',
      },
    },
  },
};

export const NoRedundancy: Story = {
  args: {
    stats: noRedundancyStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Positive alert showing excellent network performance with no redundant calls detected.',
      },
    },
  },
};

export const Hidden: Story = {
  args: {
    stats: hiddenAlertStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'No alert displayed when persistentRedundantCount is 0 - component returns null.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    stats: moderateRedundancyStats,
  },
};
