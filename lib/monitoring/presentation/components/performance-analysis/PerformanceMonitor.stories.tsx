import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PerformanceQuickStats } from '@/lib/monitoring/presentation/components/performance-analysis/PerformanceQuickStats';
import { PerformanceIssueSummary } from '@/lib/monitoring/presentation/components/business-impact/PerformanceIssueSummary';
import { PerformanceMetricsDisplay } from '@/lib/monitoring/presentation/components/performance-analysis/PerformanceMetricsDisplay';
import { NetworkDetailsContent } from '@/lib/monitoring/presentation/components/network-analysis/NetworkDetailsContent';
import { BundleDetailsContent } from '@/lib/monitoring/presentation/components/bundle-analysis/BundleDetailsContent';
import { PerformanceCompactView } from '@/lib/monitoring/presentation/components/performance-analysis/PerformanceCompactView';

import { PerformanceMetrics } from '@/lib/monitoring/domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '@/lib/monitoring/application/dto/PerformanceTrackingDTO';
import { NetworkStats } from '@/lib/monitoring/domain/network-efficiency/entities/NetworkCall';
import { OptimizationGap } from '@/lib/monitoring/domain/value-objects/OptimizationGap';
import { NetworkIssue } from '@/lib/monitoring/domain/network-efficiency/value-objects/NetworkIssue';

// Mock data creation functions
const createMockMetrics = (scenario: 'good' | 'issues' | 'optimal' = 'good'): PerformanceMetrics => ({
  cacheSize: scenario === 'issues' ? 6 : scenario === 'optimal' ? 32 : 15,
  activeMutations: scenario === 'issues' ? 8 : scenario === 'optimal' ? 0 : 2,
  isOptimized: scenario !== 'issues',
  lastUpdate: new Date().toISOString(),
  webVitals: {
    LCP: scenario === 'issues' ? 4200 : scenario === 'optimal' ? 1800 : 2100,
    CLS: scenario === 'issues' ? 0.25 : scenario === 'optimal' ? 0.02 : 0.05,
    INP: scenario === 'issues' ? 400 : scenario === 'optimal' ? 80 : 120,
    TTFB: scenario === 'issues' ? 1200 : scenario === 'optimal' ? 300 : 400,
    FCP: scenario === 'issues' ? 3500 : scenario === 'optimal' ? 1200 : 1500,
  },
});

const createMockTrackingState = (scenario: 'good' | 'issues' | 'optimal' = 'good'): PerformanceTrackingState => ({
  renderMetrics: {
    count: scenario === 'issues' ? 45 : scenario === 'optimal' ? 3 : 8,
    rapidCount: scenario === 'issues' ? 12 : scenario === 'optimal' ? 0 : 1,
    lastReset: Date.now() - 5000,
  },
  cacheHitRate: scenario === 'issues' ? 45.2 : scenario === 'optimal' ? 95.8 : 85.2,
  avgResponseTime: scenario === 'issues' ? 850 : scenario === 'optimal' ? 120 : 150,
  webVitals: {
    LCP: scenario === 'issues' ? 4200 : scenario === 'optimal' ? 1800 : 2100,
    CLS: scenario === 'issues' ? 0.25 : scenario === 'optimal' ? 0.02 : 0.05,
    INP: scenario === 'issues' ? 400 : scenario === 'optimal' ? 80 : 120,
    TTFB: scenario === 'issues' ? 1200 : scenario === 'optimal' ? 300 : 400,
  },
  pageContext: 'dashboard',
});

const createMockNetworkStats = (scenario: 'good' | 'issues' | 'optimal' = 'good'): NetworkStats => ({
  totalCalls: scenario === 'issues' ? 35 : scenario === 'optimal' ? 5 : 12,
  redundantCalls: scenario === 'issues' ? 16 : scenario === 'optimal' ? 0 : 2,
  redundancyRate: scenario === 'issues' ? 45.2 : scenario === 'optimal' ? 0 : 15.5,
  sessionRedundancyRate: scenario === 'issues' ? 38.1 : scenario === 'optimal' ? 0 : 10.2,
  persistentRedundantCount: scenario === 'issues' ? 5 : scenario === 'optimal' ? 0 : 1,
  recentCalls: [],
  redundantPatterns: [],
  callsByType: { 'api-route': 8, 'fetch': 4 },
});

