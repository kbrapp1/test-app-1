# Confirm Recommendation

Verify code improvement recommendations by examining the actual codebase before suggesting changes.

## Usage
```
/confirm-recommendation [recommendation text or file path]
```

## What it does
1. **Parse the recommendation** - Extract the specific file path, line numbers, and suggested changes
2. **Examine actual code** - Read the referenced file(s) to understand current implementation
3. **Validate claims** - Check if the identified "problem" actually exists in the code
4. **Assess necessity** - Determine if the suggested fix is needed or already implemented
5. **Provide verdict** - Give a clear assessment: ✅ Valid, ❌ Invalid, or 🟡 Partial

## Example
```
User: Fix Error Handling Gap - ContentAnalysisUtilities.ts:41 needs date validation
Claude: [Reads file, checks line 41, finds validation already exists]
Result: ❌ Invalid - The suggested date validation is already implemented at lines 41-43
```

## Guidelines
- Always read the actual source code before confirming any recommendation
- Check surrounding context, not just the specific line mentioned
- Look for existing error handling patterns in the codebase
- Consider if the recommendation follows project conventions
- Verify that suggested changes don't duplicate existing functionality

## Output Format
- **Status**: ✅ Valid | ❌ Invalid | 🟡 Partial
- **Assessment**: Brief explanation of findings
- **Current State**: What the code actually does
- **Recommendation**: Whether to proceed, modify, or skip the suggestion