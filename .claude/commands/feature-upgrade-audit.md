# Feature Upgrade Audit & Analysis

**Usage:** `/feature-upgrade-audit [feature-area] [dimension?]`

**Purpose:** Comprehensive or targeted evaluation and upgrade planning for feature areas to achieve enterprise standards matching the **Notes domain gold standard** (97/100 DDD + Unified Context + Security Compliance).

## Usage Patterns

### **Comprehensive Audit (Default)**
```bash
/feature-upgrade-audit dam                    # Full audit (all dimensions)
/feature-upgrade-audit image-generator        # Full audit (all dimensions)
/feature-upgrade-audit chatbot-widget all     # Explicit full audit
```

### **Targeted Dimension Analysis**
```bash
/feature-upgrade-audit dam ddd                # DDD compliance only
/feature-upgrade-audit dam security           # Security guidelines only
/feature-upgrade-audit dam unified-context    # Unified context pattern only
/feature-upgrade-audit dam feature-flags      # Feature flag integration only
/feature-upgrade-audit dam role-permissions   # Role-based permissions only
```

### **Supported Dimensions**
- **`all`** (default): Comprehensive multi-agent audit across all dimensions
- **`ddd`**: Domain-Driven Design architecture compliance
- **`security`**: ESLint security guidelines and organization context protection
- **`unified-context`**: API consolidation and performance optimization
- **`feature-flags`**: Organization-scoped feature flag integration
- **`role-permissions`**: Role-based access control and permission validation

## Context & Reference Documents

### **Gold Standard Baseline: Notes Domain**
- **Template Guide**: `docs/templates/notes-domain-template-guide.md`
- **Implementation**: `lib/notes/` (97/100 DDD compliance + unified context + security)
- **Architecture**: Domain events, specifications, unified context, optimistic updates

### **Security & Compliance Guidelines**
- **Security Design**: `docs/security/comprehensive-security-design.md`
- **ESLint Security**: `.claude/commands/eslint-security-guidelines.md`
- **Permission Implementation**: `docs/security/feature-permission-implementation-guide.md`
- **Unified Context Pattern**: `docs/general/unified-context-pattern-implementation-guide.md`

### **Architectural Standards**
- **Golden Rule DDD**: `.claude/commands/golden-rule.mdc`
- **Performance Optimization**: `docs/refactor/unified-context-performance-optimization.md`

## Execution Strategy

### **Dimension Selection Logic**
```typescript
if (!dimension || dimension === 'all') {
  // Run comprehensive multi-agent audit across all 5 dimensions
  executeFullAudit();
} else {
  // Run targeted single-dimension analysis
  executeTargetedAudit(dimension);
}
```

### **Targeted Dimension Workflows**

#### **`/feature-upgrade-audit [feature] ddd`**
**Focus:** Domain-Driven Design architecture compliance
**Target Score:** 90-97/100 (Notes baseline: 97/100)

**Analysis Scope:**
```typescript
Domain Layer Assessment (40 points):
- Aggregates with business invariants (10 pts)
- Domain events for state changes (10 pts)
- Value objects for type safety (10 pts)
- Specifications for business rules (10 pts)

Application Layer Assessment (30 points):
- CQRS use cases (10 pts)
- Application services coordination (10 pts)
- Transaction boundaries (10 pts)

Infrastructure Layer Assessment (20 points):
- Repository implementations (10 pts)
- Composition root dependency injection (10 pts)

Presentation Layer Assessment (10 points):
- Clean component architecture (10 pts)
```

**Output:** `docs/refactor/[feature]-ddd-audit-[timestamp].md`

#### **`/feature-upgrade-audit [feature] security`**
**Focus:** ESLint security guidelines and organization context protection
**Target Score:** 95-100/100 (Notes baseline: 100/100)

**Analysis Scope:**
```typescript
Organization Context Protection (40 points):
- organizationId variables never removed (15 pts)
- Proper context validation patterns (15 pts)
- JWT-based organization scoping (10 pts)

React Hooks Compliance (30 points):
- All hooks called before conditionals (15 pts)
- Stable dependencies in useCallback (10 pts)
- No hooks in loops/conditions (5 pts)

Permission Validation (20 points):
- Role-based access control (10 pts)
- Server-side validation (10 pts)

Multi-Tenant Security (10 points):
- Database RLS implementation (5 pts)
- Organization-scoped cache keys (5 pts)
```

**Output:** `docs/refactor/[feature]-security-audit-[timestamp].md`

#### **`/feature-upgrade-audit [feature] unified-context`**
**Focus:** API consolidation and performance optimization
**Target Score:** 85-95/100 (Notes baseline: 95/100)

**Analysis Scope:**
```typescript
API Call Consolidation (40 points):
- Current API call count analysis (10 pts)
- Unified context service implementation (15 pts)
- Single server action pattern (15 pts)

Cache Strategy (30 points):
- Organization-scoped caching (15 pts)
- Cache invalidation after mutations (15 pts)

Optimistic Updates (20 points):
- Instant UI feedback implementation (10 pts)
- Rollback handling on errors (10 pts)

Performance Measurement (10 points):
- API call reduction percentage (5 pts)
- Page load time improvement (5 pts)
```

**Output:** `docs/refactor/[feature]-unified-context-audit-[timestamp].md`

#### **`/feature-upgrade-audit [feature] feature-flags`**
**Focus:** Organization-scoped feature flag integration
**Target Score:** 90-95/100 (Notes baseline: 95/100)

**Analysis Scope:**
```typescript
Integration Architecture (50 points):
- Unified context integration (20 pts)
- Organization-scoped flags (20 pts)
- Default-enabled behavior (10 pts)

UI Implementation (30 points):
- Graceful degradation patterns (20 pts)
- Loading state handling (10 pts)

Performance Impact (20 points):
- Single API call inclusion (15 pts)
- No additional requests for flags (5 pts)
```

**Output:** `docs/refactor/[feature]-feature-flags-audit-[timestamp].md`

#### **`/feature-upgrade-audit [feature] role-permissions`**
**Focus:** Role-based access control and permission validation
**Target Score:** 90-95/100 (Notes baseline: 95/100)

**Analysis Scope:**
```typescript
Permission Architecture (40 points):
- Domain interface abstractions (15 pts)
- Infrastructure implementation (15 pts)
- SuperAdmin support (10 pts)

Use Case Integration (30 points):
- Permission checks in all operations (20 pts)
- Proper error handling (10 pts)

UI Enforcement (20 points):
- Permission-based component rendering (15 pts)
- Conditional feature access (5 pts)

Database Security (10 points):
- RLS policy implementation (10 pts)
```

**Output:** `docs/refactor/[feature]-role-permissions-audit-[timestamp].md`

## Multi-Agent Workflow (Comprehensive Audit)

### **Agent 1: Architecture Discovery & Analysis**
**Task:** Deep structural analysis and current state assessment with ultra-comprehensive thinking

**Ultra-Think Analysis Framework:**

#### **1.1 File Structure Deep Scan**
```typescript
// ULTRA-THINK: Systematic directory analysis
const analyzeFileStructure = async () => {
  // Step 1: Map existing architecture layers
  const layers = {
    domain: scanForPatterns(['aggregates/', 'entities/', 'value-objects/', 'services/', 'repositories/', 'events/', 'errors/', 'specifications/']),
    application: scanForPatterns(['use-cases/', 'services/', 'mappers/', 'dto/', 'commands/', 'queries/']),
    infrastructure: scanForPatterns(['persistence/', 'services/', 'composition/', 'providers/']),
    presentation: scanForPatterns(['components/', 'hooks/', 'actions/', 'types/'])
  };

  // Step 2: Analyze layer completeness vs Notes baseline
  const completenessScore = calculateLayerCompleteness(layers, NOTES_BASELINE);
  
  // Step 3: Identify architectural anti-patterns
  const antiPatterns = detectAntiPatterns({
    cyclicDependencies: analyzeDependencyCycles(),
    layerViolations: detectLayerBoundaryViolations(),
    organizationContext: findOrganizationContextLeaks(),
    domainLogicLeakage: detectDomainLogicInPresentationLayer()
  });

  // Step 4: Map file naming conventions and consistency
  const namingAnalysis = analyzeNamingConsistency();
  
  return { layers, completenessScore, antiPatterns, namingAnalysis };
};
```

#### **1.2 Pattern Recognition Deep Dive**
```typescript
// ULTRA-THINK: DDD pattern detection with scoring
const analyzeDDDPatterns = async () => {
  // Aggregate Analysis
  const aggregateAnalysis = {
    discovered: findAggregateRoots(),
    businessInvariants: analyzeBusiness Invariants(),
    domainEvents: mapDomainEvents(),
    encapsulation: scoreEncapsulation(),
    stateConsistency: analyzeStateConsistency()
  };

  // Value Object Analysis  
  const valueObjectAnalysis = {
    immutability: checkImmutability(),
    validation: analyzeValidationLogic(),
    typeSystem: scoreTypeSystemUsage(),
    equalsImplementation: checkEqualsLogic()
  };

  // Domain Service Analysis
  const domainServiceAnalysis = {
    businessLogic: identifyBusinessLogic(),
    statelessness: checkStatelessness(),
    dependencies: mapDomainDependencies(),
    purity: scoreFunctionalPurity()
  };

  // Repository Pattern Analysis
  const repositoryAnalysis = {
    interfaces: findRepositoryInterfaces(),
    implementations: mapImplementations(),
    organizationScoping: checkOrganizationScoping(),
    abstraction: scoreAbstractionLevel()
  };

  return { aggregateAnalysis, valueObjectAnalysis, domainServiceAnalysis, repositoryAnalysis };
};
```

