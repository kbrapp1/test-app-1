import { useState } from 'react';
import { DebugInfoDto } from '../../application/dto/DebugInfoDto';
import { 
  ChatMessage, 
  SimulatedUserProfile, 
  TestingGoal, 
  SimulationResults 
  } from '../types/ChatSimulationTypes';

/**
 * AI Instructions: Custom hook for managing chatbot simulation state
 * - Handle live simulation testing with real AI responses
 * - Manage simulation lifecycle and conversation flow
 * - Provide quality assessment metrics and debug information
 * - Support user profile customization for testing scenarios
 */

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

export function useChatSimulation(chatbotConfigId: string, onComplete?: (results: SimulationResults) => void) {
  const [isActive, setIsActive] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<SimulatedUserProfile>(defaultUserProfile);
  const [testingGoals] = useState<TestingGoal[]>(defaultTestingGoals);
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiDebugInfo, setApiDebugInfo] = useState<DebugInfoDto | null>(null);


  const startSimulation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessages([]);
      setSimulationResults(null);
      
      const response = await fetch('/api/chatbot-widget/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      setMessages([{
        id: 'system_start',
        messageType: 'system',
        content: `✅ Simulation started with Live AI responses. Session ID: ${sessionData.sessionId}`,
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
      
      const userMessages = messages.filter(m => m.messageType === 'user');
      const botMessages = messages.filter(m => m.messageType === 'bot');
      
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
      const leadCaptured = userMessages.some(msg => 
        emailPattern.test(msg.content) || phonePattern.test(msg.content)
      );
      
      const goalsAchieved = testingGoals.map(goal => {
        let achieved = false;
        switch (goal.type) {
          case 'knowledge_validation':
            achieved = botMessages.some(msg => msg.content.length > 100);
            break;
          case 'lead_capture':
            achieved = leadCaptured;
            break;
          case 'conversation_flow':
            achieved = messages.length >= 4;
            break;
          case 'response_quality':
            achieved = botMessages.every(msg => msg.content.length > 20);
            break;
          default:
            achieved = false;
        }
        
        return {
          goalId: goal.type,
          achieved,
          notes: goal.criteria,
        };
      });
      
      const qualityAssessment = {
        relevanceScore: botMessages.length > 0 ? Math.min(75 + (botMessages.filter(msg => msg.content.length > 50).length / botMessages.length) * 25, 100) : 0,
        accuracyScore: botMessages.length > 0 ? (botMessages.filter(msg => !msg.content.toLowerCase().includes('error')).length / botMessages.length) * 100 : 0,
        userSatisfactionScore: Math.min(50 + (messages.length >= 4 ? 20 : 0) + (leadCaptured ? 20 : 0) + (botMessages.length > 0 && botMessages.every(msg => msg.content.length > 20) ? 10 : 0), 100),
        knowledgeBaseUtilization: botMessages.length > 0 ? (botMessages.filter(msg => 
          msg.content.length > 50 && 
          !msg.content.toLowerCase().includes('i don\'t know') &&
          !msg.content.toLowerCase().includes('i\'m not sure')
        ).length / botMessages.length) * 100 : 0,
      };
      
      const results: SimulationResults = {
        completedSuccessfully: true,
        totalMessages: messages.length,
        leadCaptured,
        goalsAchieved,
        performanceMetrics: {
          averageResponseTime: messages.reduce((sum, msg) => sum + (msg.processingTime || 0), 0) / Math.max(messages.filter(m => m.processingTime).length, 1),
          totalDuration: messages.length > 0 ? Math.floor((messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime()) / 1000) : 0,
          messagesPerMinute: messages.length > 0 ? (messages.length / Math.max(Math.floor((messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime()) / 60000), 1)) : 0,
          errorCount: messages.filter(m => m.messageType === 'system' && m.content.includes('Error')).length,
        },
        qualityAssessment,
      };
      
      setSimulationResults(results);
      onComplete?.(results);
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
      const startTime = Date.now();
      const response = await fetch('/api/chatbot-widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const botResponse = data.botResponse;
      const processingTime = Date.now() - startTime;
      
      setApiDebugInfo(data.debugInfo || {
        session: {
          sessionId: data.sessionId,
          userMessageId: data.userMessageId,
          botMessageId: data.botMessageId,
          conversationMetrics: data.conversationMetrics || {
            messageCount: 0,
            sessionDuration: 0,
            engagementScore: 0,
            leadQualificationProgress: 0,
          },
          performanceMetrics: {
            processingTimeMs: data.processingTimeMs,
          },
        },
        intentClassification: data.intentAnalysis,
        journeyProgression: data.journeyState,
      });
      
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

  return {
    isActive,
    messages,
    currentMessage,
    isLoading,
    userProfile,
    simulationResults,
    error,
    apiDebugInfo,
    
    setCurrentMessage,
    setUserProfile,
    startSimulation,
    stopSimulation,
    sendMessage,
  };
} 