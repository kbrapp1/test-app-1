'use client';

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Brain, 
  MessageSquare, 
  Target, 
  Clock, 
  Zap,
  Info,
  AlertTriangle,
  Database,
  GitBranch,
  BookOpen
} from 'lucide-react';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { getChatbotConfigByOrganization, updateChatbotConfig } from '../../actions/configActions';
import { UpdateChatbotConfigDto } from '../../../application/dto/ChatbotConfigDto';
import { DomainConstants } from '../../../domain/value-objects/DomainConstants';

interface AdvancedParameters {
  // OpenAI Configuration
  openaiModel: string;
  openaiTemperature: number;
  openaiMaxTokens: number;
  
  // Context Window Configuration
  contextMaxTokens: number;
  contextSystemPromptTokens: number;
  contextResponseReservedTokens: number;
  contextSummaryTokens: number;
  
  // Intent Classification
  intentConfidenceThreshold: number;
  intentAmbiguityThreshold: number;
  enableMultiIntentDetection: boolean;
  enablePersonaInference: boolean;
  
  // Entity Extraction
  enableAdvancedEntities: boolean;
  entityExtractionMode: 'basic' | 'comprehensive' | 'custom';
  customEntityTypes: string[];
  
  // Conversation Flow
  maxConversationTurns: number;
  inactivityTimeoutSeconds: number;
  enableJourneyRegression: boolean;
  enableContextSwitchDetection: boolean;
  
  // Lead Scoring
  enableAdvancedScoring: boolean;
  entityCompletenessWeight: number;
  personaConfidenceWeight: number;
  journeyProgressionWeight: number;
  
  // Performance & Monitoring
  enablePerformanceLogging: boolean;
  enableIntentAnalytics: boolean;
  enablePersonaAnalytics: boolean;
  responseTimeThresholdMs: number;
}

