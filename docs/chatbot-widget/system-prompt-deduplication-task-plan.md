# System Prompt Deduplication & User Content Sanitization - Task Plan
**Following @golden-rule.md DDD Guidelines**

## Phase 1: Domain Layer - Content Processing
**Goal**: Create pure domain services for content processing following DDD patterns

### Task 1.1: Create Content Processing Domain Services
- [x] Build `UserContentSanitizationService` domain service in `lib/chatbot-widget/domain/services/content-processing/`
- [x] Add AI instruction comments following @golden-rule patterns
- [x] Implement heading removal, length limiting, whitespace cleanup as pure domain logic
- [x] Create `ContentValidationService` domain service for business rules
- [x] Keep services under 250 lines, single responsibility principle

### Task 1.2: Create Content Value Objects
- [x] Build `SanitizedContent` value object in `lib/chatbot-widget/domain/value-objects/content/`
- [x] Create `ContentValidationResult` value object with validation rules
- [x] Implement `ContentType` enumeration (company, compliance, faq, etc.)
- [x] Add immutability and validation following @golden-rule patterns
- [x] Include AI instruction comments for value object handling

### Task 1.3: Create Domain Errors
- [x] Build `ContentValidationError` in `lib/chatbot-widget/domain/errors/`
- [x] Create `ContentSanitizationError` with specific error codes
- [x] Follow domain error hierarchy from @golden-rule.md (using existing DomainErrorBase)
- [x] Include business context and severity levels
- [x] Add proper error codes for programmatic handling

## Phase 2: Application Layer - Use Cases & Orchestration ✅ COMPLETED
**Goal**: Create application services that orchestrate domain services without business logic

### Task 2.1: Create Content Processing Use Cases ✅ COMPLETED
- [x] Build `SanitizeUserContentUseCase` in `lib/chatbot-widget/application/use-cases/`
- [x] Create `ValidateContentUseCase` for content validation workflow
- [x] Orchestrate domain services, no business logic in application layer
- [x] Add proper error handling and domain event publishing
- [x] Follow @golden-rule application layer patterns

### Task 2.2: Create Prompt Assembly Application Service ✅ COMPLETED
- [x] Build `PromptAssemblyApplicationService` in `lib/chatbot-widget/application/services/`
- [x] Coordinate multiple domain services for prompt generation
- [x] Handle workflow orchestration only, delegate all business logic
- [x] Implement proper dependency injection patterns
- [x] Add AI instruction comments for service coordination

### Task 2.3: Create DTOs and Mappers ✅ COMPLETED
- [x] Build `SanitizedContentDTO` in `lib/chatbot-widget/application/dto/`
- [x] Create `PromptTemplateDTO` for clean data contracts
- [x] Build `ContentMapper` in `lib/chatbot-widget/application/mappers/`
- [x] Handle entity/DTO transformation only, no business logic
- [x] Follow immutable data contract patterns

## Phase 3: Infrastructure Layer - Template Engine & External Concerns ✅ COMPLETED
**Goal**: Implement infrastructure services that support domain and application layers

### Task 3.1: Build Template Engine Infrastructure ✅ COMPLETED
- [x] Create `PromptTemplateEngine` in `lib/chatbot-widget/infrastructure/providers/templating/`
- [x] Implement variable substitution and conditional rendering
- [x] Handle template loading and caching
- [x] Abstract template complexity from domain layer
- [x] Add proper error handling for template processing

### Task 3.2: Create Template Files ✅ COMPLETED
- [x] Build `business-persona.template` with role, objectives, communication style
- [x] Create `system-prompt.template` with conditional sections
- [x] Implement template variable substitution patterns
- [x] Add conditional rendering for optional content sections
- [x] Follow template engine patterns for maintainability

### Task 3.3: Update Domain Services for Template Integration ✅ COMPLETED
- [x] Update `PersonaGenerationService` to return template variables instead of strings
- [x] Modify `DynamicPromptService` to use template engine for prompt generation
- [x] Replace hardcoded string concatenation with template processing
- [x] Add proper dependency injection for template engine
- [x] Maintain domain service purity with infrastructure abstraction

### Task 3.4: Update Composition Roots ✅ COMPLETED
- [x] Wire `PromptTemplateEngine` into `AIConfigurationCompositionService`
- [x] Update `DynamicPromptService` dependency injection
- [x] Implement singleton pattern and lazy initialization
- [x] Follow @golden-rule composition root patterns
- [x] Ensure proper service lifecycle management

