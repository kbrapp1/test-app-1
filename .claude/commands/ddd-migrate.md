# DDD Migration Command

## Description
Migrate code to Domain-Driven Design patterns following the established chatbot-widget architecture.

## Usage
`/ddd-migrate <target-domain> [scope]`

## Parameters
- `target-domain` (required): Domain to migrate (e.g., 'tts', 'auth', 'team-management')
- `scope` (optional): Specific area to migrate ('entities', 'services', 'repositories', 'all')

## Instructions
You are a DDD architecture expert. Use the chatbot-widget domain as the blueprint for DDD implementation.

**Reference Architecture (lib/chatbot-widget/):**
```
lib/{domain}/
├── domain/           # Pure business logic
│   ├── entities/     # Domain entities with business methods
│   ├── value-objects/ # Immutable domain concepts
│   ├── services/     # Domain services for business logic
│   ├── repositories/ # Repository interfaces
│   └── errors/       # Domain-specific errors
├── application/      # Use cases and orchestration
│   ├── use-cases/    # Application-specific business rules
│   ├── services/     # Application coordination services
│   ├── dto/          # Data transfer objects
│   └── actions/      # Next.js server actions
├── infrastructure/   # External concerns
│   ├── persistence/  # Supabase repositories
│   ├── providers/    # External API clients
│   └── composition/  # Dependency injection
└── presentation/     # UI and entry points
    ├── components/   # React components
    ├── hooks/        # React hooks
    └── types/        # Presentation types
```

**Migration Process:**
1. **Analysis Phase:**
   - Identify existing code in target domain
   - Map current structure to DDD layers
   - Identify domain entities and value objects
   - Catalog business rules and services

2. **Domain Layer Creation:**
   - Create domain entities with business methods
   - Extract value objects for type safety
   - Identify and create domain services
   - Define repository interfaces
   - Create domain-specific errors

3. **Application Layer:**
   - Define use cases for business operations
   - Create application services for coordination
   - Build DTOs for data transfer
   - Implement server actions

4. **Infrastructure Layer:**
   - Implement Supabase repositories
   - Create external service providers
   - Setup composition root for DI

5. **Presentation Layer:**
   - Migrate React components
   - Create domain-specific hooks
   - Update imports and dependencies

**DDD Patterns to Follow:**
- Single Responsibility: Each service under 250 lines
- Result<T, E> Pattern: Consistent error handling
- Repository Pattern: Clean data access abstraction
- Composition Root: Centralized dependency injection
- Domain Events: For cross-domain communication (future)

**Key Rules:**
- Domain layer has NO external dependencies
- Use factory methods for entity creation
- Implement immutable updates for entities
- Follow @golden-rule patterns from existing code
- Include comprehensive tests for each layer

**Output Format:**
```
## DDD Migration Results
### Created Structure:
- domain/entities: [count] entities
- domain/services: [count] services  
- domain/value-objects: [count] value objects
- application/use-cases: [count] use cases
- infrastructure: [count] repositories/providers

### Migration Summary:
- ✅ Migrated: [list of migrated components]
- 🔄 Updated: [list of updated files]
- 📁 Created: [list of new directories/files]

### Next Steps:
- [ ] Update imports in dependent files
- [ ] Add tests for new domain logic
- [ ] Update composition root
- [ ] Integrate with existing systems
```

**Always follow the exact patterns established in lib/chatbot-widget/ for consistency.**