#### **1.3 Performance Pattern Deep Analysis**
```typescript
// ULTRA-THINK: API call pattern analysis with performance scoring
const analyzePerformancePatterns = async () => {
  // API Call Mapping
  const apiCallAnalysis = {
    pageLoadCalls: mapPageLoadAPICalls(),
    contextDuplication: findContextDuplication(),
    unnecessaryRefetches: identifyRefetchPatterns(),
    cacheStrategies: analyzeCacheImplementation()
  };

  // Unified Context Detection
  const unifiedContextAnalysis = {
    existingImplementation: detectUnifiedContextUsage(),
    consolidationOpportunities: identifyConsolidationTargets(),
    performanceGains: calculatePotentialGains(),
    cachingStrategy: analyzeCurrentCaching()
  };

  // Optimistic Updates Analysis
  const optimisticUpdateAnalysis = {
    implementation: findOptimisticUpdates(),
    rollbackHandling: analyzeRollbackLogic(),
    userExperience: scoreUXImprovement(),
    errorBoundaries: mapErrorHandling()
  };

  return { apiCallAnalysis, unifiedContextAnalysis, optimisticUpdateAnalysis };
};
```

#### **1.4 Security Context Deep Scan**
```typescript
// ULTRA-THINK: Security pattern analysis with threat modeling
const analyzeSecurityPatterns = async () => {
  // Organization Context Protection
  const orgContextAnalysis = {
    variableProtection: scanOrganizationIdUsage(),
    eslintCompliance: checkESLintSecurityRules(),
    contextValidation: analyzeValidationPatterns(),
    jwtScoping: verifyJWTImplementation()
  };

  // React Hooks Security
  const hooksSecurityAnalysis = {
    rulesOfHooks: validateHooksUsage(),
    conditionalHooks: findConditionalHookViolations(),
    dependencyArrays: analyzeDependencyStability(),
    infiniteLoops: detectInfiniteLoopRisks()
  };

  // Permission System Analysis
  const permissionAnalysis = {
    roleBasedAccess: mapRoleImplementation(),
    serverSideValidation: checkServerValidation(),
    uiEnforcement: analyzeUIPermissions(),
    superAdminSupport: verifySuperAdminLogic()
  };

  return { orgContextAnalysis, hooksSecurityAnalysis, permissionAnalysis };
};
```

#### **1.5 Dependencies & Integration Mapping**
```typescript
// ULTRA-THINK: Comprehensive dependency analysis
const analyzeDependencies = async () => {
  // External Dependencies
  const externalDeps = {
    libraries: mapExternalLibraries(),
    apiClients: identifyAPIClients(),
    thirdPartyServices: mapThirdPartyIntegrations(),
    securityRisks: assessDependencyRisks()
  };

  // Cross-Domain Dependencies
  const crossDomainDeps = {
    domainCoupling: analyzeDomainCoupling(),
    sharedServices: identifySharedServices(),
    boundaryViolations: detectBoundaryViolations(),
    circularity: findCircularDependencies()
  };

  // Database Schema Analysis
  const databaseAnalysis = {
    rlsPolicies: analyzeRLSImplementation(),
    organizationScoping: checkDatabaseScoping(),
    indexStrategy: analyzeIndexUsage(),
    performanceBottlenecks: identifyQueryBottlenecks()
  };

  return { externalDeps, crossDomainDeps, databaseAnalysis };
};
```

**Ultra-Think Output:** Comprehensive architectural assessment with quantified metrics and specific improvement recommendations

### **Agent 2: Compliance Scoring & Gap Analysis**
**Task:** Score against Notes domain baseline and identify gaps with ultra-comprehensive analysis

**Ultra-Think Scoring Framework:**

#### **2.1 DDD Compliance Deep Assessment**
```typescript
// ULTRA-THINK: Multi-layered DDD scoring with quantified metrics
const assessDDDCompliance = async (architectureData) => {
  // Domain Layer Ultra-Analysis (25 points)
  const domainLayerScore = await analyzeDomainLayer({
    aggregates: {
      businessInvariants: scoreBusinessInvariants(architectureData.aggregates),
      domainEvents: scoreDomainEvents(architectureData.events),
      encapsulation: scoreEncapsulation(architectureData.aggregates),
      stateConsistency: scoreStateConsistency(architectureData.aggregates),
      testCoverage: scoreDomainTestCoverage(architectureData.tests)
    },
    valueObjects: {
      immutability: scoreImmutability(architectureData.valueObjects),
      validation: scoreValidation(architectureData.valueObjects),
      typeSystem: scoreTypeSystemUsage(architectureData.valueObjects),
      equality: scoreEqualityImplementation(architectureData.valueObjects)
    },
    domainServices: {
      businessLogic: scoreBusinessLogicPurity(architectureData.services),
      statelessness: scoreStatelessness(architectureData.services),
      dependencies: scoreDomainDependencies(architectureData.services),
      cohesion: scoreCohesion(architectureData.services)
    },
    errorHandling: {
      domainErrors: scoreDomainErrorImplementation(architectureData.errors),
      severity: scoreErrorSeverity(architectureData.errors),
      context: scoreErrorContext(architectureData.errors)
    }
  });

  // Application Layer Ultra-Analysis (25 points)
  const applicationLayerScore = await analyzeApplicationLayer({
    useCases: {
      cqrsPattern: scoreCQRSImplementation(architectureData.useCases),
      singleResponsibility: scoreSingleResponsibility(architectureData.useCases),
      businessWorkflow: scoreBusinessWorkflow(architectureData.useCases),
      transactionBoundaries: scoreTransactionBoundaries(architectureData.useCases)
    },
    applicationServices: {
      coordination: scoreServiceCoordination(architectureData.appServices),
      domainOrchestration: scoreDomainOrchestration(architectureData.appServices),
      infrastructureAbstraction: scoreInfrastructureAbstraction(architectureData.appServices)
    },
    unifiedContext: {
      implementation: scoreUnifiedContextImplementation(architectureData.context),
      consolidation: scoreAPIConsolidation(architectureData.context),
      caching: scoreCachingStrategy(architectureData.context)
    }
  });

  // Infrastructure Layer Ultra-Analysis (25 points)
  const infrastructureLayerScore = await analyzeInfrastructureLayer({
    repositories: {
      interfaces: scoreRepositoryInterfaces(architectureData.repositories),
      implementations: scoreRepositoryImplementations(architectureData.repositories),
      organizationScoping: scoreOrganizationScoping(architectureData.repositories),
      testability: scoreTestability(architectureData.repositories)
    },
    compositionRoot: {
      dependencyInjection: scoreDependencyInjection(architectureData.composition),
      lifecycle: scoreLifecycleManagement(architectureData.composition),
      configuration: scoreConfiguration(architectureData.composition)
    },
    externalServices: {
      abstraction: scoreExternalServiceAbstraction(architectureData.external),
      resilience: scoreResiliencePatterns(architectureData.external),
      errorHandling: scoreExternalErrorHandling(architectureData.external)
    }
  });

  // Presentation Layer Ultra-Analysis (25 points)
  const presentationLayerScore = await analyzePresentationLayer({
    components: {
      architecture: scoreComponentArchitecture(architectureData.components),
      separation: scoreConcernSeparation(architectureData.components),
      reusability: scoreReusability(architectureData.components)
    },
    hooks: {
      unifiedContext: scoreUnifiedContextUsage(architectureData.hooks),
      performance: scoreHookPerformance(architectureData.hooks),
      security: scoreHookSecurity(architectureData.hooks)
    },
    optimisticUpdates: {
      implementation: scoreOptimisticImplementation(architectureData.optimistic),
      rollback: scoreRollbackHandling(architectureData.optimistic),
      userExperience: scoreUXImpact(architectureData.optimistic)
    }
  });

  return {
    domain: domainLayerScore,
    application: applicationLayerScore,
    infrastructure: infrastructureLayerScore,
    presentation: presentationLayerScore,
    overall: calculateOverallDDDScore([domainLayerScore, applicationLayerScore, infrastructureLayerScore, presentationLayerScore])
  };
};
```

#### **2.2 Performance Deep Assessment**
```typescript
// ULTRA-THINK: Performance analysis with quantified metrics
const assessPerformanceCompliance = async (performanceData) => {
  // API Call Analysis with Baseline Comparison
  const apiCallAnalysis = {
    currentState: {
      pageLoadCalls: countPageLoadAPICalls(performanceData.apiCalls),
      duplicateContexts: identifyDuplicateContexts(performanceData.contexts),
      unnecessaryRefetches: countUnnecessaryRefetches(performanceData.refetches),
      waterfallRequests: identifyWaterfallPatterns(performanceData.apiCalls)
    },
    notesBaseline: {
      pageLoadCalls: 1,
      contextConsolidation: 95,
      cacheHitRate: 85,
      performanceScore: 95
    },
    gap: calculatePerformanceGap(currentState, notesBaseline),
    consolidationOpportunities: identifyConsolidationOpportunities(performanceData)
  };

  // Cache Strategy Analysis
  const cacheAnalysis = {
    implementation: {
      organizationScoping: scoreCacheOrganizationScoping(performanceData.cache),
      invalidation: scoreCacheInvalidation(performanceData.cache),
      coherence: scoreCacheCoherence(performanceData.cache),
      performance: scoreCachePerformance(performanceData.cache)
    },
    strategy: {
      granularity: scoreCacheGranularity(performanceData.cache),
      ttl: scoreTTLStrategy(performanceData.cache),
      eviction: scoreEvictionStrategy(performanceData.cache)
    }
  };

  // Optimistic Updates Analysis
  const optimisticAnalysis = {
    coverage: scoreOptimisticCoverage(performanceData.optimistic),
    implementation: scoreOptimisticImplementation(performanceData.optimistic),
    rollback: scoreRollbackStrategy(performanceData.optimistic),
    userExperience: scoreUXImprovement(performanceData.optimistic)
  };

  return {
    apiCalls: apiCallAnalysis,
    caching: cacheAnalysis,
    optimistic: optimisticAnalysis,
    overallScore: calculatePerformanceScore([apiCallAnalysis, cacheAnalysis, optimisticAnalysis])
  };
};
```

