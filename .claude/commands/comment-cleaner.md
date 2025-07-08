# Comment Cleaner

Clean up verbose information comments while preserving important ones like TODOs, fallbacks, and error handling comments.

## What it does

- Converts multi-line verbose comments to single or double line format
- Preserves AI INSTRUCTIONS in main file headers
- Keeps TODO, FIXME, NOTE, HACK, BUG, WARNING comments
- Maintains fallback and error handling comments
- Preserves JSDoc annotations
- Simplifies method documentation to concise format

## Usage

/comment-cleaner {args}

## Examples

**Single file:**
/comment-cleaner lib/chatbot-widget/domain/services/SomeService.ts

**Entire folder:**
/comment-cleaner lib/chatbot-widget

**Specific domain:**
/comment-cleaner lib/chatbot-widget/infrastructure/composition

## What gets cleaned

**Before:**
```typescript
/**
 * Get User Service
 * 
 * AI INSTRUCTIONS:
 * - Manages user authentication flow
 * - Handles token validation and refresh
 * - Integrates with external OAuth providers
 * - Implements security best practices
 */
```

**After:**
```typescript
// Get User Service
// 2nd comment line if needed
```

## What gets preserved

- Main file headers with AI INSTRUCTIONS
- TODO/FIXME/NOTE comments
- Fallback and error handling comments
- JSDoc annotations (@param, @returns, etc.)
- Comments with debugging/logging references

## File types processed

- `.ts` - TypeScript files
- `.tsx` - TypeScript React files
- `.js` - JavaScript files
- `.jsx` - JavaScript React files

Excludes test files (`.test.ts`, `.test.js`) and common build directories.