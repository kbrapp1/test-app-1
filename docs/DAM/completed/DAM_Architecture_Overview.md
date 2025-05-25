# DAM (Digital Asset Management) Architecture Overview

## Domain-Driven Design (DDD) Implementation

The DAM module has been fully migrated to follow Domain-Driven Design principles, providing a clean, maintainable, and testable architecture.

## Architecture Layers

### 1. Domain Layer (`/lib/dam/domain/`)
**Purpose**: Contains the core business logic and domain entities

- **Entities**: `Asset`, `Folder`, `Tag` - Rich domain objects with business methods
- **Repositories**: Interface definitions for data access (`IAssetRepository`, `IFolderRepository`, `ITagRepository`)
- **Services**: Domain services for complex business operations
- **Value Objects**: Immutable objects representing domain concepts

**Key Features**:
- Business rule enforcement
- Domain validation
- No external dependencies
- Framework-agnostic

### 2. Application Layer (`/lib/dam/application/`)
**Purpose**: Orchestrates domain objects and coordinates business workflows

- **Use Cases**: Business operations like `CreateFolderUseCase`, `UploadAssetUseCase`
- **DTOs**: Data transfer objects for cross-boundary communication
- **Server Actions**: Next.js server actions that delegate to use cases

**Key Features**:
- Transaction boundaries
- Authorization checks
- Error handling
- Cache invalidation

### 3. Infrastructure Layer (`/lib/dam/infrastructure/`)
**Purpose**: Provides concrete implementations for external concerns

- **Persistence**: Supabase repository implementations
- **Storage**: File storage service implementations
- **External APIs**: Third-party service integrations

**Key Features**:
- Database access
- File storage
- External service calls
- Framework-specific implementations

### 4. Presentation Layer (`/lib/dam/presentation/`)
**Purpose**: UI components and hooks for the DAM domain

- **Components**: React components organized by domain concepts
- **Hooks**: Custom hooks for state management and data fetching
- **Types**: Component-specific type definitions

**Key Features**:
- Domain-specific UI components
- State management
- User interaction handling
- Data presentation

## Dependency Direction

```
Presentation → Application → Domain ← Infrastructure
```

- **Presentation** depends on Application
- **Application** depends on Domain
- **Infrastructure** depends on Domain
- **Domain** has no dependencies (pure business logic)

## Public API

The DAM domain exposes a clean public API through `/lib/dam/index.ts`:

### Server Actions (Recommended for Components)
```typescript
import { 
  getAssetDownloadUrl,
  listTextAssets,
  renameFolderAction,
  deleteFolderAction 
} from '@/lib/dam';
```

### Use Cases (For Advanced Scenarios)
```typescript
import { 
  CreateFolderUseCase,
  UploadAssetUseCase,
  SearchDamItemsUseCase 
} from '@/lib/dam';
```

### Domain Entities (For Type Definitions)
```typescript
import type { Asset, Folder, Tag } from '@/lib/dam';
```

### DTOs (For Data Transfer)
```typescript
import type { 
  DamFilterParameters,
  DamApiRequestDto,
  PlainTag 
} from '@/lib/dam';
```

### Repository Interfaces (For Testing/Mocking)
```typescript
import type { 
  IAssetRepository,
  IFolderRepository,
  ITagRepository 
} from '@/lib/dam';
```

## Benefits of DDD Architecture

### 1. **Maintainability**
- Clear separation of concerns
- Explicit dependencies
- Business logic isolated from infrastructure

### 2. **Testability**
- Use cases can be tested in isolation
- Repository interfaces enable easy mocking
- Domain logic is framework-independent

### 3. **Flexibility**
- Easy to swap infrastructure implementations
- Business logic is reusable across different UIs
- Clear boundaries enable team development

### 4. **Consistency**
- Uniform patterns across the domain
- Standard error handling
- Consistent cache invalidation

## Migration Benefits

The migration from server actions to DDD architecture has provided:

1. **Eliminated Duplication**: Consolidated 1,628+ lines of legacy code
2. **Improved Consistency**: Single source of truth for business logic
3. **Enhanced Testability**: Clear interfaces and dependency injection
4. **Better Performance**: Optimized cache invalidation strategies
5. **Developer Experience**: Clean imports and intuitive API

## Usage Examples

### Creating a Folder
```typescript
// Component usage (recommended)
import { createFolderAction } from '@/lib/dam';

const result = await createFolderAction('New Folder', parentFolderId);

// Direct use case usage (advanced)
import { CreateFolderUseCase, SupabaseFolderRepository } from '@/lib/dam';

const folderRepository = new SupabaseFolderRepository(supabase);
const useCase = new CreateFolderUseCase(folderRepository);
const folder = await useCase.execute({
  name: 'New Folder',
  parentFolderId,
  organizationId,
  userId
});
```

### Searching Assets
```typescript
import { GetDamDataUseCase, SupabaseAssetRepository } from '@/lib/dam';

const assetRepository = new SupabaseAssetRepository(supabase);
const folderRepository = new SupabaseFolderRepository(supabase);
const useCase = new GetDamDataUseCase(assetRepository, folderRepository);

const result = await useCase.execute({
  organizationId,
  folderId: null,
  searchTerm: 'image',
  filters: { type: 'image' },
  sortParams: { sortBy: 'created_at', sortOrder: 'desc' }
});
```

### Working with Assets
```typescript
import { 
  getAssetContent,
  updateAssetText,
  getAssetDownloadUrl 
} from '@/lib/dam';

// Get text content
const content = await getAssetContent(assetId);

// Update text content  
await updateAssetText(assetId, newContent);

// Get download URL
const { downloadUrl } = await getAssetDownloadUrl(assetId, true);
```

## Testing Strategy

### Unit Tests
Test use cases in isolation with mocked repositories:

```typescript
import { CreateFolderUseCase } from '@/lib/dam';

const mockRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  // ... other methods
};

const useCase = new CreateFolderUseCase(mockRepository);
```

### Integration Tests
Test with real database connections for end-to-end validation.

### Component Tests
Use server actions for testing UI components with real business logic.

## Best Practices

1. **Always use server actions in components** - They provide proper error handling and cache invalidation
2. **Use use cases directly only when needed** - For complex scenarios requiring custom error handling
3. **Leverage TypeScript** - All interfaces are strongly typed for better development experience
4. **Follow dependency injection** - Pass repositories to use cases for better testability
5. **Keep domain logic pure** - No external dependencies in domain entities

This architecture provides a solid foundation for building and maintaining the DAM functionality while ensuring scalability and maintainability. 