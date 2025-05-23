# TTS DDD Migration Checklist

## Overview
This checklist covers the complete migration of the Text-to-Speech (TTS) system to Domain-Driven Design (DDD) architecture. The TTS system has unique complexity due to external service orchestration and async workflows.

**Current Status: Use Cases Exist** ✅  
**Target: Full DDD Architecture** 🎯  
**Estimated Duration: 13-18 days** ⏱️

---

## 🏗️ Phase 1: Domain Layer Foundation

### 1.1 Create Domain Entities
- [ ] **Create `TtsPrediction` Entity**
  - [ ] Define prediction lifecycle states (pending, processing, completed, failed, cancelled)
  - [ ] Add state transition validation (can only go pending → processing → completed/failed)
  - [ ] Add business rules (text length limits, voice compatibility)
  - [ ] Add retry logic and attempt tracking
  - [ ] Test entity creation and state transitions
- [ ] **Create `Voice` Entity**
  - [ ] Define voice properties (id, name, provider, language, gender)
  - [ ] Add provider-specific configuration
  - [ ] Add voice availability validation
  - [ ] Test voice entity creation and validation
- [ ] **Create `TextContent` Value Object**
  - [ ] Add text validation (length limits, character restrictions)
  - [ ] Add sanitization logic
  - [ ] Add provider-specific text processing rules
  - [ ] Test text content validation and processing

### 1.2 Define Repository Interfaces
- [ ] **Create `ITtsPredictionRepository`**
  - [ ] Define CRUD operations
  - [ ] Define query methods (by user, by status, by date range)
  - [ ] Define bulk operations for history management
- [ ] **Create `IVoiceRepository`**
  - [ ] Define voice listing by provider
  - [ ] Define voice search and filtering
  - [ ] Define voice availability checking
- [ ] **Create `IAudioFileRepository`**
  - [ ] Define audio file storage operations
  - [ ] Define metadata management
  - [ ] Define cleanup operations

### 1.3 Define Domain Services
- [ ] **Create `TtsPredictionStateManager`**
  - [ ] Implement state transition logic
  - [ ] Add retry policies
  - [ ] Add timeout handling
- [ ] **Create `VoiceCompatibilityService`**
  - [ ] Check voice availability per provider
  - [ ] Validate voice-text compatibility
  - [ ] Handle provider-specific limitations

### 📋 **Manual Testing Checkpoint 1.3**
```bash
# Test domain entities in isolation
npm test -- lib/tts/domain/entities/
npm test -- lib/tts/domain/value-objects/
npm test -- lib/tts/domain/services/

# Verify:
✅ TtsPrediction entity state transitions work correctly
✅ Voice entity validation catches invalid configurations  
✅ TextContent value object enforces business rules
✅ All domain tests pass
```

---

## 🚀 Phase 2: Application Layer (Use Cases)

### 2.1 Refactor Existing Use Cases to Pure DDD
- [ ] **Migrate `startSpeechGeneration` Use Case**
  - [ ] Remove direct Supabase calls
  - [ ] Use repository abstractions
  - [ ] Implement proper error handling with domain exceptions
  - [ ] Add input validation using domain value objects
  - [ ] Test with mocked repositories
- [ ] **Migrate `getSpeechGenerationResult` Use Case**
  - [ ] Abstract external service polling
  - [ ] Use domain state management
  - [ ] Add proper timeout and retry logic
  - [ ] Test polling scenarios
- [ ] **Migrate `getTtsHistory` Use Case**
  - [ ] Use repository query methods
  - [ ] Add pagination and filtering
  - [ ] Return proper DTOs
  - [ ] Test history retrieval and filtering
- [ ] **Migrate `saveTtsAudioToDam` Use Case**
  - [ ] Clean up DAM integration
  - [ ] Use proper domain models
  - [ ] Add file validation
  - [ ] Test DAM integration

### 2.2 Create New Use Cases
- [ ] **Create `CancelTtsPredictionUseCase`**
  - [ ] Implement prediction cancellation logic
  - [ ] Handle provider-specific cancellation
  - [ ] Update prediction state properly
  - [ ] Test cancellation scenarios
- [ ] **Create `RetryTtsPredictionUseCase`**
  - [ ] Implement retry logic with backoff
  - [ ] Track retry attempts
  - [ ] Handle different failure types
  - [ ] Test retry scenarios
- [ ] **Create `GetAvailableVoicesUseCase`**
  - [ ] Abstract voice fetching from providers
  - [ ] Cache voice lists appropriately
  - [ ] Handle provider outages gracefully
  - [ ] Test voice listing and caching

### 2.3 Create Application DTOs
- [ ] **Create TTS Request/Response DTOs**
  - [ ] `GenerateSpeechRequestDto`
  - [ ] `SpeechGenerationResultDto`
  - [ ] `TtsPredictionSummaryDto`
  - [ ] `VoiceDto` and `VoiceListDto`
