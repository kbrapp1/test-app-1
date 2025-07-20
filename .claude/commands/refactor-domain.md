# Domain-Wide Multi-Agent Refactoring Analysis

## 🎯 Command Purpose
Comprehensive DDD-aware refactoring analysis for entire domains using specialized sub-agents to identify compliance issues, redundancies, and logical improvements across all domain files.

## 📋 Usage
```
/refactor-domain <domain-name>
```

Examples:
- `/refactor-domain chatbot-widget`
- `/refactor-domain dam` 
- `/refactor-domain image-generator`

## 💾 Automatic Documentation Generation

The command automatically creates persistent documentation:
- **Live Analysis**: Interactive report displayed in session
- **Markdown Plan**: Saved to `docs/refactor/{domain-name}-domain-refactoring-plan.md`
- **Execution Commands**: Ready-to-use commands for `/refactor-domain-execute`
- **Cross-Session Support**: Resume work across multiple sessions

## 🤖 Multi-Agent Orchestration Strategy

### **Phase 1: Domain Discovery & Analysis (Parallel)**
Launch 6 specialized agents simultaneously using the Task tool:

#### **Agent 1: Domain Architecture Specialist**
```
Task: "Analyze the {domain-name} domain for DDD architectural compliance"

Instructions:
1. Scan all files in lib/{domain-name}/ recursively
2. Map current layer structure (domain/, application/, infrastructure/, presentation/)
3. Identify layer boundary violations using refactor-plan.md DDD framework (lines 71-147)
4. Document aggregate boundaries and entity relationships
5. Find mixed concerns and misplaced business logic
6. Assess repository pattern compliance
7. Evaluate domain event usage and isolation

Report Format:
- Current Architecture Map
- DDD Violations Found (with file:line references)
- Aggregate Boundary Issues
- Layer Separation Problems
- Recommended Architectural Fixes
```

#### **Agent 2: Code Quality & Redundancy Specialist**
```
Task: "Identify redundancy and quality issues across {domain-name} domain"

Instructions:
1. Analyze all files for redundant methods, duplicate logic, pass-through delegation
2. Find files exceeding 250 lines and assess complexity
3. Identify unused imports, variables, and dead code
4. Detect similar patterns that could be consolidated
5. Find unnecessary abstractions and over-engineering
6. Assess code organization and file structure efficiency
7. Use refactor-plan.md redundancy detection guidelines (lines 17-21)

Report Format:
- File Complexity Matrix (size, redundancy score, priority)
- Redundancy Hotspots (duplicate patterns with locations)
- Dead Code Inventory
- Consolidation Opportunities
- Quality Improvement Recommendations
```

#### **Agent 3: Security & Auth Pattern Specialist**
```
Task: "Analyze {domain-name} domain for security pattern compliance and auth variable usage"

Instructions:
1. Identify all security-critical variables (organizationId, userId, sessionId, etc.)
2. Trace auth variable flow through all layers
3. Validate Row Level Security (RLS) parameter passing
4. Check JWT token handling and validation patterns
5. Assess multi-tenant boundary enforcement
6. Find potential security vulnerabilities in refactoring targets
7. Use refactor-plan.md security preservation framework (lines 149-187)

Report Format:
- Security Variable Inventory (by file and usage)
- Auth Flow Mapping
- Security Pattern Compliance Assessment
- Vulnerability Risk Areas
- Security Preservation Requirements for Refactoring
```

#### **Agent 4: Performance & Optimization Specialist**
```
Task: "Evaluate {domain-name} domain performance patterns and optimization opportunities"

Instructions:
1. Identify React Query usage patterns and cache optimization
2. Analyze hook dependencies and re-render optimization
3. Find bundle size impact and code splitting opportunities
4. Assess database query patterns and N+1 issues
5. Evaluate memory management and cleanup patterns
6. Check for performance anti-patterns in current code
7. Use refactor-plan.md performance preservation guidelines (lines 170-187)

Report Format:
- Performance Pattern Inventory
- Optimization Opportunities
- Bundle Impact Assessment
- Database Query Analysis
- Performance Preservation Requirements
- Recommended Performance Improvements
```

