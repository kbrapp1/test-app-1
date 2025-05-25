# DAM Component Organization - DDD Analysis

## Current Structure Issues

### Problem: "Page" is Technical, Not Domain-Driven
- `page/` folder uses technical language instead of domain language
- Doesn't reveal business intent or domain functionality
- Mixes coordinator components with layout sections

## Proposed DDD-Aligned Structure

### Option 1: Domain-Focused Organization
```
lib/dam/presentation/components/
├── workspace/                   # Domain: DAM workspace management
│   ├── DamWorkspaceView.tsx    # Main workspace coordinator (renamed from DamPageClient)
│   └── layout/                 # Workspace layout components
│       ├── WorkspaceHeader.tsx
│       ├── WorkspaceFilters.tsx
│       └── index.ts
├── assets/                     # Domain: Asset management
├── gallery/                    # Domain: Asset gallery/browsing
├── folders/                    # Domain: Folder management
├── search/                     # Domain: Search functionality
├── filters/                    # Domain: Filtering controls
└── dialogs/                    # Domain: Modal interactions
```

### Option 2: Flattened with Clear Naming
```
lib/dam/presentation/components/
├── DamWorkspaceView.tsx        # Main coordinator
├── WorkspaceHeader.tsx         # Layout sections with clear names
├── WorkspaceFilters.tsx
├── AssetGallery.tsx           # Domain-focused names
├── FolderNavigation.tsx
└── [other domain components]
```

### Option 3: Feature-Based Organization
```
lib/dam/presentation/components/
├── dam-browser/                # Feature: Browsing assets
│   ├── DamBrowserView.tsx
│   ├── BrowserHeader.tsx
│   └── BrowserFilters.tsx
├── asset-management/           # Feature: Managing assets
├── folder-management/          # Feature: Managing folders
└── search/                     # Feature: Search functionality
```

## Recommended Approach

**Option 1** is most aligned with DDD principles:

### Benefits:
- **Intention-Revealing Names**: "workspace" reveals the domain concept
- **Single Responsibility**: Each folder has one clear domain purpose
- **Consistent Terminology**: Uses business language throughout
- **Clean Dependencies**: Layout components properly nested under workspace

### Migration Strategy:
1. Rename `page/` → `workspace/`
2. Rename `DamPageClient.tsx` → `DamWorkspaceView.tsx`
3. Move sections to `workspace/layout/`
4. Update all imports and references
5. Ensure no duplication with existing `filters/` folder

## DDD Component Naming Guidelines

### ✅ DO Use Domain Language:
- `DamWorkspaceView` (business concept)
- `AssetGallery` (domain entity + function)
- `FolderNavigation` (domain concept)

### ❌ DON'T Use Technical Language:
- `DamPageClient` (technical implementation detail)
- `PageHeader` (UI technical term)
- `ComponentWrapper` (technical abstraction)

## Implementation Notes

- Maintain backward compatibility during migration
- Update documentation and onboarding materials
- Consider team familiarity vs DDD purity trade-offs
- Ensure consistent patterns across all domains 