/**
 * Main DAM Drag and Drop Hook
 * 
 * Single Responsibility: Provides drag and drop functionality for DAM gallery
 * Orchestrates modular services following DDD principles
 * Follows the single responsibility principle with clear separation of concerns
 */

'use client';

import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from '@dnd-kit/core';

import { useDragEndHandler } from './useDragEndHandler';
import type { UseDamDragAndDropProps } from './types';

/**
 * Domain-driven hook for DAM drag and drop operations
 * 
 * Follows DDD principles:
 * - Clear domain modeling with value objects
 * - Separation of validation, execution, and UI concerns
 * - Use case orchestration
 * - Clean error handling
 */
export function useDamDragAndDrop(props: UseDamDragAndDropProps) {
  
  // Sensor configuration for responsive drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 3 },
    }),
    useSensor(TouchSensor, { 
      activationConstraint: { delay: 100, tolerance: 5 } 
    })
  );

  // Drag end handler orchestration
  const { handleDragEnd } = useDragEndHandler(props);

  return { 
    sensors, 
    handleDragEnd,
  };
} 