#### **2.3 Security Compliance Deep Assessment**
```typescript
// ULTRA-THINK: Security analysis with threat modeling
const assessSecurityCompliance = async (securityData) => {
  // Organization Context Protection (Critical Security)
  const orgContextSecurity = {
    variableProtection: {
      organizationIdUsage: auditOrganizationIdUsage(securityData.variables),
      eslintCompliance: checkESLintSecurityRules(securityData.eslint),
      removalPrevention: scoreRemovalPrevention(securityData.variables),
      contextValidation: scoreContextValidation(securityData.validation)
    },
    jwtScoping: {
      implementation: scoreJWTImplementation(securityData.jwt),
      tokenValidation: scoreTokenValidation(securityData.jwt),
      scopeEnforcement: scoreScopeEnforcement(securityData.jwt),
      securityHeaders: scoreSecurityHeaders(securityData.headers)
    }
  };

  // React Hooks Security Compliance
  const hooksSecurity = {
    rulesOfHooks: {
      conditionalViolations: findConditionalHookViolations(securityData.hooks),
      loopViolations: findLoopHookViolations(securityData.hooks),
      orderConsistency: scoreHookOrderConsistency(securityData.hooks),
      dependencyStability: scoreDependencyStability(securityData.hooks)
    },
    performanceSecurity: {
      infiniteLoops: detectInfiniteLoopRisks(securityData.hooks),
      memoryLeaks: detectMemoryLeakRisks(securityData.hooks),
      staleClosures: detectStaleClosureRisks(securityData.hooks)
    }
  };

  // Permission Validation Security
  const permissionSecurity = {
    roleBasedAccess: {
      implementation: scoreRoleImplementation(securityData.permissions),
      granularity: scorePermissionGranularity(securityData.permissions),
      enforcement: scorePermissionEnforcement(securityData.permissions),
      bypass: scoreSuperAdminBypass(securityData.permissions)
    },
    serverSideValidation: {
      coverage: scoreServerValidationCoverage(securityData.serverValidation),
      consistency: scoreValidationConsistency(securityData.serverValidation),
      errorHandling: scoreValidationErrorHandling(securityData.serverValidation)
    }
  };

  // Multi-Tenant Security
  const multiTenantSecurity = {
    dataIsolation: {
      rlsPolicies: scoreRLSImplementation(securityData.rls),
      organizationScoping: scoreDataScoping(securityData.scoping),
      crossTenantLeakage: detectCrossTenantLeakage(securityData.isolation)
    },
    cacheIsolation: {
      keyScoping: scoreCacheKeyScoping(securityData.cacheKeys),
      dataIsolation: scoreCacheDataIsolation(securityData.cacheIsolation),
      invalidationSecurity: scoreCacheInvalidationSecurity(securityData.cacheInvalidation)
    }
  };

  return {
    organizationContext: orgContextSecurity,
    hooks: hooksSecurity,
    permissions: permissionSecurity,
    multiTenant: multiTenantSecurity,
    overallScore: calculateSecurityScore([orgContextSecurity, hooksSecurity, permissionSecurity, multiTenantSecurity])
  };
};
```

#### **2.4 Feature Flag Compliance Assessment**
```typescript
// ULTRA-THINK: Feature flag analysis with organization scoping
const assessFeatureFlagCompliance = async (featureFlagData) => {
  const integrationArchitecture = {
    unifiedContextIntegration: {
      consolidation: scoreFeatureFlagConsolidation(featureFlagData.integration),
      apiEfficiency: scoreFeatureFlagAPIEfficiency(featureFlagData.integration),
      caching: scoreFeatureFlagCaching(featureFlagData.integration)
    },
    organizationScoping: {
      implementation: scoreOrganizationScoping(featureFlagData.scoping),
      isolation: scoreFeatureFlagIsolation(featureFlagData.scoping),
      validation: scoreFeatureFlagValidation(featureFlagData.scoping)
    },
    defaultBehavior: {
      enabledByDefault: scoreDefaultEnabledBehavior(featureFlagData.defaults),
      gracefulDegradation: scoreGracefulDegradation(featureFlagData.degradation),
      fallbackStrategy: scoreFallbackStrategy(featureFlagData.fallback)
    }
  };

  const uiImplementation = {
    gracefulDegradation: scoreUIGracefulDegradation(featureFlagData.ui),
    loadingStates: scoreLoadingStateHandling(featureFlagData.ui),
    userFeedback: scoreUserFeedback(featureFlagData.ui)
  };

  return {
    integration: integrationArchitecture,
    ui: uiImplementation,
    overallScore: calculateFeatureFlagScore([integrationArchitecture, uiImplementation])
  };
};
```

#### **2.5 Role Permission Compliance Assessment**
```typescript
// ULTRA-THINK: Permission system analysis with granular scoring
const assessPermissionCompliance = async (permissionData) => {
  const permissionArchitecture = {
    domainInterfaces: {
      abstraction: scorePermissionAbstraction(permissionData.interfaces),
      separation: scorePermissionSeparation(permissionData.interfaces),
      extensibility: scorePermissionExtensibility(permissionData.interfaces)
    },
    infrastructureImplementation: {
      databaseBacked: scoreDatabaseBackedPermissions(permissionData.database),
      performance: scorePermissionPerformance(permissionData.performance),
      caching: scorePermissionCaching(permissionData.caching)
    },
    superAdminSupport: {
      bypassLogic: scoreSuperAdminBypass(permissionData.superAdmin),
      auditLogging: scorePermissionAuditLogging(permissionData.audit),
      securityContext: scoreSuperAdminSecurity(permissionData.superAdminSecurity)
    }
  };

  const useCaseIntegration = {
    coverage: scorePermissionCoverage(permissionData.coverage),
    validation: scorePermissionValidation(permissionData.validation),
    errorHandling: scorePermissionErrorHandling(permissionData.errors),
    consistency: scorePermissionConsistency(permissionData.consistency)
  };

  const uiEnforcement = {
    componentRendering: scorePermissionBasedRendering(permissionData.rendering),
    featureAccess: scoreFeatureAccessControl(permissionData.access),
    userFeedback: scorePermissionUserFeedback(permissionData.feedback)
  };

  return {
    architecture: permissionArchitecture,
    useCases: useCaseIntegration,
    ui: uiEnforcement,
    overallScore: calculatePermissionScore([permissionArchitecture, useCaseIntegration, uiEnforcement])
  };
};
```

**Ultra-Think Output:** Quantified compliance matrix with precise gap identification, risk assessment, and prioritized improvement recommendations

### **Agent 3: Implementation Planning & Task Generation**
**Task:** Create detailed, phase-based implementation plan with ultra-comprehensive strategic thinking

**Ultra-Think Planning Framework:**

#### **3.1 Strategic Phase Analysis & Sequencing**
```typescript
// ULTRA-THINK: Multi-dimensional phase planning with dependency analysis
const createStrategicPhaseSequence = async (complianceData, gapAnalysis) => {
  // Critical Path Analysis
  const criticalPathAnalysis = {
    domainFoundation: {
      priority: calculatePriority(complianceData.domain.gaps),
      blockers: identifyBlockers(complianceData.domain.dependencies),
      riskFactors: assessRiskFactors(complianceData.domain.complexity),
      estimateConfidence: calculateEstimateConfidence(complianceData.domain.uncertainty),
      parallelizationOpportunities: identifyParallelTasks(complianceData.domain.tasks)
    },
    applicationLayer: {
      prerequisiteCompletion: calculatePrerequisiteCompletion(complianceData.application.dependencies),
      unifiedContextComplexity: assessUnifiedContextComplexity(complianceData.application.integration),
      performanceImpact: assessPerformanceImpact(complianceData.application.optimization),
      securityIntegration: assessSecurityIntegration(complianceData.application.security)
    },
    infrastructureSecurityLayer: {
      securityCriticality: assessSecurityCriticality(complianceData.infrastructure.security),
      organizationScopingComplexity: assessScopingComplexity(complianceData.infrastructure.scoping),
      databaseMigrationRisk: assessMigrationRisk(complianceData.infrastructure.database),
      externalIntegrationRisk: assessIntegrationRisk(complianceData.infrastructure.external)
    },
    presentationLayer: {
      uiComplexity: assessUIComplexity(complianceData.presentation.complexity),
      optimisticUpdateImplementation: assessOptimisticComplexity(complianceData.presentation.optimistic),
      permissionUIIntegration: assessPermissionUIComplexity(complianceData.presentation.permissions),
      userExperienceImpact: assessUXImpact(complianceData.presentation.ux)
    }
  };

  // Dynamic Phase Sequencing Based on Risk-Benefit Analysis
  const phaseSequence = optimizePhaseSequence({
    riskMinimization: prioritizeByRisk(criticalPathAnalysis),
    valueDelivery: prioritizeByValue(criticalPathAnalysis),
    dependencyResolution: resolveDependencies(criticalPathAnalysis),
    parallelExecution: identifyParallelPhases(criticalPathAnalysis)
  });

  return { criticalPathAnalysis, phaseSequence };
};
```

