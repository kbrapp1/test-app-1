/**
 * Website Sources List Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display list of website sources with actions
 * - Show source details, status, and crawl actions
 * - Keep under 200-250 lines by focusing on display logic only
 * - Follow @golden-rule patterns exactly
 * - Delegate actions to parent state management
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Globe, Settings, Play } from 'lucide-react';
import { WebsiteSourceDto } from '../../../../application/dto/ChatbotConfigDto';
import { CrawlProgressTracker } from './CrawlProgressTracker';
import { CrawledPagesDisplay, CrawledPageInfo } from './CrawledPagesDisplay';
import { CrawlProgress } from './WebsiteSourcesSection';

interface WebsiteSourcesListProps {
  sources: WebsiteSourceDto[];
  crawlProgress: CrawlProgress | null;
  crawledPagesData: Record<string, CrawledPageInfo[]>;
  showCrawledPages: Record<string, boolean>;
  onCrawlSource: (sourceId: string) => void;
  onRemoveSource: (sourceId: string) => void;
  onToggleCrawledPages: (sourceId: string) => void;
}

export function WebsiteSourcesList({
  sources,
  crawlProgress,
  crawledPagesData,
  showCrawledPages,
  onCrawlSource,
  onRemoveSource,
  onToggleCrawledPages
}: WebsiteSourcesListProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sources.map((source) => {
        const isCrawling = crawlProgress?.sourceId === source.id;
        const hasPages = crawledPagesData[source.id]?.length > 0;
        const isShowingPages = showCrawledPages[source.id];

        return (
          <div key={source.id} className="space-y-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>{source.name}</span>
                      <Badge variant={source.isActive ? 'default' : 'secondary'} className="text-xs">
                        {source.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {source.url}
                    </p>
                    {source.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {source.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCrawlSource(source.id)}
                      disabled={isCrawling}
                      className="text-xs"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {isCrawling ? 'Crawling...' : 'Crawl'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSource(source.id)}
                      className="text-destructive hover:text-destructive text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Crawl Settings */}
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Settings className="w-3 h-3" />
                      <span>Max Pages: {source.crawlSettings.maxPages}</span>
                    </div>
                    <div>
                      Max Depth: {source.crawlSettings.maxDepth}
                    </div>
                    <div>
                      Robots.txt: {source.crawlSettings.respectRobotsTxt ? 'Yes' : 'No'}
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  {isCrawling && crawlProgress && (
                    <CrawlProgressTracker 
                      sourceId={source.id}
                      progress={crawlProgress} 
                    />
                  )}

                  {/* Crawled Pages Count */}
                  {hasPages && (
                    <div className="text-sm text-muted-foreground">
                      {crawledPagesData[source.id].length} pages crawled • 
                      {crawledPagesData[source.id].filter(p => p.status === 'success').length} successful • 
                      {crawledPagesData[source.id].filter(p => p.status === 'failed').length} failed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Crawled Pages Display */}
            {hasPages && (
              <CrawledPagesDisplay
                sourceId={source.id}
                sourceName={source.name}
                pages={crawledPagesData[source.id]}
                isVisible={isShowingPages}
                onToggleVisibility={() => onToggleCrawledPages(source.id)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
} 