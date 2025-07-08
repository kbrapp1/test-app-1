# Chatbot Widget API Route Refactoring Plan

## Current Issues Analysis

The current `app/api/chatbot-widget/chat/route.ts` file violates multiple DDD principles:

- **1,405 lines** - Far exceeds 200-250 line limit
- **Multiple responsibilities** - API handling, debug data generation, business logic
- **Infrastructure concerns in presentation layer** - Cost calculations, token counting
- **Hardcoded mock data** - Debug info generation mixed with real logic
- **No proper layer separation** - Business logic in API route

## Refactoring Strategy

Follow **golden-rule.mdc** DDD architecture to create a clean, maintainable, and testable solution.

----

## Phase 1: Extract Domain Services

### Step 1.1: Create Debug Information Domain Service
- [ ] Create `lib/chatbot-widget/domain/services/DebugInformationService.ts`
- [ ] Move all debug data generation logic from route
- [ ] Create pure domain methods for debug data calculation
- [ ] Add comprehensive unit tests

```typescript
// Target: lib/chatbot-widget/domain/services/DebugInformationService.ts
export class DebugInformationService {
  generateDebugInfo(result: ProcessChatResult, metadata: DebugMetadata): DebugInfo
  calculateApiCallDetails(result: ProcessChatResult): ApiCallDetails[]
  generateCostBreakdown(usage: TokenUsage, model: string): CostBreakdown
}
```

### Step 1.2: Create Cost Calculation Domain Service
- [ ] Create `lib/chatbot-widget/domain/services/CostCalculationService.ts`
- [ ] Extract all cost calculation methods
- [ ] Create domain value objects for cost data
- [ ] Add unit tests for all cost calculations

```typescript
// Target: lib/chatbot-widget/domain/services/CostCalculationService.ts
export class CostCalculationService {
  calculateCost(promptTokens: number, completionTokens: number, model: string): Cost
  getInputCostPerToken(model: string): number
  getOutputCostPerToken(model: string): number
  calculateDetailedCostBreakdown(usage: TokenUsage, model: string): DetailedCost
}
```

### Step 1.3: Create Lead Scoring Analysis Service
- [ ] Create `lib/chatbot-widget/domain/services/LeadScoringAnalysisService.ts`
- [ ] Extract lead scoring breakdown logic
- [ ] Move business rules identification logic
- [ ] Add comprehensive unit tests

```typescript
// Target: lib/chatbot-widget/domain/services/LeadScoringAnalysisService.ts
export class LeadScoringAnalysisService {
  calculateLeadScoringBreakdown(analysis: IntentAnalysis, session: ChatSession): ScoringBreakdown[]
  identifyTriggeredBusinessRules(result: ProcessChatResult): BusinessRule[]
  calculateJourneyProgression(state: JourneyState, session: ChatSession): JourneyProgression
}
```

---

## Phase 2: Create Value Objects

### Step 2.1: Debug Information Value Objects
- [ ] Create `lib/chatbot-widget/domain/value-objects/DebugInfo.ts`
- [ ] Create `lib/chatbot-widget/domain/value-objects/ApiCallDetails.ts`
- [ ] Create `lib/chatbot-widget/domain/value-objects/PerformanceMetrics.ts`
- [ ] Add validation and immutability
- [ ] Add unit tests for all value objects

### Step 2.2: Cost Calculation Value Objects
- [ ] Create `lib/chatbot-widget/domain/value-objects/Cost.ts`
- [ ] Create `lib/chatbot-widget/domain/value-objects/TokenUsage.ts`
- [ ] Create `lib/chatbot-widget/domain/value-objects/CostBreakdown.ts`
- [ ] Ensure immutability and validation
- [ ] Add comprehensive unit tests

### Step 2.3: Analytics Value Objects
- [ ] Create `lib/chatbot-widget/domain/value-objects/ScoringBreakdown.ts`
- [ ] Create `lib/chatbot-widget/domain/value-objects/BusinessRule.ts`
- [ ] Create `lib/chatbot-widget/domain/value-objects/JourneyProgression.ts`
- [ ] Add validation and business logic
- [ ] Add unit tests

