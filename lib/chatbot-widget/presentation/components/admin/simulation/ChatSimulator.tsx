'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';
import { ChatApiDebugPanel } from './ChatApiDebugPanel';
import { ChatConfigurationPanel } from './ChatConfigurationPanel';
import { ChatInterface } from './ChatInterface';
import { useChatSimulation } from '../../../hooks/useChatSimulation';

// Re-export the results panel that was already extracted
function ChatSimulationResultsPanel({ simulationResults }: { simulationResults: any }) {
  if (!simulationResults) return null;
  
  const { Card, CardContent, CardHeader, CardTitle } = require('@/components/ui/card');
  const { Badge } = require('@/components/ui/badge');
  const { Separator } = require('@/components/ui/separator');
  const { BarChart3 } = require('lucide-react');

  return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Simulation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{simulationResults.totalMessages}</div>
                        <div className="text-sm text-muted-foreground">Total Messages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {simulationResults.performanceMetrics.averageResponseTime}ms
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Response Time</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Lead Captured</span>
                        <Badge variant={simulationResults.leadCaptured ? 'default' : 'secondary'}>
                          {simulationResults.leadCaptured ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Accuracy Score</span>
                        <span>{simulationResults.qualityAssessment.accuracyScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>User Satisfaction</span>
                        <span>{simulationResults.qualityAssessment.userSatisfactionScore}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
  );
}

interface ChatSimulatorProps {
  chatbotConfigId: string;
  onComplete?: (results: any) => void;
}

export function ChatSimulator({ chatbotConfigId, onComplete }: ChatSimulatorProps) {
  const {
    // State
    isActive,
    messages,
    currentMessage,
    isLoading,
    userProfile,
    simulationResults,
    error,
    apiDebugInfo,
    
    // Actions
    setCurrentMessage,
    setUserProfile,
    startSimulation,
    stopSimulation,
    sendMessage,
  } = useChatSimulation(chatbotConfigId, onComplete);



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuration Panel */}
      <ChatConfigurationPanel
        userProfile={userProfile}
        isActive={isActive}
        isLoading={isLoading}
        onUserProfileChange={setUserProfile}
        onStartSimulation={startSimulation}
        onStopSimulation={stopSimulation}
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Vertical Layout: Chat Interface Above Debug Panel */}
      {(isActive || messages.length > 0) && (
        <div className="flex flex-col space-y-6">
          {/* Chat Interface - Top */}
          <div className="w-full">
            <ChatInterface
              messages={messages}
              currentMessage={currentMessage}
              isActive={isActive}
              isLoading={isLoading}
              onCurrentMessageChange={setCurrentMessage}
              onSendMessage={sendMessage}
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* Debug Panel - Below Chat */}
          <div className="w-full">
            {apiDebugInfo ? (
              <ChatApiDebugPanel apiDebugInfo={apiDebugInfo} />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4">
                <p className="text-sm text-gray-500">No debug information available yet. Send a message to see API debug details.</p>
              </div>
            )}
          </div>

          {/* Simulation Results - Bottom */}
          <div className="w-full">
            <ChatSimulationResultsPanel simulationResults={simulationResults} />
          </div>
        </div>
      )}
    </div>
  );
} 