
# Functional Specification Document (FSD)

## Feature Name
Self-Service Reporting Schema: Dimensions & Metrics Setup

---

## Purpose

Define the technical implementation of a self-service schema configuration feature that allows customer admins to manage dimensions and metrics used in reporting dashboards. This is part of a broader agency-as-a-platform solution supporting marketing analytics across verticals. The system must support schema flexibility, cross-customer standardization, and extensible reporting logic.

---

## Entities

### 1. `customer_metrics`
Stores configuration of all metrics and dimensions per customer.

| Field           | Type      | Description                                      |
|-----------------|-----------|--------------------------------------------------|
| id              | UUID      | Unique identifier                                |
| customer_id     | TEXT      | Tenant identifier                                |
| key             | TEXT      | Customer-defined field name                      |
| standard_key    | TEXT      | Internal normalized key (e.g., `revenue_per_unit`) |
| label           | TEXT      | Display name (e.g. “Form Fills”)                 |
| type            | TEXT      | `metric` or `dimension`                          |
| data_type       | TEXT      | `integer`, `float`, `string`, `boolean`, `date` |
| aggregation     | TEXT      | `sum`, `avg`, `count`, `distinct`, etc.         |
| formula         | TEXT      | Optional expression (e.g., `spend / leads`)      |
| active          | BOOLEAN   | Toggles field visibility                         |
| alias_keys      | TEXT[]    | Optional list of alternate or legacy keys        |
| created_at      | TIMESTAMPTZ | Audit field                                  |
| updated_at      | TIMESTAMPTZ | Audit field                                  |

---

### 2. `raw_marketing_data`
Stores ingested marketing data with flexible JSONB schema.

| Field        | Type        | Description                                   |
|--------------|-------------|-----------------------------------------------|
| id           | UUID        | Primary key                                   |
| customer_id  | TEXT        | Tenant ID                                     |
| recorded_at  | TIMESTAMPTZ | Timestamp of the data row                     |
| source       | TEXT        | Data source (e.g. 'meta', 'google')           |
| data         | JSONB       | Arbitrary key/value metric+dimension storage  |

---

### 3. `customer_report_views`
Stores saved report configurations.

| Field        | Type      | Description                                    |
|--------------|-----------|------------------------------------------------|
| id           | UUID      | Unique report view ID                          |
| customer_id  | TEXT      | Tenant ID                                      |
| name         | TEXT      | View title                                     |
| dimensions   | TEXT[]    | Fields used for grouping                       |
| metrics      | TEXT[]    | Fields used for aggregation                    |
| filters      | JSONB     | Field-based filters (e.g., `channel = meta`)   |
| visibility   | TEXT      | `private`, `shared`, or `org-wide`             |
| schedule     | TEXT      | Optional cron-like format                      |
| created_at   | TIMESTAMPTZ | Timestamp                                    |

---

## APIs

### `POST /metrics`
Create a new metric or dimension.

### `GET /metrics`
List all metrics/dimensions for the current customer.

### `PATCH /metrics/:id`
Update metric definition (rename, toggle, etc.)

### `GET /report-view/:id`
Retrieve a saved report and all associated config.

### `POST /report-view`
Save a new report view configuration.

---

## UI Modules

### 1. Schema Configuration UI
- Field creation/edit drawer
- Field type selector (`metric`, `dimension`)
- Aggregation selector (only for `metric`)
- Formula builder (optional with validation)
- Toggle: `Active` / `Inactive`
- Map to standard internal field (`standard_key`)
- Reorder for display priority

### 2. Report Builder
- Dimension and metric picker (based on active fields)
- Filter controls (e.g., source = 'meta', region = 'Southeast')
- Time grain toggle: Transactional / Daily / Monthly
- Visual preview: table, chart, KPIs
- Save as View (name, description, visibility)

---

## Time Grain Logic

- `transactional`: raw rows from `raw_marketing_data`
- `daily`: `GROUP BY date_trunc('day', recorded_at)`
- `monthly`: `GROUP BY date_trunc('month', recorded_at)`
- Rollups can be materialized or computed on the fly

---

## Permissions

| Role             | Can Define Schema | Can View Reports | Can Save Views |
|------------------|-------------------|------------------|----------------|
| Customer Admin   | Yes               | Yes              | Yes            |
| Account Manager  | No                | Yes              | Yes            |
| Viewer           | No                | Yes              | No             |

---

## Schema Registry Logic

- Use `standard_key` to unify internal logic across industries
- Map per-customer `key` to internal standards (e.g., `purchase_price` → `revenue_per_unit`)
- Support `alias_keys` to allow for soft migration and backward compatibility
- Query layer dynamically resolves per-customer keys at runtime

---

## Edge Cases & Considerations

- Formula dependencies must be validated on save
- Schema changes should trigger update check on saved views
- Legacy fields (renamed or deprecated) should be soft-aliased if used
- Support for vertical templates to preload schema definitions
- Avoid reliance on external tools like dbt or Cube.dev for schema abstraction

---

## Future Enhancements

- Schema versioning history
- AI-suggested metrics/dimensions per vertical
- Import from CSV field headers
- Dynamic formula preview with sample data