const mockFrontendIssues = {
  good: [OptimizationGap.createMemoizationGap(8)],
  issues: [
    OptimizationGap.createMemoizationGap(15),
    OptimizationGap.createDebouncingGap(),
  ],
  optimal: [],
};

const mockNetworkIssues = {
  good: [NetworkIssue.createRedundancyIssue(2)],
  issues: [
    NetworkIssue.createRedundancyIssue(5),
    NetworkIssue.createRedundancyIssue(3),
  ],
  optimal: [],
};

const mockBundleStats = {
  good: {
    averagePerformanceScore: 78,
    totalModules: 24,
    lazyLoadingCoverage: 65,
    criticalPathOptimized: true,
    totalCacheHitRatio: 85.2,
    recommendations: ['Consider lazy loading more components'],
  },
  issues: {
    averagePerformanceScore: 45,
    totalModules: 56,
    lazyLoadingCoverage: 25,
    criticalPathOptimized: false,
    totalCacheHitRatio: 42.1,
    recommendations: ['Critical path needs optimization', 'Enable lazy loading', 'Reduce bundle size'],
  },
  optimal: {
    averagePerformanceScore: 95,
    totalModules: 18,
    lazyLoadingCoverage: 90,
    criticalPathOptimized: true,
    totalCacheHitRatio: 98.5,
    recommendations: ['Excellent performance!'],
  },
};

