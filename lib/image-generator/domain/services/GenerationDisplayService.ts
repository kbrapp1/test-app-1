// GenerationDisplayService - DDD Domain Service
// Single Responsibility: Display and formatting logic for Generation entities
// Following Golden Rule: Pure domain service with focused responsibility

import { Generation } from '../entities/Generation';

/**
 * Domain Service for Generation Display Operations
 * Handles all formatting, display strings, and presentation-related calculations
 * Following Golden Rule DDD: Focused service with single responsibility
 */
export class GenerationDisplayService {
  /**
   * Get display title with truncation
   */
  static getDisplayTitle(generation: Generation): string {
    const promptText = generation.prompt.toString();
    return promptText.length > 50 ? `${promptText.substring(0, 47)}...` : promptText;
  }

  /**
   * Format generation duration for display
   */
  static getDurationString(generation: Generation): string {
    const seconds = generation.generationTimeSeconds;
    if (!seconds) return 'Unknown';
    
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Get formatted cost display string
   */
  static getCostDisplay(generation: Generation): string {
    const cents = generation.costCents;
    if (cents === 0) return 'Free';
    if (cents < 100) return `${cents}¢`;
    return `$${(cents / 100).toFixed(2)}`;
  }

  /**
   * Generate storage path for auto-saved images
   */
  static getAutoSaveStoragePath(generation: Generation): string {
    return `${generation.organizationId}/${generation.userId}/ai-generations/${generation.id}.webp`;
  }

  /**
   * Get status display with color coding information
   */
  static getStatusDisplay(generation: Generation): {
    label: string;
    variant: 'pending' | 'processing' | 'completed' | 'failed';
  } {
    const status = generation.status.value;
    return {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      variant: status as 'pending' | 'processing' | 'completed' | 'failed'
    };
  }

  /**
   * Get dimensions display string
   */
  static getDimensionsDisplay(generation: Generation): string {
    return `${generation.imageWidth} × ${generation.imageHeight}`;
  }

  /**
   * Get edit type display label
   */
  static getEditTypeDisplay(generation: Generation): string {
    const typeLabels: Record<string, string> = {
      'text-to-image': 'Text to Image',
      'image-editing': 'Image Editing',
      'style-transfer': 'Style Transfer',
      'background-swap': 'Background Swap'
    };
    return typeLabels[generation.editType] || generation.editType;
  }
} 