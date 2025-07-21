# DDD Domain Layer Analysis Report

**Generated:** 2025-07-21T01:12:54.880Z  
**Domain:** all

## 📊 Executive Summary

- **Total Files Analyzed:** 1914
- **Domain Services:** 233
- **Entities:** 30
- **Value Objects:** 141
- **Layer Violations:** 7
- **Layer Warnings:** 0
- **Repository Violations:** 7
- **Cross-Domain Dependencies:** 0
- **Anemic Entities:** 1
- **Value Object Violations:** 108
- **Business Rules:** 359
- **Large Files (>250 lines):** 119
- **Average File Size:** 118 lines

## 🎯 Key Recommendations

- 📏 Refactor 119 files over 250 lines to improve maintainability
- 🏛️ Fix 7 layer boundary violations to improve DDD compliance
- 🗄️ Fix 7 direct infrastructure dependencies - use repository pattern
- 🩸 Enrich 1 anemic entities with business logic
- 🔒 Make 108 value objects immutable with readonly properties
- 💼 Refactor 101 highly complex business rules (complexity 4+/5)
- ⚡ Review 27 services with async methods for potential infrastructure leaks

## 🏗️ Domain Services Analysis

Found 233 domain services across domains:

[ ] auth/OrganizationDomainService.ts: 50 lines, 2 methods
[ ] auth/PasswordService.ts: 162 lines, 6 methods
[ ] auth/PermissionService.ts: 265 lines, 12 methods
[ ] auth/SuperAdminDomainService.ts: 197 lines, 10 methods
[ ] auth/TokenService.ts: 170 lines, 5 methods
[ ] chatbot-widget/ContentCategorizationService.ts: 162 lines, 5 methods (2 async)
[ ] chatbot-widget/ContentCategorizationValidationService.ts: 58 lines, 2 methods
[ ] chatbot-widget/ContentDeduplicationService.ts: 267 lines, 7 methods
[ ] chatbot-widget/ContentExtractionService.ts: 246 lines, 12 methods
[ ] chatbot-widget/ContentValuePolicy.ts: 235 lines, 11 methods
[ ] chatbot-widget/CrawlBudgetCalculatorService.ts: 174 lines, 8 methods
[ ] chatbot-widget/CrawlPolicyService.ts: 132 lines, 8 methods
[ ] chatbot-widget/CrawlPriorityService.ts: 173 lines, 9 methods
[ ] chatbot-widget/CrawlResultProcessorService.ts: 217 lines, 8 methods
[ ] chatbot-widget/CrawlStrategyService.ts: 181 lines, 4 methods
[ ] chatbot-widget/CrawlValidationService.ts: 202 lines, 7 methods (3 async)
[ ] chatbot-widget/EntityAccumulationStrategies.ts: 198 lines, 10 methods
[ ] chatbot-widget/EntitySerializationService.ts: 274 lines, 13 methods
[ ] chatbot-widget/EntityUtilityService.ts: 244 lines, 7 methods
[ ] chatbot-widget/ErrorCategorizationDomainService.ts: 233 lines, 8 methods

## ⚠️ Layer Boundary Issues

[ ] monitoring/CauseAnalysisService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
[ ] monitoring/SpecificCauseAnalyzerService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
[ ] monitoring/ReactQueryCacheAnalysisService.ts: Direct layer boundary violation (../../../infrastructure/analysis/ReactQueryCallAnalyzer)
[ ] monitoring/IRuntimeDetectionService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
[ ] monitoring/FrontendOptimizationAnalysisService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
[ ] monitoring/OptimizationPriorityAssessmentService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)
[ ] monitoring/WebVitalsImpactAssessorService.ts: Direct layer boundary violation (../../../application/dto/PerformanceTrackingDTO)

## 🗄️ Repository Pattern Violations

[ ] dam/AuthContextService.ts: Direct infrastructure dependency in domain - database (@/lib/supabase/client)
[ ] dam/AuthContextService.ts: Direct infrastructure dependency in domain - database (@supabase/supabase-js)
[ ] organization/AuditTrailService.ts: Direct infrastructure dependency in domain - database (@/lib/supabase/client)
[ ] organization/OrganizationContextService.ts: Direct infrastructure dependency in domain - database (@/lib/supabase/client)
[ ] organization/OrganizationContextService.ts: Direct infrastructure dependency in domain - database (@supabase/supabase-js)
[ ] organization/PermissionValidationService.ts: Direct infrastructure dependency in domain - database (@/lib/supabase/client)
[ ] organization/PermissionValidationService.ts: Direct infrastructure dependency in domain - database (@supabase/supabase-js)

