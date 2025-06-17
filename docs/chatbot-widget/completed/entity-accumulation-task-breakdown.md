# Entity Accumulation Implementation Task Breakdown

## Overview
Break down the entity accumulation implementation into actionable development tasks based on the comprehensive implementation guide.

## Phase 1: Domain Layer Foundation (2 days)

### Task 1.1: Create AccumulatedEntities Value Object ✅ COMPLETED
**File**: `lib/chatbot-widget/domain/value-objects/context/AccumulatedEntities.ts`
**Dependencies**: None
**Acceptance Criteria**:
- [x] Implements immutable value object pattern
- [x] Supports three accumulation strategies (additive, replaceable, confidence-based)
- [x] Includes validation for entity data integrity  
- [x] Has comprehensive unit tests (100% coverage)
- [x] Follows @golden-rule DDD patterns exactly

**Estimated Time**: 4 hours

### Task 1.2: Create EntityCorrections Interface
**File**: `lib/chatbot-widget/domain/value-objects/context/EntityCorrections.ts`
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- [x] Defines correction structure for all entity types
- [x] Supports both removal and correction operations
- [x] Includes timestamp and metadata tracking
- [x] Has validation for correction data integrity
- [x] Has unit tests covering all correction scenarios
- [x] Follows @golden-rule DDD patterns exactly

**Estimated Time**: 2 hours

### Task 1.3: Implement EntityAccumulationService
**File**: `lib/chatbot-widget/domain/services/context/EntityAccumulationService.ts`
**Dependencies**: Tasks 1.1, 1.2
**Acceptance Criteria**:
- [x] Pure domain logic (no infrastructure dependencies)
- [x] Processes corrections before accumulations
- [x] Implements all three accumulation strategies
- [x] Maintains correction history for audit trail
- [x] Handles edge cases (empty data, malformed input)
- [x] Has comprehensive unit tests (>95% coverage)
- [x] Stays under 200 lines with focused responsibility
- [x] Follows @golden-rule DDD patterns exactly

**Estimated Time**: 8 hours

## Phase 2: Infrastructure Layer Updates (1.5 days)

### Task 2.1: Extend OpenAI Function Schema
**File**: `lib/chatbot-widget/infrastructure/providers/openai/services/OpenAIFunctionSchemaBuilder.ts`
**Dependencies**: Task 1.2
**Acceptance Criteria**:
- [ ] Adds corrections object to existing schema
- [ ] Includes all entity types for removal/correction
- [ ] Maintains backward compatibility
- [ ] Has integration tests with mock OpenAI responses
- [ ] Follows @golden-rule DDD patterns exactly

**Estimated Time**: 3 hours

### Task 2.2: Enhance System Prompts
**File**: `lib/chatbot-widget/infrastructure/providers/openai/services/OpenAIPromptBuilder.ts`
**Dependencies**: Task 2.1
**Acceptance Criteria**:
- [x] Includes correction detection patterns
- [x] Provides clear examples for AI model
- [x] Handles negation and clarification patterns
- [x] Has prompt effectiveness tests
- [x] Follows @golden-rule DDD patterns exactly

**Estimated Time**: 4 hours

### Task 2.3: Create EntityExtractionService
**File**: `lib/chatbot-widget/application/services/ai-processing/EntityExtractionService.ts`
**Dependencies**: Tasks 2.1, 2.2
**Acceptance Criteria**:
- [x] Handles OpenAI API responses with corrections
- [x] Calculates extraction confidence scores
- [x] Provides comprehensive error handling
- [x] Returns structured extraction results
- [x] Has integration tests with actual OpenAI calls
- [x] Maintains proper DDD layer separation
- [x] Follows @golden-rule DDD patterns exactly

**Estimated Time**: 5 hours

## Phase 2.5: Entity Corrections Support (0.5 days)

### Task 2.5.1: Update ProcessMessageUseCase
**File**: `lib/chatbot-widget/application/use-cases/ProcessMessageUseCase.ts`
**Dependencies**: Tasks 1.3, 2.3
**Acceptance Criteria**:
- [x] Integrates correction-aware entity extraction
- [x] Processes corrections before accumulations
- [x] Updates session context properly
- [x] Maintains existing functionality
- [x] Has integration tests covering correction scenarios
- [x] Follows @golden-rule DDD patterns exactly

**Estimated Time**: 4 hours

## Phase 3: Enhanced Context Management (1 day)

### Task 3.1: Update SessionContext Storage
**File**: `lib/chatbot-widget/infrastructure/persistence/supabase/SessionContextRepository.ts`
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- [x] Stores accumulated entities in JSONB context_data
- [x] Maintains correction history
- [x] Implements efficient JSONB updates
- [x] Has database migration if needed
- [x] Includes performance tests for large context data
- [x] Follows @golden-rule DDD patterns exactly

**Estimated Time**: 6 hours

### Task 3.2: Enhance Debug Information
**File**: `lib/chatbot-widget/application/services/debug/DebugInfoService.ts`
**Dependencies**: Tasks 1.1, 1.3
**Acceptance Criteria**:
- [x] Shows accumulated entities in debug UI
- [x] Displays correction history
- [x] Includes accumulation strategy information
- [x] Provides entity impact analysis
- [x] Has comprehensive debug data tests
- [x] Follows @golden-rule DDD patterns exactly