/**
 * AI Configuration Section
 * 
 * Component for configuring OpenAI model and behavior parameters.
 * Single responsibility: Handle AI-specific configuration settings.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain } from 'lucide-react';
import { ParameterSectionProps } from '../../../types/AdvancedParametersTypes';

export function AiConfigurationSection({ parameters, updateParameter, isEditing }: ParameterSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          OpenAI Configuration
        </CardTitle>
        <CardDescription>
          Configure the underlying AI model and behavior parameters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openai-model">Model</Label>
            <select
              id="openai-model"
              value={parameters.openaiModel}
              onChange={(e) => updateParameter('openaiModel', e.target.value)}
              disabled={!isEditing}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="gpt-4o">GPT-4o (Recommended)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-temperature">
              Temperature ({parameters.openaiTemperature})
            </Label>
            <Input
              id="openai-temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={parameters.openaiTemperature}
              onChange={(e) => updateParameter('openaiTemperature', parseFloat(e.target.value))}
              disabled={!isEditing}
            />
            <p className="text-xs text-muted-foreground">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-max-tokens">Max Response Tokens</Label>
            <Input
              id="openai-max-tokens"
              type="number"
              min="100"
              max="4000"
              value={parameters.openaiMaxTokens}
              onChange={(e) => updateParameter('openaiMaxTokens', parseInt(e.target.value))}
              disabled={!isEditing}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 