#### **3.2 Task Decomposition with Effort Estimation**
```typescript
// ULTRA-THINK: Granular task breakdown with realistic effort modeling
const decomposeImplementationTasks = async (phaseData, notesBaseline) => {
  // Domain Foundation Task Matrix
  const domainFoundationTasks = {
    aggregateCreation: {
      estimatedHours: calculateTaskHours({
        complexity: phaseData.domain.aggregateComplexity,
        businessRules: phaseData.domain.businessRuleCount,
        domainEvents: phaseData.domain.eventCount,
        testCoverage: phaseData.domain.requiredTestCoverage
      }),
      codeTemplates: extractCodeTemplates(notesBaseline.domain.aggregates),
      acceptanceCriteria: generateAcceptanceCriteria(phaseData.domain.requirements),
      qualityGates: defineQualityGates(phaseData.domain.standards),
      dependencies: mapTaskDependencies(phaseData.domain.dependencies)
    },
    valueObjectImplementation: {
      estimatedHours: calculateValueObjectHours(phaseData.domain.valueObjects),
      immutabilityPatterns: extractImmutabilityPatterns(notesBaseline.domain.valueObjects),
      validationTemplates: extractValidationTemplates(notesBaseline.domain.validation),
      typeSystemIntegration: extractTypeSystemPatterns(notesBaseline.domain.types)
    },
    domainEventSystem: {
      estimatedHours: calculateEventSystemHours(phaseData.domain.events),
      eventTemplates: extractEventTemplates(notesBaseline.domain.events),
      publisherPatterns: extractPublisherPatterns(notesBaseline.domain.publishers),
      handlerPatterns: extractHandlerPatterns(notesBaseline.domain.handlers)
    },
    specificationPattern: {
      estimatedHours: calculateSpecificationHours(phaseData.domain.specifications),
      businessRuleTemplates: extractBusinessRuleTemplates(notesBaseline.domain.specifications),
      compositePatterns: extractCompositePatterns(notesBaseline.domain.compositeSpecs),
      validationIntegration: extractValidationIntegration(notesBaseline.domain.specValidation)
    }
  };

  // Application Layer Task Matrix
  const applicationLayerTasks = {
    useCaseImplementation: {
      estimatedHours: calculateUseCaseHours(phaseData.application.useCases),
      cqrsPatterns: extractCQRSPatterns(notesBaseline.application.cqrs),
      commandTemplates: extractCommandTemplates(notesBaseline.application.commands),
      queryTemplates: extractQueryTemplates(notesBaseline.application.queries),
      coordinationPatterns: extractCoordinationPatterns(notesBaseline.application.coordination)
    },
    unifiedContextService: {
      estimatedHours: calculateUnifiedContextHours(phaseData.application.unifiedContext),
      consolidationTemplates: extractConsolidationTemplates(notesBaseline.application.consolidation),
      cachingPatterns: extractCachingPatterns(notesBaseline.application.caching),
      performanceOptimization: extractPerformancePatterns(notesBaseline.application.performance)
    },
    permissionIntegration: {
      estimatedHours: calculatePermissionIntegrationHours(phaseData.application.permissions),
      validationTemplates: extractPermissionValidationTemplates(notesBaseline.application.permissions),
      errorHandlingPatterns: extractPermissionErrorPatterns(notesBaseline.application.permissionErrors),
      superAdminPatterns: extractSuperAdminPatterns(notesBaseline.application.superAdmin)
    }
  };

  // Infrastructure Layer Task Matrix
  const infrastructureLayerTasks = {
    repositoryImplementation: {
      estimatedHours: calculateRepositoryHours(phaseData.infrastructure.repositories),
      interfaceTemplates: extractRepositoryInterfaceTemplates(notesBaseline.infrastructure.interfaces),
      implementationTemplates: extractRepositoryImplementationTemplates(notesBaseline.infrastructure.implementations),
      organizationScopingPatterns: extractScopingPatterns(notesBaseline.infrastructure.scoping)
    },
    compositionRootSetup: {
      estimatedHours: calculateCompositionRootHours(phaseData.infrastructure.composition),
      dependencyInjectionTemplates: extractDITemplates(notesBaseline.infrastructure.di),
      lifecycleManagementPatterns: extractLifecyclePatterns(notesBaseline.infrastructure.lifecycle),
      configurationPatterns: extractConfigurationPatterns(notesBaseline.infrastructure.config)
    },
    securityImplementation: {
      estimatedHours: calculateSecurityImplementationHours(phaseData.infrastructure.security),
      authenticationPatterns: extractAuthPatterns(notesBaseline.infrastructure.auth),
      authorizationTemplates: extractAuthzTemplates(notesBaseline.infrastructure.authz),
      auditingPatterns: extractAuditPatterns(notesBaseline.infrastructure.audit)
    }
  };

  return { domainFoundationTasks, applicationLayerTasks, infrastructureLayerTasks };
};
```

#### **3.3 Risk Assessment & Mitigation Planning**
```typescript
// ULTRA-THINK: Comprehensive risk analysis with mitigation strategies
const assessImplementationRisks = async (implementationPlan, organizationContext) => {
  // Technical Risk Assessment
  const technicalRisks = {
    architecturalComplexity: {
      riskLevel: assessArchitecturalComplexity(implementationPlan.architecture),
      impact: calculateArchitecturalImpact(implementationPlan.architecture),
      probability: calculateArchitecturalProbability(implementationPlan.architecture),
      mitigationStrategies: [
        'Phase-based implementation with validation gates',
        'Proof-of-concept for complex patterns',
        'Code review checkpoints with senior architects',
        'Fallback to simpler implementation if needed'
      ],
      contingencyPlans: generateArchitecturalContingencyPlans(implementationPlan.architecture)
    },
    performanceRegression: {
      riskLevel: assessPerformanceRegressionRisk(implementationPlan.performance),
      impact: calculatePerformanceImpact(implementationPlan.performance),
      mitigationStrategies: [
        'Baseline performance measurement before changes',
        'Incremental rollout with performance monitoring',
        'A/B testing for critical user journeys',
        'Rollback procedures for performance degradation'
      ],
      monitoringStrategy: definePerformanceMonitoring(implementationPlan.performance)
    },
    securityVulnerabilities: {
      riskLevel: assessSecurityRisk(implementationPlan.security),
      impact: calculateSecurityImpact(implementationPlan.security),
      mitigationStrategies: [
        'Security code review for all changes',
        'Automated security testing in CI/CD',
        'Penetration testing after implementation',
        'Security audit with external experts'
      ],
      complianceRequirements: mapComplianceRequirements(implementationPlan.security)
    }
  };

  // Business Risk Assessment
  const businessRisks = {
    userExperienceDisruption: {
      riskLevel: assessUXDisruptionRisk(implementationPlan.userExperience),
      impact: calculateUXImpact(implementationPlan.userExperience),
      mitigationStrategies: [
        'Feature flag gradual rollout',
        'User feedback collection during rollout',
        'Training materials for significant changes',
        'Support team preparation for user questions'
      ],
      rollbackStrategy: defineUXRollbackStrategy(implementationPlan.userExperience)
    },
    dataIntegrity: {
      riskLevel: assessDataIntegrityRisk(implementationPlan.data),
      impact: calculateDataImpact(implementationPlan.data),
      mitigationStrategies: [
        'Database backup before migration',
        'Data validation scripts',
        'Incremental data migration with validation',
        'Data integrity monitoring post-migration'
      ],
      recoveryProcedures: defineDataRecoveryProcedures(implementationPlan.data)
    },
    serviceAvailability: {
      riskLevel: assessAvailabilityRisk(implementationPlan.availability),
      impact: calculateAvailabilityImpact(implementationPlan.availability),
      mitigationStrategies: [
        'Blue-green deployment strategy',
        'Service health monitoring',
        'Automatic failover mechanisms',
        'Maintenance window planning'
      ]
    }
  };

  // Resource Risk Assessment
  const resourceRisks = {
    teamCapacity: {
      riskLevel: assessTeamCapacityRisk(implementationPlan.resources),
      impact: calculateCapacityImpact(implementationPlan.resources),
      mitigationStrategies: [
        'Cross-training team members on DDD patterns',
        'External consultant support for complex areas',
        'Phased implementation to distribute workload',
        'Knowledge transfer sessions'
      ]
    },
    technicalDebt: {
      riskLevel: assessTechnicalDebtRisk(implementationPlan.debt),
      impact: calculateDebtImpact(implementationPlan.debt),
      mitigationStrategies: [
        'Refactoring as part of implementation',
        'Technical debt tracking and prioritization',
        'Code quality gates in CI/CD',
        'Regular architecture review sessions'
      ]
    }
  };

  return { technicalRisks, businessRisks, resourceRisks };
};
```

#### **3.4 Quality Gates & Verification Framework**
```typescript
// ULTRA-THINK: Multi-layered quality assurance with automated verification
const defineQualityGates = async (implementationPlan, qualityStandards) => {
  // Phase-Based Quality Gates
  const qualityGates = {
    domainFoundationGate: {
      entry_criteria: [
        'Business requirements clarified and documented',
        'Domain expert availability confirmed',
        'Development environment setup complete'
      ],
      verification_criteria: [
        'All aggregates pass business invariant tests',
        'Domain events properly implemented and tested',
        'Value objects enforce immutability',
        'Specifications accurately represent business rules',
        'Domain test coverage >= 95%'
      ],
      exit_criteria: [
        'Code review approval from domain expert',
        'All domain tests passing',
        'Performance baseline established',
        'Security review completed'
      ],
      automatedChecks: [
        'Unit test execution',
        'Code coverage verification',
        'Static code analysis',
        'Business rule validation'
      ]
    },
    applicationLayerGate: {
      entry_criteria: [
        'Domain foundation gate passed',
        'Unified context service design approved',
        'Permission system integration planned'
      ],
      verification_criteria: [
        'Use cases implement proper CQRS patterns',
        'Unified context reduces API calls to target',
        'Permission validation integrated in all operations',
        'Application service coordination follows patterns',
        'Integration test coverage >= 90%'
      ],
      exit_criteria: [
        'Performance targets achieved',
        'Security validation complete',
        'Integration tests passing',
        'API consolidation verified'
      ]
    },
    infrastructureSecurityGate: {
      entry_criteria: [
        'Application layer gate passed',
        'Database migration scripts prepared',
        'Security review team available'
      ],
      verification_criteria: [
        'Repository implementations organization-scoped',
        'Composition root properly configured',
        'Security patterns implemented correctly',
        'RLS policies enforced',
        'External integrations secured'
      ],
      exit_criteria: [
        'Security audit passed',
        'Performance benchmarks met',
        'Infrastructure tests passing',
        'Monitoring and alerting configured'
      ]
    },
    presentationLayerGate: {
      entry_criteria: [
        'Infrastructure security gate passed',
        'UI/UX designs approved',
        'Component library prepared'
      ],
      verification_criteria: [
        'Unified context pattern implemented',
        'Optimistic updates working correctly',
        'Permission-based UI rendering functional',
        'User experience meets requirements',
        'E2E test coverage >= 85%'
      ],
      exit_criteria: [
        'User acceptance testing passed',
        'Accessibility requirements met',
        'Performance targets achieved',
        'Cross-browser compatibility verified'
      ]
    }
  };

  return qualityGates;
};
```

