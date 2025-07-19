/**
 * Crawled Pages Display Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display detailed information about crawled pages
 * - Show page URL, title, content preview, crawl status, and metadata
 * - Keep under 200-250 lines by focusing on display logic only
 * - Follow @golden-rule patterns exactly
 * - Use clean typography and minimal color approach
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hash, Eye, EyeOff } from 'lucide-react';
import { CrawledPagesSummaryStats } from './CrawledPagesSummaryStats';
import { CrawledPageItem } from './CrawledPageItem';
import { CrawledPagesFailedSummary } from './CrawledPagesFailedSummary';

export interface CrawledPageInfo {
  id: string;
  url: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  depth: number;
  contentLength: number;
  crawledAt: Date;
  status: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  responseTime?: number;
  statusCode?: number;
}

interface CrawledPagesDisplayProps {
  sourceId: string;
  sourceName: string;
  pages: CrawledPageInfo[];
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function CrawledPagesDisplay({
  sourceId: _sourceId,
  sourceName,
  pages,
  isVisible,
  onToggleVisibility
}: CrawledPagesDisplayProps) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const togglePageExpansion = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const successfulPages = pages.filter(p => p.status === 'success');
  const failedPages = pages.filter(p => p.status === 'failed');

  const pagesByDepth = pages.reduce((acc, page) => {
    const depth = page.depth;
    if (!acc[depth]) acc[depth] = [];
    acc[depth].push(page);
    return acc;
  }, {} as Record<number, CrawledPageInfo[]>);

  if (!isVisible) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Crawled Pages</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleVisibility}
              className="text-muted-foreground"
            >
              <Eye className="w-4 h-4 mr-2" />
              Show Details
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Crawled Pages for {sourceName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {pages.length} total pages • {successfulPages.length} successful • {failedPages.length} failed
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleVisibility}
            className="text-muted-foreground"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Hide Details
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <CrawledPagesSummaryStats 
          pages={pages}
          successfulPages={successfulPages}
          pagesByDepth={pagesByDepth}
        />

        {/* Pages by Depth */}
        <div className="space-y-4">
          {Object.entries(pagesByDepth)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([depth, depthPages]) => (
              <div key={depth} className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center text-foreground/90 pb-1 border-b border-border/30">
                  <Hash className="w-4 h-4 mr-1" />
                  Depth {depth} ({depthPages.length} pages)
                </h4>
                
                <div className="space-y-2 ml-5">
                  {depthPages.map((page) => (
                    <CrawledPageItem
                      key={page.id}
                      page={page}
                      isExpanded={expandedPages.has(page.id)}
                      onToggleExpansion={togglePageExpansion}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Failed Pages Summary */}
        <CrawledPagesFailedSummary failedPages={failedPages} />
      </CardContent>
    </Card>
  );
} 