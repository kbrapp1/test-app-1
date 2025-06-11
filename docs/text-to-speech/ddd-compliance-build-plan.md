# TTS Module DDD Compliance Build Plan

**MODULE:** lib/tts/  
**FOCUS:** Domain-Driven Design Architecture Compliance  
**TARGET:** 95% DDD Compliance (from current 85%)  
**AUDIT FINDINGS:** TTS module has strong DDD foundation with targeted fixes needed

---

## 🚨 **PHASE 1: CRITICAL DDD VIOLATIONS** (Priority 1 - Must Fix)

### **1.1 Fix Presentation → Infrastructure Layer Violation**

**FILE:** `lib/tts/presentation/hooks/useTtsDamIntegration.ts:7`

- [ ] Remove direct infrastructure import on line 7
  ```typescript
  // REMOVE: import { DamAssetManagementAdapter } from '../../infrastructure/adapters/DamAssetManagementAdapter';
  ```
- [ ] Remove default instantiation in hook parameter (line 16)
  ```typescript
  // REMOVE: assetManagement = new DamAssetManagementAdapter()
  // CHANGE TO: Make assetManagement required parameter
  export function useTtsDamIntegration({ 
    onTextLoaded, 
    assetManagement // Make this required, no default
  }: UseTtsDamIntegrationProps & { assetManagement: AssetManagementContract }) {
  ```
- [ ] Update all hook callers to inject the adapter
- [ ] Update component tests to inject mock implementation

**COMPLETION CRITERIA:** Zero imports from infrastructure in presentation layer

---

### **1.1.2 ADDITIONAL CRITICAL: Presentation Layer Using Domain Objects**

**FILE:** `lib/tts/presentation/hooks/useTtsGeneration.ts:4,41,67,88`

- [ ] Remove direct domain imports from presentation layer
  ```typescript
  // REMOVE line 4: import { PredictionStatus } from '../../domain';
  ```
- [ ] Replace domain object usage on lines 41, 67, 88
  ```typescript
  // REPLACE: const statusVO = new PredictionStatus(predictionStatus);
  // WITH: Use string-based status checks or DTOs
  ```
- [ ] Update hook to work with DTOs/strings instead of domain objects
- [ ] Ensure presentation layer never instantiates domain objects

**COMPLETION CRITERIA:** Zero domain imports in presentation layer

---

### **1.2 Fix Application → Infrastructure Direct Imports**

#### **1.2.1 startSpeechGenerationUsecase.ts (Lines 2, 5, 10)**
- [ ] Remove direct infrastructure imports
  ```typescript
  // REMOVE line 2: import { createReplicatePrediction, createElevenLabsSpeech, uploadAudioBuffer } from '../../infrastructure/providers/ttsService';
  // REMOVE line 5: import { ttsProvidersConfig } from '../../infrastructure/providers/ttsProviderConfig';
  // REMOVE line 10: import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
  ```
- [ ] Add dependencies as function parameters
  ```typescript
  export async function startSpeechGeneration(
    inputText: string, 
    voiceId: string, 
    provider: string,
    dependencies: {
      repository: TtsPredictionRepository;
      ttsService: TtsProviderService;
      providerConfig: Record<string, any>;
    }
  ): Promise<{ success: boolean; predictionId?: string; ttsPredictionDbId?: string; error?: string; }>
  ```
- [ ] Remove direct instantiation on line 36
  ```typescript
  // REMOVE: const repository = new TtsPredictionSupabaseRepository();
  ```
- [ ] Update TtsApplicationService to inject dependencies
- [ ] Update tests to mock dependencies

#### **1.2.2 saveTtsAudioToDamUsecase.ts (Lines 3, 5)**
- [ ] Remove cross-domain DAM import 
  ```typescript
  // REMOVE line 3: import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
  ```
- [ ] Remove direct TTS repository import
  ```typescript
  // REMOVE line 5: import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
  ```
- [ ] Add repositories as function parameters
- [ ] Remove direct instantiation on lines 27 and 58
- [ ] Update TtsApplicationService to inject repositories
- [ ] Update tests with proper dependency injection

#### **1.2.3 Current Assessment: TtsApplicationService Already Handles DI**
**✅ GOOD NEWS:** The TtsApplicationService.ts already properly handles dependency injection for most use cases. The direct imports in use cases should be replaced by injecting through the application service.

**COMPLETION CRITERIA:** Zero direct infrastructure imports in application layer

---

### **1.3 Fix Cross-Domain Infrastructure Imports**

#### **1.3.1 DamAssetManagementAdapter.ts (Lines 16-17)**
**✅ ASSESSMENT:** This adapter is actually CORRECT DDD implementation - it's in the infrastructure layer and serves as a proper anti-corruption layer. However, we need to strengthen it:

- [ ] ✅ **Keep existing structure** - This is proper DDD anti-corruption layer
- [ ] Review and strengthen error handling and domain translation
- [ ] Add comprehensive interface documentation
- [ ] Consider adding circuit breaker pattern for external DAM calls