## 🔗 Cross-Domain Dependencies

No cross-domain dependencies found - good domain isolation! ✅

## 🩸 Anemic Domain Model Analysis

[ ] dam/AssetTypeChecker.ts: 2 properties, 0 business methods (8 accessors)

## 🔒 Value Object Immutability

[ ] chatbot-widget/ErrorContext.ts: 8 mutable properties
[ ] chatbot-widget/ErrorImpact.ts: 4 mutable properties
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
[ ] image-generator/GenerationStats.ts: 6 mutable properties
[ ] image-generator/Provider.ts: 14 mutable properties
[ ] image-generator/Provider.ts: 6 mutable properties
[ ] image-generator/Provider.ts: 7 mutable properties
[ ] monitoring/CacheAnalysisResult.ts: 6 mutable properties
[ ] monitoring/CacheAnalysisResult.ts: 7 mutable properties
[ ] monitoring/PerformanceTrackingState.ts: 3 mutable properties
[ ] monitoring/PerformanceTrackingState.ts: 5 mutable properties
[ ] monitoring/SpecificCauseAnalysis.ts: 9 mutable properties
[ ] monitoring/WebVitalsMetrics.ts: 5 mutable properties
[ ] openai/OpenAIRateLimitConfig.ts: 1 mutable properties
[ ] tts/SpeechRequest.ts: 6 mutable properties
[ ] tts/SpeechResult.ts: 5 mutable properties
[ ] tts/SpeechResult.ts: 4 mutable properties
[ ] tts/VoiceId.ts: 4 mutable properties
[ ] chatbot-widget/AIConfiguration.ts: 26 mutable properties
[ ] chatbot-widget/BotPersonality.ts: 6 mutable properties
[ ] chatbot-widget/KnowledgeBase.ts: 6 mutable properties
[ ] chatbot-widget/KnowledgeBase.ts: 5 mutable properties
[ ] chatbot-widget/KnowledgeBase.ts: 10 mutable properties
[ ] chatbot-widget/KnowledgeBase.ts: 8 mutable properties
[ ] chatbot-widget/PersonalitySettings.ts: 7 mutable properties
[ ] chatbot-widget/PersonalitySettings.ts: 5 mutable properties
[ ] chatbot-widget/PersonalitySettings.ts: 7 mutable properties
[ ] chatbot-widget/ErrorAnalyticsFilter.ts: 7 mutable properties
[ ] chatbot-widget/ErrorSummary.ts: 6 mutable properties
[ ] chatbot-widget/ErrorTrend.ts: 4 mutable properties
[ ] chatbot-widget/CorrectionMetadata.ts: 4 mutable properties
[ ] chatbot-widget/CorrectionOperation.ts: 3 mutable properties
[ ] chatbot-widget/EntityCorrections.ts: 15 mutable properties
[ ] chatbot-widget/EntityMergeContext.ts: 4 mutable properties
[ ] chatbot-widget/EntityMergeResult.ts: 5 mutable properties
[ ] chatbot-widget/EntityMergeResult.ts: 3 mutable properties
[ ] chatbot-widget/RemovalOperation.ts: 2 mutable properties
[ ] chatbot-widget/EscalationTrigger.ts: 4 mutable properties
[ ] chatbot-widget/ResponseBehavior.ts: 5 mutable properties
[ ] chatbot-widget/ContentMetrics.ts: 2 mutable properties
[ ] chatbot-widget/ContentMetrics.ts: 3 mutable properties
[ ] chatbot-widget/ContentMetrics.ts: 2 mutable properties
[ ] chatbot-widget/ContentMetrics.ts: 3 mutable properties
[ ] chatbot-widget/ContentMetrics.ts: 2 mutable properties
[ ] chatbot-widget/ContentMetrics.ts: 2 mutable properties
[ ] chatbot-widget/ContentMetrics.ts: 7 mutable properties
[ ] chatbot-widget/ContentQualityScore.ts: 7 mutable properties
[ ] chatbot-widget/HealthCheckResult.ts: 8 mutable properties
[ ] chatbot-widget/KnowledgeQuery.ts: 8 mutable properties
[ ] chatbot-widget/KnowledgeStatsResult.ts: 7 mutable properties
[ ] chatbot-widget/ContactInfo.ts: 5 mutable properties
[ ] chatbot-widget/ContactInfo.ts: 10 mutable properties
[ ] chatbot-widget/LeadMetadata.ts: 6 mutable properties
[ ] chatbot-widget/LeadMetadata.ts: 3 mutable properties
[ ] chatbot-widget/LeadScoreTypes.ts: 5 mutable properties
[ ] chatbot-widget/LeadScoreTypes.ts: 10 mutable properties
[ ] chatbot-widget/LeadScoreTypes.ts: 7 mutable properties
[ ] chatbot-widget/LeadScoreTypes.ts: 4 mutable properties
[ ] chatbot-widget/LeadSource.ts: 8 mutable properties
[ ] chatbot-widget/QualificationData.ts: 6 mutable properties
[ ] chatbot-widget/QualificationData.ts: 10 mutable properties
[ ] chatbot-widget/ContextAnalysis.ts: 10 mutable properties
[ ] chatbot-widget/ContextAnalysis.ts: 6 mutable properties
[ ] chatbot-widget/ContextAnalysis.ts: 4 mutable properties
[ ] chatbot-widget/IntentResult.ts: 22 mutable properties
[ ] chatbot-widget/IntentResult.ts: 3 mutable properties
[ ] chatbot-widget/MessageAIMetadata.ts: 7 mutable properties
[ ] chatbot-widget/MessageAIMetadata.ts: 5 mutable properties
[ ] chatbot-widget/MessageContextMetadata.ts: 14 mutable properties
[ ] chatbot-widget/MessageCostTracking.ts: 3 mutable properties
[ ] chatbot-widget/MessageCostTracking.ts: 5 mutable properties
[ ] chatbot-widget/MessageProcessingMetrics.ts: 4 mutable properties
[ ] chatbot-widget/MessageProcessingMetrics.ts: 4 mutable properties
[ ] chatbot-widget/AccumulatedEntitiesTypes.ts: 4 mutable properties
[ ] chatbot-widget/AccumulatedEntitiesTypes.ts: 4 mutable properties
[ ] chatbot-widget/AccumulatedEntitiesTypes.ts: 25 mutable properties
[ ] chatbot-widget/ChatSessionTypes.ts: 14 mutable properties
[ ] chatbot-widget/ConversationContextWindow.ts: 4 mutable properties
[ ] chatbot-widget/ConversationContextWindow.ts: 5 mutable properties
[ ] chatbot-widget/ConversationFlowTypes.ts: 4 mutable properties
[ ] chatbot-widget/OperatingHours.ts: 4 mutable properties
[ ] chatbot-widget/OperatingHours.ts: 4 mutable properties
[ ] chatbot-widget/OperatingHours.ts: 3 mutable properties
[ ] chatbot-widget/SessionContextTypes.ts: 4 mutable properties
[ ] chatbot-widget/SessionContextTypes.ts: 14 mutable properties
[ ] chatbot-widget/SessionSupportTypes.ts: 5 mutable properties
[ ] chatbot-widget/SessionSupportTypes.ts: 5 mutable properties
[ ] chatbot-widget/SessionSupportTypes.ts: 4 mutable properties
[ ] chatbot-widget/SessionSupportTypes.ts: 5 mutable properties
[ ] chatbot-widget/ContextConfiguration.ts: 4 mutable properties
[ ] chatbot-widget/ConversationConfiguration.ts: 4 mutable properties
[ ] chatbot-widget/EntityConfiguration.ts: 3 mutable properties
[ ] chatbot-widget/IntentConfiguration.ts: 4 mutable properties
[ ] chatbot-widget/LeadScoringConfiguration.ts: 4 mutable properties
[ ] chatbot-widget/MonitoringConfiguration.ts: 4 mutable properties
[ ] chatbot-widget/OpenAIConfiguration.ts: 3 mutable properties

