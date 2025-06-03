// Main Components Export Index - DDD Bounded Context Organization
// This file provides centralized exports for all image generator components
// Following DDD principles with bounded context separation

import { createLazyComponent } from '../utils/lazyLoader';

// ========================================
// DDD BOUNDED CONTEXTS - Clean Architecture
// ========================================

// Generation Context - All generation display components
export * from './generation';

// Forms Context - All input and configuration components  
export * from './forms';

// Providers Context - Provider/model selection components
export * from './providers';

// Layout Context - Core app structure (always loaded for critical path)
export * from './layout';

// Shared Context - Reusable UI components
export * from './shared';

// UI Components (existing ui directory structure maintained)

// ========================================
// BACKWARD COMPATIBILITY - Lazy Loading Support
// These maintain existing lazy loading patterns while using new structure
// Will be gradually phased out as code is updated to use direct imports
// ========================================

// Performance monitoring (8.7KB) - only for power users
export const PerformanceMonitorLazy = createLazyComponent(
  () => import('./generation/stats/PerformanceMonitor').then(m => ({ default: m.PerformanceMonitor })),
  { retries: 2, retryDelay: 500 }
);

// Advanced generation features (7.4KB+) - used less frequently
export const StyleSectionLazy = createLazyComponent(
  () => import('./forms/settings/StyleSection').then(m => ({ default: m.StyleSection }))
);

export const ProviderSelectorLazy = createLazyComponent(
  () => import('./providers/ProviderSelector').then(m => ({ default: m.ProviderSelector }))
);

export const GenerationActionsLazy = createLazyComponent(
  () => import('./generation/card/GenerationActions').then(m => ({ default: m.GenerationActions }))
);

export const ActionButtonsToolbarLazy = createLazyComponent(
  () => import('./layout/ActionButtonsToolbar').then(m => ({ default: m.ActionButtonsToolbar }))
);

// Large list optimization (6.9KB) - only for power users with many generations
export const VirtualizedGenerationListLazy = createLazyComponent(
  () => import('./generation/list/VirtualizedGenerationList').then(m => ({ default: m.VirtualizedGenerationList }))
);

// Statistics and analytics (5KB+) - dashboard features
export const GenerationStatsLazy = createLazyComponent(
  () => import('./generation/stats/GenerationStats').then(m => ({ default: m.GenerationStats }))
);

// ========================================
// LEGACY SUPPORT - Maintain original component names
// These will be removed in future versions
// ========================================

// Keep original lazy loading exports for existing code
export const PerformanceMonitor = PerformanceMonitorLazy;
export const StyleSection = StyleSectionLazy;
export const ProviderSelector = ProviderSelectorLazy;
export const VirtualizedGenerationList = VirtualizedGenerationListLazy;
export const GenerationStats = GenerationStatsLazy; 