## Phase 4: Domain Service Integration & Deduplication
**Goal**: Eliminate redundancy while maintaining domain boundaries

### Task 4.1: Create Prompt Coordination Domain Service
- [x] Build `PromptCoordinationService` in `lib/chatbot-widget/domain/services/ai-configuration/`
- [x] Implement section deduplication logic as pure domain rules
- [x] Define service priority rules and conflict resolution
- [x] Maintain single responsibility for prompt coordination
- [x] Add AI instruction comments for coordination patterns

### Task 4.2: Update Existing Domain Services
- [x] Modify `PersonaGenerationService` to work with coordination service
- [x] Update `KnowledgeBaseService` to return structured data instead of strings
- [x] Refactor `DynamicPromptService` to use new domain services
- [x] Remove redundant prompt generation code
- [x] Maintain domain service purity and single responsibility

### Task 4.3: Resolve Identity and Content Conflicts
- [x] Create `IdentityResolutionService` domain service for persona conflicts
- [x] Build `ContentDeduplicationService` for removing duplicate sections
- [x] Implement business rules for content prioritization
- [x] Add domain events for prompt generation state changes
- [x] Follow aggregate boundary rules from @golden-rule

## Phase 5: Presentation Layer - UI Integration
**Goal**: Create clean presentation layer that doesn't expose domain entities

### Task 5.1: Update Presentation Components
- [x] Modify knowledge base forms in `lib/chatbot-widget/presentation/components/`
- [x] Add real-time content validation using React hooks
- [x] Create `useContentValidation` hook in `lib/chatbot-widget/presentation/hooks/`
- [x] Use DTOs only, never expose domain entities to UI
- [x] Follow @golden-rule presentation layer patterns

### Task 5.2: Create Server Actions
- [x] Build content validation server actions in `lib/chatbot-widget/presentation/actions/`
- [x] Handle user requests and delegate to application services
- [x] Implement proper error handling with domain error translation
- [x] Use composition root for dependency injection
- [x] Export only async functions following @golden-rule patterns

### Task 5.3: Add Content Guidelines and Documentation
- [x] Create user documentation for content best practices
- [x] Add UI tooltips and help text for content formatting
- [x] Provide example content templates
- [x] Document character limits and validation rules
- [x] Implement proper user feedback for validation errors

## Phase 6: Legacy Code Cleanup & Removal
**Goal**: Remove obsolete services and update dependencies after full template engine implementation

### Task 6.1: Remove Obsolete Domain Services
- [x] **DELETE**: `ChatbotSystemPromptService.ts` - completely replaced by template engine
  - Location: `lib/chatbot-widget/domain/services/ai-configuration/ChatbotSystemPromptService.ts`
  - Status: ❌ OBSOLETE - hardcoded string concatenation replaced by template approach
  - Dependencies: Only used by `ChatbotConfig.generateSystemPrompt()` method

### Task 6.2: Update Domain Entities
- [x] **REFACTOR**: `ChatbotConfig.ts` - remove obsolete `generateSystemPrompt()` method
  - Location: `lib/chatbot-widget/domain/entities/ChatbotConfig.ts` (lines 176-184)
  - Remove import: `ChatbotSystemPromptService`
  - Remove method: `generateSystemPrompt(): string`
  - Status: ❌ OBSOLETE - replaced by `DynamicPromptService` with template engine

### Task 6.3: Evaluate Infrastructure Services
- [x] **EVALUATE**: `PromptTemplateService.ts` - determine if still needed for intent classification
  - Location: `lib/chatbot-widget/infrastructure/providers/openai/services/PromptTemplateService.ts`
  - Status: ❓ PARTIALLY OBSOLETE - contains hardcoded templates that duplicate template engine
  - Usage: Still used by `OpenAIPromptBuilder` for intent classification prompts
  - Decision: Keep if needed for OpenAI-specific prompt formatting, refactor if duplicating template engine

- [x] **EVALUATE**: `OpenAIPromptBuilder.ts` - update to use template engine or keep for specialized prompts
  - Location: `lib/chatbot-widget/infrastructure/providers/openai/services/OpenAIPromptBuilder.ts`
  - Status: ❓ PARTIALLY OBSOLETE - uses string concatenation instead of template engine
  - Usage: Used for intent classification and behavioral analysis prompts
  - Decision: Keep if providing OpenAI-specific functionality not covered by template engine

