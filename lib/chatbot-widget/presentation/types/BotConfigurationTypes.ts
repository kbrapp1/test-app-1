/**
 * Bot Configuration Presentation Types
 * 
 * AI INSTRUCTIONS:
 * - These are UI-specific view models for the presentation layer
 * - Keep separate from domain entities and application DTOs
 * - Focus on UI state and form handling needs
 * - Never expose domain entities directly to components
 */

export interface BotConfigurationFormData {
  name: string;
  description: string;
  personality: string;
  operatingHours: {
    enabled: boolean;
    timezone: string;
  };
  isActive: boolean;
}

export interface BotConfigurationViewState {
  isEditing: boolean;
  isLoading: boolean;
  hasExistingConfig: boolean;
  error: string | null;
}

export interface BotConfigurationActions {
  startEditing: () => void;
  cancelEditing: () => void;
  saveConfiguration: () => void;
  updateFormData: (updates: Partial<BotConfigurationFormData>) => void;
}

export const PERSONALITY_OPTIONS = [
  { value: 'helpful', label: 'Helpful & Professional' },
  { value: 'friendly', label: 'Friendly & Casual' },
  { value: 'formal', label: 'Formal & Business' },
  { value: 'enthusiastic', label: 'Enthusiastic & Energetic' },
] as const;

export const DEFAULT_FORM_DATA: BotConfigurationFormData = {
  name: 'My Assistant',
  description: 'An AI assistant to help with questions and capture leads',
  personality: 'helpful',
  operatingHours: { enabled: false, timezone: 'UTC' },
  isActive: true,
}; 