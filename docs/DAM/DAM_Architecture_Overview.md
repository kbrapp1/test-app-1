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

### 5. API Layer (`/app/api/dam/`)
**Purpose**: HTTP endpoints that expose DAM functionality

- **Thin Wrappers**: API routes that delegate to use cases
- **Request/Response**: Handle HTTP concerns only
- **Validation**: Input validation at API boundary

**Key Features**:
- HTTP request/response handling
- API parameter validation
- Error transformation to HTTP status codes
- Delegation to use cases for business logic

## Dependency Direction

```
API Layer ↘
Presentation → Application → Domain ← Infrastructure
```

- **API Layer** delegates to Application (use cases)
- **Presentation** depends on Application (server actions/use cases)
- **Application** depends on Domain (entities/repositories)
- **Infrastructure** depends on Domain (implements interfaces)
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

## API Route Architecture (NEW)

All API routes follow the **thin wrapper pattern**:

### Example: DAM Gallery API
```typescript
// /app/api/dam/route.ts - BEFORE (361 lines)
export async function GET(request: NextRequest) {
  // Parameter parsing
  // Business logic (search, filtering, sorting)
  // Data transformation
  // Owner name mapping
  // Response formatting
}

// /app/api/dam/route.ts - AFTER (135 lines) 
export async function GET(request: NextRequest) {
  // 1. Parse HTTP parameters
  const params = parseRequestParameters(request);
  
  // 2. Delegate to use case
  const result = await getDamDataUseCase.execute(params);
  
  // 3. Return HTTP response
  return NextResponse.json(result);
}
```

### API Routes Structure
- **`/api/dam`** - Gallery data (uses `GetDamDataUseCase`)
- **`/api/dam/asset/[id]`** - Asset CRUD (uses `GetAssetDetailsUseCase`, `UpdateAssetMetadataUseCase`, `DeleteAssetUseCase`)
- **`/api/dam/folders`** - Folder creation (uses `CreateFolderUseCase`)

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

### 5. **API Design**
- Thin wrappers prevent API bloat
- Clear separation of HTTP and business concerns
- Reusable business logic across API and server actions

## Migration Benefits

The migration from server actions to DDD architecture has provided:

1. **Eliminated Duplication**: Consolidated 1,628+ lines of legacy code
2. **Improved Consistency**: Single source of truth for business logic
3. **Enhanced Testability**: Clear interfaces and dependency injection
4. **Better Performance**: Optimized cache invalidation strategies
5. **Developer Experience**: Clean imports and intuitive API
6. **API Optimization**: 37% reduction in main API route (361→135 lines)

## Usage Examples

### Creating a Folder
```typescript
// Component usage (recommended)
import { createFolderAction } from '@/lib/dam';

const result = await createFolderAction('New Folder', parentFolderId);

// API usage
const response = await fetch('/api/dam/folders', {
  method: 'POST',
  body: JSON.stringify({ name: 'New Folder', parentFolderId })
});

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
// API usage
const response = await fetch('/api/dam?q=image&type=image');

// Server action usage (in components)
import { executeSavedSearch } from '@/lib/dam';
const result = await executeSavedSearch(searchId);

// Direct use case usage
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
// Server actions (recommended for components)
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

// API usage
const response = await fetch(`/api/dam/asset/${assetId}?details=true`);
const asset = await response.json();
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

### API Tests
Test API routes with proper HTTP requests:

```typescript
import { GET } from '@/app/api/dam/route';

const request = new NextRequest('https://example.com/api/dam?q=test');
const response = await GET(request);
```

### Component Tests
Use server actions for testing UI components with real business logic.

## Best Practices

### For Server Actions
1. **Always use server actions in components** - They provide proper error handling and cache invalidation
2. **Use use cases directly only when needed** - For complex scenarios requiring custom error handling

### For API Routes
1. **Keep routes thin** - Only handle HTTP concerns
2. **Delegate to use cases** - All business logic should be in use cases
3. **Validate at boundary** - Validate input parameters but don't duplicate business validation

### For Use Cases
1. **Leverage TypeScript** - All interfaces are strongly typed for better development experience
2. **Follow dependency injection** - Pass repositories to use cases for better testability
3. **Keep domain logic pure** - No external dependencies in domain entities

### For Architecture
1. **Respect dependency direction** - Never let domain depend on infrastructure
2. **Use interfaces** - Define contracts between layers
3. **Single responsibility** - Each use case should do one thing well

This architecture provides a solid foundation for building and maintaining the DAM functionality while ensuring scalability and maintainability. 