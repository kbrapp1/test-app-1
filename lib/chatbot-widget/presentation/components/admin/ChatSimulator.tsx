'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  Send, 
  Bot, 
  User, 
  Clock, 
  MessageSquare,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';

// Simplified types for the component (should match domain types)
interface SimulatedUserProfile {
  name: string;
  intent: 'browsing' | 'shopping' | 'support' | 'lead_qualification';
  engagementLevel: 'low' | 'medium' | 'high';
  previousKnowledge: 'none' | 'basic' | 'advanced';
  leadReadiness: 'cold' | 'warm' | 'hot';
}

interface TestingGoal {
  type: 'knowledge_validation' | 'lead_capture' | 'conversation_flow' | 'response_quality';
  criteria: string;
  expectedOutcome: string;
}

interface ChatMessage {
  id: string;
  messageType: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  processingTime?: number;
}

interface SimulationResults {
  completedSuccessfully: boolean;
  totalMessages: number;
  leadCaptured: boolean;
  goalsAchieved: Array<{ goalId: string; achieved: boolean; notes?: string }>;
  performanceMetrics: {
    averageResponseTime: number;
    totalDuration: number;
    messagesPerMinute: number;
    errorCount: number;
  };
  qualityAssessment: {
    relevanceScore: number;
    accuracyScore: number;
    userSatisfactionScore: number;
    knowledgeBaseUtilization: number;
  };
}

interface ChatSimulatorProps {
  chatbotConfigId: string;
  onComplete?: (results: SimulationResults) => void;
}

const defaultUserProfile: SimulatedUserProfile = {
  name: 'Test User',
  intent: 'browsing',
  engagementLevel: 'medium',
  previousKnowledge: 'basic',
  leadReadiness: 'warm',
};

const defaultTestingGoals: TestingGoal[] = [
  {
    type: 'knowledge_validation',
    criteria: 'Bot provides relevant answers from knowledge base',
    expectedOutcome: 'Accurate responses to FAQ questions',
  },
  {
    type: 'conversation_flow',
    criteria: 'Natural conversation progression',
    expectedOutcome: 'Smooth dialogue with appropriate follow-ups',
  },
];

