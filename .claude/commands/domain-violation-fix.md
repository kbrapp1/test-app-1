# Domain Boundary Violation Fix

**Usage:** `/domain-violation-fix [file_path]: [description]`

**Purpose:** Check and fix DDD boundary violations in the codebase.

## Description

This command helps identify and fix Domain-Driven Design (DDD) boundary violations where:
- Domain layer imports from Application layer
- Domain layer imports from Infrastructure layer  
- Other architectural boundary violations

## Workflow

1. **Verification**: Analyze the reported violation
2. **Assessment**: Determine fix complexity and time estimate
3. **Approval**: Ask for confirmation before proceeding
4. **Implementation**: Fix the violation while maintaining functionality
5. **Validation**: Run TypeScript compilation and linter checks
6. **Testing**: Give manual UI testing steps

## Examples

```
/domain-violation-fix SearchValidator.ts: imports from ../../application/use-cases/SearchUseCase

/domain-violation-fix lib/dam/domain/services/UserService.ts: depends on application DTO

/domain-violation-fix IRepository.ts: imports from infrastructure layer
```

## Output Format

✅/❌ **Violation Status**: Confirmed or false positive  
🟢/🟡/🔴 **Complexity**: Easy/Moderate/Complex  
⏱️ **Time Estimate**: Expected fix duration  
🤔 **Approval Request**: Proceed with fix?  

**After fixing:**  
✅ **Results**: Summary of changes made  
🔍 **Quality Checks**: TypeScript compilation + targeted linter results  
🧪 **UI Testing**: Step-by-step manual testing instructions

## Implementation

When this command is used, I will:

1. **Read the specified file** to understand the violation
2. **Analyze imports and dependencies** to confirm the issue
3. **Determine the appropriate DDD solution**:
   - Move types to domain value objects
   - Relocate services to correct layer
   - Implement dependency inversion
   - Create proper abstractions
4. **Provide complexity assessment** and time estimate
5. **critical!: Ask for approval** before making changes
6. **Execute the fix** maintaining backward compatibility
7. **Run quality checks**: 
   - TypeScript compilation (`pnpm run typecheck`)
   - ESLint validation on modified files only (`pnpm exec eslint [modified_files]`)
8. **Provide targeted UI testing steps** for the affected functionality

## Complexity Levels

- 🟢 **Easy (2-5 min)**: Simple import updates, type moves
- 🟡 **Moderate (5-15 min)**: Service relocation, multiple file updates  
- 🔴 **Complex (15+ min)**: Major architectural changes, dependency restructuring