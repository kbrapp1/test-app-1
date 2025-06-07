# Generic Module Audit Prompt Template

**PURPOSE:** Universal audit prompt template for evaluating any feature module against DDD principles, Golden Rule compliance, and performance optimization opportunities.

---

## 🔍 Generic Module Audit Prompt

```
I need you to perform a comprehensive audit of the {MODULE_NAME} module against Golden Rule DDD guidelines, architectural best practices, and performance optimization opportunities.

**MODULE TO AUDIT:** lib/{module-name}/
**FOCUS AREAS:** DDD layer adherence, performance optimization, code quality, Golden Rule compliance

**AUDIT REQUIREMENTS:**

### 1. DDD Layer Architecture Compliance
**Check for violations:**
- [ ] Domain layer importing from infrastructure/application/presentation
- [ ] Application layer importing from infrastructure/presentation  
- [ ] Infrastructure layer importing from presentation
- [ ] Cross-domain imports (importing from other module infrastructures)
- [ ] Missing abstractions/interfaces in application layer
- [ ] Business logic in wrong layers

**Validate layer structure:**
- [ ] Domain: entities, value-objects, repositories (interfaces), services, events
- [ ] Application: use-cases, services, dto, actions, commands, queries, mappers
- [ ] Infrastructure: persistence, providers, storage, external integrations
- [ ] Presentation: components, hooks, types (UI-specific)

### 2. Golden Rule Compliance Check
**File Size & Responsibility:**
- [ ] Any files over 200-250 lines (require refactoring)
- [ ] Components with multiple responsibilities
- [ ] Single responsibility principle violations
- [ ] DRY principle violations (duplicate code patterns)

**Code Quality:**
- [ ] Console.log statements in production code
- [ ] Missing error handling patterns
- [ ] Outdated patterns or deprecated code
- [ ] Test coverage for major functionality

### 3. Performance Optimization Opportunities
**React Query & Caching:**
- [ ] Missing staleTime/gcTime configuration
- [ ] Unoptimized refetch behavior
- [ ] Excessive network requests
- [ ] Missing query deduplication/batching
- [ ] No cache warming strategies

**Component Performance:**
- [ ] Missing React.memo on expensive components
- [ ] Heavy computations not memoized (useMemo/useCallback)
- [ ] Event handlers recreated on every render
- [ ] Large lists without virtual scrolling
- [ ] Missing component-level optimizations

**Network & Assets:**
- [ ] No progressive loading strategies
- [ ] Missing image optimization (WebP, sizing)
- [ ] No preloading or lazy loading
- [ ] Excessive API calls or polling
- [ ] Missing request deduplication

**Memory Management:**
- [ ] No cache size limits or cleanup
- [ ] Missing AbortController patterns
- [ ] Event listener cleanup issues
- [ ] Memory leak patterns in hooks/components

**Bundle Size:**
- [ ] Large components loaded immediately
- [ ] Missing code splitting opportunities
- [ ] Barrel exports preventing tree shaking
- [ ] Unused code or imports

### 4. Architecture & Integration Issues
**Service Integration:**
- [ ] Direct infrastructure dependencies in use cases
- [ ] Missing dependency injection patterns
- [ ] Tight coupling between layers
- [ ] Hard-coded external service calls

**Data Flow:**
- [ ] DTOs not used at layer boundaries
- [ ] Domain entities exposed to presentation
- [ ] Direct database access from application layer
- [ ] Missing data transformation patterns

### 5. Testing & Quality Assurance
**Test Coverage:**
- [ ] Missing tests for critical business logic
- [ ] No integration tests for use cases
- [ ] Missing error scenario testing
- [ ] Performance regression test gaps

**Code Organization:**
- [ ] Unclear naming conventions
- [ ] Missing documentation for complex logic
- [ ] Inconsistent patterns across similar components
- [ ] Architectural decision documentation

### 6. Security & Privacy Review
**Security & Privacy:**
- [ ] Proper input validation and DTO schema enforcement
- [ ] No hard-coded secrets; use environment variables for sensitive config
- [ ] Encryption in transit (TLS) and at rest where applicable
- [ ] Access control and authorization boundaries enforced
- [ ] Compliance considerations (e.g., GDPR, HIPAA) and data protection measures

**DELIVERABLES REQUESTED:**

### Audit Report Format:
1. **Critical Violations** (🚨 Priority 1 - Breaks Architecture; Must fix before next release (<24h))
   - List specific DDD layer violations with file paths
   - Identify cross-domain imports and tight coupling
   - Note any fundamental architectural breaks

2. **High-Impact Performance Issues** (🔥 Priority 2 - Major Performance Impact; Address in next sprint)
   - React Query optimization opportunities
   - Component performance bottlenecks
   - Network and caching inefficiencies
   - Memory management issues

3. **Code Quality Issues** (⚠️ Priority 3 - Code Quality & Maintainability; Plan for next 1-2 sprints)
   - File size violations (>250 lines)
   - Single responsibility violations
   - Missing error handling
   - Code duplication patterns

4. **Optimization Opportunities** (⚡ Priority 4 - Performance Enhancements; Backlog as future improvements)
   - Bundle size reduction opportunities
   - Advanced performance features
   - Developer experience improvements

### Specific Analysis for Each Layer:

**Domain Layer Analysis:**
- Check all imports - should have ZERO external dependencies
- Validate entities are pure business logic
- Ensure repository interfaces (not implementations)
- Check value objects are immutable
- Verify domain services contain only business rules

**Application Layer Analysis:**
- Check for direct infrastructure imports
- Validate use cases orchestrate domain objects only
- Ensure DTOs are used for external boundaries
- Check for proper dependency injection patterns
- Validate command/query separation

**Infrastructure Layer Analysis:**
- Check repository implementations
- Validate external service integrations
- Check database-specific logic isolation
- Ensure proper error handling for external calls
- Validate configuration management

**Presentation Layer Analysis:**
- Check React Query usage and configuration
- Validate component performance patterns
- Check hook organization and responsibilities
- Ensure proper error boundaries
- Validate responsive design patterns
- Verify accessibility compliance (ARIA, keyboard navigation, color contrast, semantic HTML)

**VALIDATION CRITERIA:**
- Provide specific file paths for each violation
- Include severity assessment (Critical/High/Medium/Low)
- Estimate performance impact percentages where possible
- Suggest specific refactoring approaches
- Maintain backward compatibility in recommendations

**OUTPUT FORMAT:**
Please structure your response as:
1. Executive Summary (compliance score, major issues)
2. Critical Violations (immediate fixes needed)
3. Performance Optimization Opportunities (with impact estimates)
4. Refactoring Recommendations (prioritized action items)
5. Implementation Roadmap (suggested order of fixes)

Focus on actionable insights that maintain DDD principles while improving performance and code quality.
```

