# DDD Domain Layer Violations Audit

Analyzes Domain Layer violations and DDD compliance focused on domain boundary integrity.

## Usage

```
/domain-violations-audit [domain]
```

## Script Execution

**Claude should run:** `node scripts/domain-analyzer.js [domain]`

## Parameters

- `domain` (optional): Specific domain to analyze (e.g., "chatbot-widget", "dam", "auth", "image-generator", "tts")
- If no domain specified, analyzes all domains

## Examples

```bash
# Analyze all domains
/domain-violations-audit

# Analyze specific domain
/domain-violations-audit chatbot-widget
/domain-violations-audit dam
/domain-violations-audit auth
```

## What It Analyzes (Domain Layer Focus)

- **Domain Services**: Count, complexity, async usage patterns
- **Domain Entities**: Properties and methods analysis  
- **Domain Value Objects**: Count and usage patterns
- **Domain Layer Boundaries**: Domain → Application/Infrastructure violation detection
- **Domain File Sizes**: Golden rule compliance (250 line limit)
- **Infrastructure Leaks**: Domain services importing from Application/Infrastructure layers

## Key Focus: Domain Layer Integrity

**Primary Analysis**: Files in `/domain/` directories only
- ✅ Detects Domain → Application imports (violates DDD)
- ✅ Detects Domain → Infrastructure imports (violates DDD)  
- ✅ Identifies async methods in domain services (potential infrastructure leaks)
- ❌ Does not analyze Application/Infrastructure/Presentation layer violations

## Output

Results are saved to `docs/refactor/domain-analysis-[timestamp].md` and `docs/refactor/domain-analysis-[timestamp].json`

## Reports Include

- 📊 **Domain Statistics**: Domain service counts, entity analysis, value object counts
- 🏗️ **Domain Services**: Service complexity, async method detection, line counts
- ⚠️ **Domain Boundary Violations**: Domain layer importing from Application/Infrastructure
  - Example: `monitoring/BusinessImpactCalculationService.ts: imports from ../../../application/dto/PerformanceTrackingDTO`
- 📏 **Domain File Sizes**: Files in domain layer exceeding 250-line golden rule
- 🏢 **Domain Model Analysis**: Entity structure, methods, properties
- 📦 **Domain Recommendations**: Domain-specific refactoring suggestions

## Perfect For

- **Domain Layer Refactoring**: Focus specifically on domain boundary violations
- **DDD Domain Compliance**: Ensure domain layer doesn't depend on outer layers
- **Domain Service Analysis**: Identify overly complex or leaky domain services
- **Domain Model Review**: Analyze entity and value object structure
- **Clean Architecture**: Maintain proper dependency direction (outer → inner)

## Not Covered

- Application layer boundary violations
- Infrastructure layer coupling issues  
- Presentation layer dependency violations
- Cross-layer communication patterns