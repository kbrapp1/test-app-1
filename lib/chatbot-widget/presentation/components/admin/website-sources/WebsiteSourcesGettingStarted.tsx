/**
 * Website Sources Getting Started Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display getting started guide
 * - Keep under 100 lines - focused component
 * - Follow @golden-rule patterns exactly
 * - Pure presentation component with call-to-action
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Zap } from 'lucide-react';

interface WebsiteSourcesGettingStartedProps {
  onAddFirst: () => void;
}

export function WebsiteSourcesGettingStarted({ onAddFirst }: WebsiteSourcesGettingStartedProps) {
  return (
    <Card className="border-dashed border-2">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Supercharge Your Chatbot</CardTitle>
        <CardDescription className="text-base max-w-2xl mx-auto">
          Import content from your websites automatically. Our AI will crawl, categorize, 
          and extract relevant information to make your chatbot more knowledgeable and helpful.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-sm font-semibold text-blue-600">1</span>
            </div>
            <h4 className="font-medium">Add Your Website</h4>
            <p className="text-sm text-muted-foreground">
              Enter your website URL and configure crawling settings
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-sm font-semibold text-blue-600">2</span>
            </div>
            <h4 className="font-medium">AI Processing</h4>
            <p className="text-sm text-muted-foreground">
              Our AI crawls, categorizes, and extracts relevant content
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-sm font-semibold text-blue-600">3</span>
            </div>
            <h4 className="font-medium">Ready to Use</h4>
            <p className="text-sm text-muted-foreground">
              Content is immediately available for chatbot responses
            </p>
          </div>
        </div>
        <Button onClick={onAddFirst}>
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Website
        </Button>
      </CardContent>
    </Card>
  );
} 