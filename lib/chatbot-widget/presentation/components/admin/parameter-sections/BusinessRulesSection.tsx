/**
 * Business Rules Configuration Section
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Removed ConversationFlowEngineDisplay (now AI-driven)
 * - Display AI-driven conversation flow status instead of business rules
 * - Follow @golden-rule.mdc presentation layer patterns
 * - Keep under 200-250 lines
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bot, Zap } from 'lucide-react';

interface BusinessRulesSectionProps {
  config: any;
  onUpdate: (updates: any) => void;
}

export function BusinessRulesSection({ config, onUpdate }: BusinessRulesSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI-Driven Conversation Flow
          </CardTitle>
          <CardDescription>
            Conversation flow and lead capture timing are now determined by AI based on conversation context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              AI-Powered
            </Badge>
            <span className="text-sm text-muted-foreground">
              OpenAI analyzes conversation context to determine optimal timing for lead capture and qualification
            </span>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  AI Conversation Intelligence
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  The AI automatically determines when to capture lead information, ask qualification questions, 
                  and escalate to human agents based on conversation context, user intent, and engagement level.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lead Capture</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI-determined timing</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Qualification</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Context-aware questions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Escalation</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Intelligent handoff</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 