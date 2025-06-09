# TTS DDD Migration Plan - Incremental Approach

**Version:** 2.1  
**Objective:** Migrate TTS feature to Domain-Driven Design (DDD) with minimal disruption using incremental refactoring

## Overview

This migration uses an **incremental approach** to minimize disruption:
1. **Move existing code** to appropriate DDD layers (preserving current functionality)
2. **Test thoroughly** to ensure no regressions
3. **Refactor layer by layer** into proper DDD structure
4. **Test after each layer** migration

**Benefits of This Approach:**
- Minimal risk of breaking functionality
- Files placed in logical DDD layers from start
- Continuous testing and validation
- Easy rollback if issues arise
- Gradual team learning of DDD patterns
- Ability to pause migration at any stable point

## Phase 1: Initial Code Organization (Low Risk)

### 1.1 Create DDD Directory Structure
- [ ] Create `lib/tts/` root directory
- [ ] Create `lib/tts/domain/` directory (empty for now)
- [ ] Create `lib/tts/application/` directory
- [ ] Create `lib/tts/application/use-cases/` directory
- [ ] Create `lib/tts/application/actions/` directory
- [ ] Create `lib/tts/application/schemas/` directory (temporary)
- [ ] Create `lib/tts/infrastructure/` directory
- [ ] Create `lib/tts/infrastructure/providers/` directory
- [ ] Create `lib/tts/presentation/` directory
- [ ] Create `lib/tts/presentation/components/` directory
- [ ] Create `lib/tts/presentation/hooks/` directory

### 1.2 Move Existing Files to Appropriate Layers
- [ ] Move `lib/usecases/tts/` → `lib/tts/application/use-cases/`
  - [ ] Move all files: `startSpeechGenerationUsecase.ts`, `getTtsHistoryUsecase.ts`, etc.
- [ ] Move `lib/actions/tts.ts` → `lib/tts/application/actions/tts.ts`
- [ ] Move `lib/schemas/ttsSchemas.ts` → `lib/tts/application/schemas/ttsSchemas.ts`
- [ ] Move `lib/services/ttsService.ts` → `lib/tts/infrastructure/providers/ttsService.ts`
- [ ] Move `lib/config/ttsProviderConfig.ts` → `lib/tts/infrastructure/providers/ttsProviderConfig.ts`
- [ ] Move `components/tts/` → `lib/tts/presentation/components/`
  - [ ] Move all components: `tts-interface.tsx`, `TtsInputCard.tsx`, `TtsHistoryPanel.tsx`, etc.
- [ ] Move TTS hooks from `hooks/` → `lib/tts/presentation/hooks/`
  - [ ] Move `useTtsGeneration.ts`, `useTtsDamIntegration.ts`, `useHeadlessAudioPlayer.ts`, `useTtsSaveAsDialog.ts`

### 1.3 Update All Import References
- [ ] Update `app/(protected)/ai-playground/text-to-speech/page.tsx` imports
  - [ ] Update component imports to new presentation layer paths
- [ ] Update `lib/actions/services/TtsFeatureFlagService.ts` imports
- [ ] Update internal imports within moved TTS files
  - [ ] Update use case imports in action files
  - [ ] Update component imports in other components
  - [ ] Update hook imports in components
- [ ] Create `lib/tts/index.ts` with re-exports for external consumers

### 1.4 Test Everything Works
- [ ] Run full test suite
- [ ] Test TTS page functionality manually
- [ ] Test speech generation workflow
- [ ] Test history functionality
- [ ] Test DAM integration
- [ ] Verify no broken imports or missing dependencies
- [ ] Check no build errors

## Phase 2: Domain Layer Creation (Core Business Logic)

### 2.1 Create Value Objects
- [ ] Create `lib/tts/domain/value-objects/InputText.ts`
  - [ ] Add text validation (min 1, max 5000 characters)
  - [ ] Add content sanitization
  - [ ] Add immutability guarantees
- [ ] Create `lib/tts/domain/value-objects/PredictionStatus.ts`
  - [ ] Define status enum (pending, processing, completed, failed)
  - [ ] Add status transition validation
  - [ ] Add business rules for status changes
- [ ] Create `lib/tts/domain/value-objects/VoiceId.ts`
  - [ ] Add voice ID validation
  - [ ] Add provider compatibility checks

### 2.2 Create Domain Entities
- [ ] Create `lib/tts/domain/entities/TtsPrediction.ts`
  - [ ] Define entity properties based on current database schema
  - [ ] Add constructor with validation using value objects
  - [ ] Add business methods (markAsCompleted, markAsFailed, etc.)
  - [ ] Add status transition logic
  - [ ] Add DAM asset linking methods
- [ ] Create `lib/tts/domain/entities/TtsVoice.ts`
  - [ ] Define voice properties (id, name, gender, accent, provider)
  - [ ] Add voice validation logic

