'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Settings, Palette, Clock } from 'lucide-react';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { getChatbotConfigByOrganization, updateChatbotConfig, createChatbotConfig } from '../../actions/configActions';
import { CreateChatbotConfigDto, UpdateChatbotConfigDto } from '../../../application/dto/ChatbotConfigDto';

export function BotConfigurationSection() {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Query for existing chatbot config
  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', activeOrganizationId],
    queryFn: () => activeOrganizationId ? getChatbotConfigByOrganization(activeOrganizationId) : null,
    enabled: !!activeOrganizationId,
  });

  const existingConfig = configResult?.success ? configResult.data : null;

  // Form state
  const [formData, setFormData] = useState({
    name: existingConfig?.name || 'My Assistant',
    description: existingConfig?.description || 'An AI assistant to help with questions and capture leads',
    personality: existingConfig?.personalitySettings?.tone || 'helpful',
    operatingHours: { enabled: false, timezone: existingConfig?.operatingHours?.timezone || 'UTC' },
    isActive: existingConfig?.isActive ?? true,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateChatbotConfigDto) => createChatbotConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
      setIsEditing(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotConfigDto }) =>
      updateChatbotConfig(id, data, activeOrganizationId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (!activeOrganizationId) return;

    if (existingConfig) {
      // Update existing config
      updateMutation.mutate({
        id: existingConfig.id,
        data: {
          name: formData.name,
          description: formData.description,
          personalitySettings: {
            tone: formData.personality,
            communicationStyle: 'professional',
            responseLength: 'medium',
            escalationTriggers: [],
            responseBehavior: {
              useEmojis: false,
              askFollowUpQuestions: true,
              proactiveOffering: true,
              personalizeResponses: true,
              acknowledgePreviousInteractions: true,
            },
            conversationFlow: {
              greetingMessage: 'Hello! How can I help you today?',
              fallbackMessage: 'I\'m not sure about that. Could you rephrase your question?',
              escalationMessage: 'Let me connect you with a team member.',
              endConversationMessage: 'Thank you for chatting with us!',
              leadCapturePrompt: 'Can I get your contact information to follow up?',
              maxConversationTurns: 20,
              inactivityTimeout: 300,
            },
            customInstructions: '',
          },
          operatingHours: {
            timezone: formData.operatingHours.timezone,
            businessHours: [],
            holidaySchedule: [],
            outsideHoursMessage: 'We\'re currently offline. Please leave a message!',
          },
          isActive: formData.isActive,
        },
      });
    } else {
      // Create new config
      createMutation.mutate({
        organizationId: activeOrganizationId,
        name: formData.name,
        description: formData.description,
        personalitySettings: {
          tone: formData.personality,
          communicationStyle: 'professional',
          responseLength: 'medium',
          escalationTriggers: [],
          responseBehavior: {
            useEmojis: false,
            askFollowUpQuestions: true,
            proactiveOffering: true,
            personalizeResponses: true,
            acknowledgePreviousInteractions: true,
          },
          conversationFlow: {
            greetingMessage: 'Hello! How can I help you today?',
            fallbackMessage: 'I\'m not sure about that. Could you rephrase your question?',
            escalationMessage: 'Let me connect you with a team member.',
            endConversationMessage: 'Thank you for chatting with us!',
            leadCapturePrompt: 'Can I get your contact information to follow up?',
            maxConversationTurns: 20,
            inactivityTimeout: 300,
          },
          customInstructions: '',
        },
        knowledgeBase: {
          companyInfo: '',
          productCatalog: '',
          faqs: [],
          supportDocs: '',
          complianceGuidelines: '',
        },
        operatingHours: {
          timezone: formData.operatingHours.timezone,
          businessHours: [],
          holidaySchedule: [],
          outsideHoursMessage: 'We\'re currently offline. Please leave a message!',
        },
        leadQualificationQuestions: [],
      });
    }
  };

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load chatbot configuration. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bot Identity */}
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
            <Badge variant={existingConfig ? 'default' : 'secondary'}>
              {existingConfig ? 'Configured' : 'Not Configured'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="bot-name">Bot Name</Label>
              <Input
                id="bot-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your bot's name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot-description">Description</Label>
              <Textarea
                id="bot-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing}
                placeholder="Describe what your bot does"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot-personality">Personality</Label>
              <select
                id="bot-personality"
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                disabled={!isEditing}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="helpful">Helpful & Professional</option>
                <option value="friendly">Friendly & Casual</option>
                <option value="formal">Formal & Business</option>
                <option value="enthusiastic">Enthusiastic & Energetic</option>
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
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Operating Hours</CardTitle>
          </div>
          <CardDescription>
            Set when your chatbot is available to respond to visitors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>24/7 Availability</Label>
              <p className="text-sm text-muted-foreground">
                Bot responds to visitors at all times
              </p>
            </div>
            <Switch
              checked={!formData.operatingHours.enabled}
              onCheckedChange={(checked) => 
                setFormData({
                  ...formData,
                  operatingHours: { ...formData.operatingHours, enabled: !checked }
                })
              }
              disabled={!isEditing}
            />
          </div>

          {formData.operatingHours.enabled && (
            <Alert>
              <AlertDescription>
                Custom operating hours will be available in a future update.
                Currently, your bot operates 24/7.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Widget Preview */}
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
                Widget preview will be available after configuration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 