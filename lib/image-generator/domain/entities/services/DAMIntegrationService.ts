export class DAMIntegrationService {
  static canSaveToDAM(
    isCompleted: boolean, 
    savedToDAM: boolean, 
    resultImageUrl: string | null
  ): boolean {
    return isCompleted && !savedToDAM && resultImageUrl !== null;
  }

  static validateDAMSave(
    isCompleted: boolean, 
    savedToDAM: boolean, 
    resultImageUrl: string | null
  ): void {
    if (!this.canSaveToDAM(isCompleted, savedToDAM, resultImageUrl)) {
      throw new Error('Cannot save to DAM: generation not completed or already saved');
    }
  }

  static createDAMMetadata(
    prompt: string,
    modelName: string,
    providerName: string,
    costCents: number,
    generationId: string
  ): Record<string, unknown> {
    return {
      title: prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt,
      description: prompt,
      tags: ['ai-generated', modelName, providerName],
      customFields: {
        generation_id: generationId,
        provider: providerName,
        model: modelName,
        cost_cents: costCents,
        ai_generated: true
      }
    };
  }
} 