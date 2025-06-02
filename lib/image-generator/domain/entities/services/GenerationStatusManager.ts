import { GenerationStatus } from '../../value-objects/GenerationStatus';

export class GenerationStatusManager {
  static validateTransition(currentStatus: GenerationStatus, newStatus: GenerationStatus): void {
    if (!currentStatus.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus.value} to ${newStatus.value}`
      );
    }
  }

  static canComplete(status: GenerationStatus): boolean {
    return status.value === 'processing';
  }

  static canFail(status: GenerationStatus): boolean {
    return status.value === 'pending' || status.value === 'processing';
  }

  static canCancel(status: GenerationStatus): boolean {
    return status.value === 'pending' || status.value === 'processing';
  }

  static isTerminal(status: GenerationStatus): boolean {
    return status.isTerminal();
  }

  static isInProgress(status: GenerationStatus): boolean {
    return status.isInProgress();
  }
} 