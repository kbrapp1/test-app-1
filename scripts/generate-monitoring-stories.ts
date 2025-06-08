#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import path from 'path';

// List of all monitoring TSX files from the search results
const monitoringComponents = [
  'lib/monitoring/infrastructure/development/ReactScanIntegration.tsx',
  'lib/monitoring/presentation/components/bundle-analysis/BundleAnalysisPanel.tsx',
  'lib/monitoring/presentation/components/bundle-analysis/BundleDetailsContent.tsx',
  'lib/monitoring/presentation/components/business-impact/IssueCard.tsx',
  'lib/monitoring/presentation/components/business-impact/PerformanceIssueSummary.tsx',
  'lib/monitoring/presentation/components/cache-analysis/CacheMetricsSection.tsx',
  'lib/monitoring/presentation/components/error/MonitoringErrorBoundary.tsx',
  'lib/monitoring/presentation/components/network-analysis/NetworkAlertSection.tsx',
  'lib/monitoring/presentation/components/network-analysis/NetworkDetailsContent.tsx',
  'lib/monitoring/presentation/components/network-analysis/NetworkMonitorContainer.tsx',
  'lib/monitoring/presentation/components/network-analysis/NetworkMonitorHeader.tsx',
  'lib/monitoring/presentation/components/network-analysis/NetworkMonitorTabs.tsx',
  'lib/monitoring/presentation/components/network-analysis/NetworkMonitorWidget.tsx',
  'lib/monitoring/presentation/components/network-analysis/NetworkStatsOverview.tsx',
  'lib/monitoring/presentation/components/optimization/CopyReportButtons.tsx',
  'lib/monitoring/presentation/components/optimization/OptimizationStatusDisplay.tsx',
  'lib/monitoring/presentation/components/performance-analysis/ClientOnlyPerformanceMonitor.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceCompactView.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceDashboardAdvanced.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceDashboardHeader.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceExpandableSection.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceMetricsDisplay.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceMonitor.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceMonitorGateway.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceQuickStats.tsx',
  'lib/monitoring/presentation/components/performance-analysis/PerformanceReportHeader.tsx',
  'lib/monitoring/presentation/components/performance-analysis/RenderMetricsSection.tsx',
  'lib/monitoring/presentation/components/performance-analysis/WebVitalsSection.tsx',
  'lib/monitoring/presentation/providers/performance-analysis/PerformanceMonitorProvider.tsx',
];

function getComponentName(filePath: string): string {
  return path.basename(filePath, '.tsx');
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

function generateStoryContent(filePath: string): string {
  const componentName = getComponentName(filePath);
  const category = getStoryCategory(filePath);
  const importPath = filePath.replace('.tsx', '').replace(/\\/g, '/');
  
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
`;
}

async function createStoryFile(componentPath: string): Promise<void> {
  const storyContent = generateStoryContent(componentPath);
  const storyPath = componentPath.replace('.tsx', '.stories.tsx');
  
  try {
    // Check if story file already exists
    await fs.access(storyPath);
    console.log(`⚠️  Story already exists: ${storyPath}`);
    return;
  } catch {
    // File doesn't exist, create it
  }
  
  await fs.writeFile(storyPath, storyContent, 'utf8');
  console.log(`✅ Created story: ${storyPath}`);
}

async function generateAllStories(): Promise<void> {
  console.log('🎨 Generating Storybook stories for monitoring components...\n');
  
  let created = 0;
  let skipped = 0;
  
  for (const componentPath of monitoringComponents) {
    try {
      // Check if the component file exists
      await fs.access(componentPath);
      await createStoryFile(componentPath);
      created++;
    } catch (error) {
      console.log(`❌ Component not found: ${componentPath}`);
      skipped++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Created: ${created} story files`);
  console.log(`⚠️  Skipped: ${skipped} files`);
  console.log(`\n🚀 Restart Storybook to see your new monitoring component stories!`);
}

// Run the script
generateAllStories().catch(console.error); 