export interface ChatMessage {
  id: string;
  messageType: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  processingTime?: number;
}

export interface SimulatedUserProfile {
  name: string;
  intent: 'browsing' | 'shopping' | 'support' | 'lead_qualification';
  engagementLevel: 'low' | 'medium' | 'high';
  previousKnowledge: 'none' | 'basic' | 'advanced';
  leadReadiness: 'cold' | 'warm' | 'hot';
}

export interface TestingGoal {
  type: 'knowledge_validation' | 'lead_capture' | 'conversation_flow' | 'response_quality';
  criteria: string;
  expectedOutcome: string;
}

export interface SimulationResults {
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