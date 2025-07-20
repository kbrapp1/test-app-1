# DDD-Aware Refactoring Guidelines

## 🎯 Quick Refactoring Prompt

```
Please refactor this code following these DDD-aware rules:

REFACTORING GOALS:
1. **Break down large files** - Split 250+ line files into multiple smaller files (50-150 lines each)
2. **Single responsibility** - Each new file should do ONE thing well
3. **Follow DDD layers** - Respect domain, application, infrastructure, presentation boundaries
4. **Keep it simple** - Don't add complexity, just organize existing code
5. **Preserve security** - NEVER remove organizationId, activeOrganizationId, or auth variables
6. **Maintain functionality** - All existing behavior must work exactly the same

DDD SPLITTING STRATEGY:
- Split by DOMAIN LAYER first (domain/application/infrastructure/presentation)
- Then by FEATURE/RESPONSIBILITY within each layer
- Extract related functions/components into their own files
- Keep imports/exports simple and clear
- Use descriptive file names that explain the purpose
- Follow established DDD patterns exactly

SECURITY RULES:
- NEVER remove organization/auth variables (even if ESLint says "unused")
- If organizationId appears unused, USE it for validation, don't remove it
- Preserve all React Hooks order (all hooks before any returns)
- Keep JWT-based security patterns intact
- Maintain unified context patterns where they exist

DDD LAYER PATTERNS:
- Domain: Pure business logic, no external dependencies
- Application: Orchestration, use cases, no business logic
- Infrastructure: External concerns, database, APIs
- Presentation: UI components, server actions, hooks

WHAT NOT TO DO:
- Don't create complex abstractions or interfaces
- Don't add unnecessary classes or inheritance
- Don't create tiny 10-line files
- Don't change working patterns just to be "clever"
- Don't mix DDD layers in single files
- Don't break aggregate boundaries

OUTPUT:
- Show what you're extracting and why
- List the new files and their purpose (1-2 sentences each)
- Confirm all functionality is preserved
- Verify DDD layer separation is maintained
```

## 📐 **DDD Layer Architecture for Refactoring**

### **Domain Layer (Pure Business Logic)**
```
lib/{domain}/domain/
├── aggregates/{Aggregate}AggregateRoot.ts    # Consistency boundaries
├── entities/{Entity}.ts                      # Core business objects  
├── value-objects/{ValueObject}.ts            # Immutable domain concepts
├── services/{DomainService}.ts               # Pure business logic
├── events/{DomainEvent}.ts                   # Domain event definitions
├── errors/{DomainError}.ts                   # Business-specific errors
└── repositories/I{Repository}.ts             # Data access contracts
```

### **Application Layer (Use Cases & Orchestration)**
```
lib/{domain}/application/
├── use-cases/{UseCase}UseCase.ts             # Application orchestration
├── services/{Service}ApplicationService.ts  # Application coordination
├── event-handlers/{Event}Handler.ts         # Cross-aggregate coordination
├── dto/{Data}DTO.ts                         # Boundary data contracts
└── mappers/{Entity}Mapper.ts                # Entity/DTO transformation
```

### **Infrastructure Layer (External Concerns)**
```
lib/{domain}/infrastructure/
├── persistence/supabase/{Entity}Repository.ts # Data access
├── providers/{Provider}Provider.ts            # External services
├── adapters/{External}Adapter.ts              # Anti-corruption layers
└── composition/{Domain}CompositionRoot.ts     # Dependency wiring
```

### **Presentation Layer (UI & Entry Points)**
```
lib/{domain}/presentation/
├── components/{Feature}Section.tsx           # UI components
├── hooks/use{Feature}.ts                    # State management hooks
├── actions/{feature}Actions.ts              # Server action entry points
└── types/{Feature}Types.ts                  # Presentation layer types
```

## 📏 File Size Targets

**GOOD FILE SIZES:**
- **50-150 lines** - Sweet spot for most files
- **150-200 lines** - Acceptable for complex components
- **200+ lines** - Needs to be split

