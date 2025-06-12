# Functional Specification Document (FSD)
**Version 2.0 - Updated for Comprehensive Marketing Platform**

## Feature Name
Marketing Analytics Platform: Self-Service Reporting & ROAS Attribution System

---

## Purpose

Define the technical implementation of a comprehensive marketing analytics platform that unifies data from **all marketing touchpoints** - from creative assets and campaigns to customer revenue and operational metrics. This system enables marketing teams to build custom reports, track true ROAS, analyze customer journeys, and measure creative performance across the entire marketing ecosystem.

### **Platform Integration Context**
This reporting system serves as the analytics backbone for our marketing platform:
- **DAM Integration**: Track creative asset performance and ROI
- **Marketing Automation**: Analyze campaign workflows and nurture sequences  
- **Digital Storefront**: Monitor landing page conversions and form submissions
- **Ad Campaign Management**: Unify performance across Meta, Google, TikTok, LinkedIn
- **CRM Light**: Customer lifecycle tracking and attribution modeling
- **Agentic Processes**: AI-powered insights and automated reporting
- **External Data Sources**: CRM, POS, and operational data for complete ROAS picture

---

## ⚙️ Layered Architecture Overview

### 1. Domain Layer (Business Logic)

**Purpose**: Core business rules, validation, and decision logic. No awareness of infrastructure or frameworks.

**Includes:**

* `entities/`: Core business objects with identity and logic.
* `value-objects/`: Immutable objects that encapsulate validations.
* `services/`: Stateless domain services that execute domain rules.
* `repositories/`: Interfaces only – define how entities are stored/retrieved.
* `events/`: Domain events to signal state changes.
* `specifications/`: Complex rule definitions (e.g., filters).

📁 `lib/{domain}/domain/`

---

### 2. Application Layer (Use Cases & Coordination)

**Purpose**: Orchestrates domain logic, mediates input/output, enforces use case boundaries. Stateless.

**Includes:**

* `use-cases/`: Classes/functions that orchestrate workflows.
* `services/`: Coordination logic between domain elements.
* `dto/`: Data Transfer Objects for input/output across layers.
* `commands/queries/`: CQRS support (separate reads/writes).
* `mappers/`: Transforms between DTOs, entities, persistence.

📁 `lib/{domain}/application/`

---

### 3. Infrastructure Layer (External Systems)

**Purpose**: Implements interfaces from the domain layer. Contains impure logic – DB access, API calls, storage.

**Includes:**

* `persistence/`: DB implementations of repositories.
* `providers/`: API clients and 3rd-party integrations.
* `storage/`: File, media, or object storage.
* `composition/`: Dependency injection and service wiring.

📁 `lib/{domain}/infrastructure/`

---

### 4. Interface Layer (Presentation & APIs)

**Purpose**: Entry points into the system – UI actions, API routes, and scheduled jobs.

**Includes:**

* `actions/`: Next.js server actions.
* `hooks/`: React client logic that calls server actions.
* `components/`: UI components using ViewModels.
* `types/`: UI-specific models and contracts.
* `pages/` or `routes/`: Next.js App Router or API routes.

📁 `lib/{domain}/presentation/`
📁 `app/(protected)/{feature}/`
📁 `app/api/{feature}/`

---

## 📊 Flexible Metric Reporting Schema

**Problem**: Customers in different industries use different metrics and dimensions. How do we normalize for reporting?

### Core Tables

#### `metric_values`

Tall-table schema to store all metrics in a flexible way.

```sql
CREATE TABLE metric_values (
  id SERIAL PRIMARY KEY,
  customer_id UUID NOT NULL,
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  source TEXT,
  dimensions JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `dimension_mappings`

Maps customer-specific dimension keys to normalized keys.

```sql
CREATE TABLE dimension_mappings (
  customer_id UUID NOT NULL,
  raw_key TEXT NOT NULL,
  standard_key TEXT NOT NULL,
  PRIMARY KEY (customer_id, raw_key)
);
```

#### `metric_definitions`

Defines and documents the metric taxonomy.

```sql
CREATE TABLE metric_definitions (
  metric_name TEXT PRIMARY KEY,
  display_name TEXT,
  description TEXT,
  category TEXT,
  format TEXT,
  is_percentage BOOLEAN
);
```

---

## 📦 Composition Root Pattern

**Location**: `lib/{domain}/infrastructure/composition/`

Wires together concrete dependencies:

```ts
export class TtsCompositionRoot {
  private static _service: TtsApplicationService | null = null;

  static getService(): TtsApplicationService {
    if (!this._service) {
      const repo = new TtsPredictionSupabaseRepository();
      const engine = new ConcreteTtsGenerationService();
      const prediction = new TtsPredictionService(repo);
      this._service = new TtsApplicationService(repo, engine, prediction);
    }
    return this._service;
  }
}
```

---

## 🔄 End-to-End Flow

```txt
User Action → Server Action → Application Service → Use Case → Domain Service
       ↓            ↓                  ↓                 ↓           ↓
    (UI)     (Interface Layer)  (Application Layer)  (Domain)   (Infra: DB/API)
```

---

## 📋 Naming Conventions

* **Directories**: kebab-case → `use-cases`, `value-objects`
* **Components**: PascalCase → `DateFilterPanel.tsx`
* **Services/Utilities**: camelCase → `reportService.ts`
* **Entities/Models**: Singular, domain-relevant → `Generation.ts`

---

## ✅ Best Practices

* No business logic in server actions or API routes.
* Use DTOs at every boundary.
* Test each layer in isolation.
* Composition root centralizes dependency management.
* Use `metric_definitions` and `dimension_mappings` to decouple reporting logic.

---

## 🧱 Recommended Structure

```
lib/{domain}/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   ├── events/
│   ├── specifications/
│   └── repositories/
├── application/
│   ├── use-cases/
│   ├── services/
│   ├── dto/
│   ├── commands/
│   ├── queries/
│   └── mappers/
├── infrastructure/
│   ├── persistence/
│   ├── providers/
│   ├── storage/
│   └── composition/
└── presentation/
    ├── components/
    ├── hooks/
    ├── actions/
    └── types/
```

---

This format ensures that your architecture remains testable, maintainable, scalable—and most importantly, adaptable to any customer or industry.
