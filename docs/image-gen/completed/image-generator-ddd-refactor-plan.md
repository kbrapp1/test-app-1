# Image Generator DDD Refactor Plan

**CURRENT STATUS:** Critical DDD Layer Violations Found ⚠️ | Immediate Refactoring Required 🔥

**AUDIT SUMMARY:**
🚨 **Domain Layer Importing Infrastructure:** Result type and GenerationStats in wrong layers
🚨 **Application Layer Direct Infrastructure Imports:** 8+ use cases importing infrastructure directly
⚠️ **File Size Violations:** 2 files over 250-line Golden Rule limit
✅ **Presentation Layer Clean:** No improper layer dependencies

**CRITICAL IMPACT:**
- Domain layer has external dependencies (violates DDD core principle)
- Application layer tightly coupled to infrastructure implementations
- Cross-domain imports creating architectural debt
- Violates Golden Rule DDD guidelines for clean architecture

**REFACTOR GOAL:** Establish proper DDD layer separation following Golden Rule principles while maintaining all existing functionality and test coverage.

## Critical Violations Found

### 🚨 Domain Layer Violations (CRITICAL)

**File:** `lib/image-generator/domain/repositories/GenerationRepository.ts`
```typescript
// ❌ CRITICAL VIOLATION: Domain importing from Infrastructure
import { Result } from '../../infrastructure/common/Result';
import { GenerationStats } from '../../infrastructure/persistence/supabase/services/GenerationStatsCalculator';
```

**Impact:** Breaks fundamental DDD rule that domain must be pure business logic with zero external dependencies.

### 🚨 Application Layer Violations (HIGH PRIORITY)

**Files with Infrastructure Imports:**
- `GenerateImageUseCase.ts` - Imports ProviderFactory directly
- `AutoSaveGenerationUseCase.ts` - Imports Result from infrastructure  
- `GetGenerationsUseCase.ts` - Imports Result from infrastructure
- `GetGenerationStatsUseCase.ts` - Imports GenerationStats from infrastructure
- `SaveGenerationToDAMUseCase.ts` - Cross-domain DAM imports
- `DeleteGenerationUseCase.ts` - Cross-domain storage imports
- `CancelGenerationUseCase.ts` - Direct provider imports
- `GenerationOrchestrationService.ts` - Direct repository imports

**Example Violation:**
```typescript
// ❌ Application importing infrastructure directly
import { ProviderFactory } from '../../infrastructure/providers/ProviderFactory';
import { Result, success, error } from '../../infrastructure/common/Result';
import { SupabaseStorageService } from '../../../dam/infrastructure/storage/SupabaseStorageService';
```

### ⚠️ File Size Violations

**Files Over 250-Line Golden Rule:**
- `PerformanceMonitor.tsx` (244 lines) - Close to limit, needs splitting
- `Generation.ts` (242 lines) - Domain entity needs service extraction

## Refactoring Plan

### Phase 1: Critical DDD Layer Fixes (IMMEDIATE - Priority 1)

**Step 1.1: Move Result Type to Domain Layer** ✅
- [x] **Source:** `lib/image-generator/infrastructure/common/Result.ts`
- [x] **Target:** `lib/image-generator/domain/common/Result.ts`
- [x] **Task:** Move Result interface and implementations to domain layer
- [x] **Rationale:** Result pattern is domain concept, not infrastructure concern

**Step 1.2: Move GenerationStats to Domain Layer** ✅  
- [x] **Source:** `lib/image-generator/infrastructure/persistence/supabase/services/GenerationStatsCalculator.ts`
- [x] **Target:** `lib/image-generator/domain/value-objects/GenerationStats.ts`
- [x] **Task:** Extract GenerationStats interface as domain value object
- [x] **Implementation:** Calculator logic stays in infrastructure, interface moves to domain

**Step 1.3: Update Domain Repository Imports** ✅
- [x] **File:** `lib/image-generator/domain/repositories/GenerationRepository.ts`
- [x] **Task:** Update imports to use domain/common/Result
- [x] **Task:** Update imports to use domain/value-objects/GenerationStats
- [x] **Verification:** Ensure zero infrastructure imports in domain layer

**Step 1.4: Create Domain Common Index** ✅
- [x] **File:** `lib/image-generator/domain/common/index.ts`
- [x] **Task:** Export Result types for clean imports
- [x] **File:** `lib/image-generator/domain/index.ts`
- [x] **Task:** Update to include common exports

### Phase 2: Application Layer Abstraction (HIGH PRIORITY - Priority 2)

