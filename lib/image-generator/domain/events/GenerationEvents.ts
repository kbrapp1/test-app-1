import { DomainEvent } from '../common/AggregateRoot';

// Generation Domain Events
export interface GenerationStartedEvent extends DomainEvent {
  eventType: 'GenerationStarted';
  eventData: {
    prompt: string;
    imageWidth: number;
    imageHeight: number;
    userId: string;
    organizationId: string;
    modelName: string;
    providerName: string;
  };
}

export interface GenerationCompletedEvent extends DomainEvent {
  eventType: 'GenerationCompleted';
  eventData: {
    generationId: string;
    imageUrl: string;
    generationTimeSeconds: number;
    costCents: number;
    prompt: string;
    userId: string;
    organizationId: string;
  };
}

export interface GenerationFailedEvent extends DomainEvent {
  eventType: 'GenerationFailed';
  eventData: {
    generationId: string;
    errorMessage: string;
    prompt: string;
    userId: string;
    organizationId: string;
    failureReason: 'PROVIDER_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT' | 'QUOTA_EXCEEDED';
  };
}

export interface GenerationCancelledEvent extends DomainEvent {
  eventType: 'GenerationCancelled';
  eventData: {
    generationId: string;
    prompt: string;
    userId: string;
    organizationId: string;
    cancelledBy: 'USER' | 'SYSTEM' | 'TIMEOUT';
  };
}

export interface GenerationSavedToDAMEvent extends DomainEvent {
  eventType: 'GenerationSavedToDAM';
  eventData: {
    generationId: string;
    damAssetId: string;
    imageUrl: string;
    userId: string;
    organizationId: string;
  };
}

// Event Type Union
export type GenerationDomainEvent = 
  | GenerationStartedEvent
  | GenerationCompletedEvent
  | GenerationFailedEvent
  | GenerationCancelledEvent
  | GenerationSavedToDAMEvent; 