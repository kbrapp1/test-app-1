/**
 * Crawled Pages Failed Summary Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display summary of failed crawled pages
 * - Show failed page URLs and error messages in compact format
 * - Keep under 80 lines by focusing on failed pages display only
 * - Follow @golden-rule patterns exactly
 * - Use clean typography and minimal color approach
 */

import { CrawledPageInfo } from './CrawledPagesDisplay';

interface CrawledPagesFailedSummaryProps {
  failedPages: CrawledPageInfo[];
}

export function CrawledPagesFailedSummary({
  failedPages
}: CrawledPagesFailedSummaryProps) {
  if (failedPages.length === 0) {
    return null;
  }

  return (
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
  );
}