---

## 📋 Module-Specific Customization Template

### Quick Customization for Any Module:

**Step 1: Replace Placeholders**
```bash
# Replace {MODULE_NAME} with actual module name (e.g., "DAM", "Text-to-Speech", "Campaign Management")
# Replace {module-name} with kebab-case path (e.g., "dam", "text-to-speech", "campaign-management")
```

**Step 2: Add Module-Specific Context**
```
**MODULE CONTEXT:**
- Primary domain purpose: [Brief description of what this module does]
- Key entities: [List main business entities]
- External integrations: [APIs, services, databases it connects to]
- UI complexity: [Simple forms, complex dashboards, real-time updates, etc.]
- Performance requirements: [Real-time, batch processing, large datasets, etc.]
```

**Step 3: Focus Areas (Optional Customization)**
```
**ADDITIONAL FOCUS AREAS FOR {MODULE_NAME}:**
- [ ] [Module-specific architectural patterns]
- [ ] [Domain-specific performance concerns]
- [ ] [Integration-specific issues]
- [ ] [UI/UX specific optimizations]
```

---

## 🎯 Usage Examples

### Example 1: DAM Module Audit
```
I need you to perform a comprehensive audit of the DAM (Digital Asset Management) module against Golden Rule DDD guidelines...

**MODULE TO AUDIT:** lib/dam/
**MODULE CONTEXT:**
- Primary domain purpose: Digital asset storage, management, and organization
- Key entities: Asset, Folder, Tag, Selection
- External integrations: Supabase storage, file system, search APIs
- UI complexity: Complex drag-drop interfaces, bulk operations, real-time updates
- Performance requirements: Handle large file uploads, efficient search, smooth gallery navigation

**ADDITIONAL FOCUS AREAS FOR DAM:**
- [ ] File upload performance and progress tracking
- [ ] Large dataset rendering (1000+ assets)
- [ ] Drag-and-drop interaction performance
- [ ] Search and filtering efficiency
- [ ] Bulk operation handling
```

### Example 2: Text-to-Speech Module Audit
```
I need you to perform a comprehensive audit of the Text-to-Speech module against Golden Rule DDD guidelines...

**MODULE TO AUDIT:** lib/text-to-speech/ (or wherever TTS logic resides)
**MODULE CONTEXT:**
- Primary domain purpose: Convert text to speech audio files
- Key entities: TTSGeneration, Voice, AudioFile, TTSSettings
- External integrations: TTS provider APIs, audio storage, streaming services
- UI complexity: Audio players, voice selection, real-time generation status
- Performance requirements: Real-time audio streaming, efficient audio file management

**ADDITIONAL FOCUS AREAS FOR TTS:**
- [ ] Audio streaming performance
- [ ] Real-time generation status updates
- [ ] Audio file caching strategies
- [ ] Voice provider integration patterns
- [ ] Audio player component optimization
```

---

## 📊 Standard Audit Checklist

### Pre-Audit Preparation:
- [ ] Identify module boundaries and dependencies
- [ ] Understand business requirements and use cases
- [ ] Review existing test coverage
- [ ] Check current performance metrics (if available)

### Post-Audit Actions:
- [ ] Prioritize findings by business impact
- [ ] Estimate implementation effort for each fix
- [ ] Create specific refactoring tasks
- [ ] Plan incremental implementation approach
- [ ] Set up monitoring for improvements

### Continuous Improvement:
- [ ] Document architectural decisions made
- [ ] Update module documentation
- [ ] Create or update coding guidelines
- [ ] Share learnings with team
- [ ] Plan follow-up audits

---

This template can be applied to any module in the codebase for comprehensive architecture and performance auditing while maintaining consistency in evaluation criteria and output format. 