- [ ] **Create History DTOs**
  - [ ] `TtsHistoryItemDto`
  - [ ] `TtsHistoryPageDto`
  - [ ] `TtsHistoryFiltersDto`

### 📋 **Manual Testing Checkpoint 2.3**
```bash
# Test use cases with integration tests
npm test -- lib/tts/application/use-cases/
npm run test:integration -- tts

# Manual verification:
1. Start development server: pnpm run dev
2. Navigate to TTS interface
3. Test speech generation workflow:
   ✅ Text input validation works
   ✅ Voice selection shows available voices
   ✅ Generation starts successfully
   ✅ Progress tracking works
   ✅ Result audio plays correctly
   ✅ History panel shows generation
```

---

## 🔧 Phase 3: Infrastructure Layer

### 3.1 Create Repository Implementations
- [ ] **Create `SupabaseTtsPredictionRepository`**
  - [ ] Implement all repository interface methods
  - [ ] Add proper SQL queries with indexes
  - [ ] Handle database errors gracefully
  - [ ] Add logging for debugging
  - [ ] Test CRUD operations
- [ ] **Create `SupabaseVoiceRepository`**
  - [ ] Implement voice storage and retrieval
  - [ ] Add voice caching mechanism
  - [ ] Handle provider voice updates
  - [ ] Test voice operations
- [ ] **Create `SupabaseAudioFileRepository`**
  - [ ] Implement file metadata storage
  - [ ] Integrate with Supabase Storage
  - [ ] Add cleanup for orphaned files
  - [ ] Test file operations

### 3.2 Create External Service Abstractions
- [ ] **Create `ITtsGenerationService` Interface**
  - [ ] Define common generation methods
  - [ ] Handle async vs sync generation patterns
  - [ ] Define error handling contract
- [ ] **Create `ReplicateTtsService` Implementation**
  - [ ] Abstract Replicate API calls
  - [ ] Implement polling mechanism
  - [ ] Handle webhook integration (if applicable)
  - [ ] Add proper error mapping
  - [ ] Test Replicate integration
- [ ] **Create `ElevenLabsTtsService` Implementation**
  - [ ] Abstract ElevenLabs API calls
  - [ ] Handle synchronous generation
  - [ ] Add rate limiting and quota management
  - [ ] Test ElevenLabs integration
- [ ] **Create `MockTtsService` for Testing**
  - [ ] Implement predictable test responses
  - [ ] Add configurable delays and failures
  - [ ] Support different test scenarios

### 3.3 Create Storage Services
- [ ] **Create `TtsAudioStorageService`**
  - [ ] Handle audio file uploads to Supabase Storage
  - [ ] Generate proper file paths and metadata
  - [ ] Add file compression/optimization
  - [ ] Implement cleanup policies
  - [ ] Test storage operations

### 📋 **Manual Testing Checkpoint 3.3**
```bash
# Test infrastructure layer
npm test -- lib/tts/infrastructure/

# Manual provider testing:
1. Test Replicate integration:
   ✅ Can create prediction
   ✅ Can poll for results
   ✅ Handles timeouts gracefully
   ✅ Error messages are clear

2. Test ElevenLabs integration:
   ✅ Can generate speech synchronously
   ✅ Audio quality is maintained
   ✅ Rate limiting works
   ✅ API errors are handled

3. Test file storage:
   ✅ Audio files upload successfully
   ✅ Metadata is stored correctly
   ✅ File URLs are accessible
   ✅ Cleanup works as expected
```

---

## 🔌 Phase 4: Interface Adapters (Server Actions)

### 4.1 Create TTS Server Actions
- [ ] **Create `generateSpeech` Server Action**
  - [ ] Use `GenerateSpeechUseCase`
  - [ ] Apply executor pattern from DAM
  - [ ] Add proper input validation
  - [ ] Handle authentication and organization context
  - [ ] Return serializable results
  - [ ] Test action execution
- [ ] **Create `getTtsPredictionStatus` Server Action**
  - [ ] Use `GetSpeechGenerationResultUseCase`
  - [ ] Handle polling requests efficiently
  - [ ] Add proper caching headers
  - [ ] Test status polling
- [ ] **Create `getTtsHistory` Server Action**
  - [ ] Use `GetTtsHistoryUseCase`
  - [ ] Add pagination support
  - [ ] Handle filtering and sorting
  - [ ] Test history retrieval
- [ ] **Create `cancelTtsPrediction` Server Action**
  - [ ] Use `CancelTtsPredictionUseCase`
  - [ ] Handle cancellation properly
  - [ ] Update UI state correctly
  - [ ] Test cancellation flow

