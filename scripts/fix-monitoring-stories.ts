#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import path from 'path';

const storyFilesToFix = [
  'lib/monitoring/presentation/components/cache-analysis/CacheMetricsSection.stories.tsx',
  'lib/monitoring/presentation/components/error/MonitoringErrorBoundary.stories.tsx',
  'lib/monitoring/presentation/components/network-analysis/NetworkStatsOverview.stories.tsx',
  'lib/monitoring/presentation/components/optimization/CopyReportButtons.stories.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceMonitor.stories.tsx',
];

// Generic mock data that can be used for most monitoring components
const genericMockData = {
  // Basic props that many components might need
  isLoading: false,
  hasError: false,
  data: {
    metrics: {
      totalRequests: 1250,
      avgResponseTime: 145,
      errorRate: 0.02,
      cacheHitRate: 0.85,
    },
    performance: {
      firstContentfulPaint: 1.2,
      largestContentfulPaint: 2.3,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 8,
    },
    network: {
      totalBytes: 2.5 * 1024 * 1024, // 2.5MB
      cachedBytes: 1.8 * 1024 * 1024, // 1.8MB  
      requests: 45,
      duplicateRequests: 3,
    }
  }
};

function generateImprovedStoryContent(componentPath: string): string {
  const componentName = path.basename(componentPath, '.tsx');
  const category = getStoryCategory(componentPath);
  const importPath = componentPath.replace('.stories.tsx', '').replace(/\\/g, '/');
  
  return `import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from '@/${importPath}';

const meta: Meta<typeof ${componentName}> = {
  title: '${category}/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A monitoring component for ${category.toLowerCase().replace('monitoring/', '')}.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Component will render with default/empty state
  },
};

export const WithData: Story = {
  args: {
    // Add realistic props based on component type
    ...getMockPropsForComponent('${componentName}'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Component displaying sample monitoring data.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component in loading state.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    data: null,
    // or empty array/object depending on component
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with no data to display.',
      },
    },
  },
};

// Helper function to provide mock data based on component type
function getMockPropsForComponent(componentName: string) {
  const baseData = ${JSON.stringify(genericMockData, null, 2)};

  switch (componentName) {
    case 'CacheMetricsSection':
      return {
        metrics: baseData.data.metrics,
        cacheStats: {
          hitRate: baseData.data.metrics.cacheHitRate,
          missRate: 1 - baseData.data.metrics.cacheHitRate,
          totalSize: '45.2 MB',
          availableSize: '108.8 MB',
        }
      };
      
    case 'NetworkStatsOverview':
      return {
        networkData: baseData.data.network,
        requestMetrics: baseData.data.metrics,
      };
      
    case 'PerformanceMonitor':
      return {
        metrics: baseData.data.performance,
        isTracking: true,
      };
      
    case 'MonitoringErrorBoundary':
      return {
        children: 'Content that renders successfully',
        fallback: 'Error occurred while monitoring',
      };
      
    case 'CopyReportButtons':
      return {
        reportData: {
          frontend: baseData.data.performance,
          network: baseData.data.network,
          backend: baseData.data.metrics,
        }
      };
      
    default:
      return baseData.data;
  }
}
`;
}

function getStoryCategory(filePath: string): string {
  if (filePath.includes('/bundle-analysis/')) return 'Monitoring/Bundle Analysis';
  if (filePath.includes('/business-impact/')) return 'Monitoring/Business Impact';
  if (filePath.includes('/cache-analysis/')) return 'Monitoring/Cache Analysis';
  if (filePath.includes('/error/')) return 'Monitoring/Error';
  if (filePath.includes('/network-analysis/')) return 'Monitoring/Network Analysis';
  if (filePath.includes('/optimization/')) return 'Monitoring/Optimization';
  if (filePath.includes('/performance-analysis/')) return 'Monitoring/Performance Analysis';
  if (filePath.includes('/providers/')) return 'Monitoring/Providers';
  if (filePath.includes('/infrastructure/')) return 'Monitoring/Infrastructure';
  return 'Monitoring/Other';
}

async function fixStoryFile(storyPath: string): Promise<void> {
  try {
    const storyContent = generateImprovedStoryContent(storyPath);
    await fs.writeFile(storyPath, storyContent, 'utf8');
    console.log(`✅ Fixed story: ${storyPath}`);
  } catch (error) {
    console.log(`❌ Failed to fix story: ${storyPath} - ${error}`);
  }
}

async function fixAllStories(): Promise<void> {
  console.log('🔧 Fixing monitoring component stories with better mock data...\n');
  
  let fixed = 0;
  let failed = 0;
  
  for (const storyPath of storyFilesToFix) {
    try {
      await fixStoryFile(storyPath);
      fixed++;
    } catch (error) {
      console.log(`❌ Failed to fix: ${storyPath}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Fixed: ${fixed} story files`);
  console.log(`❌ Failed: ${failed} files`);
  console.log(`\n🚀 Refresh Storybook to see the improved stories!`);
}

// Run the script
fixAllStories().catch(console.error); 