### Task 6.4: Remove Redundant Composition Roots
- [x] **EVALUATE**: `PromptProcessingCompositionRoot.ts` - check if redundant
  - Location: `lib/chatbot-widget/infrastructure/composition/PromptProcessingCompositionRoot.ts`
  - Status: ❓ POTENTIALLY OBSOLETE - may be redundant with `AIConfigurationCompositionService`
  - Usage: No imports found - appears unused
  - Decision: DELETE if truly unused, MERGE into `AIConfigurationCompositionService` if has unique dependencies

### Task 6.5: Update API Routes and Tests
- [x] **UPDATE**: Chat API route fallback - replace `config.generateSystemPrompt()` calls
  - Location: `app/api/chatbot-widget/chat/route.ts` (line 73)
  - Current: Uses obsolete `config.generateSystemPrompt()` for debug info
  - Replace with: Call to `DynamicPromptService.generateSystemPrompt()` via composition root

- [x] **UPDATE**: Test files - replace obsolete method calls
  - Locations:
    - `lib/chatbot-widget/__tests__/domain/entities/ChatbotConfig.test.ts` (lines 126, 127, 405)
    - `lib/chatbot-widget/domain/entities/__tests__/ChatbotConfig.test.ts` (line 377)
  - Replace: `config.generateSystemPrompt()` calls with proper service calls
  - Update: Test expectations to match new template engine output

### Task 6.6: Verify No Breaking Changes
- [x] **VERIFY**: All existing functionality still works
  - Test: Chatbot conversations produce same quality responses
  - Test: Debug information still available in API responses
  - Test: No regression in prompt generation quality
  - Test: All composition root dependencies properly wired

### Task 6.7: Documentation Updates
- [x] **UPDATE**: Remove references to obsolete services in documentation
- [x] **UPDATE**: API documentation to reflect new prompt generation approach
- [x] **ADD**: Migration notes for any breaking changes
- [x] **UPDATE**: Architecture diagrams to show template engine flow

## **Cleanup Impact Analysis**

### Files to DELETE (Complete Removal)
```
lib/chatbot-widget/domain/services/ai-configuration/ChatbotSystemPromptService.ts ❌
lib/chatbot-widget/infrastructure/composition/PromptProcessingCompositionRoot.ts ❓ (if unused)
```

### Files to REFACTOR (Partial Changes)
```
lib/chatbot-widget/domain/entities/ChatbotConfig.ts ✏️
- Remove generateSystemPrompt() method (lines 176-184)
- Remove ChatbotSystemPromptService import (line 11)

app/api/chatbot-widget/chat/route.ts ✏️
- Replace config.generateSystemPrompt() call (line 73)
- Use DynamicPromptService via composition root

lib/chatbot-widget/__tests__/domain/entities/ChatbotConfig.test.ts ✏️
- Update test expectations for removed method
- Replace obsolete method calls with service calls

lib/chatbot-widget/domain/entities/__tests__/ChatbotConfig.test.ts ✏️
- Update test expectations for removed method
- Replace obsolete method calls with service calls
```

### Files to EVALUATE (Decision Required)
```
lib/chatbot-widget/infrastructure/providers/openai/services/PromptTemplateService.ts ❓
- Contains hardcoded templates that may duplicate template engine functionality
- Still used for OpenAI-specific intent classification prompts
- Decision: Keep if providing unique OpenAI formatting, refactor if duplicating template engine

lib/chatbot-widget/infrastructure/providers/openai/services/OpenAIPromptBuilder.ts ❓
- Uses string concatenation approach instead of template engine
- Provides behavioral analysis and intent classification functionality
- Decision: Keep if providing specialized OpenAI integration, update to use template engine if possible
```

### Migration Strategy
1. **Phase 6.1-6.2**: Remove clearly obsolete services and methods
2. **Phase 6.3-6.4**: Evaluate and refactor infrastructure services
3. **Phase 6.5**: Update API routes and tests to use new services
4. **Phase 6.6**: Comprehensive testing to ensure no regressions
5. **Phase 6.7**: Update documentation and architecture diagrams

### Risk Mitigation
- **Backup Strategy**: Keep obsolete files in a separate branch before deletion
- **Incremental Approach**: Remove one service at a time and test
- **Fallback Plan**: Ability to restore obsolete services if issues discovered
- **Testing Strategy**: Run full test suite after each cleanup phase

## **Next Steps**
1. Complete Phase 4 (Domain Service Integration & Deduplication) first
2. Complete Phase 5 (Presentation Layer Integration) 
3. Then proceed with Phase 6 cleanup after full implementation is verified
4. Follow DDD layer architecture strictly throughout
5. Test each cleanup phase independently before proceeding 