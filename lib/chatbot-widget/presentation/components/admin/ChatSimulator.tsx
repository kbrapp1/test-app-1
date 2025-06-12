'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Play, 
  Square, 
  XCircle, 
  Clock,
  DollarSign,
  MessageSquare,
  Zap,
  Eye,
  Code,
  BarChart3,
  CheckCircle
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

interface ApiDebugInfo {
  requestData: {
    model: string;
    messagesCount: number;
    temperature: number;
    maxTokens: number;
    timestamp: string;
    systemPrompt?: string;
    userMessage: string;
    fullPrompt?: string;
  };
  responseData: {
    id: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    responseLength: number;
    processingTime: number;
    fullResponse?: string;
  };
  costData: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: string;
    model: string;
  };
  // Enhanced debugging information
  intentClassification?: {
    detectedIntent: string;
    confidence: number;
    alternativeIntents: Array<{ intent: string; confidence: number }>;
    category: 'sales' | 'support' | 'qualification' | 'general';
    threshold: number;
    isAmbiguous: boolean;
  };
  entityExtraction?: {
    extractedEntities: Array<{
      type: string;
      value: string;
      confidence: number;
      category: 'core_business' | 'advanced' | 'contact';
    }>;
    totalEntitiesFound: number;
    extractionMode: 'basic' | 'comprehensive' | 'custom';
  };
  leadScoring?: {
    currentScore: number;
    maxPossibleScore: number;
    qualificationThreshold: number;
    isQualified: boolean;
    scoreBreakdown: Array<{
      entityType: string;
      points: number;
      reason: string;
    }>;
    previousScore: number;
    scoreChange: number;
  };
  journeyProgression?: {
    currentStage: string;
    previousStage: string;
    stageConfidence: number;
    transitionReason: string;
    engagementCategory: 'actively_engaged' | 'sales_ready' | 'general';
    progressionPath: string[];
  };
  businessRules?: {
    rulesTriggered: Array<{
      ruleName: string;
      condition: string;
      action: string;
      result: 'success' | 'failed' | 'skipped';
    }>;
    thresholds: {
      intentConfidence: number;
      stageTransition: number;
      personaInference: number;
    };
    automatedBehaviors: Array<{
      behavior: string;
      triggered: boolean;
      reason: string;
    }>;
  };
  performance?: {
    componentTimings: {
      intentClassification: number;
      entityExtraction: number;
      leadScoring: number;
      responseGeneration: number;
      total: number;
    };
    cacheHits: number;
    dbQueries: number;
    apiCalls: number;
  };
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
  const [apiDebugInfo, setApiDebugInfo] = useState<ApiDebugInfo | null>(null);

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
      setIsLoading(true);
      setError(null);
      setMessages([]);
      setSimulationResults(null);
      
      // Generate proper UUID for session
      const mockSimulationId = crypto.randomUUID();
      
      // Create a new chat session in the database
      const response = await fetch('/api/chatbot-widget/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotConfigId: chatbotConfigId,
          visitorId: `sim_user_${Date.now()}`,
          initialContext: {
            previousVisits: 0,
            pageViews: ['/simulator'],
            conversationSummary: '',
            topics: [],
            interests: [],
            engagementScore: 0,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat session');
      }
      
      const sessionData = await response.json();
      setSimulationId(sessionData.sessionId);
      setIsActive(true);

      // Add initial system message
      setMessages([{
        id: 'system_start',
        messageType: 'system',
        content: `✅ Simulation started with ${responseMode === 'live' ? 'Live AI' : 'Mock'} responses. Session ID: ${sessionData.sessionId}`,
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
      let botResponse: string;
      let processingTime: number;
      
      if (responseMode === 'live') {
        // Use real OpenAI API
        const startTime = Date.now();
        const response = await fetch('/api/chatbot-widget/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            sessionId: simulationId,
            chatbotConfigId: chatbotConfigId,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }
        
        const data = await response.json();
        botResponse = data.botResponse;
        processingTime = Date.now() - startTime;
        
        // Capture API debug information if available
        if (data.debugInfo) {
          setApiDebugInfo({
            requestData: {
              model: data.debugInfo.model,
              messagesCount: data.debugInfo.messagesCount || 0,
              temperature: data.debugInfo.temperature || 0.7,
              maxTokens: data.debugInfo.maxTokens || 1000,
              timestamp: data.debugInfo.timestamp || new Date().toISOString(),
              systemPrompt: data.debugInfo.systemPrompt,
              userMessage: userMessage.content,
              fullPrompt: data.debugInfo.fullPrompt,
            },
            responseData: {
              id: data.debugInfo.responseId || 'unknown',
              model: data.debugInfo.responseModel,
              usage: {
                promptTokens: data.debugInfo.promptTokens || 0,
                completionTokens: data.debugInfo.completionTokens || 0,
                totalTokens: data.debugInfo.totalTokens || 0,
              },
              responseLength: data.botResponse?.length || 0,
              processingTime: processingTime,
              fullResponse: data.debugInfo.fullResponse,
            },
            costData: {
              inputTokens: data.debugInfo.promptTokens || 0,
              outputTokens: data.debugInfo.completionTokens || 0,
              totalTokens: data.debugInfo.totalTokens || 0,
              estimatedCost: data.debugInfo.estimatedCost || '$0.00',
              model: data.debugInfo.responseModel,
            },
            // Enhanced debugging information
            intentClassification: data.debugInfo.intentClassification ? {
              detectedIntent: data.debugInfo.intentClassification.detectedIntent,
              confidence: data.debugInfo.intentClassification.confidence,
              category: data.debugInfo.intentClassification.category,
              threshold: data.debugInfo.intentClassification.threshold,
              isAmbiguous: data.debugInfo.intentClassification.isAmbiguous,
              alternativeIntents: data.debugInfo.intentClassification.alternativeIntents || [],
            } : undefined,
            entityExtraction: data.debugInfo.entityExtraction ? {
              extractedEntities: data.debugInfo.entityExtraction.extractedEntities.map((entity: any) => ({
                type: entity.type,
                value: entity.value,
                confidence: entity.confidence,
                category: entity.category
              })),
              totalEntitiesFound: data.debugInfo.entityExtraction.totalEntitiesFound,
              extractionMode: data.debugInfo.entityExtraction.extractionMode,
            } : undefined,
            leadScoring: data.debugInfo.leadScoring ? {
              currentScore: data.debugInfo.leadScoring.currentScore,
              maxPossibleScore: data.debugInfo.leadScoring.maxPossibleScore,
              qualificationThreshold: data.debugInfo.leadScoring.qualificationThreshold,
              isQualified: data.debugInfo.leadScoring.isQualified,
              scoreBreakdown: data.debugInfo.leadScoring.scoreBreakdown.map((item: any) => ({
                entityType: item.component, // Map component to entityType
                points: item.points,
                reason: item.reason,
              })),
              previousScore: data.debugInfo.leadScoring.previousScore,
              scoreChange: data.debugInfo.leadScoring.scoreChange,
            } : undefined,
            journeyProgression: data.debugInfo.journeyProgression ? {
              currentStage: data.debugInfo.journeyProgression.currentStage,
              previousStage: 'visitor', // Default previous stage
              stageConfidence: data.debugInfo.journeyProgression.confidence,
              transitionReason: 'User progression through conversation',
              engagementCategory: data.debugInfo.journeyProgression.isSalesReady ? 'sales_ready' : 'actively_engaged',
              progressionPath: data.debugInfo.journeyProgression.progression?.map((p: any) => p.stage) || [],
            } : undefined,
            businessRules: data.debugInfo.businessRules ? {
              rulesTriggered: data.debugInfo.businessRules.map((rule: any) => ({
                ruleName: rule.rule,
                condition: rule.threshold,
                action: rule.action,
                result: rule.triggered ? 'success' : 'skipped',
              })),
              thresholds: {
                intentConfidence: 0.7,
                stageTransition: 0.75,
                personaInference: 0.6,
              },
              automatedBehaviors: data.debugInfo.businessRules.filter((rule: any) => rule.triggered).map((rule: any) => ({
                behavior: rule.rule,
                triggered: rule.triggered,
                reason: rule.reason,
              })),
            } : undefined,
            performance: data.debugInfo.performance ? {
              componentTimings: data.debugInfo.performance.componentTimings,
              cacheHits: data.debugInfo.performance.cacheHits,
              dbQueries: data.debugInfo.performance.dbQueries,
              apiCalls: data.debugInfo.performance.apiCalls,
            } : undefined,
          });
        }
      } else {
        // Use mock responses
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        botResponse = generateMockResponse(userMessage.content);
        processingTime = 800 + Math.random() * 400;
      }
      
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        messageType: 'bot',
        content: botResponse,
        timestamp: new Date(),
        processingTime,
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

      {/* Split Layout: Chat + Debug Panel */}
      {(isActive || messages.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Interface - Left Side */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat Simulator
                </CardTitle>
                <CardDescription>
                  {isActive ? (
                    <Badge variant="default" className="w-fit">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Session
                      </div>
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Stopped</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Messages */}
                <ScrollArea className="h-96 w-full rounded border p-4 mb-4">
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
                              : message.messageType === 'system'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs opacity-70 mt-1 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {message.timestamp.toLocaleTimeString()}
                            {message.processingTime && (
                              <span>({message.processingTime}ms)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                {isActive && (
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
                      onClick={sendMessage} 
                      disabled={!currentMessage.trim() || isLoading}
                      size="sm"
                    >
                      Send
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Debug Panel - Right Side */}
          <div className="space-y-4">
            {/* API Debug Information */}
            {apiDebugInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    API Debug Information
                  </CardTitle>
                  <CardDescription>
                    Real-time API call details and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[440px] w-full">
                    <div className="space-y-6 pr-4">
                      
                      {/* Processing Pipeline Header */}
                      <div className="border-b pb-2">
                        <h3 className="text-lg font-semibold text-primary">Two-API-Call Processing Pipeline</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Real-time analysis of the dual OpenAI API call architecture from user input to response delivery
                        </p>
                      </div>

                      {/* Step 1: User Input */}
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                          User Input Received
                        </h4>
                        <div className="space-y-2">
                          <div className="bg-white dark:bg-gray-900 rounded p-3 border">
                            <div className="text-sm font-mono break-words">
                              "{apiDebugInfo.requestData.userMessage}"
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong>Timestamp:</strong> {new Date(apiDebugInfo.requestData.timestamp).toLocaleTimeString()} | 
                            <strong> Length:</strong> {apiDebugInfo.requestData.userMessage?.length || 0} characters
                          </div>
                        </div>
                      </div>

                      {/* Step 2: First OpenAI API Call - Function Calling for Analysis */}
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800 dark:text-green-200">
                          <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                          First OpenAI API Call - Intent Analysis & Function Calling
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
                            <div className="text-sm">
                              <strong>Business Logic:</strong> The system makes its first OpenAI API call using function calling to analyze the user's message. This call produces intent classification, entity extraction, lead scoring, and journey progression analysis. This is the "intelligence gathering" API call.
                            </div>
                            
                            {/* Intent Classification Results */}
                            {apiDebugInfo.intentClassification && (
                              <div className="border-t pt-2">
                                <strong className="text-sm text-green-700 dark:text-green-300">Intent Classification Results:</strong>
                                <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <strong>Detected Intent:</strong>
                                      <Badge variant={apiDebugInfo.intentClassification.confidence >= apiDebugInfo.intentClassification.threshold ? "default" : "secondary"}>
                                        {apiDebugInfo.intentClassification.detectedIntent}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div><strong>Confidence:</strong> {(apiDebugInfo.intentClassification.confidence * 100).toFixed(1)}%</div>
                                  <div><strong>Business Category:</strong> {apiDebugInfo.intentClassification.category}</div>
                                  <div><strong>Threshold Required:</strong> {(apiDebugInfo.intentClassification.threshold * 100).toFixed(0)}%</div>
                                </div>
                                {apiDebugInfo.intentClassification.isAmbiguous && (
                                  <div className="text-orange-600 text-sm bg-orange-50 dark:bg-orange-950/20 p-2 rounded mt-2">
                                    ⚠ <strong>Ambiguous Intent:</strong> Confidence below threshold - may trigger clarification questions
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Entity Extraction Results */}
                            {apiDebugInfo.entityExtraction && (
                              <div className="border-t pt-2">
                                <strong className="text-sm text-green-700 dark:text-green-300">Entity Extraction Results:</strong>
                                <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>Total Entities Found:</strong> {apiDebugInfo.entityExtraction.totalEntitiesFound}</div>
                                  <div><strong>Extraction Strategy:</strong> {apiDebugInfo.entityExtraction.extractionMode}</div>
                                </div>
                                {apiDebugInfo.entityExtraction.extractedEntities.length > 0 ? (
                                  <div className="mt-2 space-y-1">
                                    {apiDebugInfo.entityExtraction.extractedEntities.map((entity, idx) => (
                                      <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded flex justify-between">
                                        <span><strong>{entity.type}:</strong> {entity.value}</span>
                                        <span className="text-green-600">{(entity.confidence * 100).toFixed(1)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-sm mt-1">No extractable business data found</div>
                                )}
                              </div>
                            )}

                            {/* Lead Scoring Results */}
                            {apiDebugInfo.leadScoring && (
                              <div className="border-t pt-2">
                                <strong className="text-sm text-green-700 dark:text-green-300">Lead Scoring Results:</strong>
                                <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <strong>Lead Score:</strong>
                                    <Badge variant={apiDebugInfo.leadScoring.isQualified ? "default" : "secondary"}>
                                      {apiDebugInfo.leadScoring.currentScore}/{apiDebugInfo.leadScoring.maxPossibleScore}
                                    </Badge>
                                  </div>
                                  <div><strong>Qualification Status:</strong> 
                                    <span className={`ml-1 font-medium ${apiDebugInfo.leadScoring.isQualified ? 'text-green-600' : 'text-orange-600'}`}>
                                      {apiDebugInfo.leadScoring.isQualified ? '✅ Qualified' : '⏳ Developing'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Journey Progression Results */}
                            {apiDebugInfo.journeyProgression && (
                              <div className="border-t pt-2">
                                <strong className="text-sm text-green-700 dark:text-green-300">Journey Progression Results:</strong>
                                <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>Current Stage:</strong> 
                                    <span className="ml-1 font-medium text-teal-700 dark:text-teal-300">{apiDebugInfo.journeyProgression.currentStage}</span>
                                  </div>
                                  <div><strong>Stage Confidence:</strong> {(apiDebugInfo.journeyProgression.stageConfidence * 100).toFixed(1)}%</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Business Rules & Automation */}
                      {apiDebugInfo.businessRules && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-800 dark:text-red-200">
                            <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                            Business Rules & Automated Actions
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
                              <div className="text-sm">
                                <strong>Business Logic:</strong> Apply business rules based on the analysis results from the first API call. Trigger automated behaviors like lead notifications, CRM updates, or email sequences based on intent confidence, lead scoring, and journey progression.
                              </div>
                              <div className="border-t pt-2">
                                <strong className="text-sm">System Thresholds:</strong>
                                <div className="mt-1 grid grid-cols-3 gap-4 text-xs">
                                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <div className="font-medium">Intent Confidence</div>
                                    <div className="text-muted-foreground">{(apiDebugInfo.businessRules.thresholds.intentConfidence * 100).toFixed(0)}% required</div>
                                  </div>
                                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <div className="font-medium">Stage Transition</div>
                                    <div className="text-muted-foreground">{(apiDebugInfo.businessRules.thresholds.stageTransition * 100).toFixed(0)}% required</div>
                                  </div>
                                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <div className="font-medium">Persona Inference</div>
                                    <div className="text-muted-foreground">{(apiDebugInfo.businessRules.thresholds.personaInference * 100).toFixed(0)}% required</div>
                                  </div>
                                </div>
                              </div>
                              {apiDebugInfo.businessRules.rulesTriggered.length > 0 && (
                                <div className="border-t pt-2">
                                  <strong className="text-sm">Rules Executed This Turn:</strong>
                                  <div className="mt-2 space-y-2">
                                    {apiDebugInfo.businessRules.rulesTriggered.map((rule, idx) => (
                                      <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{rule.ruleName}</span>
                                          <Badge variant={rule.result === 'success' ? 'default' : rule.result === 'failed' ? 'destructive' : 'secondary'}>
                                            {rule.result}
                                          </Badge>
                                        </div>
                                        <div className="text-muted-foreground">
                                          <strong>IF:</strong> {rule.condition}
                                        </div>
                                        <div className="text-muted-foreground">
                                          <strong>THEN:</strong> {rule.action}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {apiDebugInfo.businessRules.automatedBehaviors.length > 0 && (
                                <div className="border-t pt-2">
                                  <strong className="text-sm">Automated Behaviors:</strong>
                                  <div className="mt-2 space-y-2">
                                    {apiDebugInfo.businessRules.automatedBehaviors.map((behavior, idx) => (
                                      <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{behavior.behavior}</span>
                                          <Badge variant={behavior.triggered ? 'default' : 'secondary'}>
                                            {behavior.triggered ? 'Active' : 'Standby'}
                                          </Badge>
                                        </div>
                                        <div className="text-muted-foreground">{behavior.reason}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Second OpenAI API Call - Response Generation */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                          <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                          Second OpenAI API Call - Response Generation
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
                            <div className="text-sm">
                              <strong>Business Logic:</strong> The system makes its second OpenAI API call to generate the conversational response. This call uses system instructions, personality settings, knowledge base context, extracted entities from step 2, and conversation history to create a contextual response for the user.
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div><strong>AI Model:</strong> {apiDebugInfo.requestData.model}</div>
                              <div><strong>Temperature:</strong> {apiDebugInfo.requestData.temperature}</div>
                              <div><strong>Max Tokens:</strong> {apiDebugInfo.requestData.maxTokens}</div>
                            </div>
                            <div className="border-t pt-2">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Response ID:</strong> <code className="text-xs">{apiDebugInfo.responseData.id}</code></div>
                                <div><strong>Processing Time:</strong> {apiDebugInfo.responseData.processingTime}ms</div>
                                <div><strong>Response Length:</strong> {apiDebugInfo.responseData.responseLength} characters</div>
                                <div><strong>Estimated Cost:</strong> {apiDebugInfo.costData.estimatedCost}</div>
                              </div>
                            </div>
                            <div className="border-t pt-2">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <strong>Input Tokens:</strong> {apiDebugInfo.costData.inputTokens.toLocaleString()}
                                </div>
                                <div>
                                  <strong>Output Tokens:</strong> {apiDebugInfo.costData.outputTokens.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            {apiDebugInfo.requestData.fullPrompt && (
                              <div className="border-t pt-2">
                                <strong className="text-sm">Complete Prompt Sent to OpenAI:</strong>
                                <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-3 border">
                                  <ScrollArea className="h-32 w-full">
                                    <pre className="font-mono text-xs whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                                      {apiDebugInfo.requestData.fullPrompt}
                                    </pre>
                                  </ScrollArea>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  <strong>Prompt Length:</strong> {apiDebugInfo.requestData.fullPrompt.length} characters
                                </div>
                              </div>
                            )}
                            {apiDebugInfo.responseData.fullResponse && (
                              <div className="border-t pt-2">
                                <strong className="text-sm">Raw OpenAI API Response:</strong>
                                <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-3 border">
                                  <ScrollArea className="h-32 w-full">
                                    <pre className="font-mono text-xs whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                                      {apiDebugInfo.responseData.fullResponse}
                                    </pre>
                                  </ScrollArea>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step 5: Performance Metrics & System Health */}
                      {apiDebugInfo.performance && (
                        <div className="bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                            <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
                            Performance Metrics & System Health
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-white dark:bg-gray-900 rounded p-3 border space-y-2">
                              <div className="text-sm">
                                <strong>System Performance:</strong> Real-time monitoring of component execution times, database efficiency, and cache utilization for optimization insights across both API calls.
                              </div>
                              <div className="border-t pt-2">
                                <strong className="text-sm">Component Execution Timeline:</strong>
                                <div className="mt-2 space-y-2">
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                      <div className="font-medium">Intent Classification</div>
                                      <div className="text-green-600 font-mono">{apiDebugInfo.performance.componentTimings.intentClassification}ms</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                      <div className="font-medium">Entity Extraction</div>
                                      <div className="text-green-600 font-mono">{apiDebugInfo.performance.componentTimings.entityExtraction}ms</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                      <div className="font-medium">Lead Scoring</div>
                                      <div className="text-green-600 font-mono">{apiDebugInfo.performance.componentTimings.leadScoring}ms</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                      <div className="font-medium">Response Generation</div>
                                      <div className="text-green-600 font-mono">{apiDebugInfo.performance.componentTimings.responseGeneration}ms</div>
                                    </div>
                                  </div>
                                  <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 p-2 rounded">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-indigo-800 dark:text-indigo-200">Total Processing Time</span>
                                      <span className="text-indigo-600 dark:text-indigo-400 font-mono text-lg">{apiDebugInfo.performance.componentTimings.total}ms</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="border-t pt-2">
                                <strong className="text-sm">System Efficiency Metrics:</strong>
                                <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                                    <div className="text-2xl font-bold text-blue-600">{apiDebugInfo.performance.cacheHits}</div>
                                    <div className="text-muted-foreground">Cache Hits</div>
                                  </div>
                                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                                    <div className="text-2xl font-bold text-purple-600">{apiDebugInfo.performance.dbQueries}</div>
                                    <div className="text-muted-foreground">DB Queries</div>
                                  </div>
                                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                                    <div className="text-2xl font-bold text-orange-600">{apiDebugInfo.performance.apiCalls}</div>
                                    <div className="text-muted-foreground">API Calls</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}


                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Simulation Results */}
            {simulationResults && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
} 