## 💼 Business Rules Analysis

Found 359 files with business rules:

[ ] auth/index.ts: complexity 1/5 (0 conditionals, validation )
[ ] auth/AggregateRoot.ts: complexity 4/5 (1 conditionals, validation business logic)
[ ] auth/OrganizationAggregate.ts: complexity 5/5 (29 conditionals, validation business logic)
[ ] auth/UserAggregate.ts: complexity 5/5 (23 conditionals, validation business logic)
[ ] auth/DomainEvent.ts: complexity 1/5 (0 conditionals, validation )
[ ] auth/SuperAdminEvents.ts: complexity 1/5 (0 conditionals, validation )
[ ] auth/IOrganizationRepository.ts: complexity 1/5 (0 conditionals, validation )
[ ] auth/IProfileRepository.ts: complexity 1/5 (0 conditionals, validation )
[ ] auth/IUserRepository.ts: complexity 1/5 (0 conditionals, validation )
[ ] auth/OrganizationDomainService.ts: complexity 3/5 (2 conditionals, validation business logic)
[ ] auth/PasswordService.ts: complexity 2/5 (11 conditionals, validation )
[ ] auth/PermissionService.ts: complexity 3/5 (11 conditionals, validation )
[ ] auth/SuperAdminDomainService.ts: complexity 3/5 (8 conditionals, validation )
[ ] auth/TokenService.ts: complexity 3/5 (6 conditionals, validation )
[ ] auth/Email.ts: complexity 3/5 (6 conditionals, validation )

