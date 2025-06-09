# JSONB Indexing Strategy for Feature Flags

**Optimizing PostgreSQL JSONB performance for feature flag operations and analytics.**

---

## 🎯 **Overview**

PostgreSQL's JSONB provides powerful indexing capabilities that can **dramatically improve** feature flag lookup performance and enable sophisticated reporting queries. With proper indexing, feature flag operations can achieve **sub-millisecond response times** even with thousands of organizations.

### **Current Performance Baseline**
- ❌ **No JSONB indexes** on `organizations.feature_flags`
- ❌ **Sequential scans** for feature flag queries
- ❌ **Limited reporting capabilities** without efficient JSONB access

### **Target Performance Goals**
- ✅ **< 1ms response time** for individual flag checks
- ✅ **Efficient bulk operations** for admin UI
- ✅ **Fast analytics queries** for reporting dashboards
- ✅ **Scalable to 10,000+ organizations**

---

## 🏗️ **JSONB Index Types for Feature Flags**

### **1. GIN Index (Most Important)**

**Purpose:** Fast containment and existence queries

```sql
-- Primary JSONB index for feature flags
CREATE INDEX idx_organizations_feature_flags_gin 
ON organizations USING GIN (feature_flags);
```

**Benefits:**
- ✅ Fast `WHERE feature_flags ? 'dam'` (key existence)
- ✅ Fast `WHERE feature_flags @> '{"tts": true}'` (containment)
- ✅ Supports complex JSONB operators
- ✅ Excellent for admin UI bulk operations

**Use Cases:**
```sql
-- Find all orgs with DAM enabled (Admin UI)
SELECT id, name FROM organizations 
WHERE feature_flags @> '{"dam": true}';

-- Find orgs with ANY feature enabled (Analytics)
SELECT id, name FROM organizations 
WHERE feature_flags != '{}';

-- Find orgs with specific features (Reporting)
SELECT id, name FROM organizations 
WHERE feature_flags ?| array['dam', 'tts'];
```

### **2. Expression Indexes (Specific Flags)**

**Purpose:** Ultra-fast queries for specific feature flags

```sql
-- Individual feature flag indexes
CREATE INDEX idx_organizations_dam_enabled 
ON organizations ((feature_flags->>'dam')) 
WHERE (feature_flags->>'dam')::boolean = true;

CREATE INDEX idx_organizations_tts_enabled 
ON organizations ((feature_flags->>'tts')) 
WHERE (feature_flags->>'tts')::boolean = true;

-- Generic pattern for new features
CREATE INDEX idx_organizations_<feature>_enabled 
ON organizations ((feature_flags->>'<feature>')) 
WHERE (feature_flags->>'<feature>')::boolean = true;
```

**Benefits:**
- ✅ **Fastest possible** lookups for specific flags
- ✅ **Minimal index size** (only enabled orgs indexed)
- ✅ **Perfect for** current feature flag checking pattern
- ✅ **Supports sorting** and aggregation

**Use Cases:**
```sql
-- Lightning-fast flag checking (current pattern)
SELECT EXISTS(
  SELECT 1 FROM organizations o
  JOIN user_organization_context uoc ON o.id = uoc.active_organization_id
  WHERE uoc.user_id = auth.uid() 
  AND (o.feature_flags->>'dam')::boolean = true
);

-- Count enabled organizations per feature
SELECT count(*) FROM organizations 
WHERE (feature_flags->>'dam')::boolean = true;
```

### **3. Composite Indexes (Advanced)**

**Purpose:** Multi-dimensional queries for analytics

```sql
-- Feature flags + organization metadata
CREATE INDEX idx_organizations_flags_created 
ON organizations USING GIN (feature_flags, created_at);

-- Support for time-based feature analysis
CREATE INDEX idx_organizations_flags_updated 
ON organizations (updated_at, feature_flags) 
WHERE feature_flags != '{}';
```

---

## 🚀 **Recommended Implementation Strategy**

### **Phase 1: Core Performance (Immediate)**

**Priority 1: GIN Index**
```sql
-- Essential for admin UI and reporting
CREATE INDEX CONCURRENTLY idx_organizations_feature_flags_gin 
ON organizations USING GIN (feature_flags);
```

