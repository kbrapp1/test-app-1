# DDD Architecture Analysis Report - chatbot-widget

**Generated:** 2025-07-20T22:58:25.010Z  
**Domain:** chatbot-widget

## 📊 Executive Summary

- **Total Files Analyzed:** 2251
- **Domain Services:** 233
- **Entities:** 30
- **Value Objects:** 136
- **Layer Violations:** 14
- **Layer Warnings:** 0
- **Large Files (>250 lines):** 160
- **Average File Size:** 118 lines

## 🎯 Key Recommendations

- 📏 Refactor 160 files over 250 lines to improve maintainability
- 🏛️ Fix 14 layer boundary violations to improve DDD compliance
- ⚡ Review 27 services with async methods for potential infrastructure leaks

## 🏗️ Domain Services Analysis

Found 233 domain services across domains:

- **auth/OrganizationDomainService.ts**: 50 lines, 2 methods
- **auth/PasswordService.ts**: 162 lines, 6 methods
- **auth/PermissionService.ts**: 265 lines, 12 methods
- **auth/SuperAdminDomainService.ts**: 197 lines, 10 methods
- **auth/TokenService.ts**: 170 lines, 5 methods
- **chatbot-widget/ContentCategorizationService.ts**: 162 lines, 5 methods (2 async)
- **chatbot-widget/ContentCategorizationValidationService.ts**: 58 lines, 2 methods
- **chatbot-widget/ContentDeduplicationService.ts**: 267 lines, 7 methods
- **chatbot-widget/ContentExtractionService.ts**: 262 lines, 12 methods
- **chatbot-widget/ContentValuePolicy.ts**: 235 lines, 11 methods
- **chatbot-widget/CrawlBudgetCalculatorService.ts**: 174 lines, 8 methods
- **chatbot-widget/CrawlPolicyService.ts**: 132 lines, 8 methods
- **chatbot-widget/CrawlPriorityService.ts**: 173 lines, 9 methods
- **chatbot-widget/CrawlResultProcessorService.ts**: 217 lines, 8 methods
- **chatbot-widget/CrawlStrategyService.ts**: 181 lines, 4 methods
- **chatbot-widget/CrawlValidationService.ts**: 202 lines, 7 methods (3 async)
- **chatbot-widget/EntityAccumulationStrategies.ts**: 198 lines, 10 methods
- **chatbot-widget/EntitySerializationService.ts**: 274 lines, 13 methods
- **chatbot-widget/EntityUtilityService.ts**: 244 lines, 7 methods
- **chatbot-widget/ErrorCategorizationDomainService.ts**: 233 lines, 8 methods

## ⚠️ Layer Boundary Issues

- **VIOLATION** in image-generator/GenerationRepository.ts: Direct layer boundary violation (../../infrastructure/common/Result)
- **VIOLATION** in image-generator/GenerationRepository.ts: Direct layer boundary violation (../../infrastructure/persistence/supabase/services/GenerationStatsCalculator)
- **VIOLATION** in image-generator/StatusCheckingRepository.ts: Direct layer boundary violation (../../infrastructure/common/Result)
- **VIOLATION** in chatbot-widget/WorkflowDataExtractor.ts: Direct layer boundary violation (../../../application/dto/WorkflowBoundaryTypes)
- **VIOLATION** in chatbot-widget/WorkflowDefaultFactory.ts: Direct layer boundary violation (../../../application/dto/WorkflowBoundaryTypes)
- **VIOLATION** in monitoring/BusinessImpactCalculationService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
- **VIOLATION** in monitoring/BusinessImpactCalculatorService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
- **VIOLATION** in monitoring/CauseAnalysisService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
- **VIOLATION** in monitoring/SpecificCauseAnalyzerService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
- **VIOLATION** in monitoring/ReactQueryCacheAnalysisService.ts: Direct layer boundary violation (../../../infrastructure/analysis/ReactQueryCallAnalyzer)
- **VIOLATION** in monitoring/IRuntimeDetectionService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
- **VIOLATION** in monitoring/FrontendOptimizationAnalysisService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
- **VIOLATION** in monitoring/OptimizationPriorityAssessmentService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
- **VIOLATION** in monitoring/WebVitalsImpactAssessorService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)

