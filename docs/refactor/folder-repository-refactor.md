# SupabaseFolderRepository Refactoring

## Overview
Refactored `SupabaseFolderRepository.ts` following DDD golden rule principles to reduce file size from 431 lines to 176 lines (59% reduction) while maintaining all functionality.

## DDD Principles Applied

### Single Responsibility Principle
Each service has one clear purpose:
- **FolderQueryBuilder**: Query construction logic
- **FolderDateFilter**: Date filtering operations  
- **FolderQueryExecutor**: Query execution and error handling
- **FolderTreeService**: Tree operations and path management

### Extracted Services

#### 1. FolderQueryBuilder (85 lines)
**Purpose:** Query construction for folders
**Methods:**
- `buildBaseQuery()` - Base query with organization filter
- `applyParentFilter()` - Parent folder filtering
- `applyOwnerFilter()` - Owner filtering
- `applyTypeFilter()` - Type filtering with folder validation
- `applySearchFilter()` - Search term filtering
- `applyNameFilter()` - Name filtering
- `applySorting()` - Sorting with validation
- `applyPagination()` - Pagination logic

#### 2. FolderDateFilter (73 lines)
**Purpose:** Date filtering operations
**Methods:**
- `applyDateFilters()` - Apply date filters to queries
- `validateDateFilters()` - Validate date filter parameters
**Features:**
- Supports today, last7days, last30days, thisYear, lastYear, custom ranges
- Proper UTC date handling

#### 3. FolderQueryExecutor (133 lines)
**Purpose:** Query execution and error handling
**Methods:**
- `executeQuery()` - Execute queries with error handling
- `executeSingleQuery()` - Execute single record queries
- `executeCreate()` - Execute folder creation
- `executeUpdate()` - Execute folder updates
- `executeDelete()` - Execute folder deletion with validation
- `executeGetFolderPath()` - Execute RPC calls for folder paths

#### 4. FolderTreeService (113 lines)
**Purpose:** Tree operations and path management
**Methods:**
- `buildFolderTree()` - Build recursive folder tree
- `getFolderChildren()` - Get folder children (folders + assets)
- `getFolderPathString()` - Get folder path as string
- `getFolderPathArray()` - Get folder path as Folder array
- `buildTreeRecursively()` - Private recursive tree building

## Refactored Repository (176 lines)

### Before vs After
- **Before:** 431 lines with mixed concerns
- **After:** 176 lines focused on coordination
- **Reduction:** 255 lines (59% smaller)

### Key Improvements
1. **Clean Separation:** Each service handles specific concerns
2. **Better Error Handling:** Centralized in query executor
3. **Reusable Components:** Services can be used by other repositories
4. **Maintainable Code:** Easier to test and modify individual services
5. **DDD Compliance:** Follows domain-driven design principles

### Repository Methods
All original methods maintained with delegation to services:
- `findById()` - Uses query builder + executor
- `findFoldersByParentId()` - Uses query builder + date filter + executor
- `findByName()` - Uses query builder + executor
- `findChildren()` - Delegates to tree service
- `getPath()` - Delegates to tree service
- `update()` - Uses query executor
- `delete()` - Uses query executor
- `getFolderTree()` - Delegates to tree service
- `findFolderPath()` - Delegates to tree service
- `findAllByOrganizationId()` - Uses query builder + executor
- `create()` - Uses query executor
- `search()` - Uses query builder + executor

## File Structure
```
lib/dam/infrastructure/persistence/supabase/
├── services/
│   ├── FolderQueryBuilder.ts      (85 lines)
│   ├── FolderDateFilter.ts        (73 lines)
│   ├── FolderQueryExecutor.ts     (133 lines)
│   ├── FolderTreeService.ts       (113 lines)
│   └── index.ts                   (updated exports)
└── SupabaseFolderRepository.ts    (176 lines)
```

## Benefits
1. **Maintainability:** Easier to modify specific functionality
2. **Testability:** Each service can be unit tested independently
3. **Reusability:** Services can be shared across repositories
4. **Readability:** Clear separation of concerns
5. **Compliance:** Follows DDD golden rule (200-250 lines max)

## Migration Notes
- All public interfaces remain unchanged
- No breaking changes to existing functionality
- Services are properly exported and imported
- Error handling improved with better context 