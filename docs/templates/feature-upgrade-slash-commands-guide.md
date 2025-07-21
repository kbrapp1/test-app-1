# Feature Upgrade Slash Commands Guide

## Overview

This guide documents the comprehensive slash command system for upgrading feature domains to match the **Notes domain gold standard** (97/100 DDD + Unified Context + Security Compliance).

## 🎯 Command Suite

### **Primary Commands**

#### **1. `/feature-upgrade-audit [feature-area]`**
**Location**: `.claude/commands/feature-upgrade-audit.md`
**Purpose**: Comprehensive multi-agent evaluation and upgrade planning

**What it does:**
- **Agent 1**: Deep architectural analysis and current state assessment
- **Agent 2**: Compliance scoring against Notes domain baseline (97/100)
- **Agent 3**: Detailed implementation planning with realistic estimates

**Output Files:**
```
docs/refactor/[feature-area]-upgrade-audit-[timestamp].md
docs/refactor/[feature-area]-implementation-plan-[timestamp].md
docs/refactor/[feature-area]-gap-analysis-[timestamp].md
```

**Example Usage:**
```bash
/feature-upgrade-audit dam
/feature-upgrade-audit image-generator
/feature-upgrade-audit chatbot-widget
```

#### **2. `/feature-implementation-executor [feature-area] [phase-number]`**
**Location**: `.claude/commands/feature-implementation-executor.md`
**Purpose**: Execute specific implementation phases with Notes domain templates

**What it does:**
- **Agent 1**: Phase validation and setup verification
- **Agent 2**: Code generation using Notes domain templates
- **Agent 3**: Quality verification and progress tracking

**Output Files:**
```
docs/refactor/[feature-area]-implementation-progress-[timestamp].md
docs/refactor/[feature-area]-quality-report-[timestamp].md
lib/[feature]/ (actual implementation files)
```

**Example Usage:**
```bash
/feature-implementation-executor dam 1
/feature-implementation-executor dam phase-2
/feature-implementation-executor image-generator 3
```

### **Supporting Commands**

#### **3. `/eslint-security-guidelines`**
**Location**: `.claude/commands/eslint-security-guidelines.md`
**Purpose**: Fix ESLint errors while maintaining security compliance

**Key Features:**
- Organization context variable protection
- React hooks rules compliance
- Unified context pattern detection
- Security-first lint fixes

#### **4. `/golden-rule`**
**Location**: `.claude/commands/golden-rule.mdc`
**Purpose**: DDD architectural guidelines and patterns

**Key Features:**
- Domain-driven design best practices
- Clean architecture patterns
- Error handling standards
- Testing strategies

## 🏗️ Implementation Workflow

### **Step 1: Audit & Analysis**
```bash
/feature-upgrade-audit [feature-area]
```

**Expected Output:**
- Current architecture analysis
- Gap identification against Notes baseline
- Detailed implementation roadmap
- Risk assessment and mitigation strategies

### **Step 2: Phase-by-Phase Implementation**
```bash
/feature-implementation-executor [feature-area] 1  # Domain Foundation
/feature-implementation-executor [feature-area] 2  # Application Layer
/feature-implementation-executor [feature-area] 3  # Infrastructure & Security
/feature-implementation-executor [feature-area] 4  # Presentation Layer
/feature-implementation-executor [feature-area] 5  # Testing & Documentation
```

**Each Phase Provides:**
- Copy-paste ready code templates from Notes domain
- Step-by-step implementation guidance
- Quality verification checkpoints
- Progress tracking with scores

### **Step 3: Quality Assurance**
- Automated ESLint security compliance
- DDD architecture verification
- Performance benchmark testing
- Security audit validation

## 📊 Quality Metrics & Targets