### 2.3 Create Repository Interfaces
- [ ] Create `lib/tts/domain/repositories/TtsPredictionRepository.ts`
  - [ ] Define save, findById, findByUserId, findByOrganizationId methods
  - [ ] Define update, delete methods
- [ ] Create `lib/tts/domain/repositories/TtsProviderRepository.ts`
  - [ ] Define getVoices, getProviderConfig methods

### 2.4 Test Domain Model
- [ ] Create unit tests for value objects
- [ ] Create unit tests for entities
- [ ] Verify domain logic works correctly
- [ ] Run domain tests

## Phase 3: Infrastructure Layer Refactoring

### 3.1 Refactor Provider Services
- [ ] Refactor `lib/tts/infrastructure/providers/ttsService.ts`
  - [ ] Split into provider-specific classes
  - [ ] Create `ReplicateTtsProvider.ts` for Replicate logic
  - [ ] Create `ElevenLabsTtsProvider.ts` for ElevenLabs logic
  - [ ] Implement TtsProviderRepository interface
- [ ] Refactor `lib/tts/infrastructure/providers/ttsProviderConfig.ts`
  - [ ] Split into provider-specific configs
  - [ ] Create `ReplicateTtsConfig.ts`
  - [ ] Create `ElevenLabsTtsConfig.ts`

### 3.2 Create Database Infrastructure
- [ ] Create `lib/tts/infrastructure/persistence/` directory
- [ ] Create `lib/tts/infrastructure/persistence/supabase/` directory
- [ ] Create `lib/tts/infrastructure/persistence/supabase/mappers/TtsPredictionSupabaseMapper.ts`
  - [ ] Map domain entity to/from Supabase table format
  - [ ] Handle all current table fields using value objects
- [ ] Create `lib/tts/infrastructure/persistence/supabase/repositories/TtsPredictionSupabaseRepository.ts`
  - [ ] Implement TtsPredictionRepository interface
  - [ ] Use existing Supabase client patterns
  - [ ] Use mapper for data transformation

### 3.3 Test Infrastructure Layer
- [ ] Test provider functionality still works
- [ ] Test database operations
- [ ] Verify no regressions in external API calls

## Phase 4: Application Layer Refactoring

### 4.1 Create DTOs and Mappers
- [ ] Create `lib/tts/application/dto/` directory
- [ ] Create `lib/tts/application/dto/StartSpeechGenerationDto.ts`
  - [ ] Mirror current action input/output structure
  - [ ] Add validation using domain value objects
- [ ] Create `lib/tts/application/dto/TtsPredictionDto.ts`
  - [ ] Define prediction data for cross-layer communication
- [ ] Create `lib/tts/application/dto/TtsHistoryDto.ts`
  - [ ] Define history data structure with pagination
- [ ] Create `lib/tts/application/mappers/` directory
- [ ] Create `lib/tts/application/mappers/TtsPredictionMapper.ts`
  - [ ] Map between domain entities and DTOs

### 4.2 Refactor Use Cases to Use Domain Layer
- [ ] Refactor `lib/tts/application/use-cases/startSpeechGenerationUsecase.ts`
  - [ ] Use domain entities and repository interfaces
  - [ ] Use DTOs for input/output
  - [ ] Keep same external interface initially
- [ ] Refactor `lib/tts/application/use-cases/getTtsHistoryUsecase.ts`
  - [ ] Use repository pattern
  - [ ] Return DTOs instead of raw database data
- [ ] Refactor `lib/tts/application/use-cases/getTtsVoicesUsecase.ts`
  - [ ] Use provider repository interface
- [ ] Refactor `lib/tts/application/use-cases/saveTtsAudioToDamUsecase.ts`
  - [ ] Use domain entities
  - [ ] Follow DAM integration patterns

### 4.3 Refactor Server Actions
- [ ] Refactor `lib/tts/application/actions/tts.ts`
  - [ ] Use new use cases and DTOs
  - [ ] Move validation from schemas to domain value objects
  - [ ] Keep same external interface
- [ ] Remove `lib/tts/application/schemas/ttsSchemas.ts` (validation moved to domain)

### 4.4 Test Application Layer
- [ ] Test all use cases work correctly
- [ ] Test server actions maintain same behavior
- [ ] Verify DTO mapping works properly

## Phase 5: Presentation Layer Refactoring

### 5.1 Create Presentation Hooks Structure
- [ ] Create `lib/tts/presentation/hooks/queries/` directory
- [ ] Create `lib/tts/presentation/hooks/mutations/` directory
- [ ] Create `lib/tts/presentation/hooks/specialized/` directory

