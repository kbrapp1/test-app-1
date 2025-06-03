'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  BarChart3, 
  TestTube, 
  Zap, 
  Monitor,
  ArrowRight,
  Shield
} from 'lucide-react';

interface TestingTool {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'stable' | 'beta' | 'experimental';
  category: 'performance' | 'debugging' | 'monitoring';
}

const testingTools: TestingTool[] = [
  {
    id: 'performance',
    title: 'Performance Testing',
    description: 'Comprehensive performance testing suite for the image generator with real-time monitoring, memory usage tracking, and automated test scenarios.',
    href: '/testing-tools/performance',
    icon: Activity,
    status: 'stable',
    category: 'performance',
  },
  // Future testing tools can be added here
  // {
  //   id: 'api-testing',
  //   title: 'API Testing',
  //   description: 'Test API endpoints, rate limiting, and error handling scenarios.',
  //   href: '/testing-tools/api',
  //   icon: Zap,
  //   status: 'beta',
  //   category: 'debugging',
  // },
  // {
  //   id: 'load-testing',
  //   title: 'Load Testing',
  //   description: 'Simulate high traffic loads and concurrent user scenarios.',
  //   href: '/testing-tools/load',
  //   icon: BarChart3,
  //   status: 'experimental',
  //   category: 'performance',
  // },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'stable':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'beta':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'experimental':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'performance':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'debugging':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'monitoring':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function TestingToolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <TestTube className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Testing Tools</h1>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Super Admin Only
        </Badge>
      </div>
      
      <div className="text-muted-foreground">
        <p>
          Advanced testing tools and utilities for debugging, performance analysis, and system monitoring. 
          These tools are designed for development and troubleshooting purposes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {testingTools.map((tool) => {
          const IconComponent = tool.icon;
          
          return (
            <Card key={tool.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(tool.status)}`}
                        >
                          {tool.status}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getCategoryColor(tool.category)}`}
                        >
                          {tool.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-sm mb-4">
                  {tool.description}
                </CardDescription>
                
                <Link href={tool.href}>
                  <Button variant="outline" className="w-full group">
                    Open Testing Tool
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {testingTools.length === 1 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium mb-2">More Testing Tools Coming Soon</h3>
              <p className="text-sm">
                Additional testing utilities for API testing, load testing, and system monitoring 
                will be added to this section as they become available.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security Notice
        </h3>
        <p className="text-sm text-muted-foreground">
          These testing tools have access to system internals and should only be used by authorized personnel. 
          Some tests may impact system performance or generate significant data loads.
        </p>
      </div>
    </div>
  );
} 