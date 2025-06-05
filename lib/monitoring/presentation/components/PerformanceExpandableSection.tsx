'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PerformanceExpandableSectionProps {
  title: string;
  icon: string;
  score: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const PerformanceExpandableSection: React.FC<PerformanceExpandableSectionProps> = ({
  title,
  icon,
  score,
  isExpanded,
  onToggle,
  children
}) => {
  return (
    <div className="border border-gray-200 rounded-lg">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full h-8 px-3 justify-between text-xs"
      >
        <span className="flex items-center gap-2">
          {icon} {title}
          <Badge variant="outline" className="text-xs">
            {score}/100
          </Badge>
        </span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}; 