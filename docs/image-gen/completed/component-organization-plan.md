# Image Generator Component Reorganization - DDD Compliance

## Current Problem
All 40+ components are at one level, violating DDD cohesion and Clean Architecture principles.

## Proposed Structure

```
lib/image-generator/presentation/components/
├── generation/                    # Generation Display Context
│   ├── list/
│   │   ├── GenerationList.tsx
│   │   ├── VirtualizedGenerationList.tsx
│   │   ├── GenerationListItem.tsx
│   │   └── GenerationEmptyState.tsx
│   ├── card/
│   │   ├── GenerationCard.tsx
│   │   ├── GenerationImage.tsx
│   │   ├── GenerationInfo.tsx
│   │   └── GenerationActions.tsx
│   ├── history/
│   │   ├── GenerationHistory.tsx
│   │   ├── GenerationSearchBar.tsx
│   │   └── HistoryPanel.tsx
│   └── stats/
│       ├── GenerationStats.tsx
│       └── PerformanceMonitor.tsx
│
├── forms/                         # Input/Form Context
│   ├── prompt/
│   │   ├── ImagePromptForm.tsx
│   │   ├── PromptSection.tsx
│   │   └── PromptInput.tsx
│   ├── settings/
│   │   ├── StyleSection.tsx
│   │   ├── SettingsSection.tsx
│   │   ├── ImageDimensionsSection.tsx
│   │   └── ImageUploadSection.tsx
│   ├── selectors/
│   │   ├── AspectRatioSelector.tsx
│   │   ├── BaseImageSelector.tsx
│   │   ├── GenerationModeSelector.tsx
│   │   └── ImageSizeSelector.tsx
│   └── controls/
│       ├── GenerationControls.tsx
│       └── GenerationActionButtons.tsx
│
├── providers/                     # Provider Selection Context
│   ├── ProviderSelector.tsx
│   ├── ModelSelector.tsx
│   └── HeaderModelSelector.tsx
│
├── layout/                        # Layout/Container Context
│   ├── ImageDisplayArea.tsx
│   ├── ImageGeneratorMain.tsx
│   ├── ActionButtonsToolbar.tsx
│   └── GeneratorSidebar.tsx
│
├── shared/                        # Shared UI Components
│   ├── ErrorDisplay.tsx
│   ├── EmptyState.tsx
│   ├── LazyLoadWrapper.tsx
│   └── PresetPrompts.tsx
│
└── ui/                           # Basic UI Components
    └── (existing ui components)
```

## DDD Benefits

### 1. **Bounded Context Separation**
- **Generation Context**: Everything related to displaying generations
- **Forms Context**: All input and configuration components  
- **Providers Context**: Provider/model selection logic
- **Layout Context**: App structure and navigation

### 2. **High Cohesion**
- Components that change together are grouped together
- Easy to find related functionality
- Clear component relationships

### 3. **Single Responsibility**
- Each directory has one clear purpose
- Components within directories share similar responsibilities
- Easier testing and maintenance

### 4. **Dependency Management**
- Clear import paths show component relationships
- Easier to identify circular dependencies
- Better tree-shaking potential

## Migration Strategy

### Phase 1: Create New Structure
1. Create new subdirectories
2. Move components to appropriate locations
3. Update import statements

### Phase 2: Update Index Files
1. Update `components/index.ts` with new paths
2. Create context-specific index files
3. Maintain backward compatibility temporarily

### Phase 3: Clean Up
1. Remove old import paths
2. Update documentation
3. Verify all imports work correctly

## Example Implementation

### Generation Context Index
```typescript
// components/generation/index.ts
export { GenerationList } from './list/GenerationList';
export { GenerationCard } from './card/GenerationCard';
export { GenerationHistory } from './history/GenerationHistory';
export { GenerationStats } from './stats/GenerationStats';
```

### Updated Main Index
```typescript
// components/index.ts
export * from './generation';
export * from './forms';
export * from './providers';
export * from './layout';
export * from './shared';
```

## Benefits for Developers

1. **Faster Navigation**: Find components by context, not alphabetically
2. **Better Understanding**: Component purpose clear from location
3. **Easier Refactoring**: Related components grouped together
4. **Reduced Cognitive Load**: Smaller, focused directories
5. **Team Collaboration**: Clear ownership boundaries

This structure follows DDD principles while maintaining Clean Architecture separation of concerns. 