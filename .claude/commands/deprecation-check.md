# Deprecation Check

**Usage:** `/deprecation-check [path]`

**Purpose:** Analyze codebase for deprecated code, unused files, dead code, and cleanup opportunities after any code changes or refactoring.

## Description

This command helps identify and clean up code that becomes obsolete after any development changes:
- Unused files and dead code blocks
- Deprecated functions, classes, and interfaces
- Orphaned imports, exports, and type definitions
- Legacy fallback patterns no longer needed
- Temporary code marked for removal
- Configuration files for removed features
- Test files for deleted functionality

## Workflow

1. **Scan Phase**: Search for deprecated patterns and unused code
2. **Analysis Phase**: Categorize findings by removal safety and impact
3. **Report Phase**: Present organized findings with removal recommendations
4. **Approval Phase**: Ask for confirmation before any deletions
5. **Cleanup Phase**: Remove approved deprecated code
6. **Validation Phase**: Run quality checks to ensure no breakage

## Examples

```
/deprecation-check

/deprecation-check lib/chatbot-widget

/deprecation-check src/components

/deprecation-check lib/dam/domain
```

## Detection Patterns

The command searches for:

### 🗑️ **Unused Files**
- Files with no import references
- Empty or near-empty files
- Old test files for removed features
- Backup files and duplicates (`.old`, `.backup`, etc.)
- Legacy configuration files

### 🔄 **Dead Code**
- Unreachable code blocks
- Unused functions, classes, and interfaces
- Commented-out code blocks
- Conditional branches that never execute
- Legacy feature flags that are always false

### 📦 **Orphaned Dependencies**
- Unused imports in files
- Exports with no consumers
- Unused package dependencies
- Legacy type definitions
- Dead utility functions

### 🏷️ **Deprecation Markers**
- `@deprecated` JSDoc comments
- TODO comments mentioning removal
- Files marked with FIXME or REMOVE
- Temporary workarounds no longer needed
- Feature flags for removed functionality

### 🔗 **Import/Export Issues**
- Imports from non-existent files
- Circular dependencies
- Re-exports of deleted modules
- Barrel files with dead exports
- Type-only imports that could be removed

## Output Format

### 📊 **Analysis Summary**
- 🗑️ **Unused Files**: N files (estimated X minutes)
- 🔄 **Dead Code Blocks**: N locations (estimated Y minutes) 
- 📦 **Orphaned Dependencies**: N items (estimated Z minutes)
- 🏷️ **Deprecation Markers**: N items requiring action
- ⚠️ **High Risk Changes**: N items requiring careful review

### 📁 **Cleanup Categories**

#### 🟢 **Safe to Remove** (Low Risk)
- Files with zero references across codebase
- Empty or commented-out code blocks
- Unused utility functions with no external usage
- Test files for completely removed features
- Dead configuration entries

#### 🟡 **Review Required** (Medium Risk)
- Files with minimal or unclear usage
- Code marked as deprecated but still referenced
- Legacy APIs that might have external consumers
- Conditional code with unclear activation conditions
- Dependencies with mixed usage patterns

#### 🔴 **High Risk** (Manual Review)
- Files that might be used by runtime reflection
- Code that could be called by external packages
- Configuration affecting production systems
- APIs exposed in public interfaces
- Dynamic imports or runtime dependency resolution

### 🔧 **Specific Findings**

For each detected item:
```
📄 [file_path:line] - [issue_type]
   ├─ 📝 Description: What was found
   ├─ 🎯 Recommendation: Suggested action
   ├─ ⚠️ Risk Level: Low/Medium/High
   └─ 🔗 Related: Connected files/imports
```

## Implementation

When this command is used, I will:

### 1. **Comprehensive Code Scanning**
- Search for unused files and dead code
- Identify deprecated functions and classes  
- Find orphaned imports and exports
- Detect commented-out code blocks
- Scan for deprecation markers and TODOs

### 2. **Dependency Analysis**
- Map all import/export relationships
- Identify unused package dependencies
- Check for circular dependencies
- Validate external usage patterns
- Detect runtime dependency patterns

### 3. **Risk Assessment**
- Categorize findings by removal safety
- Estimate cleanup time and effort
- Identify potential breaking changes
- Flag items requiring manual review
- Assess external API impact

### 4. **Interactive Cleanup**
- Present organized findings report
- Request approval for each category
- Execute safe removals automatically
- Provide guidance for manual cleanup
- Create cleanup action plan

### 5. **Quality Validation**
- Run TypeScript compilation checks
- Execute linting and formatting
- Verify no new errors introduced
- Test build process integrity
- Validate critical functionality

## Risk Mitigation

- **Backup Creation**: Git staging before changes
- **Incremental Approach**: Remove files one category at a time
- **Rollback Plan**: Clear instructions for reverting changes
- **External Validation**: Check for usage in other projects/packages
- **Documentation Updates**: Update any affected documentation

## Post-Cleanup Tasks

After successful cleanup:
- Update related documentation
- Review and update .gitignore if needed
- Clean up package.json dependencies if applicable
- Update build scripts that might reference removed files
- Consider updating CI/CD pipelines if they reference removed paths

---

This command ensures that code changes don't leave behind technical debt in the form of deprecated, unused, or obsolete code patterns, keeping the codebase clean and maintainable.