---

## Phase 3: Create Application Services

### Step 3.1: Create Debug Information Application Service
- [ ] Create `lib/chatbot-widget/application/services/DebugInformationApplicationService.ts`
- [ ] Orchestrate debug info generation using domain services
- [ ] Handle application-level concerns (logging, error handling)
- [ ] Add integration tests

```typescript
// Target: lib/chatbot-widget/application/services/DebugInformationApplicationService.ts
export class DebugInformationApplicationService {
  constructor(
    private debugService: DebugInformationService,
    private costService: CostCalculationService,
    private scoringService: LeadScoringAnalysisService
  ) {}

  async generateComprehensiveDebugInfo(result: ProcessChatResult): Promise<ComprehensiveDebugInfo>
}
```

### Step 3.2: Create Chat Response Application Service
- [ ] Create `lib/chatbot-widget/application/services/ChatResponseApplicationService.ts`
- [ ] Orchestrate the complete chat response workflow
- [ ] Coordinate between use cases and domain services
- [ ] Add integration tests

```typescript
// Target: lib/chatbot-widget/application/services/ChatResponseApplicationService.ts
export class ChatResponseApplicationService {
  async processAndEnrichChatResponse(request: ChatRequest): Promise<EnrichedChatResponse>
}
```

---

## Phase 4: Create DTOs

### Step 4.1: Request/Response DTOs
- [ ] Create `lib/chatbot-widget/application/dto/ChatRequestDto.ts`
- [ ] Create `lib/chatbot-widget/application/dto/ChatResponseDto.ts`
- [ ] Create `lib/chatbot-widget/application/dto/DebugInfoDto.ts`
- [ ] Add validation and type safety
- [ ] Add unit tests

### Step 4.2: Internal DTOs
- [ ] Create `lib/chatbot-widget/application/dto/ProcessingMetricsDto.ts`
- [ ] Create `lib/chatbot-widget/application/dto/AnalyticsDataDto.ts`
- [ ] Ensure clean boundaries between layers
- [ ] Add validation and tests

---

## Phase 5: Create Mappers

### Step 5.1: Domain to DTO Mappers
- [ ] Create `lib/chatbot-widget/application/mappers/DebugInfoMapper.ts`
- [ ] Create `lib/chatbot-widget/application/mappers/ChatResponseMapper.ts`
- [ ] Create `lib/chatbot-widget/application/mappers/AnalyticsMapper.ts`
- [ ] Add comprehensive mapping logic
- [ ] Add unit tests for all mappings

---

## Phase 6: Update Infrastructure Layer

### Step 6.1: Update Composition Root
- [ ] Update `lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot.ts`
- [ ] Wire new services and dependencies
- [ ] Implement singleton pattern for new services
- [ ] Add integration tests

```typescript
// Enhanced composition root
export class ChatbotWidgetCompositionRoot {
  static getDebugInformationApplicationService(): DebugInformationApplicationService
  static getChatResponseApplicationService(): ChatResponseApplicationService
  static getDebugInformationService(): DebugInformationService
  static getCostCalculationService(): CostCalculationService
  static getLeadScoringAnalysisService(): LeadScoringAnalysisService
}
```

---

## Phase 7: Refactor API Route

### Step 7.1: Simplify Route Handler
- [ ] Reduce route to **under 50 lines**
- [ ] Remove all business logic
- [ ] Delegate to application services via composition root
- [ ] Add proper error handling

```typescript
// Target: Clean, thin API route
async function postHandler(request: NextRequest, user: User, supabase: SupabaseClient) {
  // 1. Parse and validate request
  const body = await request.json();
  const { message, sessionId, clientInfo } = body;

  if (!message || !sessionId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 2. Get services from composition root
  const chatResponseService = ChatbotWidgetCompositionRoot.getChatResponseApplicationService();
  
  // 3. Process request
  const result = await chatResponseService.processAndEnrichChatResponse({
    message,
    sessionId,
    clientInfo,
    includeDebugInfo: true
  });

  // 4. Return response
  return NextResponse.json(result);
}
```