**Step 2.1: Create Provider Service Interface** ✅
- [x] **File:** `lib/image-generator/application/interfaces/IProviderService.ts`
- [x] **Interface Definition:**
```typescript
export interface IProviderService {
  generateImage(request: GenerationRequest): Promise<GenerationResult>;
  checkStatus(predictionId: string): Promise<GenerationStatus>;
  cancelGeneration(predictionId: string): Promise<void>;
  getAvailableProviders(): Provider[];
  getModelCapabilities(modelId: string): ModelCapabilities;
}
```

**Step 2.2: Create Repository Service Interface** ✅
- [x] **File:** `lib/image-generator/application/interfaces/IStorageService.ts`
- [x] **Interface Definition:**
```typescript
export interface IStorageService {
  downloadAndStoreImage(imageUrl: string, generationId: string): Promise<string>;
  uploadToDAM(imageUrl: string, metadata: AssetMetadata): Promise<string>;
  deleteImage(filePath: string): Promise<void>;
}
```

**Step 2.3: Implement Dependency Injection in Use Cases** ✅
- [x] **Pattern:** Constructor injection for all external dependencies
- [x] **Files to Update:**
  - [x] `GenerateImageUseCase.ts` - Inject IProviderService
  - [x] `SaveGenerationToDAMUseCase.ts` - Inject IStorageService
  - [x] `CancelGenerationUseCase.ts` - Inject IProviderService
  - [x] `AutoSaveGenerationUseCase.ts` - Inject IStorageService

**Step 2.4: Update Application Service Constructors** ✅
- [x] **File:** `lib/image-generator/application/services/GenerationOrchestrationService.ts`
- [x] **Task:** Inject repository through constructor instead of direct import
- [x] **Pattern:** Use interface dependencies only

**Step 2.5: Create Application Service Registry** ✅
- [x] **File:** `lib/image-generator/application/services/ServiceRegistry.ts`
- [x] **Purpose:** Central dependency injection configuration
- [x] **Responsibilities:** Wire up interfaces with implementations

### Phase 3: Infrastructure Implementations (MEDIUM PRIORITY - Priority 3)

**Step 3.1: Create Provider Service Implementation** ✅
- [x] **File:** `lib/image-generator/infrastructure/services/ProviderServiceImpl.ts`
- [x] **Task:** Implement IProviderService using existing ProviderFactory
- [x] **Pattern:** Adapter pattern to wrap existing infrastructure

**Step 3.2: Create Storage Service Implementation** ✅
- [x] **File:** `lib/image-generator/infrastructure/services/StorageServiceImpl.ts`
- [x] **Task:** Implement IStorageService for DAM integration
- [x] **Dependencies:** Wrap existing Supabase storage services

**Step 3.3: Update Infrastructure Index** ✅
- [x] **File:** `lib/image-generator/infrastructure/index.ts`
- [x] **Task:** Export service implementations for dependency injection
- [x] **Task:** Maintain existing provider exports for compatibility

### Phase 4: File Size Refactoring (MEDIUM PRIORITY - Priority 4)

**Step 4.1: Split PerformanceMonitor Component** ✅
- [x] **Current:** `PerformanceMonitor.tsx` (244 lines)
- [x] **Split Into:**
  - [x] `lib/image-generator/presentation/hooks/usePerformanceMetrics.ts` (≤100 lines)
  - [x] `lib/image-generator/presentation/components/performance/MetricsDisplay.tsx` (≤80 lines)
  - [x] `lib/image-generator/presentation/components/performance/OptimizationStatus.tsx` (≤60 lines)
  - [x] `lib/image-generator/presentation/components/PerformanceMonitor.tsx` (≤50 lines - orchestrator)

**Step 4.2: Extract Generation Entity Services** ✅
- [x] **Current:** `Generation.ts` (242 lines)
- [x] **Extract:**
  - [x] `lib/image-generator/domain/services/GenerationDisplayService.ts` - Display logic
  - [x] `lib/image-generator/domain/services/GenerationLifecycleService.ts` - State transitions
  - [x] **Target:** Reduce Generation.ts to ≤200 lines

**Step 4.3: Component Size Validation** ✅
- [x] **Task:** Review all components for 200-250 line compliance
- [x] **Focus:** Presentation layer components
- [x] **Method:** Extract custom hooks and smaller sub-components

### Phase 5: Testing and Validation (HIGH PRIORITY - Priority 5)

