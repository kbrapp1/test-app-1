# DDD Domain Layer Analysis Report - dam

**Generated:** 2025-07-21T00:29:43.037Z  
**Domain:** dam

## 📊 Executive Summary

- **Total Files Analyzed:** 398
- **Domain Services:** 10
- **Entities:** 16
- **Value Objects:** 8
- **Layer Violations:** 0
- **Layer Warnings:** 0
- **Repository Violations:** 2
- **Cross-Domain Dependencies:** 0
- **Anemic Entities:** 1
- **Value Object Violations:** 13
- **Business Rules:** 28
- **Large Files (>250 lines):** 8
- **Average File Size:** 93 lines

## 🎯 Key Recommendations

- 📏 Refactor 8 files over 250 lines to improve maintainability
- 🗄️ Fix 2 direct infrastructure dependencies - use repository pattern
- 🩸 Enrich 1 anemic entities with business logic
- 🔒 Make 13 value objects immutable with readonly properties
- 💼 Refactor 3 highly complex business rules (complexity 4+/5)
- ⚡ Review 1 services with async methods for potential infrastructure leaks

## 🏗️ Domain Services Analysis

Found 10 domain services across domains:

[ ] dam/AuthContextService.ts: 27 lines, 1 methods (1 async)
[ ] dam/BulkOperationValidator.ts: 96 lines, 5 methods
[ ] dam/index.ts: 14 lines, 0 methods
[ ] dam/SearchCriteriaFactory.ts: 63 lines, 3 methods
[ ] dam/SearchMapper.ts: 70 lines, 3 methods
[ ] dam/SearchUtilities.ts: 75 lines, 5 methods
[ ] dam/SearchValidation.ts: 44 lines, 2 methods
[ ] dam/SelectionOperations.ts: 224 lines, 7 methods
[ ] dam/SelectionValidator.ts: 64 lines, 3 methods
[ ] dam/TagColorService.ts: 98 lines, 6 methods

## ⚠️ Layer Boundary Issues

No layer boundary violations found! ✅

## 🗄️ Repository Pattern Violations

[ ] dam/AuthContextService.ts: Direct infrastructure dependency in domain - database (@/lib/supabase/client)
[ ] dam/AuthContextService.ts: Direct infrastructure dependency in domain - database (@supabase/supabase-js)

## 🔗 Cross-Domain Dependencies

No cross-domain dependencies found - good domain isolation! ✅

## 🩸 Anemic Domain Model Analysis

[ ] dam/AssetTypeChecker.ts: 2 properties, 0 business methods (8 accessors)

## 🔒 Value Object Immutability

[ ] dam/BulkOperation.ts: 3 mutable properties
[ ] dam/BulkOperation.ts: 2 mutable properties
[ ] dam/BulkOperation.ts: 2 mutable properties
[ ] dam/BulkOperation.ts: 2 mutable properties
[ ] dam/BulkOperation.ts: 3 mutable properties
[ ] dam/BulkOperation.ts: 3 mutable properties
[ ] dam/DamDataResult.ts: 2 mutable properties
[ ] dam/SearchCriteria.ts: 8 mutable properties
[ ] dam/SearchCriteria.ts: 2 mutable properties
[ ] dam/SearchCriteria.ts: 7 mutable properties
[ ] dam/SearchCriteria.ts: 2 mutable properties
[ ] dam/SearchCriteria.ts: 7 mutable properties
[ ] dam/SearchCriteria.ts: 6 mutable properties

## 💼 Business Rules Analysis

Found 28 files with business rules:

[ ] dam/Asset.ts: complexity 1/5 (0 conditionals, validation )
[ ] dam/AssetTypeChecker.ts: complexity 3/5 (0 conditionals, validation business logic)
[ ] dam/AssetValidation.ts: complexity 3/5 (10 conditionals, validation )
[ ] dam/Folder.ts: complexity 1/5 (0 conditionals, validation )
[ ] dam/index.ts: complexity 1/5 (0 conditionals, validation )
[ ] dam/SavedSearch.ts: complexity 0/5 (5 conditionals,  )
[ ] dam/Selection.ts: complexity 4/5 (7 conditionals, validation business logic)
[ ] dam/SelectionFactory.ts: complexity 5/5 (16 conditionals, validation business logic)
[ ] dam/Tag.ts: complexity 1/5 (0 conditionals, validation )
[ ] dam/TagFactory.ts: complexity 1/5 (0 conditionals, validation )
[ ] dam/TagUtilities.ts: complexity 3/5 (3 conditionals, validation business logic)
[ ] dam/TagValidation.ts: complexity 3/5 (10 conditionals, validation )
[ ] dam/IAssetTagRepository.ts: complexity 1/5 (0 conditionals, validation )
[ ] dam/BulkOperationValidator.ts: complexity 2/5 (7 conditionals, validation )
[ ] dam/SearchUtilities.ts: complexity 1/5 (4 conditionals, validation )

## 📏 File Size Analysis

### Large Files (>250 lines)

dam/AssetGalleryClient.tsx: 303 lines
dam/DamTypes.ts: 286 lines
dam/AssetListItem.tsx: 285 lines
dam/DamWorkspaceView.tsx: 264 lines
dam/SearchCriteria.ts: 263 lines
dam/base-props.ts: 262 lines
dam/useSearchBarState.ts: 254 lines
dam/SupabaseSavedSearchRepository.ts: 253 lines

### Largest Files by Domain

[ ] dam: AssetGalleryClient.tsx (303 lines)

## 🏢 Domain Model Analysis

### Entities by Domain

[ ] dam: 16 entities (avg 6 methods per entity)

### Value Objects Distribution

- **Total Value Objects:** 8
- **Ratio to Entities:** 0.5 value objects per entity

## 📈 Domain Health Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Average File Size | 93 lines | ✅ Good |
| Layer Violations | 0 | ✅ Clean |
| Repository Violations | 2 | ❌ Use repository pattern |
| Cross-Domain Dependencies | 0 | ✅ Good isolation |
| Anemic Entities | 1 | ⚠️ Add business logic |
| Value Object Violations | 13 | ⚠️ Make readonly |
| Business Rules | 28 | ✅ Good |
| Large Files | 8 | ⚠️ Consider splitting |
| Domain Services | 10 | ✅ Good |

---

*Generated by DDD Architecture Analyzer using ts-morph*  
*For questions or improvements, see: .claude/commands/analyze-ddd.md*
