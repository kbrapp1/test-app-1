# DDD-Aware Refactoring Planning Guidelines

## 🎯 Code Refactoring Planning Prompt
- purpose: analyze and plan DDD-compliant refactoring before execution

```
Please analyze this code and create a practical refactoring plan following these DDD-aware rules:

ANALYSIS GOALS:
1. **Identify refactoring needs** - Files 250+ lines, mixed DDD layers, redundant code
2. **Follow DDD principles** - Respect domain, application, infrastructure, presentation boundaries
3. **Reduce line count** - Target under 250 lines through redundancy removal, not file multiplication
4. **Preserve functionality** - Ensure all existing behavior will be preserved exactly
5. **Eliminate redundancies** - Remove pass-through methods, duplicate logic, unnecessary indirection
6. **Avoid over-engineering** - Don't create new files unless absolutely necessary for DDD compliance

REFACTORING PRIORITIES (in order):
1. **Remove redundant methods** - Pass-through delegation, wrapper methods
2. **Consolidate duplicate logic** - Merge similar patterns into single implementations
3. **Extract only when necessary** - Only split files for genuine DDD layer violations
4. **Simplify, don't complicate** - Prefer removing code over creating new abstractions

DDD ANALYSIS FRAMEWORK:
- **Domain Analysis**: What pure business logic exists? Which aggregates are present?
- **Application Analysis**: What use cases and orchestration logic exists?
- **Infrastructure Analysis**: What external dependencies and data access patterns exist?
- **Presentation Analysis**: What UI concerns and user interaction patterns exist?
- **Security Analysis**: Where are auth variables used? What validation exists?
- **Performance Analysis**: What optimization patterns must be preserved?

PLANNING OUTPUT:
1. **Current Architecture Assessment**
   - File size and redundancy analysis
   - DDD layer boundary violations identified
   - Pass-through methods and unnecessary delegation
   - Security pattern usage documented

2. **Refactoring Recommendations** (prioritized by simplicity)
   - **Option A: Code Removal** - Remove redundant/pass-through methods (PREFERRED)
   - **Option B: Code Consolidation** - Merge duplicate logic patterns
   - **Option C: File Extraction** - Only if genuine DDD violations exist (LAST RESORT)

3. **Implementation Strategy**
   - Step-by-step code removal/consolidation plan
   - Testing checkpoints to verify functionality preserved
   - Risk assessment for each change

4. **Preservation Requirements**
   - Security variables that must be maintained
   - Performance patterns that must be preserved
   - Core business functionality that cannot change
   - Aggregate boundaries that cannot be broken

WHAT NOT TO PLAN:
- Don't create new files unless DDD layers are genuinely mixed
- Don't plan complex abstractions or interfaces
- Don't plan to split working, well-structured code
- Don't plan tiny extracted files
- Don't plan to change working patterns just to reduce line count
- Don't plan to remove any security variables
- Don't over-engineer solutions for simple line count issues

PLANNING DELIVERABLE:
- **Assessment Report**: Current state analysis with redundancies identified
- **Refactoring Recommendation**: Simplest approach to achieve goals (removal > consolidation > extraction)
- **Implementation Plan**: Step-by-step code changes with testing checkpoints
- **Risk Assessment**: Potential issues and mitigation strategies
- **Success Criteria**: How to verify functionality preserved and goals achieved
```

## 📐 **DDD Layer Analysis Framework**

### **Domain Layer Analysis Checklist**
```
Current Domain Issues to Identify:
□ Business logic mixed with infrastructure code?
□ Multiple aggregates in single files?
□ Domain events not properly isolated?
□ Value objects mixed with entities?
□ Business rules scattered across multiple files?
□ Domain services performing non-domain operations?

Domain Refactoring Targets:
□ Extract pure business logic into domain services
□ Isolate aggregates with their invariants
□ Separate value objects from entities
□ Consolidate related domain events
□ Create focused domain error types
□ Define clear repository interfaces
```

### **Application Layer Analysis Checklist**
```
Current Application Issues to Identify:
□ Use cases mixed with business logic?
□ Orchestration code in domain layer?
□ DTOs mixed with domain entities?
□ Application services doing infrastructure work?
□ Event handlers scattered across layers?
□ Command/query separation violations?

Application Refactoring Targets:
□ Remove pass-through delegation methods
□ Consolidate duplicate orchestration patterns
□ Simplify application service interfaces
□ Remove unnecessary abstraction layers
□ Extract only when genuine layer violations exist
□ Focus on code removal over code creation
```

### **Infrastructure Layer Analysis Checklist**
```
Current Infrastructure Issues to Identify:
□ Database code mixed with business logic?
□ External API calls in domain layer?
□ Persistence concerns in application layer?
□ Provider implementations scattered?
□ Composition root complexity?
□ Adapter pattern violations?

Infrastructure Refactoring Targets:
□ Extract database operations to repositories
□ Isolate external service providers
□ Create anti-corruption adapters
□ Consolidate composition root logic
□ Separate persistence mapping
□ Establish infrastructure boundaries
```

### **Presentation Layer Analysis Checklist**
```
Current Presentation Issues to Identify:
□ UI components with business logic?
□ Server actions mixed with domain code?
□ Hooks performing infrastructure operations?
□ Components larger than 200 lines?
□ State management scattered?
□ Type definitions mixed across layers?

Presentation Refactoring Targets:
□ Extract focused UI components
□ Isolate server action entry points
□ Separate state management hooks
□ Create presentation-specific types
□ Establish component composition patterns
□ Define clear UI boundaries
```