#### **Agent 5: Business Logic & Domain Rules Specialist**
```
Task: "Analyze {domain-name} domain business logic organization and domain rule implementation"

Instructions:
1. Identify core business rules and domain invariants
2. Find business logic scattered across layers
3. Analyze entity methods and behavior organization
4. Assess value object usage and immutability patterns
5. Find domain services vs application services boundary issues
6. Evaluate domain event publishing and handling
7. Check for anemic domain model patterns

Report Format:
- Business Logic Distribution Map
- Domain Rule Compliance Assessment
- Entity vs Service Responsibility Analysis
- Value Object Opportunities
- Domain Event Architecture Review
- Business Logic Consolidation Recommendations
```

#### **Agent 6: Testing & Validation Specialist**
```
Task: "Assess {domain-name} domain testing coverage and validation patterns"

Instructions:
1. Analyze test coverage across all layers
2. Identify untested business rules and edge cases
3. Find integration test gaps and dependencies
4. Assess validation patterns and error handling
5. Check for test code duplication and setup complexity
6. Evaluate testing strategy alignment with DDD principles
7. Plan testing requirements for proposed refactoring

Report Format:
- Test Coverage Analysis by Layer
- Testing Gap Identification
- Validation Pattern Assessment
- Error Handling Review
- Testing Strategy for Refactoring
- Test Improvement Recommendations
```

### **Phase 2: Synthesis & Planning (Sequential)**

#### **Agent 7: Implementation Strategy Synthesizer**
```
Task: "Synthesize all agent findings into actionable refactoring implementation plan with comprehensive execution details"

Instructions:
1. Consolidate findings from all 6 specialist agents
2. Prioritize improvements by impact vs complexity
3. Create phased implementation roadmap
4. Identify dependencies between improvements
5. Assess risks and create mitigation strategies
6. Define success criteria and validation checkpoints
7. Estimate effort and timeline for each phase
8. **Generate comprehensive markdown documentation** in docs/refactor/{domain-name}-domain-refactoring-plan.md

CRITICAL: Include these context-independent details for each phase:

**Phase Detail Requirements:**
- Context & Rationale: Why this phase is needed (specific findings)
- Pre-Phase Validation: Checklist of prerequisites
- Detailed Tasks: For each task include:
  * Files Affected: Specific file paths and line counts
  * Replacement Strategy: Clear technical approach
  * Impact Description: What changes and why
  * Validation Steps: How to verify success
- Ready-to-Execute Commands: Complete bash scripts with:
  * Analysis commands (grep, find, wc -l)
  * Step-by-step implementation
  * Validation after each step (typecheck, test)
  * Rollback commands for safety
- Success Criteria: Measurable checkpoints
- Validation Commands: Specific pnpm/npm commands

**Execution Tracking Section:**
- Progress checkboxes for each task and phase
- Execution context (project, domain path, tools)
- Key file locations with domain structure
- Security pattern validation commands with expected counts
- Baseline metrics to record before starting

Report Format:
- Executive Summary of Findings
- Current Architecture Assessment (detailed)
- Prioritized Improvement Matrix
- Phased Implementation Roadmap (with comprehensive task details)
- Risk Assessment & Mitigation
- Success Criteria & Validation Plan
- Ready-to-Execute Commands (complete bash scripts)
- Execution Tracking (progress checkboxes and context)
- Resource Requirements & Timeline
```

### **Phase 3: Documentation Generation (Automatic)**

After synthesis, automatically create persistent documentation:

```typescript
// Generate comprehensive markdown plan
const planDocument = `docs/refactor/${domainName}-domain-refactoring-plan.md`;
await Write(planDocument, synthesizedPlan);

// Include ready-to-execute commands for each phase
const executionCommands = generateExecutionCommands(roadmap);
```

## 📊 Final Output Structure

