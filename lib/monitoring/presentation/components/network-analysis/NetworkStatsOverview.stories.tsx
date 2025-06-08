import type { Meta, StoryObj } from '@storybook/react';
import { NetworkStatsOverview } from '@/lib/monitoring/presentation/components/network-analysis/NetworkStatsOverview';
import { NetworkStats } from '@/lib/monitoring/domain/network-efficiency/entities/NetworkCall';

// Mock data for different network performance scenarios
const excellentNetworkStats: NetworkStats = {
  totalCalls: 85,
  redundantCalls: 0,
  redundancyRate: 0.0,
  sessionRedundancyRate: 0.0,
  persistentRedundantCount: 0,
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 20,
    'api-route': 45,
    'fetch': 15,
    'xhr': 5,
  },
};

const goodNetworkStats: NetworkStats = {
  totalCalls: 150,
  redundantCalls: 3,
  redundancyRate: 2.0,
  sessionRedundancyRate: 1.8,
  persistentRedundantCount: 5,
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 35,
    'api-route': 85,
    'fetch': 25,
    'xhr': 5,
  },
};

const moderateNetworkStats: NetworkStats = {
  totalCalls: 220,
  redundantCalls: 15,
  redundancyRate: 6.8,
  sessionRedundancyRate: 7.2,
  persistentRedundantCount: 18,
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 45,
    'api-route': 120,
    'fetch': 40,
    'xhr': 15,
  },
};

const poorNetworkStats: NetworkStats = {
  totalCalls: 180,
  redundantCalls: 35,
  redundancyRate: 19.4,
  sessionRedundancyRate: 22.1,
  persistentRedundantCount: 42,
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 30,
    'api-route': 95,
    'fetch': 35,
    'xhr': 20,
  },
};

const criticalNetworkStats: NetworkStats = {
  totalCalls: 200,
  redundantCalls: 75,
  redundancyRate: 37.5,
  sessionRedundancyRate: 35.8,
  persistentRedundantCount: 89,
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 40,
    'api-route': 100,
    'fetch': 45,
    'xhr': 15,
  },
};

const freshSessionStats: NetworkStats = {
  totalCalls: 12,
  redundantCalls: 0,
  redundancyRate: 0.0,
  sessionRedundancyRate: 0.0,
  persistentRedundantCount: 0,
  recentCalls: [],
  redundantPatterns: [],
  callsByType: {
    'server-action': 3,
    'api-route': 6,
    'fetch': 2,
    'xhr': 1,
  },
};

const meta: Meta<typeof NetworkStatsOverview> = {
  title: 'Monitoring/Network Analysis/NetworkStatsOverview',
  component: NetworkStatsOverview,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A network statistics overview displaying key metrics in an interactive card grid. Shows total calls, active issues, session totals, and network efficiency with visual indicators and animations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    stats: {
      description: 'Network statistics object containing call counts, redundancy metrics, and efficiency data',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Excellent: Story = {
  args: {
    stats: excellentNetworkStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Excellent network performance with no redundant calls (100% efficiency). All cards show optimal metrics with green trending indicators.',
      },
    },
  },
};

export const Good: Story = {
  args: {
    stats: goodNetworkStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Good network performance with minimal redundancy (98.2% efficiency). Minor issues detected but overall healthy performance.',
      },
    },
  },
};

export const Moderate: Story = {
  args: {
    stats: moderateNetworkStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Moderate network performance with noticeable redundancy (92.8% efficiency). Yellow indicators show room for improvement.',
      },
    },
  },
};

export const Poor: Story = {
  args: {
    stats: poorNetworkStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Poor network performance with significant redundancy (77.9% efficiency). Red alert indicators show issues requiring attention.',
      },
    },
  },
};

export const Critical: Story = {
  args: {
    stats: criticalNetworkStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical network performance with severe redundancy (64.2% efficiency). Animated pulse alerts indicate urgent optimization needed.',
      },
    },
  },
};

export const FreshSession: Story = {
  args: {
    stats: freshSessionStats,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fresh session with minimal activity (12 total calls). Shows baseline metrics for a newly started monitoring session.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    stats: goodNetworkStats,
  },
};
