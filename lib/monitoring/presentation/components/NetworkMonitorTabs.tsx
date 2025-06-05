'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  Clock,
  Zap,
  Activity,
  Server
} from 'lucide-react';
import { NetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';

interface NetworkMonitorTabsProps {
  stats: NetworkStats;
  onClear: () => void;
}

export function NetworkMonitorTabs({ stats, onClear }: NetworkMonitorTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg">
        <TabsTrigger 
          value="overview" 
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger 
          value="recent"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Clock className="w-4 h-4 mr-2" />
          Recent
        </TabsTrigger>
        <TabsTrigger 
          value="redundant"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Zap className="w-4 h-4 mr-2" />
          Session Issues
        </TabsTrigger>
        <TabsTrigger 
          value="history"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Activity className="w-4 h-4 mr-2" />
          History
        </TabsTrigger>
        <TabsTrigger 
          value="types"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Server className="w-4 h-4 mr-2" />
          Types
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="overview">
          <div className="text-center py-8 text-gray-500">
            Overview tab - Component needs to be migrated
          </div>
        </TabsContent>
        <TabsContent value="recent">
          <div className="text-center py-8 text-gray-500">
            Recent calls tab - Component needs to be migrated
          </div>
        </TabsContent>
        <TabsContent value="redundant">
          <div className="text-center py-8 text-gray-500">
            Redundant patterns tab - Component needs to be migrated
          </div>
        </TabsContent>
        <TabsContent value="history">
          <div className="text-center py-8 text-gray-500">
            History tab - Component needs to be migrated
          </div>
        </TabsContent>
        <TabsContent value="types">
          <div className="text-center py-8 text-gray-500">
            Types tab - Component needs to be migrated
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
} 