export function AdvancedParametersSection() {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-config');

  // Query for existing chatbot config
  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', activeOrganizationId],
    queryFn: () => activeOrganizationId ? getChatbotConfigByOrganization(activeOrganizationId) : null,
    enabled: !!activeOrganizationId,
  });

  const existingConfig = configResult?.success ? configResult.data : null;

  // Advanced parameters state with defaults
  const [parameters, setParameters] = useState<AdvancedParameters>({
    // OpenAI Configuration
    openaiModel: 'gpt-4o-mini',
    openaiTemperature: 0.3,
    openaiMaxTokens: 1000,
    
    // Context Window Configuration
    contextMaxTokens: 12000,
    contextSystemPromptTokens: 500,
    contextResponseReservedTokens: 3000,
    contextSummaryTokens: 200,
    
    // Intent Classification
    intentConfidenceThreshold: 0.7,
    intentAmbiguityThreshold: 0.2,
    enableMultiIntentDetection: true,
    enablePersonaInference: true,
    
    // Entity Extraction
    enableAdvancedEntities: true,
    entityExtractionMode: 'comprehensive',
    customEntityTypes: [],
    
    // Conversation Flow
    maxConversationTurns: 20,
    inactivityTimeoutSeconds: 300,
    enableJourneyRegression: true,
    enableContextSwitchDetection: true,
    
    // Lead Scoring
    enableAdvancedScoring: true,
    entityCompletenessWeight: 0.3,
    personaConfidenceWeight: 0.2,
    journeyProgressionWeight: 0.25,
    
    // Performance & Monitoring
    enablePerformanceLogging: true,
    enableIntentAnalytics: true,
    enablePersonaAnalytics: true,
    responseTimeThresholdMs: 2000,
  });

  // Update parameters when config loads
  useEffect(() => {
    if (existingConfig) {
      // Extract advanced parameters from existing config
      setParameters(prev => ({
        ...prev,
        maxConversationTurns: existingConfig.personalitySettings?.conversationFlow?.maxConversationTurns || prev.maxConversationTurns,
        inactivityTimeoutSeconds: existingConfig.personalitySettings?.conversationFlow?.inactivityTimeout || prev.inactivityTimeoutSeconds,
      }));
    }
  }, [existingConfig]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotConfigDto }) =>
      updateChatbotConfig(id, data, activeOrganizationId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (!activeOrganizationId || !existingConfig) return;

    // Map advanced parameters back to config structure
    const updateData: UpdateChatbotConfigDto = {
      personalitySettings: {
        ...existingConfig.personalitySettings,
        conversationFlow: {
          ...existingConfig.personalitySettings.conversationFlow,
          maxConversationTurns: parameters.maxConversationTurns,
          inactivityTimeout: parameters.inactivityTimeoutSeconds,
        },
      },
    };

    updateMutation.mutate({
      id: existingConfig.id,
      data: updateData,
    });
  };

  const updateParameter = <K extends keyof AdvancedParameters>(
    key: K,
    value: AdvancedParameters[K]
  ) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div>Loading parameters...</div>;
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load chatbot configuration. Please configure your bot first.
        </AlertDescription>
      </Alert>
    );
  }

  if (!existingConfig) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please configure your chatbot first before accessing advanced parameters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <Badge variant={isEditing ? 'destructive' : 'default'}>
            {isEditing ? 'Editing Mode' : 'View Mode'}
          </Badge>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Parameters'}
        </Button>
      </div>

      {/* Warning Alert */}
      {isEditing && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> These are advanced settings that affect AI behavior, performance, and accuracy. 
            Incorrect values may degrade chatbot performance. Test thoroughly after making changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="ai-config" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Config
          </TabsTrigger>
          <TabsTrigger value="context" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Context
          </TabsTrigger>
          <TabsTrigger value="intent-entities" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Intent & Entities
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="domain-constants" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Domain Constants
          </TabsTrigger>
          <TabsTrigger value="business-rules" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Business Rules
          </TabsTrigger>
        </TabsList>

        {/* AI Configuration Tab */}
        <TabsContent value="ai-config" className="space-y-4">
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
        </TabsContent>

        {/* Context Window Tab */}
        <TabsContent value="context" className="space-y-4">
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
                      {parameters.contextMaxTokens - 
                       parameters.contextSystemPromptTokens - 
                       parameters.contextResponseReservedTokens - 
                       parameters.contextSummaryTokens} tokens
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
        </TabsContent>

        {/* Intent & Entities Tab */}
        <TabsContent value="intent-entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Intent Classification & Entity Extraction
              </CardTitle>
              <CardDescription>
                Configure how the AI understands user intent and extracts information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Intent Classification */}
              <div className="space-y-4">
                <h4 className="font-medium">Intent Classification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="intent-confidence">
                      Confidence Threshold ({parameters.intentConfidenceThreshold})
                    </Label>
                    <Input
                      id="intent-confidence"
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={parameters.intentConfidenceThreshold}
                      onChange={(e) => updateParameter('intentConfidenceThreshold', parseFloat(e.target.value))}
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum confidence to accept intent classification
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intent-ambiguity">
                      Ambiguity Threshold ({parameters.intentAmbiguityThreshold})
                    </Label>
                    <Input
                      id="intent-ambiguity"
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.05"
                      value={parameters.intentAmbiguityThreshold}
                      onChange={(e) => updateParameter('intentAmbiguityThreshold', parseFloat(e.target.value))}
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Difference threshold to trigger disambiguation
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Multi-Intent Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Detect multiple possible intents for disambiguation
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enableMultiIntentDetection}
                      onCheckedChange={(checked) => updateParameter('enableMultiIntentDetection', checked)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Persona Inference</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically infer user role, industry, and company size
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enablePersonaInference}
                      onCheckedChange={(checked) => updateParameter('enablePersonaInference', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Entity Extraction */}
              <div className="space-y-4">
                <h4 className="font-medium">Entity Extraction</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Advanced Entity Extraction</Label>
                      <p className="text-sm text-muted-foreground">
                        Extract 25+ entity types including scheduling, support, and qualification data
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enableAdvancedEntities}
                      onCheckedChange={(checked) => updateParameter('enableAdvancedEntities', checked)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entity-mode">Extraction Mode</Label>
                    <select
                      id="entity-mode"
                      value={parameters.entityExtractionMode}
                      onChange={(e) => updateParameter('entityExtractionMode', e.target.value as 'basic' | 'comprehensive' | 'custom')}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="basic">Basic (Core business entities only)</option>
                      <option value="comprehensive">Comprehensive (All 25+ entity types)</option>
                      <option value="custom">Custom (Specify entity types)</option>
                    </select>
                  </div>

                  {parameters.entityExtractionMode === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-entities">Custom Entity Types</Label>
                      <Textarea
                        id="custom-entities"
                        placeholder="Enter entity types, one per line (e.g., budget, timeline, industry)"
                        value={parameters.customEntityTypes.join('\n')}
                        onChange={(e) => updateParameter('customEntityTypes', e.target.value.split('\n').filter(Boolean))}
                        disabled={!isEditing}
                        rows={4}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversation Flow Tab */}
        <TabsContent value="conversation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Conversation Flow & Journey Tracking
              </CardTitle>
              <CardDescription>
                Configure conversation limits, timeouts, and journey tracking behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Flow Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Flow Control</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-turns">Max Conversation Turns</Label>
                    <Input
                      id="max-turns"
                      type="number"
                      min="5"
                      max="100"
                      value={parameters.maxConversationTurns}
                      onChange={(e) => updateParameter('maxConversationTurns', parseInt(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inactivity-timeout">Inactivity Timeout (seconds)</Label>
                    <Input
                      id="inactivity-timeout"
                      type="number"
                      min="60"
                      max="3600"
                      value={parameters.inactivityTimeoutSeconds}
                      onChange={(e) => updateParameter('inactivityTimeoutSeconds', parseInt(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Journey Tracking */}
              <div className="space-y-4">
                <h4 className="font-medium">Journey Tracking</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Journey Regression Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Track when users move backward in the sales funnel
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enableJourneyRegression}
                      onCheckedChange={(checked) => updateParameter('enableJourneyRegression', checked)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Context Switch Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Detect when conversation topic changes significantly
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enableContextSwitchDetection}
                      onCheckedChange={(checked) => updateParameter('enableContextSwitchDetection', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lead Scoring */}
              <div className="space-y-4">
                <h4 className="font-medium">Lead Scoring Weights</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Advanced Lead Scoring</Label>
                      <p className="text-sm text-muted-foreground">
                        Use comprehensive entity and persona data for scoring
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enableAdvancedScoring}
                      onCheckedChange={(checked) => updateParameter('enableAdvancedScoring', checked)}
                      disabled={!isEditing}
                    />
                  </div>

                  {parameters.enableAdvancedScoring && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="entity-weight">
                          Entity Completeness ({parameters.entityCompletenessWeight})
                        </Label>
                        <Input
                          id="entity-weight"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={parameters.entityCompletenessWeight}
                          onChange={(e) => updateParameter('entityCompletenessWeight', parseFloat(e.target.value))}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="persona-weight">
                          Persona Confidence ({parameters.personaConfidenceWeight})
                        </Label>
                        <Input
                          id="persona-weight"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={parameters.personaConfidenceWeight}
                          onChange={(e) => updateParameter('personaConfidenceWeight', parseFloat(e.target.value))}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="journey-weight">
                          Journey Progression ({parameters.journeyProgressionWeight})
                        </Label>
                        <Input
                          id="journey-weight"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={parameters.journeyProgressionWeight}
                          onChange={(e) => updateParameter('journeyProgressionWeight', parseFloat(e.target.value))}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance & Monitoring
              </CardTitle>
              <CardDescription>
                Configure performance monitoring, analytics, and optimization settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Performance Monitoring</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Performance Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Log response times and performance metrics
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enablePerformanceLogging}
                      onCheckedChange={(checked) => updateParameter('enablePerformanceLogging', checked)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="response-threshold">Response Time Threshold (ms)</Label>
                    <Input
                      id="response-threshold"
                      type="number"
                      min="500"
                      max="10000"
                      value={parameters.responseTimeThresholdMs}
                      onChange={(e) => updateParameter('responseTimeThresholdMs', parseInt(e.target.value))}
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Alert when responses take longer than this threshold
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Analytics Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Analytics & Intelligence</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Intent Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Track intent patterns, confidence scores, and disambiguation data
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enableIntentAnalytics}
                      onCheckedChange={(checked) => updateParameter('enableIntentAnalytics', checked)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Persona Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Track persona inference accuracy and conversion patterns
                      </p>
                    </div>
                    <Switch
                      checked={parameters.enablePersonaAnalytics}
                      onCheckedChange={(checked) => updateParameter('enablePersonaAnalytics', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Current Performance Metrics */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3">Current Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-mono text-lg">~1.2s</div>
                    <div className="text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-lg">94%</div>
                    <div className="text-muted-foreground">Intent Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-lg">87%</div>
                    <div className="text-muted-foreground">Entity Extraction</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-lg">76%</div>
                    <div className="text-muted-foreground">Persona Confidence</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Constants Tab */}
        <TabsContent value="domain-constants" className="space-y-6">
          <div className="space-y-8">
            


            {/* Intent Classification System */}
            <Card>
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Intent Classification System</CardTitle>
                    <CardDescription className="mt-1">
                      User message classification categories and intent types
                    </CardDescription>
                  </div>
                  <div className="bg-slate-600 text-white px-4 py-2 rounded-lg text-center">
                    <div className="text-sm font-medium">Total Intents</div>
                    <div className="text-lg font-bold">{DomainConstants.getAllIntentTypes().length}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Sales Intents */}
                  <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Sales Intents
                        <span className="text-sm font-normal text-muted-foreground">{DomainConstants.getSalesIntents().length} types</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {DomainConstants.getSalesIntents().map((intent) => (
                        <div key={intent} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-blue-200">
                          {intent}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Support Intents */}
                  <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Support Intents
                        <span className="text-sm font-normal text-muted-foreground">{DomainConstants.getSupportIntents().length} types</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {DomainConstants.getSupportIntents().map((intent) => (
                        <div key={intent} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-emerald-200">
                          {intent}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Qualification Intents */}
                  <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Qualification Intents
                        <span className="text-sm font-normal text-muted-foreground">{DomainConstants.getQualificationIntents().length} types</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {DomainConstants.getQualificationIntents().map((intent) => (
                        <div key={intent} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-purple-200">
                          {intent}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* General Intents */}
                  <Card className="border-l-4 border-l-gray-500 bg-gradient-to-br from-gray-50 to-gray-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        General Intents
                        <span className="text-sm font-normal text-muted-foreground">
                          {DomainConstants.getAllIntentTypes().filter(intent => DomainConstants.getIntentCategory(intent) === 'general').length} types
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {DomainConstants.getAllIntentTypes()
                        .filter(intent => DomainConstants.getIntentCategory(intent) === 'general')
                        .map((intent) => (
                          <div key={intent} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-gray-200">
                            {intent}
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Customer Journey Framework */}
            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl">Customer Journey Framework</CardTitle>
                <CardDescription>Progression stages and engagement classifications</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                
                {/* Journey Flow */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Complete Journey Flow</h4>
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {DomainConstants.getAllJourneyStages().map((stage, index, array) => (
                        <div key={stage} className="flex items-center gap-3">
                          <div className="group relative">
                            <div className={`
                              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                              ${index < 4 ? 'bg-blue-600 text-white' : 
                                index < 6 ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'}
                            `}>
                              {stage}
                            </div>
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                Stage {index + 1}
                              </div>
                            </div>
                          </div>
                          {index < array.length - 1 && (
                            <div className="w-6 h-0.5 bg-slate-400"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Engagement Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-900">Actively Engaged Stages</CardTitle>
                      <CardDescription className="text-blue-700">Prospects showing interest and engagement</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {DomainConstants.getActivelyEngagedStages()
                        .filter(stage => stage !== 'ready_to_buy')
                        .map((stage) => (
                          <div key={stage} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-blue-200">
                            {stage}
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-emerald-900">Sales Ready Stages</CardTitle>
                      <CardDescription className="text-emerald-700">Qualified prospects ready for sales handoff</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {DomainConstants.getSalesReadyStages().map((stage) => (
                        <div key={stage} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-emerald-200">
                          {stage}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Entity Extraction Framework */}
            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl">Entity Extraction Framework</CardTitle>
                <CardDescription>Information types extracted from user messages</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  <div className="space-y-6">
                    <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-orange-900">Core Business Entities</CardTitle>
                        <CardDescription className="text-orange-700">
                          Essential business information ({DomainConstants.getCoreBusinessEntities().length} types)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          {DomainConstants.getCoreBusinessEntities().map((entity) => (
                            <div key={entity} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-orange-200">
                              {entity}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-50 to-violet-100">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-violet-900">Advanced Entities</CardTitle>
                        <CardDescription className="text-violet-700">
                          Specialized information types ({DomainConstants.getAdvancedEntities().length} types)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          {DomainConstants.getAdvancedEntities().map((entity) => (
                            <div key={entity} className="bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono border border-violet-200">
                              {entity}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enumerated Value Sets */}
            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl">Enumerated Value Sets</CardTitle>
                <CardDescription>Predefined value collections for structured data extraction</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Priority & Urgency */}
                  <div className="space-y-4">
                    <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-red-900">Urgency Levels</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {DomainConstants.getUrgencyLevels().map((level) => (
                          <div key={level} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-red-100">
                            {level}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-amber-900">Severity Levels</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {DomainConstants.getSeverityLevels().map((level) => (
                          <div key={level} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-amber-100">
                            {level}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Communication & Contact */}
                  <div className="space-y-4">
                    <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-blue-900">Contact Methods</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {DomainConstants.getContactMethods().map((method) => (
                          <div key={method} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-blue-100">
                            {method}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-emerald-900">Event Types</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {DomainConstants.getEventTypes().map((type) => (
                          <div key={type} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-emerald-100">
                            {type}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Support & Issues */}
                  <div className="space-y-4">
                    <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-purple-900">Issue Types</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {DomainConstants.getIssueTypes().map((type) => (
                          <div key={type} className="bg-white/70 px-3 py-2 rounded text-sm font-mono border border-purple-100">
                            {type}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domain Statistics */}
            <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Domain Model Statistics</CardTitle>
                <CardDescription className="text-slate-700">Comprehensive overview of domain coverage and complexity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Intent Types', value: DomainConstants.getAllIntentTypes().length, icon: '🎯' },
                    { label: 'Journey Stages', value: DomainConstants.getAllJourneyStages().length, icon: '🗺️' },
                    { label: 'Core Entities', value: DomainConstants.getCoreBusinessEntities().length, icon: '💼' },
                    { label: 'Advanced Entities', value: DomainConstants.getAdvancedEntities().length, icon: '⚡' },
                    { label: 'Value Sets', value: 5, icon: '📋' },
                    { label: 'Total Values', value: DomainConstants.getUrgencyLevels().length + DomainConstants.getSeverityLevels().length + DomainConstants.getContactMethods().length + DomainConstants.getEventTypes().length + DomainConstants.getIssueTypes().length, icon: '📊' }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</div>
                      <div className="text-xs text-slate-600 font-medium leading-tight">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Business Rules Tab */}
        <TabsContent value="business-rules" className="space-y-6">
          <div className="space-y-8">
            


            {/* Lead Scoring System */}
            <Card>
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Lead Scoring Matrix</CardTitle>
                    <CardDescription className="mt-1">
                      Weighted point system for automated lead qualification
                    </CardDescription>
                  </div>
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-center">
                    <div className="text-sm font-medium">Qualification</div>
                    <div className="text-lg font-bold">70+ Points</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                
                {/* Scoring Formula */}
                <div className="mb-8">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Formula</div>
                  <div className="relative">
                    <div className="bg-muted text-slate-800 p-6 rounded-lg border font-mono text-sm leading-relaxed">
                      <div className="text-slate-600 text-xs mb-2">// Automated Lead Scoring Algorithm</div>
                      <div>
                        <span className="text-emerald-700 font-semibold">leadScore</span> = 
                        <span className="text-blue-700"> budget</span><span className="text-slate-500">(25)</span> + 
                        <span className="text-blue-700"> timeline</span><span className="text-slate-500">(20)</span> + 
                        <span className="text-blue-700"> company</span><span className="text-slate-500">(15)</span> + 
                        <span className="text-blue-700"> teamSize</span><span className="text-slate-500">(15)</span>
                      </div>
                      <div className="ml-20">
                        + <span className="text-blue-700">industry</span><span className="text-slate-500">(10)</span> + 
                        <span className="text-blue-700"> urgency</span><span className="text-slate-500">(10)</span> + 
                        <span className="text-blue-700"> role</span><span className="text-slate-500">(10)</span> + 
                        <span className="text-blue-700"> contact</span><span className="text-slate-500">(5)</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-xs text-slate-600 bg-background px-2 py-1 rounded border">
                      Max: 110 points
                    </div>
                  </div>
                </div>
                
                {/* Entity Values */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-red-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Critical Value Entities
                        <span className="text-sm font-normal text-muted-foreground">15-25 pts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: 'Budget Information', points: 25 },
                        { label: 'Project Timeline', points: 20 },
                        { label: 'Company Details', points: 15 },
                        { label: 'Team Size', points: 15 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-lg">
                          <span className="text-sm font-medium">{item.label}</span>
                          <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                            {item.points}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Standard Value Entities
                        <span className="text-sm font-normal text-muted-foreground">10 pts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: 'Industry Type', points: 10 },
                        { label: 'Urgency Level', points: 10 },
                        { label: 'User Role', points: 10 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-lg">
                          <span className="text-sm font-medium">{item.label}</span>
                          <div className="bg-amber-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                            {item.points}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Basic Information
                        <span className="text-sm font-normal text-muted-foreground">5 pts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-lg">
                        <span className="text-sm font-medium">Contact Method</span>
                        <div className="bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          5
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-white border-2 border-emerald-200 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-700 mb-1">70+</div>
                          <div className="text-sm text-emerald-600 font-medium">Qualification Threshold</div>
                          <div className="text-xs text-emerald-500 mt-1">Triggers sales handoff</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Flow Engine */}
            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl">Conversation Flow Engine</CardTitle>
                <CardDescription>Journey progression logic and decision thresholds</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  
                  {/* Journey Paths */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Journey Progression Paths</h4>
                      
                      <div className="space-y-4">
                        <div className="relative p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                          <div className="text-sm font-semibold text-blue-900 mb-3">Standard Engagement Flow</div>
                          <div className="flex flex-wrap items-center gap-2">
                            {['visitor', 'curious', 'interested', 'evaluating'].map((stage, index, array) => (
                              <div key={stage} className="flex items-center gap-2">
                                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                  {stage}
                                </div>
                                {index < array.length - 1 && (
                                  <div className="w-4 h-0.5 bg-blue-400"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="relative p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                          <div className="text-sm font-semibold text-emerald-900 mb-3">Sales Handoff Trigger</div>
                          <div className="flex items-center gap-2">
                            <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                              ready_to_buy
                            </div>
                            <div className="w-4 h-0.5 bg-emerald-400"></div>
                            <div className="bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-medium">
                              qualified_lead
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decision Thresholds */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Decision Thresholds</h4>
                      
                      <div className="space-y-3">
                        {[
                          { label: 'Intent Confidence', value: 70, color: 'blue' },
                          { label: 'Stage Transition', value: 75, color: 'emerald' },
                          { label: 'Persona Inference', value: 60, color: 'purple' },
                        ].map((threshold) => (
                          <div key={threshold.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">{threshold.label}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full bg-${threshold.color}-500 transition-all duration-300`}
                                  style={{ width: `${threshold.value}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-mono font-bold min-w-[3rem] text-right">
                                {threshold.value}%
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-sm font-medium">Max Conversation Turns</span>
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            20
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Automated Behaviors */}
            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl">Automated System Behaviors</CardTitle>
                <CardDescription>Self-executing rules and response logic</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[
                    {
                      title: 'Intent Classification Engine',
                      description: 'Analyzes user messages and routes conversations',
                      rules: [
                        'Requires 70% confidence threshold for classification',
                        'Falls back to "unknown" intent below threshold',
                        'Routes to appropriate response templates automatically'
                      ],
                      color: 'blue'
                    },
                    {
                      title: 'Lead Qualification System',
                      description: 'Automatically scores and qualifies prospects',
                      rules: [
                        'Real-time scoring based on extracted entities',
                        'Triggers sales handoff at 70+ point threshold',
                        'Continues nurturing below qualification threshold'
                      ],
                      color: 'emerald'
                    },
                    {
                      title: 'Journey Progression Logic',
                      description: 'Manages conversation flow and stage advancement',
                      rules: [
                        'Unlocks advanced questions as users progress',
                        'Tracks engagement depth and commitment signals',
                        'Adapts conversation strategy by stage'
                      ],
                      color: 'purple'
                    },
                    {
                      title: 'Safety & Limits Enforcement',
                      description: 'Prevents infinite loops and ensures handoffs',
                      rules: [
                        'Maximum 20 turns per conversation session',
                        '5-minute inactivity timeout with graceful exit',
                        '2-second response time target with fallbacks'
                      ],
                      color: 'red'
                    }
                  ].map((behavior) => (
                    <Card key={behavior.title} className={`border-l-4 border-l-${behavior.color}-500`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{behavior.title}</CardTitle>
                        <CardDescription className="text-sm">{behavior.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {behavior.rules.map((rule, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <div className={`w-1.5 h-1.5 bg-${behavior.color}-500 rounded-full mt-2 flex-shrink-0`}></div>
                              <span className="text-muted-foreground">{rule}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status Dashboard */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-emerald-900">System Configuration Status</CardTitle>
                    <CardDescription className="text-emerald-700">Real-time validation of business logic components</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Intent Types Mapped',
                                             value: DomainConstants.getSalesIntents().length + 
                              DomainConstants.getSupportIntents().length + 
                              DomainConstants.getQualificationIntents().length,
                      total: DomainConstants.getAllIntentTypes().length
                    },
                    {
                      label: 'Journey Stages',
                      value: DomainConstants.getAllJourneyStages().length,
                      total: null
                    },
                                         {
                       label: 'Scoring Entities',
                       value: Object.keys(DomainConstants.getLeadScoringRules()).length,
                       total: null
                     },
                    {
                      label: 'Max Lead Score',
                      value: 110,
                      total: null
                    }
                  ].map((metric) => (
                    <div key={metric.label} className="bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-800 mb-1">
                        {metric.value}
                        {metric.total && <span className="text-lg text-emerald-600">/{metric.total}</span>}
                      </div>
                      <div className="text-xs text-emerald-600 font-medium leading-tight">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {isEditing && (
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Parameters'}
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );} 
