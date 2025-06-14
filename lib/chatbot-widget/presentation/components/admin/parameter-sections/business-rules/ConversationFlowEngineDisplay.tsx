/**
 * Conversation Flow Engine Display
 * 
 * Component for displaying conversation flow engine information.
 * Single responsibility: Display journey progression logic and decision thresholds.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConversationFlowEngineDisplay() {
  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl">Conversation Flow Engine</CardTitle>
        <CardDescription>Journey progression logic and decision thresholds</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center text-muted-foreground">
          Conversation flow engine configuration display
        </div>
      </CardContent>
    </Card>
  );
} 