### **Notes Domain Baseline (Gold Standard)**
```typescript
Overall Score: 97/100
├── DDD Architecture: 97/100
├── Unified Context: 95/100 (3+ API calls → 1 call, 70% improvement)
├── Security Compliance: 100/100 (ESLint guidelines)
├── Feature Flags: 95/100 (Organization-scoped)
└── Role Permissions: 95/100 (Granular control)

Performance Metrics:
├── API Calls: 3+ → 1 (70% reduction)
├── Page Load: <100ms improvement
├── Cache Hit Rate: 85%+
└── Test Coverage: 90%+ (44/44 tests passing)

Security Features:
├── Organization Context: Protected variables ✅
├── React Hooks Rules: Compliant ✅
├── Multi-Tenant: JWT-based scoping ✅
├── Permission Validation: Role-based ✅
└── Cache Security: Organization-scoped keys ✅
```

### **Target Scores for All Features**
```typescript
Minimum Acceptable Scores:
├── DDD Architecture: 90/100
├── Unified Context: 85/100
├── Security Compliance: 95/100
├── Feature Flags: 90/100
└── Role Permissions: 90/100

Performance Targets:
├── API Reduction: 60%+ improvement
├── Page Load: Measurable improvement
├── Cache Strategy: Proper invalidation
└── Test Coverage: 90%+ for critical paths
```

## 🎯 Reference Documents

### **Core Template**
- **`docs/templates/notes-domain-template-guide.md`**: Complete implementation guide using Notes as template

### **Architecture Guidelines**
- **`docs/security/comprehensive-security-design.md`**: Security architecture overview
- **`docs/security/feature-permission-implementation-guide.md`**: Permission system details
- **`docs/general/unified-context-pattern-implementation-guide.md`**: Performance optimization patterns

### **Quality Standards**
- **`.claude/commands/eslint-security-guidelines.md`**: Security compliance rules
- **`.claude/commands/golden-rule.mdc`**: DDD best practices
- **`docs/refactor/unified-context-performance-optimization.md`**: Performance guidelines

## 🚀 Feature Priority Matrix

### **High Priority (Immediate Implementation)**
```typescript
1. DAM (Digital Asset Management)
   - Current: Multiple API calls for assets, folders, permissions
   - Impact: Critical for users with large file libraries
   - Estimated Reduction: 4-5 API calls → 1 call
   - Implementation Time: 60-80 hours

2. Chatbot Widget  
   - Current: Multiple context calls for configuration, conversations
   - Impact: User interaction responsiveness
   - Estimated Reduction: 3-4 API calls → 1 call
   - Implementation Time: 50-70 hours

3. Image Generator
   - Current: Multiple validation calls before generation
   - Impact: Generation start time
   - Estimated Reduction: 3-4 API calls → 1 call
   - Implementation Time: 40-60 hours
```

### **Medium Priority (Future Implementation)**
```typescript
4. Team Management
   - Current: Multiple permission checks for member access
   - Impact: Team page loading
   - Estimated Reduction: 3 API calls → 1 call
   - Implementation Time: 30-40 hours

5. Settings
   - Current: Multiple feature flag checks
   - Impact: Settings page performance
   - Estimated Reduction: 2-3 API calls → 1 call
   - Implementation Time: 20-30 hours
```

## 📋 Example Implementation Plan

### **DAM Domain Upgrade Example**

#### **Phase 1: Audit**
```bash
/feature-upgrade-audit dam
```

**Expected Analysis:**
```typescript
Current State:
├── DDD Compliance: 45/100
├── API Calls: 5+ on page load
├── Security: 60/100 (missing organization context)
├── Feature Flags: 80/100 (partially implemented)
└── Permissions: 70/100 (basic role checking)

Target State (Notes Baseline):
├── DDD Compliance: 95/100
├── API Calls: 1 on page load
├── Security: 100/100 (full compliance)
├── Feature Flags: 95/100 (unified context)
└── Permissions: 95/100 (granular control)

Implementation Plan:
├── Phase 1: Domain Foundation (16-24 hours)
├── Phase 2: Unified Context Service (20-28 hours)
├── Phase 3: Presentation Layer (20-28 hours)
└── Phase 4: Testing & Documentation (8-12 hours)

Total Estimated Time: 64-92 hours (8-11.5 days)
```