**Priority 2: Current Features**
```sql
-- Optimize existing feature flag checks
CREATE INDEX CONCURRENTLY idx_organizations_dam_enabled 
ON organizations ((feature_flags->>'dam')) 
WHERE (feature_flags->>'dam')::boolean = true;

CREATE INDEX CONCURRENTLY idx_organizations_tts_enabled 
ON organizations ((feature_flags->>'tts')) 
WHERE (feature_flags->>'tts')::boolean = true;
```

### **Phase 2: Analytics Support (Next Sprint)**

**Reporting & Dashboard Queries**
```sql
-- Support feature adoption analytics
CREATE INDEX CONCURRENTLY idx_organizations_any_features 
ON organizations (created_at) 
WHERE feature_flags != '{}';

-- Support feature usage trends
CREATE INDEX CONCURRENTLY idx_organizations_feature_count 
ON organizations ((jsonb_object_keys(feature_flags))) 
WHERE feature_flags != '{}';
```

### **Phase 3: Advanced Analytics (Future)**

**Complex Reporting Queries**
```sql
-- Multi-feature analysis
CREATE INDEX CONCURRENTLY idx_organizations_feature_combinations 
ON organizations USING GIN (
  (SELECT array_agg(key ORDER BY key) 
   FROM jsonb_object_keys(feature_flags) AS key)
);
```

---

## 📊 **Performance Impact Analysis**

### **Query Performance Improvements**

| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| **Single Flag Check** | ~5-20ms | <1ms | **95% faster** |
| **Bulk Admin Queries** | ~100-500ms | ~5-10ms | **98% faster** |
| **Analytics Aggregations** | ~1-5s | ~50-100ms | **95% faster** |
| **Feature Reporting** | Not feasible | ~10-50ms | **New capability** |

### **Storage Overhead**

```sql
-- Estimate index sizes (approximate)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE tablename = 'organizations';
```

**Expected Index Sizes:**
- **GIN Index**: ~5-15% of table size
- **Expression Indexes**: ~1-3% per feature
- **Total Overhead**: ~10-25% additional storage

---

## 🔧 **Implementation Migration**

### **Migration Script Template**

```sql
-- Feature Flag JSONB Indexing Migration
-- Run with CONCURRENTLY to avoid blocking operations

BEGIN;

-- 1. Primary GIN index for general JSONB operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_feature_flags_gin 
ON organizations USING GIN (feature_flags);

-- 2. Specific feature indexes for ultra-fast lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_dam_enabled 
ON organizations ((feature_flags->>'dam')) 
WHERE (feature_flags->>'dam')::boolean = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_tts_enabled 
ON organizations ((feature_flags->>'tts')) 
WHERE (feature_flags->>'tts')::boolean = true;

-- 3. Analytics support indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_has_features 
ON organizations (created_at) 
WHERE feature_flags != '{}';

-- Add comments for maintenance
COMMENT ON INDEX idx_organizations_feature_flags_gin IS 
  'GIN index for fast JSONB feature flag queries and admin operations';

COMMENT ON INDEX idx_organizations_dam_enabled IS 
  'Partial index for lightning-fast DAM feature flag checks';

COMMENT ON INDEX idx_organizations_tts_enabled IS 
  'Partial index for lightning-fast TTS feature flag checks';

COMMIT;
```

### **Adding New Feature Indexes**

```sql
-- Template for new features
CREATE INDEX CONCURRENTLY idx_organizations_<feature_name>_enabled 
ON organizations ((feature_flags->>'<feature_name>')) 
WHERE (feature_flags->>'<feature_name>')::boolean = true;

-- Example for new 'api_access' feature
CREATE INDEX CONCURRENTLY idx_organizations_api_access_enabled 
ON organizations ((feature_flags->>'api_access')) 
WHERE (feature_flags->>'api_access')::boolean = true;
```

---

## 📈 **Advanced Query Patterns**

### **Admin UI Queries (Ultra-Fast)**

```sql
-- Get all organizations with feature status (Admin Dashboard)
SELECT 
  o.id,
  o.name,
  o.feature_flags->>'dam' as dam_enabled,
  o.feature_flags->>'tts' as tts_enabled,
  jsonb_object_keys(o.feature_flags) as enabled_features
FROM organizations o
ORDER BY o.name;

-- Bulk feature operations (Admin Actions)
UPDATE organizations 
SET feature_flags = feature_flags || '{"new_feature": true}'
WHERE feature_flags @> '{"dam": true}';  -- Only premium orgs
```

