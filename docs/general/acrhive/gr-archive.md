# Golden Rule DDD Guidelines for Next.js

## Core Principles

1. **High-priority**: Always use DDD design best-practices, coding, architecture, compliance etc.
2. **Single Responsibility Principle**
   → Each service has one clear purpose
   → keep to 200-250 lines if possible
3. Review appropriate codebase to ensure new code is not redundant with existing code. If so, pls provide a recommendation and design that is using practices, DDD, network efficient, api efficient (minimize redundant calls), memory/cache efficient, rendering efficient.
4. Please avoid pnpm/npm run build. The dev enviroment hotloads.

## DDD Layer Architecture for Next.js

### Domain Layer (Core Business Logic)
The innermost layer containing pure business logic, isolated from external concerns.

**Components:**
- **Entities**: Core business objects with identity
  - Location: `lib/{domain}/domain/entities/`
  - Example: `lib/image-generator/domain/entities/Generation.ts`
  - Keep business logic pure, no external dependencies

- **Value Objects**: Immutable objects that describe domain characteristics
  - Location: `lib/{domain}/domain/value-objects/`
  - Example: `lib/image-generator/domain/value-objects/Prompt.ts`
  - Ensure immutability and validation

- **Domain Services**: Business logic that doesn't belong to a single entity
  - Location: `lib/{domain}/domain/services/`
  - Focus on domain rules and calculations
  - No infrastructure concerns

- **Repository Interfaces**: Contracts for data access (interfaces only)
  - Location: `lib/{domain}/domain/repositories/`
  - Define data access contracts, no implementations

- **Domain Events**: Events that occur within the domain
  - Location: `lib/{domain}/domain/events/`
  - Represent significant business occurrences

- **Specifications**: Business rule patterns for complex queries
  - Location: `lib/{domain}/domain/specifications/`
  - Encapsulate business rules for reusability

### Application Layer (Use Cases & Orchestration)
Coordinates domain objects to fulfill use cases, contains no business logic.

**Components:**
- **Use Cases**: Application-specific business rules
  - Location: `lib/{domain}/application/use-cases/`
  - Orchestrate domain objects for specific scenarios
  - Keep focused on single use case

- **Application Services**: Coordinate use cases and domain services
  - Location: `lib/{domain}/application/services/`
  - Handle application workflow
  - No business logic, only coordination
  - Used by presentation layer (server actions, API routes)

- **DTOs**: Data Transfer Objects for layer boundaries
  - Location: `lib/{domain}/application/dto/`
  - Define data contracts between layers
  - Immutable data structures

- **Command/Query Handlers**: CQRS pattern implementation
  - Location: `lib/{domain}/application/commands/handlers/`
  - Location: `lib/{domain}/application/queries/`
  - Separate read and write operations

- **Mappers**: Transform between DTOs and domain entities
  - Location: `lib/{domain}/application/mappers/`
  - Handle data transformation between layers

### Infrastructure Layer (External Concerns)
Implements interfaces defined in inner layers, handles persistence, external APIs, etc.

**Components:**
- **Repository Implementations**: Concrete data access implementations
  - Location: `lib/{domain}/infrastructure/persistence/supabase/`
  - Implement domain repository interfaces
  - Handle database-specific logic

- **External API Clients**: Third-party service integrations
  - Location: `lib/{domain}/infrastructure/providers/`
  - Example: `lib/image-generator/infrastructure/providers/replicate/`
  - Abstract external service complexity

- **Database Access**: Database-specific implementations
  - Location: `lib/{domain}/infrastructure/persistence/supabase/services/`
  - Handle database operations and transactions

- **File Storage**: File system and cloud storage
  - Location: `lib/{domain}/infrastructure/storage/`
  - Manage file operations and cloud storage

- **Persistence Mappers**: Convert between domain objects and database models
  - Location: `lib/{domain}/infrastructure/persistence/supabase/mappers/`
  - Transform between domain and persistence models

- **Composition Root**: Dependency injection wiring
  - Location: `lib/{domain}/infrastructure/composition/`
  - Example: `lib/tts/infrastructure/composition/TtsCompositionRoot.ts`
  - Wire all dependencies together
  - Used by presentation layer entry points

