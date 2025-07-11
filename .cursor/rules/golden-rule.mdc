---
description: 
globs: 
alwaysApply: true
---
# Golden Rule DDD Guidelines for AI-Driven Next.js Development

## Core Principles

1. **AI-First Architecture**: Leverage AI's ability to maintain complex DDD patterns consistently across large codebases
2. **Single Responsibility Principle**: Each service has one clear purpose, keeping to 200-250 lines when possible
3. **Domain-Driven Design**: Always use DDD best practices, coding, architecture, and compliance
4. **Pattern Consistency**: Use explicit patterns that AI can replicate perfectly without cognitive fatigue
5. **Template-Driven Development**: Create reusable templates and schemas that guide AI code generation
6. **Explicit Instructions**: Embed AI guidance directly in code comments and documentation
7. **No Redundancy**: Review codebase to ensure new code isn't redundant; provide recommendations using DDD, network efficient, API efficient, memory/cache efficient, rendering efficient practices
8. Please dont p/npm build or dev each time. Next JS hotloads

## Advanced DDD Patterns for Complex Domains

### Aggregate Roots & Consistency Boundaries
Aggregates enforce consistency boundaries and encapsulate business invariants.

```typescript
/**
 * Aggregate Root Base Class
 * 
 * AI INSTRUCTIONS:
 * - Use for entities that serve as consistency boundaries
 * - Enforce business invariants across aggregate members
 * - Publish domain events for cross-aggregate communication
 * - Never reference other aggregates directly - use IDs only
 */
export abstract class AggregateRoot<TId> {
  private _domainEvents: DomainEvent[] = [];
  
  constructor(protected readonly id: TId) {}
  
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }
  
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }
  
  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }
  
  // AI: Override in concrete aggregates to enforce invariants
  protected abstract validateInvariants(): void;
}

// Example Usage
export class ChatSession extends AggregateRoot<ChatSessionId> {
  private messages: ChatMessage[] = [];
  private status: SessionStatus;
  
  public addMessage(content: string, role: MessageRole): void {
    this.validateInvariants();
    
    if (this.status === SessionStatus.CLOSED) {
      throw new BusinessRuleViolationError(
        'Cannot add message to closed session',
        { sessionId: this.id.value, status: this.status }
      );
    }
    
    const message = new ChatMessage(content, role);
    this.messages.push(message);
    
    this.addDomainEvent(new MessageAddedEvent(this.id, message.id));
  }
  
  protected validateInvariants(): void {
    if (this.messages.length > 100) {
      throw new BusinessRuleViolationError(
        'Session cannot exceed 100 messages',
        { sessionId: this.id.value, messageCount: this.messages.length }
      );
    }
  }
}
```

### Domain-Specific Error Handling
Implement rich error types that capture business context and enable proper error propagation.

```typescript
/**
 * Domain Error Hierarchy
 * 
 * AI INSTRUCTIONS:
 * - Create specific error types for each business rule violation
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Never expose technical details to domain layer
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly severity: ErrorSeverity;
  
  constructor(
    message: string,
    public readonly context: Record<string, any> = {},
    public readonly timestamp: Date = new Date()
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Business rule violated: ${rule}`, context);
  }
}

export class InvariantViolationError extends DomainError {
  readonly code = 'INVARIANT_VIOLATION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(invariant: string, context: Record<string, any> = {}) {
    super(`Domain invariant violated: ${invariant}`, context);
  }
}

