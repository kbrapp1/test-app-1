/**
 * Crawled Pages Summary Stats Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display summary statistics for crawled pages
 * - Show success counts, depth levels, content metrics, and success rates
 * - Keep under 100 lines by focusing on stats display only
 * - Follow @golden-rule patterns exactly
 * - Use clean typography and minimal color approach
 */

import { CrawledPageInfo } from './CrawledPagesDisplay';

interface CrawledPagesSummaryStatsProps {
  pages: CrawledPageInfo[];
  successfulPages: CrawledPageInfo[];
  pagesByDepth: Record<number, CrawledPageInfo[]>;
}

export function CrawledPagesSummaryStats({
  pages,
  successfulPages,
  pagesByDepth
}: CrawledPagesSummaryStatsProps) {
  const averageContentLength = successfulPages.length > 0 
    ? Math.round(successfulPages.reduce((sum, p) => sum + p.contentLength, 0) / successfulPages.length)
    : 0;

  const hasContentLengthData = successfulPages.some(p => p.contentLength > 0);

  return (
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
        <div className="text-2xl font-semibold">{hasContentLengthData ? averageContentLength.toLocaleString() : 'N/A'}</div>
        <div className="text-sm text-muted-foreground">Avg Content Length</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold">
          {pages.length > 0 ? Math.round((successfulPages.length / pages.length) * 100) : 0}%
        </div>
        <div className="text-sm text-muted-foreground">Success Rate</div>
      </div>
    </div>
  );
}