**DDD SPLITTING EXAMPLES:**

### Example 1: Large Domain Service (400 lines)
```typescript
// BEFORE: notes-service.ts (400 lines) - Mixed concerns
export class NotesService {
  // 100 lines of business logic
  // 100 lines of database operations
  // 100 lines of external API calls
  // 100 lines of validation logic
}

// AFTER: Split by DDD layers
// lib/notes/domain/services/NotesOrderingService.ts (100 lines) - Pure business logic
// lib/notes/application/services/NotesApplicationService.ts (100 lines) - Orchestration
// lib/notes/infrastructure/persistence/NotesSupabaseRepository.ts (100 lines) - Data access
// lib/notes/infrastructure/adapters/NotesExternalAdapter.ts (100 lines) - External APIs
```

### Example 2: Large Component with Mixed Concerns (350 lines)
```typescript
// BEFORE: user-profile.tsx (350 lines) - Mixed presentation concerns
export function UserProfile() {
  // 50 lines of hooks and context
  // 100 lines of form handling
  // 100 lines of data display
  // 100 lines of action buttons
}

// AFTER: Split by presentation responsibility
// lib/user/presentation/components/UserProfile.tsx (80 lines) - Main component + security
// lib/user/presentation/components/UserProfileForm.tsx (120 lines) - Form handling
// lib/user/presentation/components/UserProfileDisplay.tsx (100 lines) - Data display  
// lib/user/presentation/components/UserProfileActions.tsx (90 lines) - Action buttons
```

### Example 3: Mixed Layer File (500 lines)
```typescript
// BEFORE: chatbot-service.ts (500 lines) - Multiple DDD layers mixed
export class ChatbotService {
  // Domain logic mixed with infrastructure
  // Application orchestration mixed with business rules
  // Database calls mixed with business validation
}

// AFTER: Proper DDD layer separation
// lib/chatbot/domain/aggregates/ChatSessionAggregate.ts (120 lines) - Business logic
// lib/chatbot/domain/services/ConversationDomainService.ts (100 lines) - Domain rules
// lib/chatbot/application/services/ChatbotApplicationService.ts (100 lines) - Orchestration
// lib/chatbot/infrastructure/persistence/ChatbotSupabaseRepository.ts (100 lines) - Data access
// lib/chatbot/infrastructure/adapters/OpenAIAdapter.ts (80 lines) - External APIs
```

## 🔧 DDD-Aware Splitting Strategies

### 1. **Domain-First Splitting**
```typescript
// Large mixed file → DDD layers
UserManagementService (600 lines) →
  Domain Layer:
    - UserAggregate (150 lines) - Business logic + invariants
    - UserDomainService (100 lines) - Pure business operations
    - UserDomainErrors (50 lines) - Business error types
  Application Layer:
    - UserApplicationService (100 lines) - Use case orchestration
    - UserUseCases (100 lines) - Specific application workflows
  Infrastructure Layer:
    - UserSupabaseRepository (100 lines) - Data persistence
```

### 2. **Aggregate Boundary Splitting**
```typescript
// Large aggregate → Focused aggregates
OrderManagement (800 lines) →
  - OrderAggregate (200 lines) - Order lifecycle + invariants
  - PaymentAggregate (200 lines) - Payment processing + rules
  - ShippingAggregate (200 lines) - Shipping logic + tracking
  - InventoryAggregate (200 lines) - Stock management + allocation
```

### 3. **Unified Context Pattern Preservation**
```typescript
// Large context hook → Optimized unified pattern
useComplexContext (300 lines) →
  - useUnifiedContext (150 lines) - Single API call + optimistic updates
  - contextActions (100 lines) - Server actions for context operations
  - contextTypes (50 lines) - Type definitions for context data
```

## 🚨 DDD Security Preservation Rules