### Presentation Layer (User Interface & Entry Points)
Handles user interaction, displays information, captures user input, and serves as system entry points.

**Components:**
- **Server Actions**: Next.js server action entry points
  - Location: `lib/{domain}/presentation/actions/`
  - Example: `lib/tts/presentation/actions/tts.ts`
  - Handle user requests and delegate to application services
  - Only export async functions (Next.js requirement)
  - Replace API routes for mutations in App Router

- **UI Components**: React components with single responsibilities
  - Location: `lib/{domain}/presentation/components/`
  - Follow single responsibility principle
  - Keep components under 200-250 lines
  - Use theme-aware styling with CSS custom properties

- **React Hooks**: Stateful logic for components
  - Location: `lib/{domain}/presentation/hooks/`
  - Focus only on state coordination
  - Separate concerns (queries, mutations, state)
  - Call server actions for data operations
  - **React Query Integration**: Use React Query to call server actions for data fetching/mutations while maintaining cache state consistency

- **App Router Pages**: Next.js page components
  - Location: `app/(protected)/{feature}/`
  - Handle routing and initial data loading
  - Server components by default, client components when needed
  - Use server actions for form submissions and mutations

- **API Routes**: REST API endpoints (when needed)
  - Location: `app/api/{domain}/`
  - Alternative entry points to server actions
  - Delegate to application services via composition root
  - Prefer server actions over API routes for mutations

- **View Models**: Presentation-specific data structures
  - Location: `lib/{domain}/presentation/types/`
  - Define UI-specific data contracts

### Middleware Layer (Edge Runtime)
Handles cross-cutting concerns at the request level.

**Components:**
- **Edge Middleware**: Request-level processing
  - Location: `app/middleware.ts`
  - Handle authentication, rewrites, redirects
  - Tenant routing and feature flags
  - Rate limiting and security headers
  - Keep lightweight (Edge Runtime limitations)

### Shared Kernel (Cross-Domain Concerns)
Common functionality shared across multiple bounded contexts.

**Components:**
- **Shared Services**: Cross-domain utilities
  - Location: `lib/shared/`
  - Example: `lib/shared/date-utils/`, `lib/shared/validation/`
  - Keep infrastructure-agnostic and minimal
  - Use domain-specific adapters for integration

- **Common Types**: Shared data structures
  - Location: `lib/shared/types/`
  - Only for truly universal concepts
  - Avoid overuse - prefer domain-specific types

- **Shared Utilities**: Pure functions and helpers
  - Location: `lib/shared/utils/`
  - No business logic or external dependencies
  - Example: formatting, parsing, calculations

**Shared Kernel Guidelines:**
- Keep shared modules small and focused
- Use domain-specific adapters to integrate shared functionality
- Avoid coupling domains through shared business logic
- Prefer duplication over inappropriate coupling

## Next.js DDD Integration Patterns

### Entry Point Flow
```
Next.js Request → Server Action → Application Service → Use Case → Domain Service
(Presentation)   (Presentation)  (Application)      (Application) (Domain)
```

### Component Patterns
- **Server Components**: Default for pages, can directly call server actions
- **Client Components**: Use hooks that call server actions for interactivity
- **Server Actions**: Presentation layer entry points, replace API routes for mutations

### Composition Root Pattern
- **Location**: `lib/{domain}/infrastructure/composition/`
- **Purpose**: Wire all dependencies at application startup
- **Usage**: Server actions and API routes get services from composition root
- **Pattern**: Singleton pattern for dependency management

```typescript
// Example: TtsCompositionRoot.ts
export class TtsCompositionRoot {
  private static _ttsApplicationService: TtsApplicationService | null = null;

  static getTtsApplicationService(): TtsApplicationService {
    if (!this._ttsApplicationService) {
      // Wire all dependencies here
      const repository = new TtsPredictionSupabaseRepository();
      const ttsService = new ConcreteTtsGenerationService();
      const featureFlagService = new TtsFeatureFlagAdapter();
      const predictionService = new TtsPredictionService(repository);
      
      this._ttsApplicationService = new TtsApplicationService(
        repository,
        ttsService,
        predictionService,
        featureFlagService
      );
    }
    return this._ttsApplicationService;
  }
}
```