## 📏 File Size Analysis

### Large Files (>250 lines)

- **unknown/supabase.ts**: 1698 lines
- **unknown/page.tsx**: 807 lines
- **unknown/sidebar.tsx**: 771 lines
- **unknown/page.tsx**: 724 lines
- **unknown/data-table.tsx**: 718 lines
- **tts/TtsHistoryPanel.test.tsx**: 717 lines
- **monitoring/DiscoveredContexts.ts**: 646 lines
- **unknown/data.json**: 615 lines
- **unknown/page.tsx**: 567 lines
- **auth/teamActions.ts**: 537 lines
- **auth/OrganizationAggregate.ts**: 480 lines
- **notes/NotesUnifiedContextService.ts**: 459 lines
- **shared/UnifiedAppProvider.tsx**: 436 lines
- **auth/UserAggregate.ts**: 434 lines
- **monitoring/PerformanceMonitor.stories.tsx**: 432 lines

### Largest Files by Domain

- **unknown**: supabase.ts (1698 lines)
- **tts**: TtsHistoryPanel.test.tsx (717 lines)
- **monitoring**: DiscoveredContexts.ts (646 lines)
- **auth**: teamActions.ts (537 lines)
- **notes**: NotesUnifiedContextService.ts (459 lines)
- **shared**: UnifiedAppProvider.tsx (436 lines)
- **supabase**: db-queries.ts (384 lines)
- **organization**: AuditTrailService.ts (361 lines)
- **performance-profiler.ts**: performance-profiler.ts (346 lines)
- **image-generator**: useFileUpload.ts (345 lines)
- **dam**: AssetGalleryClient.tsx (303 lines)
- **chatbot-widget**: KnowledgeContentSimilarityService.ts (298 lines)
- **test**: performance-handlers.ts (293 lines)
- **services**: api-deduplication.ts (272 lines)
- **hooks**: useCacheHealth.ts (229 lines)
- **forms**: error-handling.ts (198 lines)
- **store**: FolderTreeService.ts (197 lines)
- **config**: navigation.ts (186 lines)
- **errors**: base.ts (183 lines)
- **openai**: OpenAIApplicationService.ts (178 lines)
- **infrastructure**: ElevenLabsProvider.ts (170 lines)
- **middleware**: error.ts (136 lines)
- **logging**: index.ts (99 lines)
- **utils**: lazyLoader.tsx (72 lines)
- **utils.ts**: utils.ts (70 lines)
- **schemas**: team.ts (59 lines)
- **__mocks__**: server.ts (37 lines)
- **helpers.ts**: helpers.ts (33 lines)
- **actions**: TtsFeatureFlagService.ts (24 lines)

## 🏢 Domain Model Analysis

### Entities by Domain

- **chatbot-widget**: 6 entities (avg 18 methods per entity)
- **dam**: 16 entities (avg 6 methods per entity)
- **image-generator**: 5 entities (avg 7 methods per entity)
- **monitoring**: 2 entities (avg 5 methods per entity)
- **tts**: 1 entities (avg 20 methods per entity)

### Value Objects Distribution

- **Total Value Objects:** 136
- **Ratio to Entities:** 4.5 value objects per entity

## 📈 Domain Health Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Average File Size | 118 lines | ✅ Good |
| Layer Violations | 14 | ❌ Needs attention |
| Large Files | 160 | ⚠️ Consider splitting |
| Domain Services | 233 | ✅ Good |

---

*Generated by DDD Architecture Analyzer using ts-morph*  
*For questions or improvements, see: .claude/commands/analyze-ddd.md*