**Step 5.1: Update Import Statements** ✅
- [x] **Domain Tests:** Update to use domain/common/Result
- [x] **Application Tests:** Update to use new interfaces
- [x] **Infrastructure Tests:** Update service implementations
- [x] **Verification:** All 79+ tests still pass

**Step 5.2: Integration Testing** ✅
- [x] **Test:** End-to-end generation workflow
- [x] **Test:** DAM integration still works
- [x] **Test:** Provider switching functionality
- [x] **Test:** Error handling through all layers

**Step 5.3: Performance Validation** ✅
- [x] **Metric:** No performance degradation in generation times
- [x] **Metric:** Memory usage remains stable
- [x] **Metric:** UI responsiveness maintained
- [x] **Tool:** Use existing PerformanceMonitor component

### Phase 6: Documentation and Cleanup (LOW PRIORITY - Priority 6)

**Step 6.1: Update Architecture Documentation** ✅
- [x] **File:** Update `docs/image-gen/architecture-overview.md`
- [x] **Content:** Document new layer separation
- [x] **Content:** Dependency injection patterns
- [x] **Content:** Interface abstractions

**Step 6.2: Code Review and Cleanup** ✅
- [x] **Task:** Remove unused imports
- [x] **Task:** Verify no console.log statements
- [x] **Task:** Ensure consistent naming conventions
- [x] **Task:** Validate all exports in index files

## Implementation Timeline

### Week 1: Critical Fixes (Phase 1-2)
**Day 1-2: Domain Layer Fixes**
- [x] Move Result and GenerationStats to domain
- [x] Update all domain imports
- [x] Verify domain purity

**Day 3-4: Application Abstractions** 
- [x] Create service interfaces
- [x] Implement dependency injection
- [x] Update use case constructors

**Day 5: Integration Testing**
- [x] Verify all tests pass
- [x] Test complete workflows
- [x] Performance validation

### Week 2: Infrastructure and File Size (Phase 3-4)
**Day 1-2: Infrastructure Implementations**
- [x] Create service implementations
- [x] Wire up dependency injection
- [x] Update infrastructure exports

**Day 3-4: File Size Refactoring**
- [x] Split PerformanceMonitor
- [x] Extract Generation services
- [x] Validate component sizes

**Day 5: Final Testing and Documentation**
- [x] Complete integration testing
- [x] Update documentation
- [x] Code review and cleanup

## Success Criteria

### Layer Compliance ✅
- [x] **Domain Layer:** Zero imports from outer layers
- [x] **Application Layer:** Only domain and interface imports
- [x] **Infrastructure Layer:** Implements application interfaces
- [x] **Presentation Layer:** Only application layer imports

### File Size Compliance ✅
- [x] **All Files:** ≤250 lines following Golden Rule
- [x] **Components:** Single responsibility principle
- [x] **Services:** Focused, cohesive responsibilities

### Functional Requirements ✅
- [x] **Generation Workflow:** Complete end-to-end functionality
- [x] **DAM Integration:** Seamless save-to-DAM operations
- [x] **Provider Flexibility:** Easy provider switching
- [x] **Error Handling:** Graceful error propagation

### Quality Requirements ✅
- [x] **Test Coverage:** Maintain existing 79+ tests
- [x] **Performance:** No degradation in response times
- [x] **Maintainability:** Clear separation of concerns
- [x] **Extensibility:** Easy to add new providers/features

## Validation Checklist

### Pre-Refactor Baseline ✅
- [x] Current test suite passes (79+ tests)
- [x] Generation workflow functional
- [x] DAM integration working
- [x] Performance metrics recorded

### Post-Refactor Validation ✅
- [x] All tests pass with no modifications needed
- [x] No new console.log statements introduced
- [x] Layer dependency direction verified
- [x] File sizes within Golden Rule limits
- [x] Performance maintained or improved
- [x] Error handling preserved
- [x] User workflows unchanged

## Risk Mitigation

### High Risk Areas ✅
- [x] **Domain Entity Changes:** Minimal changes to core Generation entity
- [x] **Interface Breaking Changes:** Maintain existing public APIs
- [x] **Test Coverage:** Incremental updates to maintain coverage
- [x] **Performance Impact:** Monitor generation times throughout refactor

### Rollback Plan ✅
- [x] **Version Control:** Feature branch for all changes
- [x] **Incremental Commits:** Each phase committed separately
- [x] **Test Gates:** No progression without passing tests
- [x] **Documentation:** Clear before/after comparisons

This refactor establishes proper DDD architecture following Golden Rule principles while maintaining full functionality and improving maintainability for future development.
