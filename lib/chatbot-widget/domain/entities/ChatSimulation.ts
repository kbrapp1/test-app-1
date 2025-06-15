import { ChatSimulationContext } from '../value-objects/simulation/ChatSimulationContext';
import { SimulationResults } from '../value-objects/simulation/SimulationResults';
import { SimulationMetadata, SimulationMetadataProps } from '../value-objects/simulation/SimulationMetadata';
import { SimulationMetrics } from '../value-objects/simulation/SimulationMetrics';
import { ChatMessage } from './ChatMessage';

export interface ChatSimulationProps {
  readonly id: string;
  readonly context: ChatSimulationContext;
  readonly messages: ChatMessage[];
  readonly status: 'active' | 'completed' | 'cancelled' | 'failed';
  readonly startedAt: Date;
  readonly endedAt?: Date;
  readonly results?: SimulationResults;
  readonly metadata: SimulationMetadata;
}

export class ChatSimulation {
  private constructor(private readonly props: ChatSimulationProps) {
    this.validateProps(props);
  }

  static create(
    context: ChatSimulationContext,
    metadata: Partial<SimulationMetadataProps> = {}
  ): ChatSimulation {
    return new ChatSimulation({
      id: crypto.randomUUID(),
      context,
      messages: [],
      status: 'active',
      startedAt: new Date(),
      metadata: SimulationMetadata.create(metadata),
    });
  }

  static fromPersistence(props: ChatSimulationProps): ChatSimulation {
    return new ChatSimulation(props);
  }

  private validateProps(props: ChatSimulationProps): void {
    if (!props.id?.trim()) {
      throw new Error('Simulation ID is required');
    }

    if (!props.context) {
      throw new Error('Simulation context is required');
    }

    if (!props.startedAt) {
      throw new Error('Started at timestamp is required');
    }

    if (props.endedAt && props.endedAt < props.startedAt) {
      throw new Error('End time cannot be before start time');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get context(): ChatSimulationContext { return this.props.context; }
  get messages(): ChatMessage[] { return this.props.messages; }
  get status(): string { return this.props.status; }
  get startedAt(): Date { return this.props.startedAt; }
  get endedAt(): Date | undefined { return this.props.endedAt; }
  get results(): SimulationResults | undefined { return this.props.results; }
  get metadata(): SimulationMetadata { return this.props.metadata; }

  // Business methods
  addMessage(message: ChatMessage): ChatSimulation {
    if (!this.canAddMessage()) {
      throw new Error('Cannot add message to inactive simulation');
    }

    if (!this.context.isWithinMessageLimit(this.props.messages.length + 1)) {
      throw new Error('Message limit exceeded for simulation');
    }

    if (!this.context.isWithinTimeLimit(this.props.startedAt)) {
      return this.complete(SimulationResults.createFailure(
        this.props.messages.length,
        SimulationMetrics.calculatePerformanceMetrics(this.props.messages, this.props.startedAt),
        SimulationMetrics.calculateQualityAssessment(this.props.messages)
      ));
    }

    return new ChatSimulation({
      ...this.props,
      messages: [...this.props.messages, message],
    });
  }

  complete(results: SimulationResults): ChatSimulation {
    if (this.props.status !== 'active') {
      throw new Error('Can only complete active simulations');
    }

    return new ChatSimulation({
      ...this.props,
      status: 'completed',
      endedAt: new Date(),
      results,
    });
  }

  cancel(reason?: string): ChatSimulation {
    if (this.props.status !== 'active') {
      throw new Error('Can only cancel active simulations');
    }

    const updatedMetadata = reason 
      ? this.props.metadata.appendNotes(`Cancelled: ${reason}`)
      : this.props.metadata;

    return new ChatSimulation({
      ...this.props,
      status: 'cancelled',
      endedAt: new Date(),
      metadata: updatedMetadata,
    });
  }

  fail(error: string): ChatSimulation {
    const updatedMetadata = this.props.metadata.appendNotes(`Failed: ${error}`);

    return new ChatSimulation({
      ...this.props,
      status: 'failed',
      endedAt: new Date(),
      metadata: updatedMetadata,
    });
  }

  canAddMessage(): boolean {
    return this.props.status === 'active';
  }

  isCompleted(): boolean {
    return this.props.status === 'completed';
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  hasExceededLimits(): boolean {
    return !this.context.isWithinMessageLimit(this.props.messages.length) ||
           !this.context.isWithinTimeLimit(this.props.startedAt);
  }

  getUserMessages(): ChatMessage[] {
    return this.props.messages.filter(msg => msg.messageType === 'user');
  }

  getBotMessages(): ChatMessage[] {
    return this.props.messages.filter(msg => msg.messageType === 'bot');
  }

  getCurrentMessageCount(): number {
    return this.props.messages.length;
  }

  getDuration(): number {
    const endTime = this.props.endedAt || new Date();
    return endTime.getTime() - this.props.startedAt.getTime();
  }

  getDurationInSeconds(): number {
    return Math.floor(this.getDuration() / 1000);
  }

  withUpdatedMetadata(metadata: Partial<SimulationMetadataProps>): ChatSimulation {
    const currentMetadata = this.props.metadata.toPlainObject();
    const newMetadata = SimulationMetadata.fromPersistence({
      ...currentMetadata,
      ...metadata,
    });

    return new ChatSimulation({
      ...this.props,
      metadata: newMetadata,
    });
  }

  // Export methods
  toPlainObject(): Omit<ChatSimulationProps, 'messages'> & { messages: ChatMessage[] } {
    return {
      ...this.props,
      messages: this.props.messages,
    };
  }

  getExecutiveSummary(): string {
    const duration = this.getDurationInSeconds();
    const userMsgCount = this.getUserMessages().length;
    const botMsgCount = this.getBotMessages().length;
    
    return `Simulation completed in ${duration}s with ${userMsgCount} user messages and ${botMsgCount} bot responses. Status: ${this.props.status}`;
  }

  getResultsSummary(): string {
    if (!this.props.results) return 'No results available';
    
    return this.props.results.getSummary();
  }
} 