#### **3.5 Implementation Timeline & Resource Allocation**
```typescript
// ULTRA-THINK: Resource-optimized timeline with capacity planning
const createImplementationTimeline = async (tasks, risks, resources) => {
  const timelineOptimization = {
    criticalPath: identifyCriticalPath(tasks, dependencies),
    resourceAllocation: optimizeResourceAllocation(tasks, resources),
    riskMitigation: incorporateRiskMitigation(tasks, risks),
    bufferCalculation: calculateTimeBuffers(tasks, uncertainty),
    parallelizationOpportunities: identifyParallelization(tasks, dependencies)
  };

  const phaseTimelines = {
    phase1_domainFoundation: {
      estimatedHours: calculatePhaseHours(tasks.domain, complexity.domain),
      confidence: calculateEstimateConfidence(tasks.domain, historicalData),
      criticalTasks: identifyCriticalTasks(tasks.domain),
      bufferTime: calculateBufferTime(tasks.domain, risks.domain),
      resourceRequirements: calculateResourceRequirements(tasks.domain)
    },
    phase2_applicationLayer: {
      estimatedHours: calculatePhaseHours(tasks.application, complexity.application),
      dependencies: mapPhaseDependencies(tasks.application, phase1),
      parallelTasks: identifyParallelTasks(tasks.application),
      riskMitigation: incorporateRiskMitigation(tasks.application, risks.application)
    },
    phase3_infrastructureSecurity: {
      estimatedHours: calculatePhaseHours(tasks.infrastructure, complexity.infrastructure),
      securityReviewTime: calculateSecurityReviewTime(tasks.infrastructure),
      migrationWindow: calculateMigrationWindow(tasks.infrastructure),
      rollbackTime: calculateRollbackTime(tasks.infrastructure)
    },
    phase4_presentationLayer: {
      estimatedHours: calculatePhaseHours(tasks.presentation, complexity.presentation),
      userTestingTime: calculateUserTestingTime(tasks.presentation),
      iterationCycles: calculateIterationCycles(tasks.presentation),
      performanceOptimization: calculateOptimizationTime(tasks.presentation)
    }
  };

  return { timelineOptimization, phaseTimelines };
};
```

**Ultra-Think Output:** Strategic implementation roadmap with risk-aware planning, resource optimization, and quality assurance framework

## Targeted Dimension Sub-Agents (Ultra-Think Specialists)

### **Sub-Agent Alpha: DDD Compliance Specialist**
**Activation:** When dimension = `ddd`
**Ultra-Think Focus:** Deep Domain-Driven Design architectural analysis

```typescript
// ULTRA-THINK: DDD-specific deep analysis specialist
const dddComplianceUltraAnalysis = async (featureArea) => {
  // Domain Layer Deep Dive
  const domainLayerAnalysis = {
    aggregateAssessment: {
      businessInvariantEnforcement: analyzeBusinessInvariantImplementation({
        entityConsistency: checkEntityStateConsistency(featureArea.domain.entities),
        ruleEncapsulation: assessBusinessRuleEncapsulation(featureArea.domain.aggregates),
        boundaryProtection: validateAggregateBoundaries(featureArea.domain.aggregates),
        invariantTesting: auditInvariantTestCoverage(featureArea.tests.domain)
      }),
      domainEventImplementation: analyzeDomainEventSystem({
        eventPublishing: assessEventPublishingPatterns(featureArea.domain.events),
        eventHandling: auditEventHandlers(featureArea.application.handlers),
        eventSourcing: evaluateEventSourcingOpportunities(featureArea.domain.events),
        crossBoundaryEvents: mapCrossBoundaryEventFlows(featureArea.domain.events)
      }),
      aggregateDesign: evaluateAggregateDesign({
        rootEntityIdentification: validateAggregateRoots(featureArea.domain.aggregates),
        childEntityManagement: assessChildEntityHandling(featureArea.domain.entities),
        valueObjectIntegration: auditValueObjectUsage(featureArea.domain.valueObjects),
        lifecycleManagement: evaluateAggregateLifecycle(featureArea.domain.aggregates)
      })
    },
    valueObjectAnalysis: {
      immutabilityEnforcement: auditImmutabilityPatterns({
        objectCreation: checkValueObjectCreation(featureArea.domain.valueObjects),
        mutationPrevention: validateMutationPrevention(featureArea.domain.valueObjects),
        copySemantics: assessCopySemantics(featureArea.domain.valueObjects),
        equalityImplementation: auditEqualityMethods(featureArea.domain.valueObjects)
      }),
      validationLogic: analyzeValidationImplementation({
        constructorValidation: checkConstructorValidation(featureArea.domain.valueObjects),
        businessRuleValidation: assessBusinessRuleValidation(featureArea.domain.valueObjects),
        formatValidation: auditFormatValidation(featureArea.domain.valueObjects),
        crossFieldValidation: evaluateCrossFieldValidation(featureArea.domain.valueObjects)
      }),
      typeSystemIntegration: evaluateTypeSystemUsage({
        discriminatedUnions: checkDiscriminatedUnionUsage(featureArea.domain.valueObjects),
        brandedTypes: assessBrandedTypeImplementation(featureArea.domain.valueObjects),
        typeGuards: auditTypeGuardImplementation(featureArea.domain.valueObjects),
        serializationSupport: validateSerializationSupport(featureArea.domain.valueObjects)
      })
    },
    specificationPattern: {
      businessRuleImplementation: analyzeSpecificationImplementation({
        ruleEncapsulation: assessBusinessRuleEncapsulation(featureArea.domain.specifications),
        compositeSpecifications: evaluateCompositeSpecifications(featureArea.domain.specifications),
        ruleTestability: auditSpecificationTestability(featureArea.domain.specifications),
        performanceOptimization: assessSpecificationPerformance(featureArea.domain.specifications)
      }),
      domainLanguageAlignment: evaluateDomainLanguageAlignment({
        ubiquitousLanguage: checkUbiquitousLanguageUsage(featureArea.domain.specifications),
        businessExpertCollaboration: assessBusinessExpertInvolvement(featureArea.domain.specifications),
        documentationQuality: auditSpecificationDocumentation(featureArea.domain.specifications),
        exampleBasedTesting: validateExampleBasedTesting(featureArea.tests.specifications)
      })
    }
  };

  // Application Layer CQRS Analysis
  const applicationLayerAnalysis = {
    commandQuerySeparation: analyzeCQRSImplementation({
      commandHandlers: assessCommandHandlerImplementation(featureArea.application.commands),
      queryHandlers: evaluateQueryHandlerImplementation(featureArea.application.queries),
      separationClarity: auditCommandQuerySeparation(featureArea.application),
      sideEffectManagement: analyzeSideEffectHandling(featureArea.application.commands)
    }),
    useCaseOrchestration: evaluateUseCaseImplementation({
      singleResponsibility: checkUseCaseSingleResponsibility(featureArea.application.useCases),
      domainServiceCoordination: assessDomainServiceUsage(featureArea.application.useCases),
      transactionBoundaries: auditTransactionBoundaries(featureArea.application.useCases),
      errorHandlingPatterns: evaluateErrorHandlingPatterns(featureArea.application.useCases)
    }),
    applicationServiceDesign: analyzeApplicationServiceDesign({
      coordinationLogic: assessCoordinationLogic(featureArea.application.services),
      infrastructureAbstraction: auditInfrastructureAbstraction(featureArea.application.services),
      domainLogicLeakage: detectDomainLogicLeakage(featureArea.application.services),
      testabilityDesign: evaluateApplicationServiceTestability(featureArea.application.services)
    })
  };

  // Infrastructure Layer DDD Compliance
  const infrastructureLayerAnalysis = {
    repositoryPattern: analyzeRepositoryImplementation({
      interfaceDesign: assessRepositoryInterfaceDesign(featureArea.domain.repositories),
      implementationQuality: auditRepositoryImplementations(featureArea.infrastructure.repositories),
      aggregateLoading: evaluateAggregateLoadingStrategies(featureArea.infrastructure.repositories),
      performanceOptimization: analyzeRepositoryPerformance(featureArea.infrastructure.repositories)
    }),
    dependencyInversion: evaluateDependencyInversion({
      abstractionQuality: assessAbstractionQuality(featureArea.domain.interfaces),
      implementationDecoupling: auditImplementationDecoupling(featureArea.infrastructure),
      testDoubleSupport: validateTestDoubleSupport(featureArea.tests.infrastructure),
      configurationManagement: analyzeConfigurationManagement(featureArea.infrastructure.config)
    }),
    persistenceIgnorance: analyzePersistenceIgnorance({
      domainModelPurity: checkDomainModelPurity(featureArea.domain),
      ormLeakage: detectORMLeakage(featureArea.domain),
      persistenceAbstraction: evaluatePersistenceAbstraction(featureArea.infrastructure.persistence),
      migrationStrategy: assessMigrationStrategy(featureArea.infrastructure.migrations)
    })
  };

  return {
    domainLayer: domainLayerAnalysis,
    applicationLayer: applicationLayerAnalysis,
    infrastructureLayer: infrastructureLayerAnalysis,
    overallDDDScore: calculateDetailedDDDScore([domainLayerAnalysis, applicationLayerAnalysis, infrastructureLayerAnalysis])
  };
};
```

### **Sub-Agent Beta: Security Compliance Specialist**
**Activation:** When dimension = `security`
**Ultra-Think Focus:** Security threat modeling and compliance analysis