### **Analytics & Reporting Queries**

```sql
-- Feature adoption over time
SELECT 
  date_trunc('month', created_at) as month,
  count(*) as total_orgs,
  count(*) FILTER (WHERE feature_flags ? 'dam') as dam_orgs,
  count(*) FILTER (WHERE feature_flags ? 'tts') as tts_orgs
FROM organizations 
GROUP BY date_trunc('month', created_at)
ORDER BY month;

-- Feature combination analysis
SELECT 
  CASE 
    WHEN feature_flags @> '{"dam": true, "tts": true}' THEN 'Premium'
    WHEN feature_flags @> '{"dam": true}' THEN 'Business'
    WHEN feature_flags = '{}' THEN 'Free'
    ELSE 'Custom'
  END as tier,
  count(*) as org_count
FROM organizations
GROUP BY tier;

-- Feature usage trends
WITH feature_stats AS (
  SELECT 
    key as feature_name,
    count(*) as enabled_count,
    round(count(*) * 100.0 / (SELECT count(*) FROM organizations), 2) as adoption_rate
  FROM organizations,
  LATERAL jsonb_object_keys(feature_flags) AS key
  GROUP BY key
)
SELECT * FROM feature_stats ORDER BY enabled_count DESC;
```

### **Performance Monitoring Queries**

```sql
-- Index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
WHERE tablename = 'organizations'
ORDER BY idx_scan DESC;

-- Query performance analysis
EXPLAIN (ANALYZE, BUFFERS) 
SELECT count(*) FROM organizations 
WHERE feature_flags @> '{"dam": true}';
```

---

## 🛠️ **Maintenance & Monitoring**

### **Index Health Checks**

```sql
-- Check index bloat
SELECT 
  indexname,
  round(100 * (pg_relation_size(indexrelid) - pg_relation_size(indexrelid, 'vm_size')) / pg_relation_size(indexrelid), 2) as bloat_percentage
FROM pg_stat_user_indexes 
WHERE tablename = 'organizations';

-- Rebuild indexes if needed (during maintenance window)
REINDEX INDEX CONCURRENTLY idx_organizations_feature_flags_gin;
```

### **Performance Monitoring**

```sql
-- Track query performance trends
CREATE VIEW feature_flag_query_performance AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%feature_flags%'
ORDER BY total_time DESC;
```

---

## 🚦 **Implementation Checklist**

### **Pre-Implementation**
- [ ] **Backup database** before creating indexes
- [ ] **Analyze current query patterns** with EXPLAIN
- [ ] **Estimate storage requirements** for new indexes
- [ ] **Plan maintenance window** for CONCURRENTLY operations

### **Phase 1 Implementation**
- [ ] **Create GIN index** for general JSONB operations
- [ ] **Create expression indexes** for DAM and TTS features
- [ ] **Test query performance** improvements
- [ ] **Update application code** to leverage new indexes

### **Phase 2 Implementation** 
- [ ] **Add analytics indexes** for reporting queries
- [ ] **Implement admin UI** queries using new indexes
- [ ] **Create monitoring views** for index health
- [ ] **Document query patterns** for team

### **Ongoing Maintenance**
- [ ] **Monitor index usage** via pg_stat_user_indexes
- [ ] **Add indexes for new features** as they're implemented
- [ ] **Regular performance reviews** and optimization
- [ ] **Update documentation** as patterns evolve

---

## 📚 **Additional Resources**

### **PostgreSQL JSONB Documentation**
- [JSONB Indexing](https://www.postgresql.org/docs/current/datatype-json.html#id-1.5.7.22.18)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin-intro.html)
- [JSONB Operators](https://www.postgresql.org/docs/current/functions-json.html)

### **Performance Optimization**
- [Index-Only Scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html)
- [Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [Query Planning](https://www.postgresql.org/docs/current/using-explain.html)

---

**Next Steps:** Implement Phase 1 indexes to unlock immediate performance improvements for feature flag operations and enable the admin UI development. 