'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { UnifiedIssueDto } from '../../application/dto/UnifiedIssueDto';

interface IssueCardProps {
  issue: UnifiedIssueDto;
  index: number;
}

const IssueCardComponent: React.FC<IssueCardProps> = ({ issue, index }) => {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high': 
        return 'bg-red-50 border-red-400';
      case 'medium':
        return 'bg-yellow-50 border-yellow-400';
      default:
        return 'bg-blue-50 border-blue-400';
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    return category === 'Cross-Domain' && issue.severity === 'high' ? 'destructive' : 'secondary';
  };

  const getSeverityBadgeStyles = (severity: string) => {
    switch (severity) {
      case 'high': 
        return 'border-red-300 text-red-700';
      case 'medium':
        return 'border-yellow-300 text-yellow-700';
      default:
        return 'border-blue-300 text-blue-700';
    }
  };

  return (
    <div 
      className={`p-3 rounded-lg border-l-4 ${getSeverityStyles(issue.severity)}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{issue.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-800">{issue.title}</h4>
            <Badge 
              variant={getCategoryBadgeVariant(issue.category)}
              className="text-xs"
            >
              {issue.category}
            </Badge>
            <Badge 
              variant="outline"
              className={`text-xs ${getSeverityBadgeStyles(issue.severity)}`}
            >
              {issue.severity.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{issue.description}</p>
        </div>
      </div>
    </div>
  );
};

// Wrap component in React.memo for performance
export const IssueCard = React.memo(IssueCardComponent);
IssueCard.displayName = 'IssueCard';

// No further exports 