### 1. **Preserve Aggregate Boundaries**
```typescript
// ✅ PRESERVE: Aggregate consistency boundaries
export class OrderAggregate extends AggregateRoot<OrderId> {
  // Keep business invariants together
  private validateOrderInvariants(): void {
    if (this.items.length === 0) {
      throw new BusinessRuleViolationError('Order must have items');
    }
  }
  
  // Don't split business rules across files
  public addItem(item: OrderItem): void {
    this.validateOrderInvariants();
    this.items.push(item);
    this.addDomainEvent(new ItemAddedEvent(this.id, item.id));
  }
}
```

### 2. **Maintain Domain Event Publishing**
```typescript
// ✅ PRESERVE: Domain events for cross-aggregate communication
export class ChatSessionAggregate {
  public endSession(): void {
    this.status = SessionStatus.ENDED;
    // Critical: Keep domain event publishing
    this.addDomainEvent(new SessionEndedEvent(this.id, this.userId));
  }
}
```

### 3. **Preserve Composition Root Wiring**
```typescript
// ✅ PRESERVE: Dependency injection patterns
export class NotesCompositionRoot {
  public static getApplicationService(): NotesApplicationService {
    if (!this._notesApplicationService) {
      // Keep lazy initialization and proper wiring
      const repository = this.getNotesRepository();
      this._notesApplicationService = new NotesApplicationService(repository);
    }
    return this._notesApplicationService;
  }
}
```

### 4. **Maintain Unified Context Performance**
```typescript
// ✅ PRESERVE: Unified context optimization patterns
export function useNotesUnifiedContext(): NotesUnifiedContextData {
  // Keep single API call optimization
  const [state, setState] = useState({
    user: null,
    organizationId: null,
    notes: [], // Single call gets all data
    isLoading: true
  });
  
  // Preserve optimistic updates
  const addNoteOptimistic = useCallback((note: Note) => {
    setState(prev => ({ ...prev, notes: [...prev.notes, note] }));
  }, []);
}
```

## 📋 DDD Refactoring Checklist

### Before Splitting
- [ ] File is actually too large (200+ lines)
- [ ] Identify DDD layer boundaries (domain/application/infrastructure/presentation)
- [ ] Note all aggregate boundaries and domain events
- [ ] Identify security-critical variables and patterns
- [ ] Plan 3-5 focused files per layer (not 10+ tiny files)

### During Splitting
- [ ] Each new file respects DDD layer boundaries
- [ ] Domain layer has no external dependencies
- [ ] Application layer only orchestrates, no business logic
- [ ] Infrastructure layer implements domain interfaces
- [ ] Presentation layer uses composition root for dependencies
- [ ] Security variables are preserved and passed down
- [ ] React Hooks rules maintained
- [ ] Domain events are properly published
- [ ] Aggregate boundaries are respected

### After Splitting
- [ ] All functionality works the same
- [ ] No security variables were removed
- [ ] DDD layer separation is clean
- [ ] Domain events still fire correctly
- [ ] Composition root wiring is intact
- [ ] Each file is 50-150 lines (sweet spot)
- [ ] File purposes are clear from names
- [ ] Code is easier to understand, not more complex

## 🎯 DDD-Aware File Names

**DOMAIN LAYER NAMES:**
- `{Entity}Aggregate.ts` - Aggregate root with business logic
- `{Concept}ValueObject.ts` - Immutable domain concepts
- `{BusinessArea}DomainService.ts` - Pure business operations
- `{Domain}DomainError.ts` - Business-specific errors
- `{Event}DomainEvent.ts` - Significant business occurrences
- `I{Entity}Repository.ts` - Data access contracts

**APPLICATION LAYER NAMES:**
- `{Operation}UseCase.ts` - Specific application workflows
- `{Domain}ApplicationService.ts` - Use case orchestration
- `{Event}EventHandler.ts` - Cross-aggregate coordination
- `{Data}DTO.ts` - Boundary data contracts