## 🔍 Security Pattern Analysis

### **Authentication Pattern Preservation**
```
Security Variables to Preserve:
□ organizationId - Multi-tenant boundary enforcement
□ activeOrganizationId - Current tenant context
□ userId - User identification and authorization
□ sessionId - Session management and tracking
□ roleId - Role-based access control
□ permissions - Granular permission checking

Security Patterns to Maintain:
□ JWT token validation flows
□ Row Level Security (RLS) parameter passing
□ Organization context validation
□ User permission checking
□ Session state management
□ Auth state propagation
```

### **Performance Pattern Preservation**
```
Performance Patterns to Maintain:
□ Unified context optimization (single API calls)
□ Optimistic update patterns
□ Caching strategies and cache invalidation
□ Lazy loading implementations
□ Bundle splitting and code splitting
□ Memory management patterns

Critical Performance Areas:
□ React Query optimization patterns
□ Supabase query optimization
□ Context provider efficiency
□ Component re-render minimization
□ State management efficiency
□ Hook dependency optimization
```

## 📊 Analysis Templates

### **File Complexity Assessment Template**
```
File: [filename]
Current Size: [line count]
DDD Layer Violations: [list mixed concerns]
Security Variables Present: [list auth variables]
Performance Patterns: [list optimization patterns]
Aggregate Boundaries: [identify business boundaries]
Refactoring Priority: [High/Medium/Low]
Risk Level: [High/Medium/Low]

Issues Identified:
- [Specific issue 1]
- [Specific issue 2]
- [Specific issue 3]

Proposed Structure:
- [New file 1]: [purpose] ([estimated lines])
- [New file 2]: [purpose] ([estimated lines])
- [New file 3]: [purpose] ([estimated lines])
```

### **Migration Risk Assessment Template**
```
Risk Category: [Breaking Changes/Security/Performance/Complexity]
Risk Level: [High/Medium/Low]
Impact: [Description of potential impact]
Mitigation: [Strategy to prevent or minimize risk]
Testing: [How to verify risk is mitigated]
Rollback: [How to undo changes if needed]

Example Risks:
- Authentication flow disruption
- Performance regression
- Domain event publishing failure
- Aggregate boundary violations
- Security variable removal
- Context optimization breaking
```

### **Testing Checkpoint Template**
```
Checkpoint: [Description of what was extracted]
Functionality Tests:
□ [Specific UI workflow 1]
□ [Specific API endpoint 2]
□ [Specific business rule 3]

Security Tests:
□ Authentication still works
□ Organization context preserved
□ Permission checking intact
□ Session management functional

Performance Tests:
□ Page load times unchanged
□ API response times maintained
□ Memory usage stable
□ Bundle size acceptable

Success Criteria:
□ All tests pass
□ No new errors in logs
□ Performance metrics within 5% of baseline
□ Security audit passes
```

## 🎯 Planning Deliverable Structure

### **1. Executive Summary**
- Current architecture assessment summary
- Key issues identified requiring refactoring
- Proposed solution overview
- Risk level and mitigation approach
- Timeline and resource requirements

### **2. Current State Analysis**
- File-by-file complexity assessment
- DDD layer boundary violation documentation
- Security pattern usage analysis
- Performance optimization inventory
- Aggregate boundary mapping

### **3. Target Architecture Design**
- Proposed file structure with DDD layer assignments
- Clear responsibility statements for each new file
- Import/export dependency mapping
- Aggregate boundary preservation plan
- Security variable flow documentation

### **4. Migration Roadmap**
- Phase-by-phase extraction plan
- Dependency resolution order
- Testing checkpoint schedule
- Risk mitigation timeline
- Rollback procedures

### **5. Success Validation Plan**
- Functional testing checklist
- Security validation procedures
- Performance benchmark comparison
- Code quality metrics
- Team adoption readiness assessment

## 📋 Planning Checklist

### **Before Planning**
- [ ] Identified files requiring refactoring (250+ lines)
- [ ] Documented all redundant/pass-through methods
- [ ] Mapped current DDD layer violations (if any)
- [ ] Documented all security variable usage
- [ ] Catalogued performance optimization patterns

### **During Planning**
- [ ] Prioritized code removal over code creation
- [ ] Each proposed change respects DDD layer boundaries
- [ ] Security variables flow is preserved
- [ ] Performance patterns are maintained
- [ ] Plan targets under 250 lines through simplification
- [ ] No unnecessary file extractions planned

### **After Planning**
- [ ] Summarize the request
- [ ] Plan uses simplest approach to achieve goals
- [ ] Security requirements are fully preserved
- [ ] Performance characteristics are maintained
- [ ] Testing strategy covers all critical paths
- [ ] No over-engineering introduced
- [ ] Functionality will be identical after refactoring

## 🚨 Planning Red Flags

**Stop Planning If:**
- Plan requires breaking aggregate boundaries
- Security variables would be removed
- Performance optimizations would be lost
- Domain events would be eliminated
- Working, well-structured code would be split unnecessarily
- File extraction is planned instead of code removal

**Revise Plan If:**
- Creating new files when code removal would suffice
- Complex abstractions are being introduced for line count reduction
- Working patterns are being changed just to reduce lines
- Over-engineering solutions for simple redundancy issues
- Plan doesn't prioritize simplest approach first
- Testing strategy doesn't cover critical paths

**Remember: The goal is to follow DDD principles, reduce redundancy, and get under 250 lines using the SIMPLEST approach possible - usually code removal, not file creation.**