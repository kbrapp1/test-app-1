import { Prompt } from '../../value-objects/Prompt';

export class GenerationDisplayService {
  static getDisplayTitle(prompt: Prompt): string {
    const promptText = prompt.toString();
    return promptText.length > 50 
      ? `${promptText.substring(0, 47)}...`
      : promptText;
  }

  static getDurationString(generationTimeSeconds: number | null): string {
    if (generationTimeSeconds === null) {
      return 'N/A';
    }
    
    if (generationTimeSeconds < 60) {
      return `${generationTimeSeconds}s`;
    }
    
    const minutes = Math.floor(generationTimeSeconds / 60);
    const seconds = generationTimeSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  static getCostDisplay(costCents: number): string {
    const dollars = costCents / 100;
    return `$${dollars.toFixed(2)}`;
  }

  static getProgressPercentage(status: string): number {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 50;
      case 'completed': return 100;
      case 'failed':
      case 'cancelled': return 0;
      default: return 0;
    }
  }
} 