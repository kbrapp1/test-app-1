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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Clock, 
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';

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
  sourceId,
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
  const skippedPages = pages.filter(p => p.status === 'skipped');

  const averageContentLength = successfulPages.length > 0 
    ? Math.round(successfulPages.reduce((sum, p) => sum + p.contentLength, 0) / successfulPages.length)
    : 0;

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-semibold">{successfulPages.length}</div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{Object.keys(pagesByDepth).length}</div>
            <div className="text-sm text-muted-foreground">Depth Levels</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{averageContentLength.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Avg Content Length</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">
              {pages.length > 0 ? Math.round((successfulPages.length / pages.length) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Pages by Depth */}
        <div className="space-y-4">
          {Object.entries(pagesByDepth)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([depth, depthPages]) => (
              <div key={depth} className="space-y-2">
                <h4 className="font-medium text-sm flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  Depth {depth} ({depthPages.length} pages)
                </h4>
                
                <div className="space-y-2 ml-5">
                  {depthPages.map((page) => (
                    <Collapsible key={page.id}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start p-3 h-auto"
                          onClick={() => togglePageExpansion(page.id)}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-start space-x-3 flex-1 text-left">
                              {expandedPages.has(page.id) ? (
                                <ChevronDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium truncate">{page.title}</span>
                                  <Badge variant={
                                    page.status === 'success' ? 'default' :
                                    page.status === 'failed' ? 'destructive' : 'secondary'
                                  } className="text-xs">
                                    {page.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {page.category}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {page.url}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <div className="text-xs text-muted-foreground">
                                {page.contentLength.toLocaleString()} chars
                              </div>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="ml-7 mt-2">
                        <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                          {/* Page Metadata */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Status Code:</span>
                              <span className="ml-2 font-medium">{page.statusCode || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Response Time:</span>
                              <span className="ml-2 font-medium">
                                {page.responseTime ? `${page.responseTime}ms` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Crawled:</span>
                              <span className="ml-2 font-medium">
                                {page.crawledAt.toLocaleTimeString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tags:</span>
                              <span className="ml-2">
                                {page.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs mr-1">
                                    {tag}
                                  </Badge>
                                ))}
                              </span>
                            </div>
                          </div>

                          {/* Content Preview */}
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">Content Preview</span>
                            </div>
                            <div className="bg-background rounded border p-3 text-sm">
                              <p className="text-muted-foreground line-clamp-3">
                                {page.content.substring(0, 300)}
                                {page.content.length > 300 && '...'}
                              </p>
                            </div>
                          </div>

                          {/* Error Message (if failed) */}
                          {page.status === 'failed' && page.errorMessage && (
                            <div>
                              <div className="text-sm font-medium text-destructive mb-2">Error</div>
                              <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
                                {page.errorMessage}
                              </div>
                            </div>
                          )}

                          {/* External Link */}
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(page.url, '_blank')}
                              className="text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Original Page
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Failed Pages Summary */}
        {failedPages.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm text-destructive mb-2">
              Failed Pages ({failedPages.length})
            </h4>
            <div className="space-y-1">
              {failedPages.slice(0, 5).map((page) => (
                <div key={page.id} className="text-sm text-muted-foreground">
                  • {page.url} - {page.errorMessage || 'Unknown error'}
                </div>
              ))}
              {failedPages.length > 5 && (
                <div className="text-sm text-muted-foreground">
                  ... and {failedPages.length - 5} more failed pages
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 