### 5.2 Refactor React Query Hooks
- [ ] Refactor `lib/tts/presentation/hooks/useTtsGeneration.ts`
  - [ ] Move to `mutations/useStartSpeechGeneration.ts`
  - [ ] Use new application actions
  - [ ] Add proper React Query patterns
- [ ] Move and refactor history hook
  - [ ] Move `useTtsHistory.ts` logic to `queries/useTtsHistory.ts`
  - [ ] Use DTOs instead of raw database types
  - [ ] Add proper cache invalidation
- [ ] Move specialized hooks
  - [ ] Move `useHeadlessAudioPlayer.ts` to `specialized/useAudioPlayer.ts`
  - [ ] Move `useTtsDamIntegration.ts` to `mutations/useSaveAudioToDam.ts`
  - [ ] Move `useTtsSaveAsDialog.ts` to `specialized/useTtsSaveAsDialog.ts`

### 5.3 Refactor Components to Use New Hooks
- [ ] Refactor `lib/tts/presentation/components/tts-interface.tsx`
  - [ ] Use new presentation hooks
  - [ ] Keep under 200-250 lines (Golden Rule)
  - [ ] Test complete interface works
- [ ] Refactor `lib/tts/presentation/components/TtsInputCard.tsx`
  - [ ] Use new form hooks
  - [ ] Use DTOs for data handling
- [ ] Refactor `lib/tts/presentation/components/TtsHistoryPanel.tsx`
  - [ ] Use new history hooks
  - [ ] Use DTO data structures
- [ ] Refactor remaining components to use new patterns

### 5.4 Update Page Component
- [ ] Update `app/(protected)/ai-playground/text-to-speech/page.tsx`
  - [ ] Verify imports point to new presentation layer
  - [ ] Test full page functionality

### 5.5 Test Presentation Layer
- [ ] Test all components render correctly
- [ ] Test user interactions work
- [ ] Test React Query caching and invalidation
- [ ] Verify no performance regressions

## Phase 6: Final Cleanup and Optimization

### 6.1 Remove Empty Directories and Unused Files
- [ ] Remove `lib/actions/tts.ts` (if not used elsewhere)
- [ ] Remove `lib/usecases/tts/` directory (now empty)
- [ ] Remove `lib/services/ttsService.ts` (now empty)
- [ ] Remove `components/tts/` directory (now empty)
- [ ] Remove TTS hooks from `hooks/` directory (now empty)
- [ ] Remove `lib/config/ttsProviderConfig.ts` (now empty)
- [ ] Remove `lib/schemas/ttsSchemas.ts` (validation moved to domain)

### 6.2 Clean Up Type Definitions
- [ ] Update `types/tts.ts`
  - [ ] Remove database-specific types
  - [ ] Keep only presentation types if needed
  - [ ] Consider moving to presentation layer

### 6.3 Update Module Exports
- [ ] Create clean `lib/tts/index.ts` with public API
  - [ ] Export presentation components for external use
  - [ ] Export any needed types
  - [ ] Follow DAM/image-generator export patterns

### 6.4 Update Feature Flag Integration
- [ ] Update `lib/actions/services/TtsFeatureFlagService.ts`
  - [ ] Update import paths if needed
  - [ ] Consider moving to TTS application layer

## Phase 7: Testing and Documentation

### 7.1 Comprehensive Testing
- [ ] Run full test suite
- [ ] Test all TTS functionality manually
- [ ] Test error scenarios
- [ ] Test with different providers (Replicate, ElevenLabs)
- [ ] Performance testing
- [ ] Verify no console.log statements remain

### 7.2 Update Tests for DDD Structure
- [ ] Update existing component tests for new file locations
- [ ] Create domain entity tests
- [ ] Create use case tests
- [ ] Create integration tests
- [ ] Ensure high test coverage maintained

### 7.3 Update Documentation
- [ ] Update build steps documentation
- [ ] Document new DDD architecture
- [ ] Update feature documentation
- [ ] Create migration notes for team

## Success Criteria

- [ ] All TTS functionality working exactly as before
- [ ] Clean DDD architecture following @golden-rule.mdc
- [ ] No legacy code remaining
- [ ] All tests passing
- [ ] Performance maintained or improved
- [ ] Team can understand and maintain new structure
- [ ] Files properly organized in logical DDD layers

## Rollback Plan

At any phase, if issues arise:
1. **Stop migration** at current phase
2. **Investigate issues** thoroughly
3. **Fix in current structure** before proceeding
4. **If major issues**: revert to previous stable phase using git
5. **Document lessons learned** and adjust plan

## Notes for Each Phase

- **Test thoroughly** after each phase before proceeding
- **Keep phases small** (1-3 days of work each)
- **One layer at a time** to minimize complexity
- **Maintain external interfaces** until all migration complete
- **Document any deviations** from plan during implementation
- **Get team review** before major structural changes
- **Performance check** after each layer migration 