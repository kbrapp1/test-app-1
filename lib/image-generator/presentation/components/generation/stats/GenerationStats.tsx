'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Image,
  Save,
  BarChart3
} from 'lucide-react';

export interface GenerationStatsData {
  totalGenerations: number;
  completedGenerations: number;
  failedGenerations: number;
  totalCostCents: number;
  avgGenerationTimeSeconds: number;
  savedToDAMCount: number;
}

interface GenerationStatsProps {
  stats: GenerationStatsData;
  className?: string;
}

export const GenerationStats: React.FC<GenerationStatsProps> = ({
  stats,
  className = ''
}) => {
  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  const getSuccessRate = () => {
    if (stats.totalGenerations === 0) return 0;
    return Math.round((stats.completedGenerations / stats.totalGenerations) * 100);
  };

  const getSaveRate = () => {
    if (stats.completedGenerations === 0) return 0;
    return Math.round((stats.savedToDAMCount / stats.completedGenerations) * 100);
  };

  return (
    <Card className={`bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Generation Stats</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Generations */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Image className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{stats.totalGenerations}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{getSuccessRate()}%</div>
              <div className="text-xs text-gray-500">Success</div>
            </div>
          </div>

          {/* Average Time */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {formatTime(stats.avgGenerationTimeSeconds)}
              </div>
              <div className="text-xs text-gray-500">Avg Time</div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {formatCost(stats.totalCostCents)}
              </div>
              <div className="text-xs text-gray-500">Spent</div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              <Save className="w-3 h-3 mr-1" />
              {stats.savedToDAMCount} Saved
            </Badge>
          </div>
          
          {stats.failedGenerations > 0 && (
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600">{stats.failedGenerations} failed</span>
            </div>
          )}
        </div>

        {/* Performance Indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>DAM Save Rate</span>
            <span>{getSaveRate()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${getSaveRate()}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 