export function ChatSimulator({ chatbotConfigId, onComplete }: ChatSimulatorProps) {
  const [isActive, setIsActive] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<SimulatedUserProfile>(defaultUserProfile);
  const [testingGoals, setTestingGoals] = useState<TestingGoal[]>(defaultTestingGoals);
  const [responseMode, setResponseMode] = useState<'mock' | 'live'>('mock');
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const startSimulation = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // TODO: Replace with actual service call
      // const context = ChatSimulationContext.createTesting(
      //   chatbotConfigId,
      //   userProfile,
      //   testingGoals
      // );
      // const simulation = await chatSimulationService.startSimulation(context);
      
      // Mock simulation start
      const mockSimulationId = `sim_${Date.now()}`;
      setSimulationId(mockSimulationId);
      setIsActive(true);
      setMessages([{
        id: 'greeting',
        messageType: 'bot',
        content: `Hi there! I'm your chatbot assistant. I'm ready to help you test our conversation flow. What would you like to know?`,
        timestamp: new Date(),
      }]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const stopSimulation = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual service call
      // if (simulationId) {
      //   const results = await chatSimulationService.completeSimulation(simulationId);
      //   setSimulationResults(results.results || null);
      //   onComplete?.(results.results);
      // }

      // Mock simulation completion
      const mockResults: SimulationResults = {
        completedSuccessfully: true,
        totalMessages: messages.length,
        leadCaptured: false,
        goalsAchieved: testingGoals.map(goal => ({
          goalId: goal.type,
          achieved: Math.random() > 0.3,
          notes: goal.criteria,
        })),
        performanceMetrics: {
          averageResponseTime: 1200,
          totalDuration: Math.floor(Date.now() / 1000) - Math.floor(Date.now() / 1000),
          messagesPerMinute: messages.length > 0 ? messages.length * 2 : 0,
          errorCount: 0,
        },
        qualityAssessment: {
          relevanceScore: 85,
          accuracyScore: 90,
          userSatisfactionScore: 80,
          knowledgeBaseUtilization: 75,
        },
      };
      
      setSimulationResults(mockResults);
      onComplete?.(mockResults);
      setIsActive(false);
      setSimulationId(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !isActive || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      messageType: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual service call
      // const { response } = await chatSimulationService.sendMessage(simulationId!, userMessage.content);
      
      // Mock bot response
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const mockResponse = generateMockResponse(userMessage.content);
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        messageType: 'bot',
        content: mockResponse,
        timestamp: new Date(),
        processingTime: 800 + Math.random() * 400,
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        messageType: 'system',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return "I'd be happy to help you with pricing information. Our basic plan starts at $29/month, and our premium plan is $99/month. Would you like me to go over the features included?";
    }
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('trial')) {
      return "Absolutely! I can set up a free demo for you. To get started, I'll need your email address and company name. What's the best email to reach you at?";
    }
    
    if (lowerMessage.includes('feature') || lowerMessage.includes('what can')) {
      return "Our platform includes automated lead scoring, conversation analytics, knowledge base management, and seamless WordPress integration. Which of these features interests you most?";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! You can ask me about our features, pricing, implementation, or anything else. Our support team is also available 24/7 if you need personalized assistance.";
    }
    
    if (lowerMessage.includes('@') || lowerMessage.includes('email')) {
      return "Thank you for providing your contact information! Someone from our team will reach out within 24 hours to schedule your demo. In the meantime, is there anything else you'd like to know about our chatbot platform?";
    }

    return "I understand what you're asking about. Let me help you with that. Our chatbot platform is designed to help businesses like yours generate more qualified leads through intelligent conversations. What specific aspect would you like to learn more about?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuration Panel */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User Profile</label>
            <Select 
              value={userProfile.intent} 
              onValueChange={(value) => setUserProfile(prev => ({ ...prev, intent: value as any }))}
              disabled={isActive}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="browsing">Browsing</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="lead_qualification">Lead Qualification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Response Mode</label>
            <Select 
              value={responseMode} 
              onValueChange={(value) => setResponseMode(value as 'mock' | 'live')}
              disabled={isActive}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock Responses</SelectItem>
                <SelectItem value="live">Live AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          {!isActive ? (
            <Button onClick={startSimulation} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Starting...' : 'Start Simulation'}
            </Button>
          ) : (
            <Button onClick={stopSimulation} variant="destructive" disabled={isLoading}>
              <Square className="h-4 w-4 mr-2" />
              {isLoading ? 'Stopping...' : 'Stop Simulation'}
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Chat Interface */}
      {(isActive || messages.length > 0) && (
        <div>
            <div className="space-y-4">
              {/* Messages */}
              <ScrollArea className="h-96 w-full rounded border p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.messageType === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.messageType === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.messageType === 'bot'
                            ? 'bg-muted'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.messageType === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.processingTime && (
                            <span className="text-xs opacity-70">
                              ({message.processingTime}ms)
                            </span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input */}
              {isActive && (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                  />
                  <Button onClick={sendMessage} disabled={isLoading || !currentMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
        </div>
      )}

      {/* Results */}
      {simulationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Performance Metrics</h4>
                <div className="text-sm space-y-1">
                  <div>Messages: {simulationResults.totalMessages}</div>
                  <div>Avg Response Time: {simulationResults.performanceMetrics.averageResponseTime}ms</div>
                  <div>Lead Captured: {simulationResults.leadCaptured ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Quality Assessment</h4>
                <div className="text-sm space-y-1">
                  <div>Relevance: {simulationResults.qualityAssessment.relevanceScore}%</div>
                  <div>Accuracy: {simulationResults.qualityAssessment.accuracyScore}%</div>
                  <div>Knowledge Utilization: {simulationResults.qualityAssessment.knowledgeBaseUtilization}%</div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium">Testing Goals</h4>
              <div className="space-y-2">
                {simulationResults.goalsAchieved.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {goal.achieved ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{goal.goalId}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 