/**
 * Website Sources Stats Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display website sources statistics
 * - Keep under 100 lines - focused component
 * - Follow @golden-rule patterns exactly
 * - Pure presentation component with derived calculations
 */

import { Card, CardContent } from '@/components/ui/card';
import { Globe, TrendingUp, CheckCircle } from 'lucide-react';
import { WebsiteSourceDto } from '../../../../application/dto/ChatbotConfigDto';

interface WebsiteSourcesStatsProps {
  websiteSources: WebsiteSourceDto[];
}

export function WebsiteSourcesStats({ websiteSources }: WebsiteSourcesStatsProps) {
  const activeSourcesCount = websiteSources.filter((s) => s.isActive).length;
  const totalPages = websiteSources.reduce((sum, s) => sum + (s.pageCount || 0), 0);
  const readySourcesCount = websiteSources.filter((s) => s.status === 'completed').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{activeSourcesCount}</p>
              <p className="text-sm text-muted-foreground">Active Sources</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{totalPages}</p>
              <p className="text-sm text-muted-foreground">Pages Indexed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold">{readySourcesCount}</p>
              <p className="text-sm text-muted-foreground">Ready to Use</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 