The command automatically generates two outputs:
1. **Interactive Report**: Displayed in the session for immediate review
2. **Markdown Documentation**: Saved to `docs/refactor/{domain-name}-domain-refactoring-plan.md` for persistence and future reference

### **Domain Refactoring Analysis Report: {domain-name}**

```markdown
# {Domain-Name} Domain Refactoring Implementation Plan

> **Generated**: {timestamp} by Multi-Agent DDD Refactoring Analysis
> **Domain**: `lib/{domain-name}/`
> **Analysis Scope**: {X} TypeScript files, {Y} lines of code

## 🎯 Executive Summary

### Key Metrics
- **Domain Size**: {X} TypeScript files, ~{Y} lines of code
- **DDD Compliance**: {score}% ({assessment})
- **Code Quality Issues**: {count} files >250 lines, ~{lines}+ redundant code
- **Security Compliance**: {score}% ({assessment})
- **Performance Opportunities**: {description}
- **Testing Coverage**: {assessment}

### Critical Findings Synthesis
{list specific findings with file names and line counts}

## 🏗️ Current Architecture Assessment

### DDD Compliance Status
**Overall Score: {score}% - {assessment}**

#### ✅ Strengths
{list from Domain Architecture Specialist}

#### ⚠️ Issues Found
{list with specific file references}

### Code Quality Matrix
{table with file names, line counts, redundancy scores, priorities}

## 🔒 Security Pattern Analysis
**Compliance Score: {score}% - {assessment}**

### Critical Security Variables (PRESERVE)
{list all security variables with usage counts and file references}

## 📈 Performance Optimization Opportunities
{detailed findings from Performance Specialist}

## 🎯 Business Logic Organization Review
{findings from Business Logic Specialist}

## 🧪 Testing & Validation Strategy
{findings from Testing Specialist}

## 📋 Implementation Roadmap

### Phase 1: Foundation Cleanup (Weeks 1-2) 🔴 CRITICAL
**Priority: Eliminate Major Anti-patterns**

#### Context & Rationale
{specific findings explaining why this phase is needed}

#### Pre-Phase Validation
- [ ] Verify current branch is clean: `git status`
- [ ] Confirm tests pass: `pnpm run test`
- [ ] Validate TypeScript: `pnpm run typecheck`
- [ ] Check security patterns present: {specific commands}

#### Tasks
{for each task, include:}
1. **Task Name** - [ ] 
   - **Files Affected**: {specific file paths with line counts}
   - **Replacement Strategy**: {clear technical approach}
   - **Impact**: {what changes and why}
   - **Validation**: {how to verify success}
   - [ ] **Task Completed**: All validation criteria met

#### Success Criteria
- [ ] {specific measurable criteria}
- [ ] Achieve 100% TypeScript compilation: `pnpm run typecheck`
- [ ] Maintain all existing functionality: `pnpm run test`
- [ ] No security pattern regressions: {validation commands}

#### Validation Commands
```bash
# After each task
{specific commands}

# Final phase validation
{quality check commands}
```

#### Risk Level: {level}
#### Testing Required: {specific requirements}

{repeat pattern for Phase 2, 3, 4}

## 🚨 Critical Preservation Requirements

### Security Variables (NEVER REMOVE)
```typescript
{code examples with comments about usage}
```

### Performance Patterns (PRESERVE)
{list with explanations}

### Business Rules (MAINTAIN)
{list with descriptions}

## 🔄 Ready-to-Execute Commands

### Phase 1 Commands

#### 1. {Task Name} - [ ]
```bash
# Step 1: Analyze current state
{analysis commands with grep, find, wc -l}
# [ ] Analysis completed

# Step 2: Implementation
{step-by-step bash commands}
# [ ] Implementation completed

# Step 3: Validation
{validation commands}
# [ ] Validation passed

