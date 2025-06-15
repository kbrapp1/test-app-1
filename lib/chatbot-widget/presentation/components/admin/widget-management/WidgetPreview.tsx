/**
 * Widget Preview Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display widget preview UI
 * - Under 200 lines - focused component
 * - Pure presentation component - no state management
 * - Show preview of how chatbot will appear
 * - Use presentation layer types only
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Palette } from 'lucide-react';
import { BotConfigurationViewState } from '../../types/BotConfigurationTypes';

interface WidgetPreviewProps {
  viewState: BotConfigurationViewState;
}

export function WidgetPreview({ viewState }: WidgetPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <CardTitle>Widget Preview</CardTitle>
        </div>
        <CardDescription>
          Preview how your chatbot will appear on websites.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-muted/50 min-h-[200px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {viewState.hasExistingConfig
                ? 'Widget preview will be available after configuration is saved'
                : 'Widget preview will be available after configuration'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 