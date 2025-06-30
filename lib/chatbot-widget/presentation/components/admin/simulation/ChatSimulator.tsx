/**
 * ChatSimulator Component
 * 
 * AI INSTRUCTIONS:
 * - Real chatbot simulation using actual API pipeline
 * - All detailed results logged to file for QA analysis
 * - Keep under 250 lines following @golden-rule patterns
 * - Single responsibility: Execute real chatbot pipeline and log results
 * - Use organization context for session creation
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Play, Square } from 'lucide-react';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { createSimulationSession, sendSimulationMessage, endSimulationSession, SimulationSession } from '../../../actions/simulationActions';

interface ChatMessage {
  id: string;
  messageType: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  responseTime?: number;
}

export function ChatSimulator() {
  const { activeOrganizationId } = useOrganization();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<SimulationSession | null>(null);

  const handleStartSimulation = async () => {
    if (!activeOrganizationId) {
      setMessages([{
        id: '1',
        messageType: 'system',
        content: 'Error: No active organization found. Please select an organization.',
        timestamp: new Date()
      }]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Create real chat session using actual domain logic
      const result = await createSimulationSession(activeOrganizationId);
      
      if (result.success && result.session) {
        setCurrentSession(result.session);
        setIsActive(true);
        setMessages([{
          id: '1',
          messageType: 'system',
          content: `✅ Real simulation session created - All pipeline results logged to file\nSession ID: ${result.session.sessionId}\nChatbot Config: ${result.session.chatbotConfigId}`,
          timestamp: new Date()
        }]);
      } else {
        setMessages([{
          id: '1',
          messageType: 'system',
          content: `❌ Failed to create session: ${result.error}`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages([{
        id: '1',
        messageType: 'system',
        content: `❌ Error creating session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSimulation = async () => {
    if (currentSession) {
      try {
        await endSimulationSession(currentSession.sessionId);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          messageType: 'system',
          content: '✅ Simulation session ended - All data logged to file',
          timestamp: new Date()
        }]);
      } catch (error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          messageType: 'system',
          content: `❌ Error ending session: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }]);
      }
    }
    
    setIsActive(false);
    setCurrentSession(null);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !isActive || !currentSession) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      messageType: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = currentMessage;
    setCurrentMessage('');

    try {
      // Send message through real API pipeline
      const result = await sendSimulationMessage(currentSession.sessionId, messageContent);
      
      if (result.success) {
        // Add bot response with timing information
        const botMessage: ChatMessage = {
          id: result.botMessageId,
          messageType: 'bot',
          content: result.botResponse,
          timestamp: new Date(),
          responseTime: result.totalPromptTimeSeconds
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          messageType: 'system',
          content: `❌ Pipeline error: ${result.error}`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        messageType: 'system',
        content: `❌ API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Interface
            </CardTitle>
            <CardDescription>
              Simulate user prompts as if using chatbot widget on website
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={handleStartSimulation} disabled={isLoading}>
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </Button>
            ) : (
              <Button onClick={handleStopSimulation} variant="destructive" disabled={isLoading}>
                <Square className="h-4 w-4 mr-2" />
                Stop Simulation
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Messages */}
            <div className="h-96 border rounded-lg p-4 overflow-y-auto space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.messageType === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.messageType === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.messageType === 'system'
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                      {message.responseTime && ` (${message.responseTime}s)`}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            {isActive && currentSession && (
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!currentMessage.trim() || isLoading}
                  size="sm"
                >
                  Send
                </Button>
              </div>
            )}
          </div>
                 </CardContent>
       </Card>
   );
} 