```typescript
// ULTRA-THINK: Security-focused ultra-comprehensive analysis
const securityComplianceUltraAnalysis = async (featureArea) => {
  // Organization Context Protection Ultra-Analysis
  const organizationContextSecurity = {
    variableProtectionAudit: {
      organizationIdUsage: auditOrganizationIdVariables({
        variableScanning: scanForOrganizationIdVariables(featureArea.codebase),
        eslintRuleCompliance: checkESLintOrganizationRules(featureArea.eslint),
        removalDetection: detectOrganizationIdRemoval(featureArea.gitHistory),
        contextPropagation: analyzeContextPropagation(featureArea.components)
      }),
      contextValidationPatterns: analyzeContextValidation({
        validationCoverage: assessValidationCoverage(featureArea.validation),
        errorHandling: auditValidationErrorHandling(featureArea.errorHandling),
        bypassPrevention: checkValidationBypassPrevention(featureArea.validation),
        performanceImpact: measureValidationPerformanceImpact(featureArea.performance)
      }),
      jwtScopingImplementation: analyzeJWTScoping({
        tokenValidation: auditTokenValidation(featureArea.auth.jwt),
        scopeEnforcement: checkScopeEnforcement(featureArea.auth.scopes),
        tokenRefresh: analyzeTokenRefreshSecurity(featureArea.auth.refresh),
        crossOriginProtection: assessCORSImplementation(featureArea.security.cors)
      })
    },
    threatModelingAnalysis: {
      attackSurfaceMapping: mapAttackSurface({
        apiEndpoints: analyzeAPIEndpointSecurity(featureArea.api),
        userInputs: auditUserInputHandling(featureArea.inputs),
        fileUploads: assessFileUploadSecurity(featureArea.uploads),
        externalIntegrations: evaluateExternalIntegrationSecurity(featureArea.integrations)
      }),
      vulnerabilityAssessment: assessVulnerabilities({
        sqlInjection: checkSQLInjectionPrevention(featureArea.database),
        xssProtection: auditXSSPrevention(featureArea.frontend),
        csrfProtection: validateCSRFProtection(featureArea.security.csrf),
        clickjackingPrevention: checkClickjackingPrevention(featureArea.security.headers)
      }),
      dataProtectionCompliance: analyzeDataProtection({
        piiHandling: auditPIIHandling(featureArea.data.pii),
        encryptionUsage: assessEncryptionImplementation(featureArea.security.encryption),
        dataRetention: analyzeDataRetentionPolicies(featureArea.data.retention),
        auditLogging: evaluateAuditLogging(featureArea.logging.audit)
      })
    }
  };

  // React Hooks Security Ultra-Analysis
  const reactHooksSecurity = {
    rulesOfHooksCompliance: {
      conditionalHookDetection: detectConditionalHooks({
        componentScanning: scanComponentsForHookViolations(featureArea.components),
        eslintIntegration: checkESLintHooksRules(featureArea.eslint.hooks),
        automaticFixing: generateHookViolationFixes(featureArea.components),
        performanceImpact: assessHookPerformanceImpact(featureArea.performance.hooks)
      }),
      dependencyArrayAnalysis: analyzeDependencyArrays({
        staleClosureDetection: detectStaleClosures(featureArea.hooks),
        infiniteLoopPrevention: checkInfiniteLoopRisks(featureArea.hooks),
        memoryLeakDetection: detectMemoryLeaks(featureArea.hooks),
        optimizationOpportunities: identifyOptimizationOpportunities(featureArea.hooks)
      }),
      hookSecurityPatterns: analyzeHookSecurityPatterns({
        contextSecurityUsage: auditContextSecurityUsage(featureArea.contexts),
        customHookSecurity: assessCustomHookSecurity(featureArea.customHooks),
        sideEffectManagement: analyzeSideEffectSecurity(featureArea.effects),
        cleanupImplementation: auditCleanupImplementation(featureArea.cleanup)
      })
    },
    performanceSecurityNexus: {
      securityPerformanceTradeoffs: analyzeSecurityPerformanceTradeoffs({
        validationOverhead: measureValidationOverhead(featureArea.validation),
        encryptionPerformance: assessEncryptionPerformance(featureArea.encryption),
        authenticationLatency: measureAuthenticationLatency(featureArea.auth),
        auditingImpact: assessAuditingPerformanceImpact(featureArea.audit)
      }),
      dosProtection: analyzeDOSProtection({
        rateLimiting: checkRateLimitingImplementation(featureArea.rateLimiting),
        resourceLimiting: assessResourceLimiting(featureArea.resources),
        circuitBreakers: evaluateCircuitBreakerImplementation(featureArea.circuitBreakers),
        gracefulDegradation: analyzeGracefulDegradation(featureArea.degradation)
      })
    }
  };

  // Multi-Tenant Security Ultra-Analysis
  const multiTenantSecurity = {
    dataIsolationAnalysis: {
      rlsPolicyAudit: auditRLSPolicies({
        policyCompleteness: checkRLSPolicyCompleteness(featureArea.database.rls),
        policyTesting: auditRLSPolicyTesting(featureArea.tests.rls),
        performanceImpact: assessRLSPerformanceImpact(featureArea.performance.rls),
        bypassPrevention: checkRLSBypassPrevention(featureArea.database.rls)
      }),
      crossTenantLeakageDetection: detectCrossTenantLeakage({
        queryAnalysis: analyzeQueriesForLeakage(featureArea.database.queries),
        cacheKeyValidation: validateCacheKeyIsolation(featureArea.cache.keys),
        fileSystemIsolation: checkFileSystemIsolation(featureArea.files),
        logIsolation: auditLogIsolation(featureArea.logging)
      }),
      organizationScopingVerification: verifyOrganizationScoping({
        apiScopingValidation: validateAPIScopingImplementation(featureArea.api.scoping),
        uiScopingEnforcement: checkUIScopingEnforcement(featureArea.ui.scoping),
        backgroundJobScoping: auditBackgroundJobScoping(featureArea.jobs),
        webhookScoping: validateWebhookScoping(featureArea.webhooks)
      })
    },
    complianceFrameworkAlignment: {
      gdprCompliance: assessGDPRCompliance(featureArea.compliance.gdpr),
      soc2Alignment: evaluateSOC2Alignment(featureArea.compliance.soc2),
      isoStandardsCompliance: checkISOStandardsCompliance(featureArea.compliance.iso),
      industrySpecificCompliance: assessIndustryCompliance(featureArea.compliance.industry)
    }
  };

  return {
    organizationContext: organizationContextSecurity,
    reactHooks: reactHooksSecurity,
    multiTenant: multiTenantSecurity,
    overallSecurityScore: calculateDetailedSecurityScore([organizationContextSecurity, reactHooksSecurity, multiTenantSecurity])
  };
};
```

### **Sub-Agent Gamma: Unified Context Performance Specialist**
**Activation:** When dimension = `unified-context`
**Ultra-Think Focus:** API consolidation and performance optimization

```typescript
// ULTRA-THINK: Performance-focused ultra-detailed analysis
const unifiedContextPerformanceUltraAnalysis = async (featureArea) => {
  // API Call Consolidation Ultra-Analysis
  const apiConsolidationAnalysis = {
    currentStateMapping: {
      apiCallInventory: inventoryAPICalls({
        pageLoadCalls: mapPageLoadAPICalls(featureArea.pages),
        componentCalls: analyzeComponentAPICalls(featureArea.components),
        hookCalls: auditHookAPICalls(featureArea.hooks),
        contextCalls: mapContextAPICalls(featureArea.contexts)
      }),
      duplicationAnalysis: analyzeDuplication({
        contextDuplication: detectContextDuplication(featureArea.contexts),
        dataDuplication: identifyDataDuplication(featureArea.data),
        requestDuplication: analyzeRequestDuplication(featureArea.requests),
        cacheMissPatterns: identifyCacheMissPatterns(featureArea.cache)
      }),
      waterfallDetection: detectWaterfallRequests({
        dependencyChaining: analyzeDependencyChaining(featureArea.dependencies),
        sequentialRequests: identifySequentialRequests(featureArea.requests),
        blockedRequests: findBlockedRequests(featureArea.blocking),
        criticalPathAnalysis: analyzeCriticalPath(featureArea.performance)
      })
    },
    consolidationStrategy: {
      unificationOpportunities: identifyUnificationOpportunities({
        contextMerging: analyzeContextMergingOpportunities(featureArea.contexts),
        batchingPotential: assessBatchingPotential(featureArea.requests),
        prefetchingStrategy: developPrefetchingStrategy(featureArea.prefetch),
        cacheOptimization: optimizeCacheStrategy(featureArea.cache)
      }),
      performanceProjections: projectPerformanceGains({
        apiCallReduction: calculateAPICallReduction(featureArea.consolidation),
        bandwidthSavings: estimateBandwidthSavings(featureArea.bandwidth),
        latencyImprovement: projectLatencyImprovement(featureArea.latency),
        userExperienceImpact: calculateUXImpact(featureArea.ux)
      }),
      implementationComplexity: assessImplementationComplexity({
        technicalComplexity: evaluateTechnicalComplexity(featureArea.technical),
        businessLogicImpact: assessBusinessLogicImpact(featureArea.business),
        testingRequirements: calculateTestingRequirements(featureArea.testing),
        migrationStrategy: developMigrationStrategy(featureArea.migration)
      })
    }
  };

  // Caching Strategy Ultra-Analysis
  const cachingStrategyAnalysis = {
    cacheArchitectureAssessment: {
      organizationScopingImplementation: analyzeCacheOrganizationScoping({
        keyScopingPatterns: auditCacheKeyScopingPatterns(featureArea.cache.keys),
        dataIsolationVerification: verifyCacheDataIsolation(featureArea.cache.isolation),
        invalidationScoping: analyzeCacheInvalidationScoping(featureArea.cache.invalidation),
        performanceImpact: measureCacheScopingPerformance(featureArea.cache.performance)
      }),
      invalidationStrategy: analyzeCacheInvalidationStrategy({
        invalidationTriggers: mapInvalidationTriggers(featureArea.cache.triggers),
        granularityOptimization: optimizeInvalidationGranularity(featureArea.cache.granularity),
        cascadingInvalidation: analyzeCascadingInvalidation(featureArea.cache.cascading),
        performanceOptimization: optimizeInvalidationPerformance(featureArea.cache.optimization)
      }),
      cacheCoherenceManagement: manageCacheCoherence({
        consistencyModels: analyzeCacheConsistencyModels(featureArea.cache.consistency),
        conflictResolution: implementConflictResolution(featureArea.cache.conflicts),
        synchronizationStrategy: developSynchronizationStrategy(featureArea.cache.sync),
        distributedCacheManagement: manageDistributedCache(featureArea.cache.distributed)
      })
    },
    performanceOptimization: {
      cacheHitRateOptimization: optimizeCacheHitRate({
        accessPatternAnalysis: analyzeAccessPatterns(featureArea.cache.access),
        prefetchingStrategy: implementPrefetchingStrategy(featureArea.cache.prefetch),
        cacheSizeOptimization: optimizeCacheSize(featureArea.cache.size),
        evictionPolicyTuning: tuneEvictionPolicy(featureArea.cache.eviction)
      }),
      cachePerformanceMonitoring: implementCachePerformanceMonitoring({
        metricsCollection: collectCacheMetrics(featureArea.cache.metrics),
        performanceAlerting: setupPerformanceAlerting(featureArea.cache.alerts),
        automaticOptimization: implementAutomaticOptimization(featureArea.cache.auto),
        capacityPlanning: planCacheCapacity(featureArea.cache.planning)
      })
    }
  };

  // Optimistic Updates Ultra-Analysis
  const optimisticUpdatesAnalysis = {
    optimisticUpdateImplementation: {
      updateStrategy: analyzeOptimisticUpdateStrategy({
        operationCoverage: assessOptimisticOperationCoverage(featureArea.optimistic.operations),
        rollbackComplexity: evaluateRollbackComplexity(featureArea.optimistic.rollback),
        conflictResolution: implementConflictResolution(featureArea.optimistic.conflicts),
        userFeedbackIntegration: integrateUserFeedback(featureArea.optimistic.feedback)
      }),
      rollbackMechanisms: implementRollbackMechanisms({
        automaticRollback: implementAutomaticRollback(featureArea.optimistic.autoRollback),
        manualRollback: provideManualRollback(featureArea.optimistic.manualRollback),
        partialRollback: implementPartialRollback(featureArea.optimistic.partialRollback),
        rollbackNotification: implementRollbackNotification(featureArea.optimistic.notification)
      }),
      userExperienceOptimization: optimizeUserExperience({
        loadingStates: optimizeLoadingStates(featureArea.optimistic.loading),
        errorHandling: enhanceErrorHandling(featureArea.optimistic.errors),
        successFeedback: improveSuccessFeedback(featureArea.optimistic.success),
        performanceFeedback: providePerformanceFeedback(featureArea.optimistic.performance)
      })
    },
    optimisticUpdateTesting: {
      scenarioTesting: implementScenarioTesting(featureArea.optimistic.scenarios),
      errorConditionTesting: testErrorConditions(featureArea.optimistic.errorTesting),
      performanceTesting: conductPerformanceTesting(featureArea.optimistic.performanceTesting),
      usabilityTesting: performUsabilityTesting(featureArea.optimistic.usabilityTesting)
    }
  };

  return {
    apiConsolidation: apiConsolidationAnalysis,
    cachingStrategy: cachingStrategyAnalysis,
    optimisticUpdates: optimisticUpdatesAnalysis,
    overallPerformanceScore: calculateDetailedPerformanceScore([apiConsolidationAnalysis, cachingStrategyAnalysis, optimisticUpdatesAnalysis])
  };
};
```