### 4.2 Update TTS Components
- [ ] **Update `tts-interface.tsx`**
  - [ ] Use new server actions instead of direct API calls
  - [ ] Update error handling
  - [ ] Improve loading states
  - [ ] Test component functionality
- [ ] **Update `TtsHistoryPanel.tsx`**
  - [ ] Use new history server action
  - [ ] Update data structures
  - [ ] Test history display and interactions
- [ ] **Update `VoiceSelector.tsx`**
  - [ ] Use new voice listing action
  - [ ] Handle provider switching
  - [ ] Test voice selection

### 📋 **Manual Testing Checkpoint 4.2**
```bash
# Test full TTS workflow
pnpm run dev

# Complete end-to-end testing:
1. TTS Generation Flow:
   ✅ Open TTS interface
   ✅ Enter text (test validation)
   ✅ Select voice from dropdown
   ✅ Start generation
   ✅ Monitor progress/polling
   ✅ Verify audio playback
   ✅ Check history panel updates

2. Error Handling:
   ✅ Test invalid input text
   ✅ Test network failures
   ✅ Test provider outages
   ✅ Test timeout scenarios
   ✅ Verify error messages are user-friendly

3. Provider Switching:
   ✅ Switch between Replicate and ElevenLabs
   ✅ Verify voice lists update
   ✅ Test generation with both providers
   ✅ Check different audio qualities

4. History Management:
   ✅ Verify history displays correctly
   ✅ Test history filtering
   ✅ Test history pagination
   ✅ Test replay functionality
   ✅ Test deletion of history items
```

---

## 🧪 Phase 5: Comprehensive Testing

### 5.1 Unit Tests
- [ ] **Domain Entity Tests**
  - [ ] `TtsPrediction.test.ts` - state transitions, validation
  - [ ] `Voice.test.ts` - voice validation, provider compatibility
  - [ ] `TextContent.test.ts` - text validation, sanitization
- [ ] **Use Case Tests**
  - [ ] `GenerateSpeechUseCase.test.ts`
  - [ ] `GetSpeechGenerationResultUseCase.test.ts`
  - [ ] `GetTtsHistoryUseCase.test.ts`
  - [ ] `CancelTtsPredictionUseCase.test.ts`
  - [ ] `RetryTtsPredictionUseCase.test.ts`
- [ ] **Repository Tests**
  - [ ] `SupabaseTtsPredictionRepository.test.ts`
  - [ ] `SupabaseVoiceRepository.test.ts`
  - [ ] `SupabaseAudioFileRepository.test.ts`
- [ ] **Service Tests**
  - [ ] `ReplicateTtsService.test.ts`
  - [ ] `ElevenLabsTtsService.test.ts`
  - [ ] `TtsAudioStorageService.test.ts`

### 5.2 Integration Tests
- [ ] **TTS Workflow Integration Tests**
  - [ ] End-to-end generation flow
  - [ ] Provider switching scenarios
  - [ ] Error recovery scenarios
  - [ ] Concurrent generation handling
- [ ] **Database Integration Tests**
  - [ ] Repository operations with real database
  - [ ] Transaction handling
  - [ ] Data consistency checks
- [ ] **External Service Integration Tests**
  - [ ] Replicate API integration (with test account)
  - [ ] ElevenLabs API integration (with test account)
  - [ ] Storage service integration

### 📋 **Manual Testing Checkpoint 5.2**
```bash
# Run full test suite
npm test
npm run test:integration
npm run test:e2e

# Manual stress testing:
1. Load Testing:
   ✅ Generate multiple speeches simultaneously
   ✅ Verify system handles concurrent requests
   ✅ Check database performance under load
   ✅ Monitor memory usage

2. Edge Cases:
   ✅ Very long text input (near limits)
   ✅ Special characters and emojis
   ✅ Multiple language texts
   ✅ Rapid successive generations

3. Provider Reliability:
   ✅ Test when Replicate is slow
   ✅ Test when ElevenLabs hits rate limits
   ✅ Test network interruptions during generation
   ✅ Verify graceful degradation
```

---

## 🧹 Phase 6: Migration & Cleanup

### 6.1 Data Migration (if needed)
- [ ] **Migrate Existing TTS Data**
  - [ ] Create migration scripts for existing predictions
  - [ ] Update database schema if needed
  - [ ] Verify data integrity after migration
  - [ ] Test with migrated data

### 6.2 Remove Legacy Code
- [ ] **Remove Old API Routes**
  - [ ] Remove `/api/tts/` routes if they exist
  - [ ] Update any remaining direct API calls
  - [ ] Clean up unused dependencies
- [ ] **Update Component Imports**
  - [ ] Remove old service imports
  - [ ] Update hook dependencies
  - [ ] Clean up unused utilities