### Data Flow
```
UI Event → Server Action → Application Service → Domain Logic → Infrastructure
   ↓           ↓              ↓                    ↓              ↓
Client → Presentation → Application → Domain → Infrastructure
```

### Server Action Best Practices
```typescript
// ✅ GOOD: Clean server action
'use server';

export async function startSpeechGeneration(inputText: string, voiceId: string) {
  const service = TtsCompositionRoot.getTtsApplicationService();
  return service.startSpeechGeneration(inputText, voiceId, 'elevenlabs');
}

// ❌ BAD: Server action with business logic
'use server';

export async function startSpeechGeneration(inputText: string, voiceId: string) {
  // Don't put business logic here!
  if (inputText.length > 1000) {
    throw new Error('Text too long');
  }
  // Direct infrastructure calls
  const repository = new TtsPredictionSupabaseRepository();
  // ...
}
```

### React Query + Server Actions Pattern
```typescript
// ✅ GOOD: React Query with server actions
export function useTtsVoices(provider: string) {
  return useQuery({
    queryKey: ['tts-voices', provider],
    queryFn: () => getTtsVoices(provider), // Server action
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTtsGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ text, voiceId }: { text: string; voiceId: string }) =>
      startSpeechGeneration(text, voiceId, 'elevenlabs'), // Server action
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tts-history'] });
    },
  });
}
```

## Implementation Guidelines

### Component Design
- **Single Responsibility**: Each component handles one concern
- **Size Limit**: Keep files under 200-250 lines
- **Focused Logic**: Components should have clear, single purposes
- **DRY Principle**: Check for existing similar functionality before creating new

### Layer Dependencies
- **Dependency Rule**: Inner layers never depend on outer layers
- **Domain Independence**: Domain layer has no external dependencies
- **Application Coordination**: Application layer only depends on Domain
- **Infrastructure Implementation**: Infrastructure implements Domain/Application interfaces
- **Presentation Entry Points**: Presentation layer calls Application via Composition Root

### Bounded Contexts
- **Module Separation**: Each domain lives in separate module
- **Context Boundaries**: Clear separation between different business areas
- **Integration**: Use DTOs for cross-context communication

### Code Organization
- **Clean Architecture**: Maintain clear separation of concerns
- **Testability**: Each layer testable in isolation
- **Maintainability**: Changes in one layer don't affect others
- **Flexibility**: Easy to swap implementations

### Best Practices
- **No Console Logs**: Remove console.log statements from final code
- **Test Thoroughly**: Write comprehensive tests for major functionality
- **Theme Awareness**: Use CSS custom properties for theme support
- **Error Handling**: Implement proper error boundaries and handling
- **Performance**: Consider React Query for data operations in frontend
- **Dependency Injection**: Use composition root for all dependency wiring

## Naming Conventions

### Files and Directories
- Use kebab-case for directories: `use-cases`, `value-objects`
- Use PascalCase for component files: `StyleSection.tsx`
- Use camelCase for service files: `assetService.ts`

### Components
- Descriptive names indicating single responsibility
- Example: `StyleSection`, `ImageDimensionsSection`, `SettingsSection`
- Avoid generic names like `Helper`, `Utils`, `Manager`

### Layers Structure
```
app/
├── middleware.ts             # ← Edge middleware
├── (protected)/
│   └── {feature}/            # ← App Router pages
└── api/
    └── {domain}/             # ← API routes (when needed)

lib/
├── shared/                   # ← Shared kernel
│   ├── types/
│   ├── utils/
│   └── services/
└── {domain}/
    ├── domain/
    │   ├── entities/
    │   ├── value-objects/
    │   ├── repositories/
    │   ├── services/
    │   ├── events/
    │   └── specifications/
    ├── application/
    │   ├── use-cases/
    │   ├── services/
    │   ├── dto/
    │   ├── commands/
    │   ├── queries/
    │   └── mappers/
    ├── infrastructure/
    │   ├── persistence/
    │   ├── providers/
    │   ├── storage/
    │   └── composition/          # ← Composition root here
    └── presentation/
        ├── components/
        ├── hooks/
        ├── actions/              # ← Server actions here
        └── types/
```

This structure ensures maintainable, testable, and scalable code following DDD principles optimized for Next.js App Router patterns.