**Ultra-Think Sub-Agent Coordination:** When targeted dimensions are requested, the main agents delegate to these specialists for ultra-detailed analysis, ensuring comprehensive coverage while maintaining focus on specific architectural concerns.

## Description

This command performs a comprehensive multi-agent evaluation of a specified feature area and generates detailed implementation plans to upgrade it to enterprise standards matching the Notes domain baseline.

## Workflow

1. **Architecture Discovery**: Analyze current feature area structure
2. **Compliance Assessment**: Evaluate against baseline standards
3. **Gap Analysis**: Identify specific areas needing improvement
4. **Implementation Planning**: Create detailed, actionable upgrade plan
5. **Task Generation**: Provide implementable tasks with code examples
6. **Documentation**: Generate comprehensive upgrade documentation

## Examples

```
/feature-upgrade-audit tts
/feature-upgrade-audit image-generator
/feature-upgrade-audit dam
/feature-upgrade-audit chatbot-widget
/feature-upgrade-audit auth
```

## Evaluation Dimensions

### 1. 🏗️ **DDD Compliance**
- **Domain Layer**: Aggregates, entities, value objects, services
- **Application Layer**: Use cases, services, mappers
- **Infrastructure Layer**: Repositories, external integrations
- **Presentation Layer**: Components, hooks, actions
- **Layer Boundaries**: Dependency direction compliance

### 2. 🚀 **Unified Context Pattern**
- **Performance**: API call consolidation (3+ → 1)
- **Architecture**: Single context service pattern
- **Caching**: Intelligent caching with invalidation
- **Optimistic Updates**: Instant UI feedback
- **Security**: Organization context validation

### 3. 🔒 **Security Guidelines**
- **Organization Variables**: Security-critical variable protection
- **React Hooks Rules**: Proper hook compliance
- **Multi-Tenant Isolation**: JWT-based organization scoping
- **Permission Validation**: Role-based access control
- **Error Handling**: Secure error patterns

### 4. 🎯 **Feature Flags**
- **Organization-Scoped**: Feature flags per organization
- **Unified Integration**: Feature flags in unified context
- **Graceful Degradation**: UI handling when disabled
- **Performance**: Single API call inclusion

### 5. 👥 **Role-Based Permissions**
- **Domain Interface**: Clean permission abstractions
- **Infrastructure Implementation**: Database-backed permissions
- **Use Case Validation**: Permission checks in all operations
- **UI Enforcement**: Conditional rendering based on roles
- **SuperAdmin Support**: System administrator bypasses

## Output Format

### **Comprehensive Audit Output (Default)**

#### 📊 **Executive Summary**
```typescript
Feature: [Feature Name]
Overall Score: 67/100 → Target: 95/100 (Gap: 28 points)
Priority Level: HIGH PRIORITY
Implementation Time: 52-88 hours (6.5-11 days)
Compliance Status: MAJOR UPGRADE REQUIRED

Business Impact:
- Performance: 3+ API calls → 1 API call (70% reduction)
- Security: 5 critical security gaps identified
- Maintainability: 15 architectural improvements needed
- User Experience: Optimistic updates + faster page loads
```

### **Targeted Dimension Output Examples**

#### **DDD Audit** (`/feature-upgrade-audit dam ddd`)
```typescript
Feature: DAM (Digital Asset Management)
Dimension: DDD Architecture Compliance
Current Score: 45/100 → Target: 95/100 (Gap: 50 points)
Priority Level: CRITICAL
Implementation Time: 24-32 hours

Domain Layer Assessment (18/40 points):
❌ Aggregates: 3/10 (Missing business invariants, no domain events)
❌ Domain Events: 0/10 (Not implemented)
❌ Value Objects: 5/10 (Basic implementation, missing validation)
❌ Specifications: 0/10 (Business rules scattered across layers)

Application Layer Assessment (15/30 points):
⚠️ Use Cases: 8/10 (Present but not following CQRS)
❌ Application Services: 2/10 (Direct database access)
⚠️ Transaction Boundaries: 5/10 (Basic implementation)

Infrastructure Layer Assessment (8/20 points):
❌ Repositories: 3/10 (No interfaces, direct ORM usage)
❌ Composition Root: 0/10 (No dependency injection)

Presentation Layer Assessment (4/10 points):
⚠️ Component Architecture: 4/10 (Mixed concerns)

CRITICAL ACTIONS REQUIRED:
1. Create AssetAggregate with domain events
2. Implement value objects for type safety
3. Add specifications for business rules
4. Create repository interfaces
5. Implement composition root

Recommended Phase: Start with Phase 1 (Domain Foundation)
```

#### **Security Audit** (`/feature-upgrade-audit dam security`)
```typescript
Feature: DAM (Digital Asset Management)
Dimension: Security Compliance
Current Score: 60/100 → Target: 98/100 (Gap: 38 points)
Priority Level: CRITICAL

Organization Context Protection (20/40 points):
❌ organizationId Variables: 5/15 (Some removed in ESLint fixes)
⚠️ Context Validation: 10/15 (Partial implementation)
⚠️ JWT-based Scoping: 5/10 (Basic implementation)

React Hooks Compliance (15/30 points):
❌ Hooks Before Conditionals: 5/15 (Multiple violations found)
⚠️ Stable Dependencies: 8/10 (Some infinite loop risks)
⚠️ No Hooks in Loops: 2/5 (Found 3 violations)

Permission Validation (15/20 points):
⚠️ Role-based Access: 8/10 (Basic implementation)
⚠️ Server-side Validation: 7/10 (Inconsistent patterns)

Multi-Tenant Security (10/10 points):
✅ Database RLS: 5/5 (Properly implemented)
✅ Cache Keys: 5/5 (Organization-scoped)

CRITICAL SECURITY FIXES:
1. Restore organizationId variables removed by ESLint
2. Fix React hooks violations in AssetList.tsx
3. Implement stable useCallback dependencies
4. Add server-side permission validation
5. Review all context validation patterns

Recommended Phase: Immediate security fixes before other work
```

#### **Unified Context Audit** (`/feature-upgrade-audit dam unified-context`)
```typescript
Feature: DAM (Digital Asset Management)
Dimension: Unified Context Performance
Current Score: 25/100 → Target: 90/100 (Gap: 65 points)
Priority Level: HIGH

API Call Consolidation (5/40 points):
❌ Current API Calls: 6+ calls on page load (Target: 1)
❌ Unified Service: 0/15 (Not implemented)
❌ Single Server Action: 0/15 (Multiple actions used)

Cache Strategy (10/30 points):
❌ Organization-scoped Caching: 0/15 (No caching implemented)
⚠️ Cache Invalidation: 10/15 (Basic mutation handling)

Optimistic Updates (5/20 points):
❌ Instant UI Feedback: 0/10 (All operations wait for server)
⚠️ Rollback Handling: 5/10 (Basic error handling)

Performance Measurement (5/10 points):
⚠️ API Reduction: 0/5 (No measurement)
⚠️ Page Load: 5/5 (Current baseline measured)

PERFORMANCE IMPROVEMENTS NEEDED:
1. Create DamUnifiedContextService
2. Consolidate 6+ API calls to 1
3. Implement organization-scoped caching
4. Add optimistic updates for asset operations
5. Measure and track performance improvements

Expected Performance Gain: 75-80% API call reduction
Recommended Phase: Phase 2 (Application Layer)
```

#### **Feature Flags Audit** (`/feature-upgrade-audit dam feature-flags`)
```typescript
Feature: DAM (Digital Asset Management)
Dimension: Feature Flag Integration
Current Score: 75/100 → Target: 95/100 (Gap: 20 points)
Priority Level: MEDIUM

Integration Architecture (35/50 points):
⚠️ Unified Context: 15/20 (Basic flag checking)
✅ Organization-scoped: 20/20 (Properly scoped)
❌ Default Behavior: 0/10 (Missing default-enabled logic)

UI Implementation (25/30 points):
✅ Graceful Degradation: 20/20 (Feature disabled UI works)
⚠️ Loading States: 5/10 (Basic loading implementation)

Performance Impact (15/20 points):
⚠️ Single API Call: 10/15 (Flag checks in separate calls)
✅ No Additional Requests: 5/5 (No redundant flag requests)

FEATURE FLAG IMPROVEMENTS:
1. Add default-enabled behavior (dam_enabled !== false)
2. Integrate flags into unified context service
3. Improve loading state handling
4. Consolidate flag checks into single API call

Implementation Time: 4-6 hours
Recommended Phase: Phase 2 (Application Layer)
```

