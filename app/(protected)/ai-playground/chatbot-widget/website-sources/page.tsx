/**
 * Website Sources Page
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display website source management interface
 * - Use WebsiteSourcesSection component for all functionality
 * - Keep page component minimal - delegate to section component
 * - Follow @golden-rule patterns exactly
 */

import { WebsiteSourcesSection } from '@/lib/chatbot-widget/presentation/components/admin/website-sources/WebsiteSourcesSection';

export default function WebsiteSourcesPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Website Sources</h1>
          <p className="text-muted-foreground">
            Add websites to crawl and include their content in your chatbot's knowledge base.
          </p>
        </div>
        
        <WebsiteSourcesSection />
      </div>
    </div>
  );
} 