#### **1.3.2 saveTtsAudioToDamUsecase.ts (Line 3)**
- [ ] Remove cross-domain import (already covered in 1.2.2)
  ```typescript
  // REMOVE line 3: import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
  ```
- [ ] Use DAM operations through AssetManagementContract only
- [ ] Inject DAM adapter through application service

#### **1.3.3 Test Files (saveTtsAudioToDamUsecase.test.ts:8)**
- [ ] Remove cross-domain DAM infrastructure import 
  ```typescript
  // REMOVE line 8: import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
  ```
- [ ] Use mocked AssetManagementContract interface instead

**COMPLETION CRITERIA:** Zero cross-domain infrastructure imports

---

### **1.4 CRITICAL: Provider Manager Cross-Domain Imports**

**FILE:** `lib/tts/infrastructure/providers/TtsProviderManager.ts:1-2`

- [ ] **ASSESSMENT:** These imports violate bounded context principles
  ```typescript
  // PROBLEMATIC lines 1-2:
  // import { ReplicateProvider, ReplicateConfig } from '@/lib/infrastructure/providers/replicate/ReplicateProvider';
  // import { ElevenLabsProvider, ElevenLabsConfig } from '@/lib/infrastructure/providers/elevenlabs/ElevenLabsProvider';
  ```
- [ ] **DECISION NEEDED:** Either:
  - **Option A:** Move global providers into TTS infrastructure (recommended)
  - **Option B:** Create TTS-specific provider interfaces and adapters
- [ ] Remove dependency on global provider registry
- [ ] Implement proper DDD bounded context isolation

**COMPLETION CRITERIA:** TTS providers managed within TTS bounded context

---

### **1.5 CRITICAL: Console Statements in Production Code**

**Multiple files contain console.log/warn/error statements:**

- [ ] **lib/tts/infrastructure/providers/ttsService.ts** (7 console statements)
- [ ] **lib/tts/infrastructure/providers/TtsProviderManager.ts** (4 console statements)  
- [ ] **lib/tts/presentation/hooks/useHeadlessAudioPlayer.ts** (1 active console.error)
- [ ] **lib/tts/application/use-cases/getTtsVoicesUsecase.ts** (2 console statements)
- [ ] **lib/tts/application/use-cases/saveTtsHistoryUsecase.ts** (1 console.warn)

**ACTION:** Replace all console statements with proper logging service or remove

**COMPLETION CRITERIA:** Zero console statements in production code

---

## 🚨 **PHASE 1.6: FILE SIZE VIOLATIONS** (Priority 1 - Golden Rule)

### **1.6 Files Exceeding 250-Line Limit**

**Files requiring immediate refactoring (39% of files exceed limit):**

- [ ] **TtsPrediction.ts** - 348 lines (39% over limit) - Split entity from business logic
- [ ] **SpeechResult.ts** - 304 lines (22% over limit) - Separate value object from validation  
- [ ] **TtsPredictionSupabaseRepository.ts** - 296 lines (18% over limit) - Split CRUD operations
- [ ] **TtsValidationService.ts** - 281 lines (12% over limit) - Split validation types
- [ ] **TtsError.ts** - 279 lines (12% over limit) - Separate error types and handlers
- [ ] **TtsApplicationService.test.ts** - 275 lines (10% over limit) - Split test suites
- [ ] **TtsPrediction.test.ts** - 272 lines (9% over limit) - Split test categories

**COMPLETION CRITERIA:** All files under 250 lines per Golden Rule

---

## ⚠️ **PHASE 2: ARCHITECTURAL REFINEMENTS** (Priority 2)

### **2.1 Fix Presentation Layer Domain Access**

#### **2.1.1 Test Utilities Refactoring (Lines 1-4)**
- [ ] Update `lib/tts/presentation/components/__tests__/testUtils.ts`
  ```typescript
  // REMOVE domain entity imports lines 1-4:
  // import { TtsPrediction } from '../../../domain/entities/TtsPrediction';
  // import { PredictionStatus } from '../../../domain/value-objects/PredictionStatus';
  // import { TextInput } from '../../../domain/value-objects/TextInput';
  // import { VoiceId } from '../../../domain/value-objects/VoiceId';
  ```
- [ ] Create test DTO factory functions instead
  ```typescript
  // ADD: Use DTOs for presentation tests
  import { TtsPredictionDisplayDto } from '../../../application/dto/TtsPredictionDto';
  
  export function createMockTtsPredictionDisplayDto(overrides = {}): TtsPredictionDisplayDto {
    // Factory for DTOs, not domain entities
  }
  ```
- [ ] Replace all 4 factory functions to create DTOs
- [ ] Update all presentation tests to use DTO factories

#### **2.1.2 Component Test Updates**
- [ ] Audit remaining presentation tests for domain entity usage
- [ ] Replace domain entities with appropriate DTOs
- [ ] Ensure presentation layer only knows about DTOs

**COMPLETION CRITERIA:** Zero domain entity imports in presentation layer

---

### **2.2 Dependency Injection Infrastructure**

