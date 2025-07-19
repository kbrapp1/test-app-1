/**
 * Crawled Page Item Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display individual crawled page information
 * - Show page title, URL, status, content preview, and metadata
 * - Keep under 150 lines by focusing on single page display only
 * - Follow @golden-rule patterns exactly
 * - Use clean typography and minimal color approach
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  FileText
} from 'lucide-react';
import { CrawledPageInfo } from './CrawledPagesDisplay';

interface CrawledPageItemProps {
  page: CrawledPageInfo;
  isExpanded: boolean;
  onToggleExpansion: (pageId: string) => void;
}

export function CrawledPageItem({
  page,
  isExpanded,
  onToggleExpansion
}: CrawledPageItemProps) {
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname === '/' ? '' : urlObj.pathname;
      return `${urlObj.hostname}${path}`;
    } catch {
      return url;
    }
  };

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start p-3 h-auto hover:bg-muted/50 border border-transparent hover:border-border/50 rounded-lg transition-colors"
          onClick={() => onToggleExpansion(page.id)}
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-start space-x-3 flex-1 min-w-0 pr-4">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-foreground truncate flex-1 min-w-0 max-w-[60%] text-left">{page.title}</span>
                  <div className="flex items-center space-x-1 flex-shrink-0">
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
                </div>
                <div className="text-xs text-muted-foreground/80 truncate w-full text-left">
                  {formatUrl(page.url)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
              {/* Only show content length if it's meaningful */}
              {page.contentLength > 0 && (
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {page.contentLength.toLocaleString()} chars
                </div>
              )}
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
          {page.content && page.content.trim().length > 0 ? (
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
          ) : (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Content Preview</span>
              </div>
              <div className="bg-muted/10 rounded border border-dashed p-3 text-sm">
                <p className="text-muted-foreground italic">
                  No content preview available
                </p>
              </div>
            </div>
          )}

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
          <div className="pt-2 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(page.url, '_blank')}
              className="text-xs hover:bg-primary/5"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Original Page
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}