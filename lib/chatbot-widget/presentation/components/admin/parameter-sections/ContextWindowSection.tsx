/**
 * Context Window Section
 * 
 * Component for configuring conversation context and memory management.
 * Single responsibility: Handle context window configuration settings.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';
import { ParameterSectionProps } from '../../../types/AdvancedParametersTypes';

export function ContextWindowSection({ parameters, updateParameter, isEditing }: ParameterSectionProps) {
  const availableTokens = parameters.contextMaxTokens - 
    parameters.contextSystemPromptTokens - 
    parameters.contextResponseReservedTokens - 
    parameters.contextSummaryTokens;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Context Window Management
        </CardTitle>
        <CardDescription>
          Configure how conversation context and memory are managed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="context-max-tokens">Total Context Window</Label>
            <Input
              id="context-max-tokens"
              type="number"
              min="4000"
              max="32000"
              value={parameters.contextMaxTokens}
              onChange={(e) => updateParameter('contextMaxTokens', parseInt(e.target.value))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context-system-tokens">System Prompt Tokens</Label>
            <Input
              id="context-system-tokens"
              type="number"
              min="200"
              max="2000"
              value={parameters.contextSystemPromptTokens}
              onChange={(e) => updateParameter('contextSystemPromptTokens', parseInt(e.target.value))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context-response-tokens">Response Reserved Tokens</Label>
            <Input
              id="context-response-tokens"
              type="number"
              min="1000"
              max="4000"
              value={parameters.contextResponseReservedTokens}
              onChange={(e) => updateParameter('contextResponseReservedTokens', parseInt(e.target.value))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context-summary-tokens">Summary Tokens</Label>
            <Input
              id="context-summary-tokens"
              type="number"
              min="100"
              max="500"
              value={parameters.contextSummaryTokens}
              onChange={(e) => updateParameter('contextSummaryTokens', parseInt(e.target.value))}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Token Allocation</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Available for Messages:</span>
              <span className="font-mono">
                {availableTokens} tokens
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Allocated:</span>
              <span className="font-mono">{parameters.contextMaxTokens} tokens</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 