## 📏 File Size Analysis

### Large Files (>250 lines)

tts/TtsHistoryPanel.test.tsx: 717 lines
monitoring/DiscoveredContexts.ts: 646 lines
auth/teamActions.ts: 537 lines
auth/OrganizationAggregate.ts: 480 lines
notes/NotesUnifiedContextService.ts: 459 lines
shared/UnifiedAppProvider.tsx: 436 lines
auth/UserAggregate.ts: 434 lines
monitoring/PerformanceMonitor.stories.tsx: 432 lines
notes/notesUnifiedActions.ts: 414 lines
notes/NotesApplicationService.ts: 411 lines
tts/TtsPrediction.ts: 386 lines
supabase/db-queries.ts: 384 lines
notes/NoteAggregate.ts: 364 lines
organization/AuditTrailService.ts: 361 lines
tts/TtsReplicateAdapter.ts: 349 lines

### Largest Files by Domain

[ ] tts: TtsHistoryPanel.test.tsx (717 lines)
[ ] monitoring: DiscoveredContexts.ts (646 lines)
[ ] auth: teamActions.ts (537 lines)
[ ] notes: NotesUnifiedContextService.ts (459 lines)
[ ] shared: UnifiedAppProvider.tsx (436 lines)
[ ] supabase: db-queries.ts (384 lines)
[ ] organization: AuditTrailService.ts (361 lines)
[ ] performance-profiler.ts: performance-profiler.ts (346 lines)
[ ] image-generator: useFileUpload.ts (345 lines)
[ ] dam: AssetGalleryClient.tsx (303 lines)
[ ] chatbot-widget: KnowledgeContentSimilarityService.ts (298 lines)
[ ] test: performance-handlers.ts (293 lines)
[ ] services: api-deduplication.ts (272 lines)
[ ] hooks: useCacheHealth.ts (229 lines)
[ ] forms: error-handling.ts (198 lines)
[ ] store: FolderTreeService.ts (197 lines)
[ ] config: navigation.ts (186 lines)
[ ] errors: base.ts (183 lines)
[ ] openai: OpenAIApplicationService.ts (178 lines)
[ ] infrastructure: ElevenLabsProvider.ts (170 lines)
[ ] middleware: error.ts (136 lines)
[ ] logging: index.ts (99 lines)
[ ] utils: lazyLoader.tsx (72 lines)
[ ] utils.ts: utils.ts (70 lines)
[ ] schemas: team.ts (59 lines)
[ ] __mocks__: server.ts (37 lines)
[ ] helpers.ts: helpers.ts (33 lines)
[ ] actions: TtsFeatureFlagService.ts (24 lines)

## 🏢 Domain Model Analysis

### Entities by Domain

[ ] chatbot-widget: 6 entities (avg 18 methods per entity)
[ ] dam: 16 entities (avg 6 methods per entity)
[ ] image-generator: 5 entities (avg 7 methods per entity)
[ ] monitoring: 2 entities (avg 5 methods per entity)
[ ] tts: 1 entities (avg 20 methods per entity)

### Value Objects Distribution

- **Total Value Objects:** 141
- **Ratio to Entities:** 4.7 value objects per entity

## 📈 Domain Health Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Average File Size | 118 lines | ✅ Good |
| Layer Violations | 7 | ❌ Needs attention |
| Repository Violations | 7 | ❌ Use repository pattern |
| Cross-Domain Dependencies | 0 | ✅ Good isolation |
| Anemic Entities | 1 | ⚠️ Add business logic |
| Value Object Violations | 108 | ⚠️ Make readonly |
| Business Rules | 359 | ✅ Good |
| Large Files | 119 | ⚠️ Consider splitting |
| Domain Services | 233 | ✅ Good |

---

*Generated by DDD Architecture Analyzer using ts-morph*  
*For questions or improvements, see: .claude/commands/analyze-ddd.md*