#### **Role Permissions Audit** (`/feature-upgrade-audit dam role-permissions`)
```typescript
Feature: DAM (Digital Asset Management)
Dimension: Role-Based Permissions
Current Score: 70/100 → Target: 95/100 (Gap: 25 points)
Priority Level: HIGH

Permission Architecture (25/40 points):
⚠️ Domain Interfaces: 10/15 (Basic IPermissionService)
⚠️ Infrastructure: 10/15 (Partial implementation)
⚠️ SuperAdmin Support: 5/10 (Basic override logic)

Use Case Integration (20/30 points):
⚠️ Permission Checks: 15/20 (Missing in some operations)
⚠️ Error Handling: 5/10 (Generic error messages)

UI Enforcement (15/20 points):
⚠️ Component Rendering: 10/15 (Basic role checks)
⚠️ Feature Access: 5/5 (Conditional access working)

Database Security (10/10 points):
✅ RLS Policies: 10/10 (Properly implemented)

PERMISSION IMPROVEMENTS:
1. Complete permission checks in all asset operations
2. Improve SuperAdmin bypass logic
3. Add granular permission error messages
4. Enhance UI permission enforcement
5. Add permission-based feature rendering

Implementation Time: 12-16 hours
Recommended Phase: Phase 3 (Infrastructure & Security)
```

### 📋 **Detailed Assessment**

#### **Current State Analysis**
```
✅ **Strengths**
- [List current good implementations]

⚠️ **Issues Identified**
- [List problems and gaps]

🔴 **Critical Problems**
- [List blocking issues requiring immediate attention]
```

#### **Dimension Scores**
| Dimension | Current Score | Target Score | Gap | Priority |
|-----------|---------------|--------------|-----|----------|
| DDD Compliance | X/10 | 9/10 | Y | HIGH |
| Unified Context | X/10 | 9/10 | Y | HIGH |
| Security Guidelines | X/10 | 10/10 | Y | CRITICAL |
| Feature Flags | X/10 | 9/10 | Y | MEDIUM |
| Role Permissions | X/10 | 9/10 | Y | HIGH |

### 🎯 **Implementation Plan**

#### **Phase 1: Foundation (Critical)**
**Estimated Time**: X hours
**Dependencies**: None

```typescript
// Example code structure for implementation
```

**Tasks:**
- [ ] **[TASK-001]** Create domain layer structure
  - **File**: `lib/[feature]/domain/aggregates/[Feature]Aggregate.ts`
  - **Description**: Implement aggregate root with business invariants
  - **Acceptance Criteria**: 
    - Aggregate encapsulates business rules
    - Domain events published for state changes
    - Proper validation and error handling
  - **Code Template**: [Detailed implementation example]

#### **Phase 2: Application Layer (High Priority)**
**Estimated Time**: X hours  
**Dependencies**: Phase 1 complete

**Tasks:**
- [ ] **[TASK-002]** Implement use cases following CQRS pattern
- [ ] **[TASK-003]** Create unified context service
- [ ] **[TASK-004]** Add permission validation layer

#### **Phase 3: Infrastructure & Security (High Priority)**
**Estimated Time**: X hours
**Dependencies**: Phase 1, 2 complete

**Tasks:**
- [ ] **[TASK-005]** Implement repository with organization scoping
- [ ] **[TASK-006]** Add feature flag integration
- [ ] **[TASK-007]** Create permission service implementation

#### **Phase 4: Presentation Layer (Medium Priority)**
**Estimated Time**: X hours
**Dependencies**: Phase 1, 2, 3 complete

**Tasks:**
- [ ] **[TASK-008]** Convert to unified context pattern
- [ ] **[TASK-009]** Add optimistic updates
- [ ] **[TASK-010]** Implement permission-based UI

#### **Phase 5: Testing & Documentation (Low Priority)**
**Estimated Time**: X hours
**Dependencies**: All previous phases

**Tasks:**
- [ ] **[TASK-011]** Add comprehensive test coverage
- [ ] **[TASK-012]** Update documentation
- [ ] **[TASK-013]** Performance optimization

### 📚 **Reference Implementation**

#### **Notes Domain Baseline**
The implementation should match the excellence demonstrated in the Notes domain:

**File Structure Reference:**
```
lib/[feature]/
├── domain/
│   ├── aggregates/         # Business logic encapsulation
│   ├── entities/           # Domain entities
│   ├── value-objects/      # Immutable domain concepts
│   ├── services/           # Domain services
│   ├── repositories/       # Repository interfaces
│   ├── events/             # Domain events
│   ├── errors/             # Domain-specific errors
│   └── specifications/     # Business rules
├── application/
│   ├── use-cases/          # Application operations (CQRS)
│   ├── services/           # Application coordination
│   ├── mappers/            # Data transformation
│   └── dto/                # Data transfer objects
├── infrastructure/
│   ├── persistence/        # Database implementations
│   ├── services/           # External service implementations
│   └── composition/        # Dependency injection
└── presentation/
    ├── components/         # React components
    ├── hooks/              # React hooks
    ├── actions/            # Server actions
    └── types/              # Presentation types
```

#### **Security Patterns**
```typescript
// Example: Proper organization context validation
export function FeatureComponent({ organizationId }: Props) {
  // ✅ ALL HOOKS CALLED FIRST - React's Rules of Hooks
  const { activeOrganizationId, user } = useFeatureUnifiedContext();

  // ✅ Security validation AFTER all hooks
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }

  return <SecureContent />;
}
```

#### **Unified Context Pattern**
```typescript
// Example: Unified context service structure
export class FeatureUnifiedContextService {
  async getUnifiedContext(): Promise<FeatureValidationResult> {
    // Single API call consolidating:
    // - User authentication
    // - Organization context
    // - Feature flags
    // - Permissions
    // - Feature-specific data
  }
}
```

### 🔍 **Quality Gates**

#### **Pre-Implementation Checklist**
- [ ] Baseline documentation reviewed
- [ ] Current architecture understood
- [ ] Dependencies identified
- [ ] Team capacity confirmed

#### **Implementation Checkpoints**
- [ ] **Phase 1 Gate**: Domain layer passes DDD compliance check
- [ ] **Phase 2 Gate**: Use cases implement proper permission validation
- [ ] **Phase 3 Gate**: Infrastructure layer handles organization scoping
- [ ] **Phase 4 Gate**: UI implements unified context pattern
- [ ] **Phase 5 Gate**: Full feature passes security audit

#### **Completion Criteria**
- [ ] All tasks completed and verified
- [ ] Security audit passes (95+ score)
- [ ] DDD compliance verified (90+ score)
- [ ] Performance benchmarks met (single API call)
- [ ] Documentation updated

### 📖 **Implementation Guidelines**

#### **Key Principles**
1. **Security First**: All implementations must pass security guidelines
2. **Performance Optimization**: Unified context pattern for API consolidation
3. **DDD Compliance**: Proper layer separation and dependency direction
4. **Role-Based Access**: Granular permission validation
5. **Feature Flag Integration**: Organization-scoped feature control

#### **Code Quality Standards**
- Follow ESLint security guidelines
- Implement proper TypeScript typing
- Add comprehensive error handling
- Include security audit logging
- Follow React Hooks Rules

#### **Testing Requirements**
- Unit tests for domain logic
- Integration tests for use cases
- Security validation tests
- Performance benchmark tests
- E2E tests for critical flows

### 🚀 **Success Metrics**

#### **Technical Metrics**
- **API Calls**: Reduce from 3+ to 1 (unified context)
- **Security Score**: Achieve 95+ compliance
- **DDD Score**: Achieve 90+ compliance
- **Performance**: <100ms initial load
- **Test Coverage**: >90% for critical paths

#### **Business Metrics**
- **User Experience**: Faster page loads
- **Security**: Zero permission bypass vulnerabilities
- **Maintainability**: Clear architecture boundaries
- **Scalability**: Organized feature flag management

---

This command provides a comprehensive evaluation framework that can be used across all feature areas to achieve enterprise-grade implementation standards matching the Notes domain baseline.

## Output File Management

### **Audit Report Location**
```
docs/refactor/[feature-area]-upgrade-audit-[timestamp].md
```

### **Implementation Plan Location**
```
docs/refactor/[feature-area]-implementation-plan-[timestamp].md
```

### **Example Output Files**
```
docs/refactor/tts-upgrade-audit-2025-01-21T14-30-15-123Z.md
docs/refactor/tts-implementation-plan-2025-01-21T14-30-15-123Z.md
docs/refactor/image-generator-upgrade-audit-2025-01-21T14-35-22-456Z.md
docs/refactor/image-generator-implementation-plan-2025-01-21T14-35-22-456Z.md
```

### **File Structure**
- **Audit Report**: Comprehensive analysis with scores and gap identification
- **Implementation Plan**: Detailed task breakdown with code templates
- **Both files cross-reference each other for easy navigation

## Implementation

When this command is used, I will:

1. **Discover & Analyze**: Scan the specified feature area structure
2. **Evaluate**: Score against all five dimensions
3. **Plan**: Create detailed phase-by-phase implementation plan
4. **Generate Files**: Create both audit report and implementation plan files
5. **Cross-Reference**: Link documents for easy navigation
6. **Estimate**: Provide realistic time and effort estimates
7. **Guide**: Offer specific code examples and patterns

### **File Generation Process**
1. **Create audit report**: `docs/refactor/[feature-area]-upgrade-audit-[timestamp].md`
2. **Generate implementation plan**: `docs/refactor/[feature-area]-implementation-plan-[timestamp].md`
3. **Add cross-references**: Each file links to the other
4. **Provide file paths**: Display created file locations to user

The output will be detailed enough for implementation in a new session while being actionable for immediate development work.