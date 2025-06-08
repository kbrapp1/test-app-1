'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe
} from 'lucide-react';
import { NetworkStats } from '../../../domain/network-efficiency/entities/NetworkCall';

interface NetworkStatsOverviewProps {
  stats: NetworkStats;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  subtitle: string;
  isAlert?: boolean;
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient, 
  subtitle, 
  isAlert = false 
}: StatCardProps) {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isAlert ? 'ring-2 ring-red-200 animate-pulse' : 'hover:scale-105'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NetworkStatsOverview({ stats }: NetworkStatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Calls"
        value={stats.totalCalls}
        icon={<Globe className="w-5 h-5" />}
        gradient="from-blue-500 to-blue-600"
        subtitle="All requests"
      />
      <StatCard
        title="Active Issues"
        value={stats.redundantCalls}
        icon={<AlertTriangle className="w-5 h-5" />}
        gradient="from-red-500 to-red-600"
        subtitle="Redundant calls"
        isAlert={stats.redundantCalls > 0}
      />
      <StatCard
        title="Session Total"
        value={stats.persistentRedundantCount}
        icon={<BarChart3 className="w-5 h-5" />}
        gradient="from-orange-500 to-orange-600"
        subtitle="All detected issues"
      />
      <StatCard
        title="Efficiency"
        value={`${(100 - stats.sessionRedundancyRate).toFixed(1)}%`}
        icon={stats.sessionRedundancyRate < 10 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        gradient={stats.sessionRedundancyRate < 10 ? "from-green-500 to-green-600" : "from-yellow-500 to-yellow-600"}
        subtitle="Network efficiency"
      />
    </div>
  );
} 