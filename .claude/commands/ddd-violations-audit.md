# DDD Violations Audit

Analyzes Domain-Driven Design compliance and architecture quality across your codebase.

## Usage

```
/ddd-violations-audit [domain]
```

## Script Execution

**Claude should run:** `node scripts/ddd-analyzer-command.js [domain]`

## Parameters

- `domain` (optional): Specific domain to analyze (e.g., "chatbot-widget", "dam", "auth", "image-generator", "tts")
- If no domain specified, analyzes all domains

## Examples

```bash
# Analyze all domains
/ddd-violations-audit

# Analyze specific domain
/ddd-violations-audit chatbot-widget
/ddd-violations-audit dam
/ddd-violations-audit auth
```

## What It Analyzes

- **Domain Services**: Count, complexity, async usage
- **Entities**: Properties and methods analysis  
- **Value Objects**: Count and usage patterns
- **Layer Boundaries**: DDD layer violation detection
- **File Sizes**: Golden rule compliance (250 line limit)
- **Infrastructure Leaks**: Direct database/HTTP usage in domain

## Output

Results are saved to `docs/refactor/ddd-analysis-[timestamp].md` and `docs/refactor/ddd-analysis-[timestamp].json`

## Reports Include

- 📊 **Summary Statistics**: File counts, violations, averages
- 🏗️ **Domain Services**: Top services with complexity metrics
- ⚠️ **Layer Violations**: Specific boundary crossing issues (e.g., lib/image-generator/domain/repositories/StatusCheckingRepository.ts: Direct layer boundary violation imports from lib/infrastructure/common/Result.ts)
- 📏 **Large Files**: Files exceeding size limits
- 🏢 **Entity Analysis**: Domain model structure
- 📦 **Recommendations**: Actionable improvement suggestions

Perfect for:
- Architecture reviews
- Refactoring planning
- DDD compliance checking
- Code quality monitoring
- Team onboarding documentation