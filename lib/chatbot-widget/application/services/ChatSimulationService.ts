import { ChatSimulation, SimulationResults } from '../../domain/entities/ChatSimulation';
import { ChatSimulationContext, SimulatedUserProfile, TestingGoal } from '../../domain/value-objects/ChatSimulationContext';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';

export interface IChatSimulationService {
  startSimulation(context: ChatSimulationContext): Promise<ChatSimulation>;
  sendMessage(simulationId: string, message: string): Promise<{ simulation: ChatSimulation; response: string }>;
  completeSimulation(simulationId: string, results?: Partial<SimulationResults>): Promise<ChatSimulation>;
  cancelSimulation(simulationId: string, reason?: string): Promise<ChatSimulation>;
}

export class ChatSimulationService implements IChatSimulationService {
  private activeSimulations = new Map<string, ChatSimulation>();

  constructor(
    private readonly chatbotConfigRepository: IChatbotConfigRepository
  ) {}

  async startSimulation(context: ChatSimulationContext): Promise<ChatSimulation> {
    // Validate chatbot config exists
    const chatbotConfig = await this.chatbotConfigRepository.findById(context.chatbotConfigId);
    if (!chatbotConfig) {
      throw new Error(`Chatbot config not found: ${context.chatbotConfigId}`);
    }

    const simulation = ChatSimulation.create(context, {
      notes: `Testing simulation for ${chatbotConfig.name}`,
      tags: ['testing', context.simulationType],
    });

    this.activeSimulations.set(simulation.id, simulation);
    return simulation;
  }

  async sendMessage(simulationId: string, message: string): Promise<{ simulation: ChatSimulation; response: string }> {
    let simulation = this.activeSimulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    if (!simulation.isActive()) {
      throw new Error(`Simulation is not active: ${simulation.status}`);
    }

    // Add user message
    const userMessage = ChatMessage.createUserMessage(simulation.id, message);
    simulation = simulation.addMessage(userMessage);

    // Generate live AI response
    const response = await this.generateLiveResponse(message, simulation);

    // Add bot response
    const botMessage = ChatMessage.createBotMessage(
      simulation.id,
      response,
      { 
        model: simulation.context.shouldUseMockResponses() ? 'mock' : 'gpt-4',
        processingTime: simulation.context.shouldUseMockResponses() ? 800 : 2000,
        confidence: 0.85
      }
    );
    
    simulation = simulation.addMessage(botMessage);

    // Check if simulation should auto-complete
    if (simulation.hasExceededLimits()) {
      simulation = await this.autoCompleteSimulation(simulation);
    }

    this.activeSimulations.set(simulationId, simulation);
    return { simulation, response };
  }

  async completeSimulation(simulationId: string, results?: Partial<SimulationResults>): Promise<ChatSimulation> {
    const simulation = this.activeSimulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    const defaultResults: SimulationResults = {
      completedSuccessfully: true,
      totalMessages: simulation.getCurrentMessageCount(),
      leadCaptured: this.hasLeadCapture(simulation),
      goalsAchieved: this.evaluateGoals(simulation),
      performanceMetrics: {
        averageResponseTime: this.calculateAverageResponseTime(simulation),
        totalDuration: simulation.getDurationInSeconds(),
        messagesPerMinute: simulation.getDurationInSeconds() > 0 ? 
          (simulation.getCurrentMessageCount() / simulation.getDurationInSeconds()) * 60 : 0,
        errorCount: 0,
      },
      qualityAssessment: {
        relevanceScore: 85,
        accuracyScore: 90,
        userSatisfactionScore: 80,
        knowledgeBaseUtilization: 75,
      },
    };

    const finalResults = { ...defaultResults, ...results };
    const completedSimulation = simulation.complete(finalResults);
    
    this.activeSimulations.delete(simulationId);
    return completedSimulation;
  }

  async cancelSimulation(simulationId: string, reason?: string): Promise<ChatSimulation> {
    const simulation = this.activeSimulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    const cancelledSimulation = simulation.cancel(reason);
    this.activeSimulations.delete(simulationId);
    return cancelledSimulation;
  }



  private async generateLiveResponse(message: string, simulation: ChatSimulation): Promise<string> {
    // This would integrate with the actual AI conversation service
    // For now, return a placeholder indicating live AI would be used
    return `[Live AI Response] I understand you're asking about "${message.substring(0, 50)}...". This would be generated by our AI service in production.`;
  }



  private async autoCompleteSimulation(simulation: ChatSimulation): Promise<ChatSimulation> {
    return simulation.complete({
      completedSuccessfully: true,
      totalMessages: simulation.getCurrentMessageCount(),
      leadCaptured: this.hasLeadCapture(simulation),
      goalsAchieved: this.evaluateGoals(simulation),
      performanceMetrics: {
        averageResponseTime: this.calculateAverageResponseTime(simulation),
        totalDuration: simulation.getDurationInSeconds(),
        messagesPerMinute: simulation.getDurationInSeconds() > 0 ? 
          (simulation.getCurrentMessageCount() / simulation.getDurationInSeconds()) * 60 : 0,
        errorCount: 0,
      },
      qualityAssessment: {
        relevanceScore: 75,
        accuracyScore: 80,
        userSatisfactionScore: 70,
        knowledgeBaseUtilization: 65,
      },
    });
  }

  private hasLeadCapture(simulation: ChatSimulation): boolean {
    const userMessages = simulation.getUserMessages();
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    
    return userMessages.some(msg => 
      emailPattern.test(msg.content) || phonePattern.test(msg.content)
    );
  }

  private evaluateGoals(simulation: ChatSimulation): Array<{ goalId: string; achieved: boolean; notes?: string }> {
    return simulation.context.testingGoals.map(goal => ({
      goalId: goal.type,
      achieved: this.evaluateGoal(goal, simulation),
      notes: `Goal: ${goal.criteria}`,
    }));
  }

  private evaluateGoal(goal: TestingGoal, simulation: ChatSimulation): boolean {
    switch (goal.type) {
      case 'knowledge_validation':
        return simulation.getBotMessages().some(msg => msg.content.length > 100);
      case 'lead_capture':
        return this.hasLeadCapture(simulation);
      case 'conversation_flow':
        return simulation.getCurrentMessageCount() >= 4;
      case 'response_quality':
        return simulation.getBotMessages().every(msg => msg.content.length > 20);
      default:
        return false;
    }
  }

  private calculateAverageResponseTime(simulation: ChatSimulation): number {
    const botMessages = simulation.getBotMessages();
    if (botMessages.length === 0) return 0;
    
    const totalTime = botMessages.reduce((sum, msg) => sum + (msg.processingTime || 1000), 0);
    return totalTime / botMessages.length;
  }

  // Utility methods
  getActiveSimulations(): ChatSimulation[] {
    return Array.from(this.activeSimulations.values());
  }

  getSimulation(simulationId: string): ChatSimulation | undefined {
    return this.activeSimulations.get(simulationId);
  }

  clearInactiveSimulations(): void {
    for (const [id, simulation] of this.activeSimulations.entries()) {
      if (!simulation.isActive()) {
        this.activeSimulations.delete(id);
      }
    }
  }
} 