# Step 4: Final check
{quality commands}
# [ ] Quality checks passed
```

**Rollback Command**: 
```bash
{rollback commands}
```

**Task Completion**: - [ ] All steps validated and working

{repeat for all tasks in all phases}

## ✅ Success Metrics
{table with current vs target metrics}

## 📊 Execution Tracking

### Progress Checkboxes
**Phase 1: Foundation Cleanup** - [ ]
- [ ] **Task 1.1**: {description}
- [ ] **Task 1.2**: {description}  
- [ ] **Task 1.3**: {description}
- [ ] **Task 1.4**: {description}
- [ ] **Phase 1 Validation**: All success criteria met

**Phase 2: Architecture Enhancement** - [ ]
- [ ] **Task 2.1**: {description}
- [ ] **Task 2.2**: {description}
- [ ] **Task 2.3**: {description}
- [ ] **Task 2.4**: {description}
- [ ] **Phase 2 Validation**: All success criteria met

**Phase 3: Performance & Quality** - [ ]
- [ ] **Task 3.1**: {description}
- [ ] **Task 3.2**: {description}
- [ ] **Task 3.3**: {description}
- [ ] **Task 3.4**: {description}
- [ ] **Phase 3 Validation**: All success criteria met

**Phase 4: Validation & Documentation** - [ ]
- [ ] **Task 4.1**: {description}
- [ ] **Task 4.2**: {description}
- [ ] **Task 4.3**: {description}
- [ ] **Task 4.4**: {description}
- [ ] **Phase 4 Validation**: All success criteria met

**Overall Project Completion** - [ ]

### Execution Context
- **Project**: {project-name}
- **Domain Path**: `lib/{domain-name}/`
- **Current Branch**: `main` (create feature branch for refactoring)
- **Required Tools**: {list tools}
- **Quality Commands**: {list commands}

### Key File Locations
```
{domain structure with critical files to refactor}
```

### Security Pattern Validation
{commands to verify security patterns with expected counts}

### Baseline Metrics (Pre-Refactoring)
Record these metrics before starting:
- [ ] **Total Files**: {X} TypeScript files
- [ ] **Total Lines**: ~{Y} lines
- [ ] **Files >250 lines**: {count} files
- [ ] **Test Coverage**: Run `pnpm run test:coverage` → {percentage}%
- [ ] **Bundle Size**: Run `pnpm run analyze` → {size}
- [ ] **TypeScript Errors**: Run `pnpm run typecheck` → {count} errors
- [ ] **DDD Compliance**: {score}%
- [ ] **Security Variables**: organizationId in {count} files

---

**Ready for Execution**: Use `/refactor-domain-execute {domain-name} <phase>` to execute phases incrementally with automatic progress tracking.
```

## 🎯 Implementation Guidelines

### **Before Execution**
1. **Review the complete analysis report**
2. **Validate findings with domain experts**
3. **Ensure CI/CD pipeline is ready**
4. **Create feature branch for refactoring**
5. **Backup current state**

### **During Execution**
1. **Execute one phase at a time**
2. **Run tests after each major change**
3. **Validate security patterns are preserved**
4. **Monitor performance metrics**
5. **Document any deviations from plan**

### **After Each Phase**
1. **Run full test suite**
2. **Validate success criteria met**
3. **Update documentation**
4. **Peer review changes**
5. **Deploy to staging for validation**

## 🚀 Follow-up Commands

After receiving the analysis report, use these commands to execute:

- `/refactor-execute <domain-name> <phase-name>` - Execute specific phase from saved markdown plan
- `/refactor-validate <domain-name> <phase-name>` - Validate phase completion
- `/refactor-status <domain-name>` - Check current progress against markdown plan  
- `/refactor-rollback <domain-name> <phase-name>` - Rollback if needed

## 💾 Persistent Documentation

The analysis automatically generates:
- `docs/refactor/{domain-name}-domain-refactoring-plan.md` - Complete implementation plan
- Ready-to-execute commands for each phase
- Progress tracking capabilities across multiple sessions
- Detailed validation checkpoints and success criteria

## 📝 Notes

- Each agent runs independently using the Task tool for parallel processing
- All findings reference specific files and line numbers for actionable guidance  
- Implementation plan is designed for incremental execution with validation checkpoints
- Security and performance patterns are preserved throughout all phases
- Success criteria are measurable and verifiable