**INFRASTRUCTURE LAYER NAMES:**
- `{Entity}SupabaseRepository.ts` - Concrete data access
- `{External}Adapter.ts` - Anti-corruption layers
- `{Provider}Provider.ts` - External service integrations
- `{Domain}CompositionRoot.ts` - Dependency injection

**PRESENTATION LAYER NAMES:**
- `{Feature}Section.tsx` - UI components
- `use{Feature}UnifiedContext.ts` - Optimized context hooks
- `{feature}Actions.ts` - Server action entry points

## 🚫 DDD Anti-Patterns to Avoid

### 1. **Don't Mix DDD Layers**
```typescript
// ❌ DON'T: Mix domain and infrastructure in one file
export class UserService {
  // Domain logic mixed with database calls
  async createUser(userData: UserData) {
    // Business validation (domain)
    if (!userData.email) throw new Error('Email required');
    
    // Database call (infrastructure) - WRONG LAYER!
    const result = await supabase.from('users').insert(userData);
  }
}

// ✅ DO: Separate domain and infrastructure
// Domain: UserAggregate.ts
export class UserAggregate {
  public static create(userData: UserData): UserAggregate {
    // Pure business validation
    if (!userData.email) throw new BusinessRuleViolationError('Email required');
    return new UserAggregate(userData);
  }
}

// Infrastructure: UserSupabaseRepository.ts  
export class UserSupabaseRepository implements IUserRepository {
  async save(user: UserAggregate): Promise<void> {
    // Database operations only
    await this.supabase.from('users').insert(user.toData());
  }
}
```

### 2. **Don't Break Aggregate Boundaries**
```typescript
// ❌ DON'T: Split aggregates across multiple files
// order-items.ts
export class OrderItems {
  validateItems() { /* business logic */ }
}

// order-shipping.ts  
export class OrderShipping {
  calculateShipping() { /* business logic */ }
}

// ✅ DO: Keep aggregate logic together
// OrderAggregate.ts
export class OrderAggregate extends AggregateRoot<OrderId> {
  private items: OrderItem[] = [];
  private shipping: ShippingInfo;
  
  // All order business logic in one aggregate
  public addItem(item: OrderItem): void { /* ... */ }
  public calculateShipping(): Money { /* ... */ }
  protected validateInvariants(): void { /* ... */ }
}
```

### 3. **Don't Create Anemic Domain Models**
```typescript
// ❌ DON'T: Split business logic from data
// user-data.ts
export interface UserData {
  id: string;
  email: string;
  name: string;
}

// user-business-logic.ts
export class UserBusinessLogic {
  validateUser(userData: UserData) { /* ... */ }
}

// ✅ DO: Keep data and behavior together
// UserAggregate.ts
export class UserAggregate extends AggregateRoot<UserId> {
  private email: Email;
  private name: string;
  
  // Data and behavior together
  public changeEmail(newEmail: string): void {
    this.email = Email.create(newEmail); // Validation included
    this.addDomainEvent(new EmailChangedEvent(this.id, this.email));
  }
}
```

## 📖 Quick DDD Reference

**When to Split:**
- File > 200 lines
- Multiple DDD layers in one file
- Multiple aggregates in one file
- Mixed domain and infrastructure concerns
- Hard to find specific business logic

**How to Split:**
- By DDD layer first (domain/application/infrastructure/presentation)
- By aggregate boundary within domain layer
- By use case within application layer
- By external system within infrastructure layer
- 50-150 lines per new file
- Clear, descriptive file names
- Preserve all security patterns
- Maintain domain event publishing

**Red Flags:**
- Creating 10+ tiny files
- Mixing DDD layers in single files
- Breaking aggregate boundaries
- Removing domain events
- Adding complex abstractions
- Removing organization variables
- Breaking unified context patterns

**Remember: The goal is to make DDD architecture clearer and business logic easier to find, while maintaining all security guarantees and performance optimizations.** 