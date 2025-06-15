'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, MessageSquare, CheckCircle, Lightbulb } from 'lucide-react';
import { ChatSimulator } from '@/lib/chatbot-widget/presentation/components/admin/simulation/ChatSimulator';
import { TestScenarios } from '@/lib/chatbot-widget/presentation/components/admin/testing/TestScenarios';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { useQuery } from '@tanstack/react-query';
import { getChatbotConfigByOrganization } from '@/lib/chatbot-widget/presentation/actions/configActions';

export default function TestingPage() {
  const { activeOrganizationId } = useOrganization();
  
  // Query for existing chatbot config
  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', activeOrganizationId],
    queryFn: () => activeOrganizationId ? getChatbotConfigByOrganization(activeOrganizationId) : null,
    enabled: !!activeOrganizationId,
  });

  const existingConfig = configResult?.success ? configResult.data : null;

  const handleSimulationComplete = (results: any) => {
    console.log('Simulation completed:', results);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Loading chatbot configuration...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error || !existingConfig) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            No chatbot configuration found. Please create a configuration first in the Config tab.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Chat Simulator */}
        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<div>Loading simulator...</div>}>
              <ChatSimulator 
                chatbotConfigId={existingConfig.id}
                onComplete={handleSimulationComplete}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Testing Guide */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              <CardTitle>Testing Best Practices</CardTitle>
            </div>
            <CardDescription>
              Follow these guidelines to effectively test your chatbot configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Knowledge Base Testing</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Ask FAQ questions verbatim</li>
                  <li>• Test variations of common questions</li>
                  <li>• Verify company information accuracy</li>
                  <li>• Test product/service descriptions</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Lead Capture Testing</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Express interest in products/services</li>
                  <li>• Ask for demos or trials</li>
                  <li>• Provide contact information</li>
                  <li>• Test qualification questions</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Conversation Flow</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Test natural conversation progression</li>
                  <li>• Check response relevance</li>
                  <li>• Verify tone consistency</li>
                  <li>• Test edge cases and off-topic questions</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Performance Testing</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Monitor response times</li>
                  <li>• Test with different user profiles</li>
                  <li>• Verify error handling</li>
                  <li>• Check message limits</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Scenarios */}
        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<div>Loading test scenarios...</div>}>
              <TestScenarios 
                chatbotConfigId={existingConfig.id}
                onRunScenario={(scenario) => {
                  console.log('Running scenario:', scenario.name);
                }}
                onScenarioComplete={(result) => {
                  console.log('Scenario completed:', result);
                }}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 