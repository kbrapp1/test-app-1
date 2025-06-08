'use client';

import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Minimize2 } from 'lucide-react';

interface PerformanceDashboardHeaderProps {
  overallScore: number;
  scoreColor: 'green' | 'yellow' | 'red';
  onCollapse?: () => void;
  pageContext?: string;
}

export const PerformanceDashboardHeader: React.FC<PerformanceDashboardHeaderProps> = ({
  overallScore,
  scoreColor,
  onCollapse,
  pageContext
}) => {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Performance Dashboard
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge 
            variant={scoreColor === 'green' ? 'default' : 'secondary'}
            className={`text-xs ${
              scoreColor === 'green' ? 'bg-green-100 text-green-800' :
              scoreColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            {overallScore}/100
          </Badge>
          {onCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapse}
              className="h-6 w-6 p-0"
              title="Collapse to compact view"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
  );
}; 