### 6.3 Performance Optimization
- [ ] **Database Optimization**
  - [ ] Add appropriate indexes for TTS queries
  - [ ] Optimize history retrieval queries
  - [ ] Add database connection pooling if needed
- [ ] **Caching Strategy**
  - [ ] Implement voice list caching
  - [ ] Add prediction result caching
  - [ ] Cache audio file metadata
- [ ] **Storage Optimization**
  - [ ] Implement audio file compression
  - [ ] Add cleanup policies for old files
  - [ ] Optimize file serving

---

## 🚀 Phase 7: Advanced Features (Optional)

### 7.1 Domain Events
- [ ] **Implement TTS Domain Events**
  - [ ] `SpeechGenerationStarted`
  - [ ] `SpeechGenerationCompleted`
  - [ ] `SpeechGenerationFailed`
  - [ ] `VoiceProviderSwitched`
- [ ] **Create Event Handlers**
  - [ ] Analytics event logging
  - [ ] User notification triggers
  - [ ] Audit trail maintenance

### 7.2 Advanced Monitoring
- [ ] **Add TTS Metrics**
  - [ ] Generation success/failure rates
  - [ ] Provider performance metrics
  - [ ] Audio quality tracking
  - [ ] User engagement metrics
- [ ] **Health Checks**
  - [ ] Provider availability checks
  - [ ] Storage service health
  - [ ] Database performance monitoring

### 📋 **Final Manual Testing Checkpoint**
```bash
# Comprehensive system verification
1. Full Feature Testing:
   ✅ All TTS features work end-to-end
   ✅ Error handling is robust
   ✅ Performance is acceptable
   ✅ UI/UX is smooth and responsive

2. Cross-browser Testing:
   ✅ Chrome, Firefox, Safari
   ✅ Mobile browsers
   ✅ Audio playback works everywhere

3. Load Testing:
   ✅ Multiple users can generate speech simultaneously
   ✅ System remains responsive under load
   ✅ No memory leaks during extended use

4. Data Integrity:
   ✅ History is accurately maintained
   ✅ Audio files are properly stored
   ✅ No orphaned data exists
```

---

## ✅ Final Verification & Sign-off

### Technical Verification
- [ ] **Architecture Review**
  - [ ] Clean dependency flow (Components → Actions → Use Cases → Domain)
  - [ ] No circular dependencies
  - [ ] Proper separation of concerns
  - [ ] All external services properly abstracted
- [ ] **Code Quality**
  - [ ] All tests passing (unit, integration, e2e)
  - [ ] Code coverage >80% for critical paths
  - [ ] TypeScript strict mode enabled
  - [ ] No console.log statements in production code
- [ ] **Performance Validation**
  - [ ] Speech generation <30s for normal text
  - [ ] History loading <2s
  - [ ] Voice selection <1s
  - [ ] Audio playback starts <3s

### Business Verification  
- [ ] **User Acceptance Testing**
  - [ ] All TTS features work as expected
  - [ ] Error messages are user-friendly
  - [ ] Performance meets user expectations
  - [ ] Audio quality is acceptable
- [ ] **Stakeholder Sign-off**
  - [ ] Technical team approval
  - [ ] Product team approval
  - [ ] User experience validation

---

## 📝 Progress Log

### Completed Items
*(Track your progress with dates and notes)*

```
Date: [YYYY-MM-DD]
Phase: [Phase Number]
Completed: [Specific task/checkpoint]
Notes: [Any issues, learnings, or important decisions]
Duration: [Time taken]
```

### Issues & Resolutions
*(Track problems encountered and solutions)*

- **Issue**: [Description]
  - **Impact**: [High/Medium/Low]
  - **Solution**: [How it was resolved]
  - **Prevention**: [How to avoid in future]

### Architecture Decisions
*(Document important technical decisions)*

- **Decision**: [What was decided]
  - **Context**: [Why the decision was needed]
  - **Options**: [Alternatives considered]
  - **Rationale**: [Why this option was chosen]

---

## 🎯 Success Criteria

The TTS DDD migration is complete when:

1. ✅ **Clean DDD Architecture** - Domain, Application, Infrastructure, Interface layers properly separated
2. ✅ **External Service Abstraction** - Replicate and ElevenLabs properly abstracted behind interfaces
3. ✅ **Async State Management** - Prediction lifecycle properly managed through domain
4. ✅ **Comprehensive Testing** - >80% test coverage with unit, integration, and e2e tests
5. ✅ **Performance Standards** - Generation <30s, UI responsive, error handling robust
6. ✅ **User Experience** - All features work smoothly, error messages clear, audio quality maintained

---

**Current Status**: Ready to Start 🚀  
**Target Completion**: 13-18 days  
**Complexity**: Moderate (6/10)  
**Key Challenge**: External service orchestration & async workflows 