export class ResourceNotFoundError extends DomainError {
  readonly code = 'RESOURCE_NOT_FOUND';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(resourceType: string, identifier: string, context: Record<string, any> = {}) {
    super(`${resourceType} not found: ${identifier}`, { ...context, resourceType, identifier });
  }
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

### Event Sourcing Patterns
For domains requiring complete audit trails and temporal queries.

```typescript
/**
 * Event Sourcing Infrastructure
 * 
 * AI INSTRUCTIONS:
 * - Use for domains requiring complete audit trails
 * - Store events as immutable facts, rebuild state from events
 * - Implement snapshots for performance optimization
 * - Handle event versioning and migration carefully
 */
export abstract class EventSourcedAggregateRoot<TId> extends AggregateRoot<TId> {
  private _version: number = 0;
  private _uncommittedEvents: DomainEvent[] = [];
  
  constructor(id: TId) {
    super(id);
  }
  
  public get version(): number {
    return this._version;
  }
  
  protected applyEvent(event: DomainEvent): void {
    this.applyEventToState(event);
    this._uncommittedEvents.push(event);
    this._version++;
  }
  
  public static fromHistory<T extends EventSourcedAggregateRoot<any>>(
    id: any,
    events: DomainEvent[],
    constructor: new (id: any) => T
  ): T {
    const aggregate = new constructor(id);
    
    events.forEach(event => {
      aggregate.applyEventToState(event);
      aggregate._version++;
    });
    
    return aggregate;
  }
  
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }
  
  public markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }
  
  // AI: Override in concrete aggregates to handle state changes
  protected abstract applyEventToState(event: DomainEvent): void;
}

// Example Event-Sourced Aggregate
export class EventSourcedChatSession extends EventSourcedAggregateRoot<ChatSessionId> {
  private messages: ChatMessage[] = [];
  private status: SessionStatus = SessionStatus.ACTIVE;
  
  public addMessage(content: string, role: MessageRole): void {
    this.validateInvariants();
    
    if (this.status === SessionStatus.CLOSED) {
      throw new BusinessRuleViolationError(
        'Cannot add message to closed session',
        { sessionId: this.id.value, status: this.status }
      );
    }
    
    const messageId = ChatMessageId.generate();
    const event = new MessageAddedEvent(this.id, messageId, content, role, new Date());
    this.applyEvent(event);
  }
  
  protected applyEventToState(event: DomainEvent): void {
    switch (event.constructor.name) {
      case 'MessageAddedEvent':
        const messageEvent = event as MessageAddedEvent;
        this.messages.push(new ChatMessage(
          messageEvent.messageId,
          messageEvent.content,
          messageEvent.role,
          messageEvent.timestamp
        ));
        break;
        
      case 'SessionClosedEvent':
        this.status = SessionStatus.CLOSED;
        break;
        
      default:
        throw new InvariantViolationError(
          `Unknown event type: ${event.constructor.name}`,
          { eventType: event.constructor.name, aggregateId: this.id.value }
        );
    }
  }
  
  protected validateInvariants(): void {
    if (this.messages.length > 100) {
      throw new InvariantViolationError(
        'Session cannot exceed 100 messages',
        { sessionId: this.id.value, messageCount: this.messages.length }
      );
    }
  }
}
```

### Bounded Context Management
Explicit context boundaries and anti-corruption layers for complex systems.

```typescript
/**
 * Bounded Context Definition
 * 
 * AI INSTRUCTIONS:
 * - Define explicit boundaries between business contexts
 * - Use anti-corruption layers for external system integration
 * - Implement context maps for inter-context communication
 * - Maintain separate models per context
 */
export interface BoundedContext {
  readonly name: string;
  readonly ubiquitousLanguage: Record<string, string>;
  readonly aggregates: string[];
  readonly externalDependencies: string[];
  readonly publishedEvents: string[];
  readonly subscribedEvents: string[];
}

// Context Map for Strategic Design
export const BOUNDED_CONTEXTS: Record<string, BoundedContext> = {
  'chatbot-widget': {
    name: 'Chatbot Widget',
    ubiquitousLanguage: {
      'ChatSession': 'A conversation between user and bot',
      'Lead': 'Potential customer identified through conversation',
      'Intent': 'User\'s purpose or goal in the conversation'
    },
    aggregates: ['ChatSession', 'ChatbotConfig', 'Lead'],
    externalDependencies: ['user-management', 'notification'],
    publishedEvents: ['LeadCaptured', 'ConversationCompleted'],
    subscribedEvents: ['UserAuthenticated', 'ConfigurationUpdated']
  },
  'user-management': {
    name: 'User Management',
    ubiquitousLanguage: {
      'User': 'System user with authentication credentials',
      'Organization': 'Group of users sharing resources',
      'Permission': 'Authorization to perform specific actions'
    },
    aggregates: ['User', 'Organization', 'Role'],
    externalDependencies: ['audit-trail'],
    publishedEvents: ['UserAuthenticated', 'OrganizationCreated'],
    subscribedEvents: ['SecurityViolationDetected']
  }
} as const;

// Anti-Corruption Layer Pattern
export interface AntiCorruptionLayer<TExternal, TInternal> {
  translateToInternal(external: TExternal): TInternal;
  translateToExternal(internal: TInternal): TExternal;
}

export class ChatbotExternalApiAdapter implements AntiCorruptionLayer<ExternalChatData, ChatSession> {
  translateToInternal(external: ExternalChatData): ChatSession {
    // AI: Transform external format to internal domain model
    const sessionId = new ChatSessionId(external.conversation_id);
    const session = new ChatSession(sessionId, external.user_id);
    
    external.messages.forEach(msg => {
      session.addMessage(msg.text, this.mapRole(msg.sender));
    });
    
    return session;
  }
  
  translateToExternal(internal: ChatSession): ExternalChatData {
    // AI: Transform internal domain model to external format
    return {
      conversation_id: internal.id.value,
      user_id: internal.userId,
      messages: internal.getMessages().map(msg => ({
        text: msg.content,
        sender: this.mapRoleExternal(msg.role),
        timestamp: msg.timestamp.toISOString()
      }))
    };
  }
  
  private mapRole(externalRole: string): MessageRole {
    switch (externalRole) {
      case 'user': return MessageRole.USER;
      case 'assistant': return MessageRole.ASSISTANT;
      default: throw new BusinessRuleViolationError(
        `Unknown external role: ${externalRole}`,
        { role: externalRole }
      );
    }
  }
  
  private mapRoleExternal(role: MessageRole): string {
    switch (role) {
      case MessageRole.USER: return 'user';
      case MessageRole.ASSISTANT: return 'assistant';
      default: throw new InvariantViolationError(
        `Cannot map internal role to external: ${role}`,
        { role }
      );
    }
  }
}
```

## DDD Layer Architecture for Next.js + AI

### Domain Layer (Core Business Logic)
Pure business logic, isolated from external concerns. AI excels at maintaining domain purity.

**Components:**
- **Aggregate Roots**: Consistency boundaries with business invariants
  - Location: `lib/{domain}/domain/aggregates/`
  - AI Instructions: Enforce invariants, publish domain events, single responsibility
  - Pattern: Extend AggregateRoot base class, validate on state changes

- **Entities**: Core business objects with identity
  - Location: `lib/{domain}/domain/entities/`
  - AI Instructions: Keep business logic pure, no external dependencies
  - Pattern: Constructor validation, immutable updates, business methods

- **Value Objects**: Immutable objects describing domain characteristics
  - Location: `lib/{domain}/domain/value-objects/`
  - AI Instructions: Ensure immutability and validation, delegate complex operations

- **Domain Services**: Business logic that doesn't belong to a single entity
  - Location: `lib/{domain}/domain/services/`
  - AI Instructions: Focus on domain rules and calculations, no infrastructure concerns
  - Pattern: Single responsibility, delegate to value objects, pure functions

- **Domain Events**: Events that occur within the domain
  - Location: `lib/{domain}/domain/events/`
  - AI Instructions: Represent significant business occurrences, immutable data
  - Pattern: Include aggregate ID, timestamp, and relevant context

- **Domain Errors**: Business-specific error types
  - Location: `lib/{domain}/domain/errors/`
  - AI Instructions: Capture business context, use specific error codes, include severity

- **Repository Interfaces**: Contracts for data access (interfaces only)
  - Location: `lib/{domain}/domain/repositories/`
  - AI Instructions: Define data access contracts only, no implementations

### Application Layer (Use Cases & Orchestration)
Coordinates domain objects without containing business logic. AI handles orchestration perfectly.

**Components:**
- **Use Cases**: Application-specific business rules
  - Location: `lib/{domain}/application/use-cases/`
  - AI Instructions: Orchestrate domain objects, no business logic, single use case focus

- **Application Services**: Coordinate use cases and domain services
  - Location: `lib/{domain}/application/services/`
  - AI Instructions: Handle workflow coordination only, delegate all business logic

- **Event Handlers**: Process domain events
  - Location: `lib/{domain}/application/event-handlers/`
  - AI Instructions: Handle cross-aggregate coordination, maintain eventual consistency

- **DTOs**: Data Transfer Objects for layer boundaries
  - Location: `lib/{domain}/application/dto/`
  - AI Instructions: Define clean data contracts, immutable structures

- **Mappers**: Transform between DTOs and domain entities
  - Location: `lib/{domain}/application/mappers/`
  - AI Instructions: Handle transformation only, no business logic

### Infrastructure Layer (External Concerns)
Implements interfaces defined in inner layers. AI maintains perfect separation.

**Components:**
- **Repository Implementations**: Concrete data access implementations
  - Location: `lib/{domain}/infrastructure/persistence/supabase/`
  - AI Instructions: Implement domain interfaces, handle database-specific logic

- **Event Store**: Event sourcing persistence (when needed)
  - Location: `lib/{domain}/infrastructure/event-store/`
  - AI Instructions: Store events immutably, handle event versioning, implement snapshots

- **External API Clients**: Third-party service integrations
  - Location: `lib/{domain}/infrastructure/providers/`
  - AI Instructions: Abstract external service complexity, implement domain interfaces

- **Anti-Corruption Layers**: External system adapters
  - Location: `lib/{domain}/infrastructure/adapters/`
  - AI Instructions: Translate between external and internal models, protect domain integrity

- **Composition Root**: Dependency injection wiring
  - Location: `lib/{domain}/infrastructure/composition/`
  - AI Instructions: Wire all dependencies, singleton pattern, lazy initialization

### Presentation Layer (User Interface & Entry Points)
Handles user interaction and serves as system entry points. AI creates clean boundaries.

**Components:**
- **Server Actions**: Next.js server action entry points
  - Location: `lib/{domain}/presentation/actions/`
  - AI Instructions: Handle user requests, delegate to application services, only export async functions

- **UI Components**: React components with single responsibilities
  - Location: `lib/{domain}/presentation/components/`
  - AI Instructions: Single responsibility, under 200-250 lines, theme-aware styling

- **React Hooks**: Stateful logic for components
  - Location: `lib/{domain}/presentation/hooks/`
  - AI Instructions: State coordination only, call server actions, use React Query

- **View Models**: Presentation-specific data structures
  - Location: `lib/{domain}/presentation/types/`
  - AI Instructions: UI-specific data contracts, never expose domain entities

## AI-Optimized Development Patterns

### AI Instruction Comments
Embed explicit guidance in every major component:

```typescript
/**
 * {ServiceName} Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 250 lines - refactor into smaller services
 * - Follow @golden-rule patterns exactly
 * - Check for existing similar logic before creating new
 * - Always validate inputs using value objects
 * - Delegate complex calculations to separate methods
 * - Handle domain errors with specific error types
 * - Publish domain events for cross-aggregate communication
 */
export class ExampleDomainService {
  // AI follows these instructions perfectly
}
```

### Domain Boundary Documentation
Define crystal-clear boundaries for AI:

```typescript
// /lib/{domain}/DOMAIN_BOUNDARY.md
/**
 * {DOMAIN} DOMAIN BOUNDARY
 * 
 * BOUNDED CONTEXT: {Context Name}
 * 
 * UBIQUITOUS LANGUAGE:
 * - {Term}: {Definition}
 * - {Term}: {Definition}
 * 
 * AGGREGATES:
 * - {AggregateName}: {Responsibility}
 * 
 * OWNS:
 * - Core business concepts for this domain
 * - Domain-specific business rules
 * - Domain entities and value objects
 * - Business invariants and constraints
 * 
 * DOES NOT OWN:
 * - Cross-cutting concerns (auth, logging, monitoring)
 * - Other domain concepts
 * - Infrastructure implementations
 * - External system integrations
 * 
 * PUBLISHES EVENTS:
 * - {EventName}Event: {When and why}
 * 
 * SUBSCRIBES TO EVENTS:
 * - {ExternalEventName}Event: {How handled}
 * 
 * EXTERNAL DEPENDENCIES:
 * - {DependencyName}: {Purpose and integration pattern}
 * 
 * ANTI-CORRUPTION LAYERS:
 * - {ExternalSystem}: {Adapter class and translation rules}
 */
```

### Schema-Driven Development
Use JSON schemas to drive AI code generation:

```json
// /schemas/domains/{domain}.json
{
  "domain": "example-domain",
  "boundedContext": "Example Context",
  "aggregates": [
    {
      "name": "ExampleAggregate",
      "entities": ["ExampleEntity"],
      "valueObjects": ["ExampleMetadata", "ExampleTracking"],
      "businessMethods": ["processAction", "updateStatus"],
      "invariants": ["property cannot be empty", "id is required"],
      "events": ["ExampleProcessed", "ActionCompleted"]
    }
  ],
  "useCases": [
    {
      "name": "ProcessExample",
      "dependencies": ["ExampleRepository", "ExampleService"],
      "events": ["ExampleProcessed", "ActionCompleted"],
      "errors": ["BusinessRuleViolationError", "ResourceNotFoundError"]
    }
  ],
  "externalIntegrations": [
    {
      "name": "ExternalAPI",
      "adapter": "ExternalAPIAdapter",
      "purpose": "Data synchronization"
    }
  ]
}
```

## Next.js Integration Patterns

### Entry Point Flow
```
Next.js Request → Server Action → Application Service → Use Case → Domain Service
(Presentation)   (Presentation)  (Application)      (Application) (Domain)
```

### Server Action Best Practices
```typescript
// ✅ GOOD: Clean server action with error handling
'use server';

export async function processExample(input: string, config: string) {
  try {
    const service = ExampleCompositionRoot.getApplicationService();
    return await service.processExample(input, config);
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          severity: error.severity
        }
      };
    }
    
    // Log unexpected errors but don't expose details
    console.error('Unexpected error in processExample:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        severity: ErrorSeverity.HIGH
      }
    };
  }
}

// ❌ BAD: Server action with business logic
'use server';

export async function processExample(input: string) {
  // Don't put business logic here!
  if (input.length > 1000) {
    throw new Error('Input too long');
  }
  // Direct infrastructure calls
  const repository = new ExampleRepository();
  // ...
}
```

### React Query + Server Actions Pattern
```typescript
// ✅ GOOD: React Query with server actions and error handling
export function useExampleData(filter: string) {
  return useQuery({
    queryKey: ['example-data', filter],
    queryFn: () => getExampleData(filter), // Server action
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on business rule violations
      if (error?.code === 'BUSINESS_RULE_VIOLATION') {
        return false;
      }
      return failureCount < 3;
    }
  });
}

export function useExampleMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ input, config }: { input: string; config: string }) =>
      processExample(input, config), // Server action
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['example-data'] });
      }
    },
    onError: (error) => {
      // Handle domain errors appropriately
      if (error.severity === ErrorSeverity.CRITICAL) {
        // Escalate critical errors
        console.error('Critical domain error:', error);
      }
    }
  });
}
```

## AI-Friendly Naming Conventions

### Predictable Patterns AI Can Follow
```typescript
// Domain Layer
abstract class {Aggregate}AggregateRoot     // Aggregate root base
interface I{ServiceName}Service             // Domain service interface
class {ServiceName}Service                  // Domain service implementation
class {EntityName}                          // Domain entity
class {ValueObject}ValueObject              // Value object
class {EventName}Event                      // Domain event
class {ErrorType}Error                      // Domain error

// Application Layer  
class {ProcessName}UseCase                  // Application use case
class {Coordination}ApplicationService      // Application service
class {EventName}EventHandler               // Event handler
interface {Data}DTO                         // Data transfer object

// Infrastructure Layer
class {Entity}SupabaseRepository            // Repository implementation
class {Provider}Provider                    // External service provider
class {External}Adapter                     // Anti-corruption layer
class {Domain}CompositionRoot               // Dependency injection root

// Presentation Layer
function {action}Action()                   // Server actions
function use{Feature}()                     // React hooks
function {Feature}Section()                 // UI components
```

## Context Mapping & Domain Relationships

```typescript
// /lib/CONTEXT_MAP.ts
export const DOMAIN_RELATIONSHIPS = {
  'example-domain': {
    type: 'core-domain',
    boundedContext: 'Example Context',
    dependsOn: ['user-management', 'notification'],
    publishes: ['ExampleCompleted', 'ProcessStarted'],
    subscribes: ['UserAuthenticated', 'UserProfileUpdated'],
    sharedKernel: ['shared-types', 'shared-infrastructure'],
    antiCorruptionLayers: ['ExternalAPIAdapter', 'LegacySystemAdapter']
  }
} as const;

// Context Integration Patterns
export enum IntegrationPattern {
  SHARED_KERNEL = 'shared-kernel',
  CUSTOMER_SUPPLIER = 'customer-supplier',
  CONFORMIST = 'conformist',
  ANTI_CORRUPTION_LAYER = 'anti-corruption-layer',
  SEPARATE_WAYS = 'separate-ways',
  OPEN_HOST_SERVICE = 'open-host-service'
}
```

## AI Anti-Patterns to Avoid

### ❌ Common AI Mistakes
```typescript
// DON'T: Put business logic in application services
class BadApplicationService {
  async processData(data: string) {
    // ❌ Business logic in application layer
    if (data.includes('special')) {
      return 'special response';
    }
  }
}

// DON'T: Skip composition root
class BadServerAction {
  async execute() {
    // ❌ Direct instantiation
    const service = new SomeService();
  }
}

// DON'T: Use domain entities in presentation
function BadComponent({ entity }: { entity: DomainEntity }) {
  // ❌ Domain entity in presentation layer
  return <div>{entity.businessProperty}</div>;
}

// DON'T: Ignore aggregate boundaries
class BadDomainService {
  async processOrder(orderId: string) {
    // ❌ Directly modifying multiple aggregates
    const order = await this.orderRepo.findById(orderId);
    const customer = await this.customerRepo.findById(order.customerId);
    customer.updateCreditScore(order.total); // ❌ Cross-aggregate modification
  }
}

// DON'T: Use generic error types
class BadService {
  processData(data: string) {
    if (!data) {
      throw new Error('Data is required'); // ❌ Generic error
    }
  }
}
```

### ✅ Correct AI Patterns
```typescript
// DO: Delegate business logic to domain services
class GoodApplicationService {
  constructor(private businessService: BusinessDomainService) {}
  
  async processData(data: string) {
    try {
      // ✅ Delegate to domain service
      const result = this.businessService.processData(data);
      // ✅ Coordinate, don't implement business logic
      return result;
    } catch (error) {
      if (error instanceof DomainError) {
        // ✅ Handle domain errors appropriately
        throw error;
      }
      // ✅ Wrap unexpected errors
      throw new InternalError('Data processing failed', { originalError: error });
    }
  }
}

// DO: Use composition root
class GoodServerAction {
  async execute() {
    // ✅ Get from composition root
    const service = CompositionRoot.getApplicationService();
  }
}

// DO: Use DTOs in presentation
function GoodComponent({ data }: { data: DataDTO }) {
  // ✅ DTO in presentation layer
  return <div>{data.displayProperty}</div>;
}

// DO: Respect aggregate boundaries
class GoodDomainService {
  async processOrder(orderId: string) {
    // ✅ Work within single aggregate
    const order = await this.orderRepo.findById(orderId);
    order.process();
    
    // ✅ Publish event for cross-aggregate coordination
    order.addDomainEvent(new OrderProcessedEvent(orderId, order.total));
    
    await this.orderRepo.save(order);
  }
}

// DO: Use specific domain errors
class GoodService {
  processData(data: string) {
    if (!data) {
      throw new BusinessRuleViolationError(
        'Data is required for processing',
        { operation: 'processData', input: data }
      );
    }
  }
}
```

## File Organization Standards

```
/lib/{domain}/
├── DOMAIN_BOUNDARY.md              # AI reads this for domain scope
├── domain/
│   ├── aggregates/{Aggregate}AggregateRoot.ts # AI: Consistency boundaries
│   ├── entities/{Entity}.ts        # AI: Pure business objects
│   ├── value-objects/{ValueObject}.ts # AI: Immutable domain concepts
│   ├── services/{DomainService}.ts # AI: Pure business logic
│   ├── events/{DomainEvent}.ts     # AI: Domain event definitions
│   ├── errors/{DomainError}.ts     # AI: Business-specific errors
│   └── repositories/I{Repository}.ts # AI: Data access contracts
├── application/
│   ├── use-cases/{UseCase}UseCase.ts # AI: Application orchestration
│   ├── services/{Service}Service.ts # AI: Application coordination
│   ├── event-handlers/{Event}Handler.ts # AI: Cross-aggregate coordination
│   ├── dto/{Data}DTO.ts           # AI: Boundary data contracts
│   └── mappers/{Entity}Mapper.ts  # AI: Entity/DTO transformation
├── infrastructure/
│   ├── persistence/supabase/{Entity}SupabaseRepository.ts # AI: Data access
│   ├── event-store/{Domain}EventStore.ts # AI: Event sourcing (when needed)
│   ├── providers/{Provider}Provider.ts # AI: External services
│   ├── adapters/{External}Adapter.ts # AI: Anti-corruption layers
│   └── composition/{Domain}CompositionRoot.ts # AI: Dependency wiring
└── presentation/
    ├── components/{Feature}Section.tsx # AI: UI components
    ├── hooks/use{Feature}.ts      # AI: State management hooks
    ├── actions/{feature}Actions.ts # AI: Server action entry points
    └── types/{Feature}Types.ts    # AI: Presentation layer types
```

## AI Development Workflow

### When Creating New Domains
AI should follow this checklist:
- [ ] Create domain boundary documentation with bounded context definition
- [ ] Define domain schema in JSON (if complex)
- [ ] Identify aggregates and their consistency boundaries
- [ ] Define domain events and error types
- [ ] Generate all four layers (domain, application, infrastructure, presentation)
- [ ] Implement anti-corruption layers for external dependencies
- [ ] Wire dependencies through composition root
- [ ] Add domain to context map with integration patterns
- [ ] Add AI instruction comments to all major components

### When Adding Features
AI should:
- [ ] Check for existing similar functionality across codebase
- [ ] Determine correct domain placement using DOMAIN_BOUNDARY.md
- [ ] Identify which aggregate owns the new functionality
- [ ] Define any new domain events or errors needed
- [ ] Follow established patterns exactly
- [ ] Maintain single responsibility principle
- [ ] Keep files under 200-250 lines
- [ ] Update context map if integration patterns change

### When Refactoring
AI should:
- [ ] Preserve all existing functionality
- [ ] Maintain clean architecture principles
- [ ] Respect aggregate boundaries during refactoring
- [ ] Update event handlers if domain events change
- [ ] Update composition root wiring
- [ ] Ensure no broken dependencies
- [ ] Follow established naming conventions
- [ ] Update domain boundary documentation if scope changes

## Quality Standards

### Code Generation Rules
```typescript
/**
 * AI_GENERATION_RULES:
 * - Max file size: 250 lines
 * - Required: AI instruction comments
 * - Required: Input validation with domain errors
 * - Required: Error handling with specific error types
 * - Required: Return type annotations
 * - Required: Domain event publishing for state changes
 * - Forbidden: console.log statements
 * - Forbidden: any types
 * - Forbidden: direct database calls in domain layer
 * - Forbidden: cross-aggregate direct references
 * - Forbidden: generic Error types in domain layer
 */
```

### Pattern Validation Checklist
AI should validate each generated file:
- [ ] Follows naming conventions
- [ ] Respects layer boundaries
- [ ] Respects aggregate boundaries
- [ ] Uses composition root for dependencies
- [ ] Has proper error handling with domain-specific errors
- [ ] Publishes domain events for significant state changes
- [ ] Includes AI instruction comments
- [ ] Stays under line limits
- [ ] Has proper TypeScript types
- [ ] Follows single responsibility principle
- [ ] Uses anti-corruption layers for external integrations

## Best Practices

- **No Console Logs**: Remove console.log statements from final code
- **Theme Awareness**: Use CSS custom properties for theme support
- **Error Handling**: Implement proper error boundaries and domain-specific error handling
- **Performance**: Use React Query for data operations in frontend
- **Dependency Injection**: Use composition root for all dependency wiring
- [ ] Use event-driven architecture for cross-aggregate communication
- [ ] Respect aggregate boundaries during refactoring
- [ ] Update context map if integration patterns change
- [ ] Write comprehensive tests for major functionality (when requested)
- [ ] Account for dev, test, and prod environments
- [ ] Keep codebase organized, avoid files over 200-300 lines, refactor at that point



This enhanced guide enables AI to build maintainable, scalable Next.js applications with advanced DDD architecture, proper error handling, event sourcing capabilities, and clear bounded context management while maintaining perfect consistency across all domains and features.