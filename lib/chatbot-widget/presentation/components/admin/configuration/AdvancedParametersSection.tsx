// Advanced Parameters Section
// Main component for advanced chatbot parameters configuration
// Single responsibility: Orchestrate parameter configuration UI

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { useChatbotConfiguration } from '../../../hooks/useChatbotConfiguration';
import { useAdvancedParameters } from '../../../hooks/useAdvancedParameters';
import { TabConfig } from '../../../types/AdvancedParametersTypes';

// Import section components
import { AiConfigurationSection } from '../parameter-sections/AiConfigurationSection';
import { ContextWindowSection } from '../parameter-sections/ContextWindowSection';
import { IntentEntitiesSection } from '../parameter-sections/IntentEntitiesSection';
import { ConversationFlowSection } from '../parameter-sections/ConversationFlowSection';
import { PerformanceSection } from '../parameter-sections/PerformanceSection';
import { DomainConstantsSection } from '../parameter-sections/DomainConstantsSection';
// Removed BusinessRulesSection import - component deleted per user requirements

const TAB_CONFIGS: TabConfig[] = [
  { id: 'ai-config', label: 'AI Config', icon: Brain },
  { id: 'context', label: 'Context', icon: MessageSquare },
  { id: 'intent-entities', label: 'Intent & Entities', icon: Target },
  { id: 'conversation', label: 'Conversation', icon: Clock },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'domain-constants', label: 'Domain Constants', icon: Database },
  { id: 'business-rules', label: 'Business Rules', icon: GitBranch },
];

export function AdvancedParametersSection() {
  const [activeTab, setActiveTab] = useState('ai-config');

  // Use consolidated hook for config management
  const { config: existingConfig, isLoading, error } = useChatbotConfiguration({ 
    enableFormState: false 
  });

  // Use custom hook for parameters management - now follows same pattern as other working components
  const {
    parameters,
    updateParameter,
    isEditing,
    setIsEditing,
    handleSave,
    updateMutation,
  } = useAdvancedParameters({
    existingConfig
  });

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

  const sectionProps = { parameters, updateParameter, isEditing };

  return (
    <div className="space-y-6 max-w-none">
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
          {TAB_CONFIGS.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* AI Configuration Tab */}
        <TabsContent value="ai-config" className="space-y-4">
          <AiConfigurationSection {...sectionProps} />
        </TabsContent>

        {/* Context Window Tab */}
        <TabsContent value="context" className="space-y-4">
          <ContextWindowSection {...sectionProps} />
        </TabsContent>

        {/* Intent & Entities Tab */}
        <TabsContent value="intent-entities" className="space-y-4">
          <IntentEntitiesSection {...sectionProps} />
        </TabsContent>

        {/* Conversation Flow Tab */}
        <TabsContent value="conversation" className="space-y-4">
          <ConversationFlowSection {...sectionProps} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <PerformanceSection {...sectionProps} />
        </TabsContent>

        {/* Domain Constants Tab */}
        <TabsContent value="domain-constants" className="space-y-4">
          <DomainConstantsSection />
        </TabsContent>

        {/* Business Rules Tab - Removed per user requirements */}
        <TabsContent value="business-rules" className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Business rules are now handled purely through API-driven decisions and log file tracking.
              No manual business rule configuration is available.
            </p>
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
  );
} 
