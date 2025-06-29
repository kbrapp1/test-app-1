/**
 * Bot Identity Form Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle bot identity configuration UI
 * - Under 200 lines - focused component
 * - Delegate all state management to parent/hooks
 * - Pure UI component - no business logic
 * - Use presentation layer types only
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';
import {
  BotConfigurationFormData,
  BotConfigurationViewState,
  BotConfigurationActions,
  PERSONALITY_OPTIONS,
} from '../../../types/BotConfigurationTypes';
import { useChatbotConfiguration } from '../../../hooks/useChatbotConfiguration';

interface BotIdentityFormProps {
  // No props needed - hook handles everything
}

export function BotIdentityForm({}: BotIdentityFormProps) {
  const { formData, viewState, actions, isSaving } = useChatbotConfiguration();
  
  // Early return if form state is not available
  if (!formData || !viewState || !actions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading configuration...
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <CardTitle>Bot Identity</CardTitle>
        </div>
        <CardDescription>
          Configure your chatbot's name, description, and basic settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={viewState.hasExistingConfig ? 'default' : 'secondary'}>
            {viewState.hasExistingConfig ? 'Configured' : 'Not Configured'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => viewState.isEditing ? actions.cancelEditing() : actions.startEditing()}
          >
            {viewState.isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="bot-name">Bot Name</Label>
            <Input
              id="bot-name"
              value={formData.name}
              onChange={(e) => actions.updateFormData({ name: e.target.value })}
              disabled={!viewState.isEditing}
              placeholder="Enter your bot's name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-description">Description</Label>
            <Textarea
              id="bot-description"
              value={formData.description}
              onChange={(e) => actions.updateFormData({ description: e.target.value })}
              disabled={!viewState.isEditing}
              placeholder="Describe what your bot does"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-personality">Personality</Label>
            <select
              id="bot-personality"
              value={formData.personality}
              onChange={(e) => actions.updateFormData({ personality: e.target.value })}
              disabled={!viewState.isEditing}
              className="w-full p-2 border rounded-md bg-background"
            >
              {PERSONALITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Bot Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable your chatbot
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => actions.updateFormData({ isActive: checked })}
              disabled={!viewState.isEditing}
            />
          </div>
        </div>

        {viewState.isEditing && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={actions.saveConfiguration}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={actions.cancelEditing}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 