#### **Phase 2: Implementation**
```bash
/feature-implementation-executor dam 1    # Domain Foundation
/feature-implementation-executor dam 2    # Application Layer
/feature-implementation-executor dam 3    # Infrastructure
/feature-implementation-executor dam 4    # Presentation
/feature-implementation-executor dam 5    # Testing
```

**Generated Files:**
```
lib/dam/domain/
├── aggregates/AssetAggregate.ts
├── value-objects/AssetId.ts
├── events/AssetEvents.ts
├── specifications/AssetSpecifications.ts
├── services/IAuthContext.ts
├── repositories/IAssetRepository.ts
└── errors/DamDomainError.ts

lib/dam/application/services/
├── DamUnifiedContextService.ts
└── DamApplicationService.ts

lib/dam/presentation/
├── hooks/useDamUnifiedContext.ts
├── actions/damUnifiedActions.ts
└── components/DamPageClient.tsx
```

#### **Phase 3: Verification**
```typescript
Quality Report:
├── DDD Architecture: 94/100 ✅
├── Unified Context: 92/100 ✅
├── Security Compliance: 100/100 ✅
├── Feature Flags: 95/100 ✅
└── Role Permissions: 93/100 ✅

Performance Results:
├── API Calls: 5+ → 1 (80% reduction) ✅
├── Page Load: 60ms improvement ✅
├── Cache Hit Rate: 87% ✅
└── Test Coverage: 92% ✅

Status: MEETS NOTES DOMAIN STANDARD ✅
```

## 🔧 Command Integration

### **IDE Integration**
```json
// .vscode/settings.json
{
  "claude.commands": {
    "feature-upgrade-audit": {
      "description": "Audit feature for DDD/security/performance compliance",
      "shortcut": "Ctrl+Shift+A"
    },
    "feature-implementation-executor": {
      "description": "Execute implementation phase with Notes templates",
      "shortcut": "Ctrl+Shift+E"
    }
  }
}
```

### **Development Workflow**
```bash
# 1. Analysis Phase
/feature-upgrade-audit [feature]

# 2. Review generated plans
docs/refactor/[feature]-upgrade-audit-*.md
docs/refactor/[feature]-implementation-plan-*.md

# 3. Implementation Phase
/feature-implementation-executor [feature] 1
# ... continue through phases

# 4. Quality Verification
npm run test
npm run lint
npm run typecheck
npm run ddd-audit [feature]
```

## 🎖️ Success Criteria

### **Technical Excellence**
- **Architecture**: 90+ DDD compliance score
- **Performance**: 60%+ API call reduction
- **Security**: 95+ security compliance score
- **Quality**: 90%+ test coverage

### **Business Value**
- **User Experience**: Faster page loads, optimistic updates
- **Security Posture**: Zero organization context leakage
- **Maintainability**: Clear architecture boundaries
- **Developer Velocity**: Reduced complexity for future features

### **Consistency**
- **Pattern Compliance**: Follows Notes domain template exactly
- **Code Quality**: ESLint security guidelines adherence
- **Documentation**: Comprehensive implementation guides
- **Testing**: Complete test coverage with realistic scenarios

## 🚀 Getting Started

### **Quick Start for New Feature Upgrade**
```bash
# 1. Run audit to understand current state
/feature-upgrade-audit [your-feature]

# 2. Review the generated implementation plan
# Check: docs/refactor/[your-feature]-implementation-plan-*.md

# 3. Start with Phase 1 (Domain Foundation)
/feature-implementation-executor [your-feature] 1

# 4. Continue through phases based on audit recommendations
/feature-implementation-executor [your-feature] 2
# ... etc.
```

### **Expected Timeline**
- **Small Feature** (e.g., Settings): 20-30 hours
- **Medium Feature** (e.g., Team Management): 30-50 hours  
- **Large Feature** (e.g., DAM, Chatbot): 60-90 hours

### **Success Indicators**
- All phases completed with quality scores meeting targets
- Performance benchmarks achieved (API reduction, page load)
- Security compliance validated (ESLint, organization context)
- Test coverage meets requirements (90%+)

This slash command system provides a complete, systematic approach to upgrading any feature domain to match the **Notes domain gold standard**, ensuring consistent architecture, performance, and security across the entire application.