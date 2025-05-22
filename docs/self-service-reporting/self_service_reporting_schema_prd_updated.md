
# Product Requirements Document (PRD)

## Feature Name
Self-Service Reporting Schema: Dimensions & Metrics Setup

---

## Overview

This feature empowers customer admins (or internal onboarding teams) to define a flexible reporting schema — including dimensions, metrics, data types, and aggregations — tailored to their business logic. This schema powers dashboards, automation rules, and insights across marketing channels (e.g., Meta, Google, TikTok). It is optimized for multi-unit businesses in QSR, health & wellness, home services, and similar industries.

---

## Objectives

- Allow admins to define their own dimensions and metrics via a clean UI
- Support vertical-specific default schema templates to accelerate onboarding
- Enable formula-based metrics (e.g. `spend / leads`)
- Support transactional, daily, and monthly views via time grain toggling
- Ensure compatibility across diverse marketing data sources and business models
- Provide visibility controls, versioning, and safe schema evolution
- Power all dashboards and reporting features off the defined schema

---

## Target Users

- **Customer Admins**: Configure and manage the reporting schema
- **Internal Onboarding Teams**: Set up schema on behalf of non-technical clients
- **Marketing Teams / Franchise Ops**: Consume dashboards built on schema
- **Account Managers**: Share, monitor, and optimize based on schema-defined reports

---

## Supported Verticals

Schema system must support metric definitions across:
- **QSR / Restaurant**: orders, online sales, foot traffic, cost per order
- **Health & Wellness**: new patients, appointments, leads, cost per lead
- **Home Services**: calls, quotes sent, job completions, conversion rates

---

## Success Criteria

- 100% of customers have a working schema on day 1 via template or manual setup
- Dashboard performance < 1.5s load time for MoM reporting
- Customers with >10 locations can filter, group, and drill down by defined dimensions
- >80% of clients create or modify a report view within 30 days

---

## Scope

### In Scope
- Schema setup UI: define dimensions, metrics, types, aggregations, and formulas
- Prebuilt schema templates per vertical (QSR, wellness, home services)
- API ingestion of Meta/Google data mapped to schema fields
- Time-grain support: transactional, daily, monthly
- Save/share dashboards powered by schema-defined fields
- Schema registry layer to resolve customer-defined keys to internal standard keys

### Out of Scope (Phase 1)
- AI-generated metric recommendations
- Customer-facing API for schema sync
- Multi-language support
- Use of external schema modeling SDKs (e.g., dbt, Cube.dev)

---

## Functional Requirements

### 1. Schema Definition (DIY or Internal Admin)
- Create/edit **dimensions** (e.g., `clinic_id`, `region`, `campaign_type`)
- Create/edit **metrics** (e.g., `leads`, `spend`, `appointments`)
- Set:
  - **Field type**: `metric` or `dimension`
  - **Data type**: `integer`, `float`, `string`, `date`, `boolean`
  - **Aggregation**: `sum`, `avg`, `count`, `distinct`, etc.
  - **Formula**: support simple expressions (e.g., `spend / leads`)
  - **Visibility toggle**: shown or hidden in reporting UI
  - **Standard Key Mapping**: map each metric to a universal internal standard key
- Store in: `customer_metrics` table

### 2. Schema Templates
- Provide vertical-specific templates (editable after import)
- Templates include standard fields + best-practice aggregations

### 3. Data Ingestion & Mapping
- Daily ingestion from Meta/Google/TikTok
- Enrich with:
  - `source`, `channel`, `campaign_name`, `recorded_at`
- Store in: `raw_marketing_data` (JSONB)
- (Future) Allow customers to map CSV/webhook fields to schema

### 4. Time Grain Support
- Customers can toggle:
  - **Transactional** (raw events)
  - **Daily** (aggregated view)
  - **Monthly** (summarized trends)
- Powered via dynamic SQL using `date_trunc()` and/or rollup tables

### 5. Dashboard + Report Builder
- Field picker based on schema
- Filtering, grouping, sorting
- Save/share views
- Calculate MoM changes automatically

---

## Non-Functional Requirements

- Scalable to 100+ customers with 1M+ records each
- Rollups computed on ingestion or via CRON batch
- Changes to field definitions tracked and versioned
- All schema changes reflected in saved dashboards

---

## Schema Change Handling

- Admins can rename, disable, or recalculate metrics
- If a saved report uses a deprecated field:
  - Flag the report with a warning
  - Optionally auto-update using alias/version metadata

---

## Default Schema Templates (Example)

### QSR Template
- Dimensions: `location_id`, `region`, `order_type`
- Metrics: `orders`, `spend`, `cost_per_order`, `roi`

### Health & Wellness Template
- Dimensions: `clinic_id`, `channel`, `provider_type`
- Metrics: `leads`, `appointments`, `CPL`, `revenue`

### Home Services Template
- Dimensions: `franchise_id`, `zip_code`, `service_type`
- Metrics: `calls`, `quotes`, `jobs_booked`, `conversion_rate`

---

## Milestones (Suggested)

| Milestone                              | Timeline |
|----------------------------------------|----------|
| Schema config model + API              | Week 1   |
| Admin UI to manage metrics/dimensions  | Week 2   |
| Template import & customization        | Week 3   |
| Marketing data ingestion setup         | Week 4   |
| Time-grain toggling in reporting       | Week 5   |
| MoM logic + saved reports              | Week 6   |
| QA and internal pilot                  | Week 7   |

---

## Open Questions

- Should we allow customers to create calculated fields from other calculated fields?
- Do we need role-based access for schema editing vs report viewing?
- Should we version templates for audit/history purposes?