### Step 7.2: Add Request Validation
- [ ] Create request validation using DTOs
- [ ] Add proper error responses
- [ ] Add request/response logging
- [ ] Add performance monitoring

---

## Phase 8: Testing Strategy

### Step 8.1: Unit Tests
- [ ] Test all domain services in isolation
- [ ] Test all value objects
- [ ] Test all mappers
- [ ] Achieve >90% test coverage
- [ ] Use **pnpm test** command

### Step 8.2: Integration Tests
- [ ] Test application services
- [ ] Test composition root wiring
- [ ] Test end-to-end API flow
- [ ] Test error scenarios

### Step 8.3: Performance Tests
- [ ] Benchmark API response times
- [ ] Test memory usage
- [ ] Validate under load
- [ ] Ensure <3 second response time

---

## Phase 9: Clean Up and Documentation

### Step 9.1: Remove Legacy Code
- [ ] Delete old helper functions from route
- [ ] Remove hardcoded mock data
- [ ] Clean up unused imports
- [ ] Remove console.log statements

### Step 9.2: Add Documentation
- [ ] Document new domain services
- [ ] Add API documentation
- [ ] Create architecture diagrams
- [ ] Update README files

---

## Validation Checklist

### DDD Compliance
- [ ] Domain layer contains only pure business logic
- [ ] Application layer coordinates without business logic
- [ ] Infrastructure layer implements interfaces
- [ ] Presentation layer is thin and delegates properly

### Golden Rule Compliance
- [ ] All files under 200-250 lines
- [ ] Single responsibility per service
- [ ] No duplication across codebase
- [ ] Proper error handling
- [ ] No console.log statements in final code

### Performance Requirements
- [ ] API response time < 3 seconds
- [ ] Memory usage optimized
- [ ] Efficient data structures
- [ ] Proper caching where applicable

### Testing Requirements
- [ ] Unit tests for all services
- [ ] Integration tests for workflows
- [ ] >90% test coverage
- [ ] All tests pass with **pnpm test**

---

## Expected Outcomes

### File Structure After Refactoring
```
lib/chatbot-widget/
├── domain/
│   ├── services/
│   │   ├── DebugInformationService.ts           # ~150 lines
│   │   ├── CostCalculationService.ts            # ~100 lines
│   │   └── LeadScoringAnalysisService.ts        # ~120 lines
│   └── value-objects/
│       ├── DebugInfo.ts                         # ~80 lines
│       ├── Cost.ts                              # ~60 lines
│       └── [other VOs...]                       # ~50-80 lines each
├── application/
│   ├── services/
│   │   ├── DebugInformationApplicationService.ts # ~100 lines
│   │   └── ChatResponseApplicationService.ts     # ~120 lines
│   ├── dto/
│   │   └── [DTOs...]                            # ~40-60 lines each
│   └── mappers/
│       └── [Mappers...]                         # ~80-100 lines each
└── infrastructure/
    └── composition/
        └── ChatbotWidgetCompositionRoot.ts      # ~200 lines

app/api/chatbot-widget/chat/route.ts             # ~40 lines
```

### Benefits
- **Maintainable**: Each file has single responsibility
- **Testable**: Pure functions and dependency injection
- **Scalable**: Clear boundaries and abstractions
- **Performant**: Optimized business logic separation
- **Compliant**: Follows all golden-rule.mdc principles

### Key Improvements
1. **Separation of Concerns**: Business logic moved to domain layer
2. **Testability**: Pure functions and dependency injection enable comprehensive testing
3. **Maintainability**: Small, focused files with single responsibilities
4. **Scalability**: Clean architecture supports future enhancements
5. **Performance**: Optimized data flow and reduced coupling
6. **Compliance**: Adheres to DDD principles and golden-rule.mdc guidelines

This refactoring transforms a monolithic 1,405-line API route into a clean, maintainable DDD architecture with proper separation of concerns. 