#### **2.2.1 ✅ Current State Assessment: TTS Already Has Proper DI Structure**
**GOOD NEWS:** The TTS module already implements proper DDD architecture:
- ✅ `TtsApplicationService.ts` handles all dependency injection 
- ✅ Server actions delegate to application service 
- ✅ Repository pattern properly implemented

#### **2.2.2 Minimal Refactoring Needed**
- [ ] Update use cases to receive dependencies as parameters (instead of direct imports)
- [ ] Inject provider services through TtsApplicationService
- [ ] Consider creating provider factory if needed for complex provider management

#### **2.2.3 ✅ Server Actions Architecture is Correct**
The current `lib/tts/application/actions/tts.ts` properly:
- ✅ Delegates to application service
- ✅ Maintains clean signatures for frontend  
- ✅ Handles feature flag checking centrally

**COMPLETION CRITERIA:** Proper dependency injection throughout application layer

---

## 🔧 **PHASE 3: ARCHITECTURAL CLEAN-UP** (Priority 3)

### **3.1 Legacy Field Migration**

#### **3.1.1 Remove replicatePredictionId Duplication**
- [ ] Audit all usage of `replicatePredictionId` field
- [ ] Ensure `externalProviderId` is used consistently
- [ ] Update database migration if needed
- [ ] Update all mappers and DTOs
- [ ] Remove deprecated field references

#### **3.1.2 Provider ID Standardization**
- [ ] Verify all providers use `externalProviderId`
- [ ] Update provider adapters
- [ ] Clean up legacy compatibility code

**COMPLETION CRITERIA:** Single provider ID field used throughout

---

### **3.2 Contract Interface Strengthening**

#### **3.2.1 AssetManagementContract Enhancement**
- [ ] Review contract interface completeness
- [ ] Add missing operations if needed
- [ ] Ensure proper error handling contracts
- [ ] Add comprehensive documentation

#### **3.2.2 Repository Interface Audit**
- [ ] Review `TtsPredictionRepository` interface
- [ ] Ensure all operations are properly abstracted
- [ ] Add missing domain operations if needed

**COMPLETION CRITERIA:** Complete and robust domain contracts

---

## ✅ **PHASE 4: VALIDATION & TESTING** (Priority 4)

### **4.1 Architecture Validation**

- [ ] Run dependency analysis tool to verify layer compliance
- [ ] Audit all import statements for violations
- [ ] Check bounded context isolation
- [ ] Verify anti-corruption layer effectiveness

### **4.2 Test Suite Validation**

- [ ] Ensure all 128+ tests still pass
- [ ] Add tests for new dependency injection patterns
- [ ] Add integration tests for anti-corruption layer
- [ ] Verify mocking strategies work correctly

### **4.3 Documentation Updates**

- [ ] Update architecture documentation
- [ ] Document dependency injection patterns
- [ ] Add examples for future development
- [ ] Update troubleshooting guides

**COMPLETION CRITERIA:** 95% DDD compliance achieved with full test coverage

---

## 📋 **COMPLETION CHECKLIST**

### **Critical Fixes (Must Complete)**
- [ ] Fix presentation → infrastructure import (1 file: useTtsDamIntegration.ts)
- [ ] Fix presentation layer domain object usage (1 file: useTtsGeneration.ts)
- [ ] Fix application → infrastructure direct imports (2 use cases)  
- [ ] Remove cross-domain imports (2 test files)
- [ ] Resolve provider manager bounded context violations
- [ ] Remove all console statements (15+ instances across 5 files)
- [ ] Refactor 7 files exceeding 250-line limit

### **Quality Fixes (Should Complete)**
- [ ] Presentation test layer uses only DTOs (4 test utility files)
- [ ] Strengthen anti-corruption layer documentation
- [ ] Legacy field duplication removed (if needed)
- [ ] All 128 tests passing with new architecture

### **Validation (Must Verify)**
- [ ] Layer dependency analysis passes
- [ ] Bounded context isolation verified
- [ ] Test coverage maintained at 100%
- [ ] Performance baseline maintained

---

## 🎯 **SUCCESS METRICS**

- **DDD Compliance Score:** 75% → 95% (revised down after comprehensive audit)
- **Critical Violations Found:** 8 categories requiring immediate attention
  1. Presentation → Infrastructure import (1 file)
  2. Presentation → Domain object usage (1 file)  
  3. Application → Infrastructure direct imports (4 use cases) 
  4. Cross-domain imports (4 files)
  5. Provider bounded context violations (1 critical file)
  6. Console statements in production (15+ instances, 5 files)
  7. File size violations (7 files exceed 250-line limit)
  8. Test utilities using domain entities (4 files)

- **Golden Rule Compliance Issues:** 
  - **File Size:** 7/50 files (14%) exceed 250-line limit
  - **Console Logs:** 15+ production console statements
  - **Layer Separation:** 6 critical layer violations

- **Test Coverage:** 128 tests passing (maintain 100%)
- **Module Size:** 50 TypeScript files total

**ESTIMATED EFFORT:** 4-6 developer days (increased due to comprehensive findings)  
**RISK LEVEL:** Medium (significant refactoring needed for oversized files)  
**DEPENDENCIES:** Decision needed on provider architecture (bounded context vs global) 