// Expandable Section Component
const ExpandableSection = ({ 
  title, 
  icon, 
  score, 
  isExpanded, 
  onToggle, 
  children 
}: {
  title: string;
  icon: string;
  score: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border rounded-lg">
    <button
      onClick={onToggle}
      className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`px-2 py-1 rounded text-xs ${
          score >= 90 ? 'bg-green-100 text-green-800' :
          score >= 70 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {score}
        </div>
        <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </div>
    </button>
    {isExpanded && (
      <div className="px-3 pb-3 border-t bg-gray-50">
        {children}
      </div>
    )}
  </div>
);

// Dashboard Header Component
const DashboardHeader = ({ 
  overallScore, 
  onCollapse 
}: { 
  overallScore: number; 
  onCollapse: () => void; 
}) => (
  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600">⚡</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          <p className="text-xs text-gray-600">Real-time performance tracking</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full font-medium ${
          overallScore >= 90 ? 'bg-green-100 text-green-800' :
          overallScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          Score: {overallScore}
        </div>
        <button
          onClick={onCollapse}
          className="w-6 h-6 rounded hover:bg-gray-200 flex items-center justify-center text-gray-400"
        >
          ×
        </button>
      </div>
    </div>
  </div>
);

// Dashboard Actions Component
const DashboardActions = ({ lastUpdate }: { lastUpdate: number }) => (
  <div className="border-t pt-3 space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-xs">Last update: {new Date(lastUpdate).toLocaleTimeString()}</span>
      <div className="flex gap-2">
        <button className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200">
          Reset
        </button>
        <button className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200">
          Export
        </button>
      </div>
    </div>
  </div>
);

// Complete Performance Dashboard Component
const CompletePerformanceDashboard = ({ 
  scenario = 'good',
  isCompact = false,
}: { 
  scenario?: 'good' | 'issues' | 'optimal';
  isCompact?: boolean;
}) => {
  const [expandedSections, setExpandedSections] = useState({
    frontend: true,
    network: false,
    bundle: false,
  });
  
  const [compactMode, setCompactMode] = useState(isCompact);

  const metrics = createMockMetrics(scenario);
  const trackingState = createMockTrackingState(scenario);
  const networkStats = createMockNetworkStats(scenario);
  const frontendIssues = mockFrontendIssues[scenario];
  const networkIssues = mockNetworkIssues[scenario];
  const bundleStats = mockBundleStats[scenario];

  const overallScore = scenario === 'issues' ? 45 : scenario === 'optimal' ? 98 : 82;
  const frontendScore = scenario === 'issues' ? 52 : scenario === 'optimal' ? 95 : 78;
  const networkScore = scenario === 'issues' ? 55 : scenario === 'optimal' ? 100 : 85;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Compact view
  if (compactMode) {
    return (
      <div className="fixed bottom-4 right-4">
        <PerformanceCompactView
          overallScore={overallScore}
          frontendIssues={frontendIssues}
          networkIssues={networkIssues}
          onExpand={() => setCompactMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-[460px] max-h-[85vh] shadow-xl bg-white border flex flex-col">
        <DashboardHeader
          overallScore={overallScore}
          onCollapse={() => setCompactMode(true)}
        />
        
        {/* Page Context */}
        <div className="px-6 pb-2 pt-2">
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full border inline-block">
            📍 {trackingState.pageContext}
          </div>
        </div>
        
        <CardContent className="space-y-4 text-xs overflow-y-auto pb-4 flex-1 min-h-0">
          <PerformanceIssueSummary 
            frontendIssues={frontendIssues}
            networkIssues={networkIssues}
            crossDomainInsights={[]}
            metrics={metrics}
            trackingState={trackingState}
          />

          <PerformanceQuickStats 
            frontendState={trackingState}
            networkStats={networkStats}
            isPaused={false}
          />

          <ExpandableSection
            title="Frontend Details"
            icon="⚡"
            score={frontendScore}
            isExpanded={expandedSections.frontend}
            onToggle={() => toggleSection('frontend')}
          >
            <PerformanceMetricsDisplay 
              metrics={metrics} 
              trackingState={trackingState}
              frontendOptimizations={frontendIssues}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Network Details"
            icon="🌐"
            score={networkScore}
            isExpanded={expandedSections.network}
            onToggle={() => toggleSection('network')}
          >
            <NetworkDetailsContent 
              networkStats={networkStats}
              networkScore={networkScore}
              isPaused={false}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Bundle Details"
            icon="📦"
            score={bundleStats.averagePerformanceScore}
            isExpanded={expandedSections.bundle}
            onToggle={() => toggleSection('bundle')}
          >
            <BundleDetailsContent 
              bundleStats={bundleStats}
              bundleScore={bundleStats.averagePerformanceScore}
              isPaused={false}
            />
          </ExpandableSection>

          <DashboardActions lastUpdate={Date.now()} />
        </CardContent>
      </Card>
    </div>
  );
};

const meta: Meta<typeof CompletePerformanceDashboard> = {
  title: 'Monitoring/Performance Analysis/PerformanceMonitor',
  component: CompletePerformanceDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete performance monitoring dashboard with all sections: header, issue summary, quick stats, expandable frontend/network/bundle details, and dashboard actions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    scenario: {
      control: { type: 'select' },
      options: ['good', 'issues', 'optimal'],
      description: 'Performance scenario to display',
    },
    isCompact: {
      control: { type: 'boolean' },
      description: 'Start in compact mode',
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ height: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '8px' }}>
          <h2>Complete Performance Dashboard</h2>
          <p>This shows the full performance monitoring dashboard with all sections:</p>
          <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
            <li>• Dashboard header with overall score</li>
            <li>• Performance issue summary</li>
            <li>• Quick stats overview</li>
            <li>• Expandable frontend details section</li>
            <li>• Expandable network details section</li>
            <li>• Expandable bundle details section</li>
            <li>• Dashboard actions (reset, export)</li>
          </ul>
          <p><strong>Try:</strong> Change the scenario or toggle compact mode in the controls below.</p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteDashboard: Story = {
  args: {
    scenario: 'good',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete performance dashboard with all sections expanded, showing good performance with minor optimization opportunities.',
      },
    },
  },
};

export const PerformanceIssues: Story = {
  args: {
    scenario: 'issues',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard showing multiple performance issues - high render count, network problems, poor cache performance, and bundle optimization needs.',
      },
    },
  },
};

export const OptimalPerformance: Story = {
  args: {
    scenario: 'optimal',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard showing optimal performance - all metrics in excellent range across all sections.',
      },
    },
  },
};

export const CompactView: Story = {
  args: {
    scenario: 'good',
    isCompact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact view of the performance monitor. Click the expand button to see the full dashboard.',
      },
    },
  },
};
