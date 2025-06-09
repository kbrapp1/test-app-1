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

## Core Entities

### 1. `marketing_metrics_config`
Stores configuration of all marketing metrics and dimensions per organization.

| Field           | Type      | Description                                      |
|-----------------|-----------|--------------------------------------------------|
| id              | UUID      | Unique identifier                                |
| organization_id | UUID      | Organization identifier                          |
| metric_key      | TEXT      | Organization-defined field name                  |
| standard_key    | TEXT      | Internal normalized key (e.g., `campaign_roas`) |
| display_label   | TEXT      | Display name (e.g. "Campaign ROAS")             |
| category        | TEXT      | `platform`, `external`, `calculated`, `attribution` |
| metric_type     | TEXT      | `metric` or `dimension`                          |
| data_type       | TEXT      | `integer`, `float`, `string`, `boolean`, `date`, `currency` |
| aggregation     | TEXT      | `sum`, `avg`, `count`, `distinct`, `weighted_avg` |
| formula         | TEXT      | Optional expression (e.g., `revenue / ad_spend`) |
| source_tables   | TEXT[]    | Tables/views this metric depends on             |
| is_active       | BOOLEAN   | Toggles field visibility                         |
| alias_keys      | TEXT[]    | Optional list of alternate or legacy keys        |
| created_at      | TIMESTAMPTZ | Audit field                                  |
| updated_at      | TIMESTAMPTZ | Audit field                                  |

### 2. `unified_marketing_data`
Stores all marketing data with flexible JSONB schema for cross-platform analysis.

| Field             | Type        | Description                                   |
|-------------------|-------------|-----------------------------------------------|
| id                | UUID        | Primary key                                   |
| organization_id   | UUID        | Organization identifier                       |
| recorded_at       | TIMESTAMPTZ | Timestamp of the data row                     |
| data_source       | TEXT        | `platform_dam`, `platform_automation`, `meta_ads`, `google_ads`, `crm_salesforce`, etc. |
| source_category   | TEXT        | `platform_native`, `external_marketing`, `external_revenue`, `external_operational` |
| campaign_id       | UUID        | Optional link to campaign                     |
| customer_id       | UUID        | Optional link to customer                     |
| asset_id          | UUID        | Optional link to DAM asset                    |
| data_payload      | JSONB       | Flexible metric+dimension storage             |
| attribution_data  | JSONB       | Attribution model results                     |

### 3. `customer_journey_tracking`
Unified customer journey tracking across all touchpoints.

| Field                    | Type        | Description                                |
|--------------------------|-------------|--------------------------------------------|
| id                       | UUID        | Primary key                                |
| organization_id          | UUID        | Organization identifier                    |
| customer_id              | UUID        | Customer identifier                        |
| journey_start_date       | TIMESTAMPTZ | First known interaction                    |
| first_touch_campaign_id  | UUID        | Attribution to first campaign              |
| first_touch_asset_id     | UUID        | Attribution to first creative              |
| first_touch_source       | TEXT        | Channel of first interaction               |
| last_touch_campaign_id   | UUID        | Attribution to last campaign               |
| total_touchpoints        | INTEGER     | Number of interactions                     |
| acquisition_cost         | DECIMAL(10,2) | Total cost to acquire                    |
| lifetime_value           | DECIMAL(10,2) | Current customer LTV                     |
| current_stage            | TEXT        | Pipeline stage                             |
| journey_data             | JSONB       | All touchpoint details                     |

### 4. `revenue_attribution`
Multi-touch attribution linking marketing activities to revenue.

| Field                | Type        | Description                                      |
|----------------------|-------------|--------------------------------------------------|
| id                   | UUID        | Primary key                                      |
| organization_id      | UUID        | Organization identifier                          |
| customer_id          | UUID        | Customer identifier                              |
| campaign_id          | UUID        | Campaign attribution                             |
| asset_id             | UUID        | Creative asset attribution                       |
| touchpoint_sequence  | INTEGER     | Order in customer journey                        |
| attribution_model    | TEXT        | `first_touch`, `last_touch`, `linear`, `time_decay`, `position_based` |
| attribution_weight   | DECIMAL(5,4) | Weight for multi-touch models                   |
| revenue_amount       | DECIMAL(10,2) | Attributed revenue                             |
| transaction_date     | TIMESTAMPTZ | When revenue occurred                           |
| transaction_source   | TEXT        | CRM, POS, or platform source                    |

### 5. `marketing_report_views`
Stores saved report configurations for marketing analytics.

| Field            | Type        | Description                                    |
|------------------|-------------|------------------------------------------------|
| id               | UUID        | Unique report view ID                          |
| organization_id  | UUID        | Organization identifier                        |
| created_by_user  | UUID        | User who created the report                    |
| report_name      | TEXT        | Report title                                   |
| report_category  | TEXT        | `campaign_performance`, `asset_roi`, `customer_journey`, `roas_analysis` |
| dimensions       | TEXT[]      | Fields used for grouping                       |
| metrics          | TEXT[]      | Fields used for aggregation                    |
| filters          | JSONB       | Field-based filters                            |
| date_range       | JSONB       | Date range configuration                       |
| attribution_model| TEXT        | Attribution model for revenue metrics          |
| time_grain       | TEXT        | `hourly`, `daily`, `weekly`, `monthly`         |
| visibility       | TEXT        | `private`, `team`, `organization`              |
| schedule_config  | JSONB       | Automated report delivery                      |
| dashboard_config | JSONB       | Chart types and visualization settings         |
| created_at       | TIMESTAMPTZ | Timestamp                                      |

---

## API Endpoints

### Marketing Metrics Management
- `POST /api/marketing/metrics` - Create new metric or dimension
- `GET /api/marketing/metrics` - List all metrics for organization
- `PATCH /api/marketing/metrics/:id` - Update metric definition
- `DELETE /api/marketing/metrics/:id` - Deactivate metric

### Data Integration
- `POST /api/integrations/connect` - Connect external data source
- `GET /api/integrations/sources` - List connected data sources
- `POST /api/integrations/sync` - Trigger data sync
- `GET /api/integrations/sync-status` - Check sync status

### Campaign & Asset Analytics
- `GET /api/analytics/campaigns/:id/performance` - Campaign performance data
- `GET /api/analytics/assets/:id/roi` - Asset ROI analysis
- `GET /api/analytics/customer-journey/:customerId` - Customer journey details
- `POST /api/analytics/attribution/calculate` - Run attribution analysis

### Report Management
- `POST /api/reports/views` - Save new report configuration
- `GET /api/reports/views` - List saved reports
- `GET /api/reports/views/:id/data` - Execute report and return data
- `PATCH /api/reports/views/:id` - Update report configuration
- `POST /api/reports/views/:id/schedule` - Schedule automated delivery

### Dashboard & Visualization
- `GET /api/dashboard/widgets` - Available widget types
- `POST /api/dashboard/create` - Create custom dashboard
- `GET /api/dashboard/:id` - Load dashboard configuration
- `POST /api/dashboard/:id/export` - Export dashboard data

---

## UI Modules

### 1. Marketing Metrics Configuration
- **Metric Builder**: Create custom marketing metrics with formulas
- **Data Source Mapping**: Map external fields to internal standards
- **Attribution Model Setup**: Configure attribution windows and models
- **Platform Integration Panel**: Connect DAM, automation, and campaign data
- **External Source Manager**: Connect CRM, POS, and operational systems
- **Metric Categories**: Organize by platform vs external vs calculated
- **Validation Engine**: Real-time formula and dependency validation

### 2. Campaign Performance Analytics
- **Cross-Platform Campaign View**: Unified performance across Meta, Google, TikTok
- **Asset Performance Tracker**: ROI analysis for DAM creative assets
- **ROAS Calculator**: True return on ad spend with full attribution
- **Conversion Funnel**: Track from impression to revenue
- **A/B Test Results**: Compare creative and campaign variations
- **Audience Performance**: Analyze target audience effectiveness

### 3. Customer Journey Analyzer
- **Journey Visualization**: Timeline view of customer touchpoints
- **Attribution Modeling**: Compare different attribution models
- **Cohort Analysis**: Customer lifetime value by acquisition source
- **Retention Tracking**: Customer engagement over time
- **Pipeline Analytics**: Lead progression through sales stages

### 4. Self-Service Report Builder
- **Drag-and-Drop Interface**: Visual report building
- **Marketing Template Library**: Pre-built reports for common use cases
- **Custom Dashboard Creator**: Build marketing dashboards
- **Automated Insights**: AI-powered recommendations
- **Scheduled Reporting**: Automated delivery to stakeholders
- **Data Export Tools**: CSV, PDF, and API export options

### 5. Asset Performance Intelligence
- **Creative ROI Dashboard**: Performance of DAM assets across campaigns
- **Asset Usage Analytics**: Track asset utilization and effectiveness
- **Creative A/B Testing**: Compare asset performance variations
- **Brand Compliance Tracking**: Monitor brand guideline adherence
- **Asset Lifecycle Analysis**: From creation to retirement

---

## Time Grain & Attribution Logic

### Time Granularity Options
- **Real-time**: Live campaign performance (15-minute intervals)
- **Hourly**: Intraday optimization analysis
- **Daily**: Standard campaign reporting
- **Weekly**: Trend analysis and planning
- **Monthly**: Strategic performance review
- **Quarterly**: Executive reporting and forecasting

### Attribution Models
- **First-Touch**: Credit to first interaction
- **Last-Touch**: Credit to final interaction before conversion
- **Linear**: Equal credit across all touchpoints
- **Time-Decay**: More weight to recent interactions
- **Position-Based**: 40% first, 40% last, 20% middle interactions
- **Custom Weighted**: Organization-defined attribution weights

---

## Permissions & Access Control

| Role                  | Metrics Config | View Reports | Create Reports | Data Integration | Attribution Models |
|-----------------------|----------------|--------------|----------------|------------------|--------------------|
| Organization Admin    | Full Access    | All Reports  | Yes            | Yes              | Yes                |
| Marketing Manager     | View Only      | Team Reports | Yes            | View Status      | Use Existing       |
| Campaign Manager      | No Access      | Campaign Only| Campaign Only  | No Access        | Use Existing       |
| Analyst               | No Access      | All Reports  | Yes            | No Access        | Use Existing       |
| Viewer                | No Access      | Public Only  | No             | No Access        | View Only          |

---

## Data Source Integration Framework

### Platform Native Sources
- **DAM**: Asset usage, performance, ROI tracking
- **Marketing Automation**: Email opens, clicks, workflow completions
- **Digital Storefront**: Page views, form submissions, conversions
- **Campaign Manager**: Ad spend, impressions, clicks across platforms

### External Marketing Sources
- **Meta Ads API**: Campaign performance, audience insights
- **Google Ads API**: Search and display campaign data
- **TikTok Ads API**: Video campaign performance
- **LinkedIn Ads API**: B2B campaign analytics
- **Email Platforms**: Mailchimp, Constant Contact, etc.

### Revenue & Operational Sources
- **CRM Systems**: Salesforce, HubSpot, custom CRM data
- **POS Systems**: Shopify, Square, Stripe transaction data
- **Customer Service**: Ticket volume, satisfaction scores
- **Inventory Systems**: Stock levels, product costs, margins

---

## Standard Marketing Metrics Library

### Campaign Performance
- `campaign_spend`, `campaign_impressions`, `campaign_clicks`, `campaign_ctr`
- `campaign_conversions`, `campaign_conversion_rate`, `campaign_cpc`, `campaign_cpm`
- `campaign_roas`, `campaign_roi`, `campaign_frequency`, `campaign_reach`

### Customer Metrics
- `customer_acquisition_cost`, `customer_lifetime_value`, `customer_retention_rate`
- `lead_conversion_rate`, `pipeline_velocity`, `customer_journey_length`
- `average_order_value`, `repeat_purchase_rate`, `churn_rate`

### Asset Performance
- `asset_usage_count`, `asset_click_rate`, `asset_conversion_rate`
- `asset_roi`, `creative_fatigue_score`, `brand_compliance_score`

### Attribution Metrics
- `first_touch_revenue`, `last_touch_revenue`, `multi_touch_revenue`
- `assisted_conversions`, `attribution_weight`, `touchpoint_influence`

---

## Edge Cases & Technical Considerations

### Data Quality & Validation
- **Source Data Validation**: Ensure data integrity from external APIs
- **Attribution Window Management**: Handle varying attribution windows
- **Currency Normalization**: Standardize currency across international campaigns
- **Time Zone Handling**: Consistent timestamp management across sources
- **Duplicate Detection**: Prevent double-counting across data sources

### Performance Optimization
- **Data Aggregation**: Pre-compute common metrics for faster queries
- **Caching Strategy**: Cache frequently accessed report data
- **Query Optimization**: Efficient JSONB indexing for flexible schema
- **Real-time Updates**: Balance freshness with performance

### Scalability Requirements
- **Multi-tenant Architecture**: Isolate organization data
- **API Rate Limiting**: Manage external API usage efficiently
- **Storage Optimization**: Efficient storage of high-volume marketing data
- **Compute Scaling**: Handle complex attribution calculations

---

## Future Enhancements

### Phase 1 Extensions
- **Predictive Analytics**: AI-powered campaign performance forecasting
- **Automated Optimization**: AI recommendations for campaign improvements
- **Advanced Attribution**: Machine learning attribution models
- **Competitive Intelligence**: Market benchmark comparisons

### Phase 2 Capabilities
- **Cross-Channel Attribution**: Unified attribution across online/offline channels
- **Customer Persona Analytics**: Behavior-based customer segmentation
- **Brand Sentiment Integration**: Social listening and sentiment analysis
- **Marketing Mix Modeling**: Advanced statistical attribution models

### Long-term Vision
- **Agentic Reporting**: AI agents that generate insights automatically
- **Natural Language Queries**: Ask questions in plain English
- **Automated Campaign Creation**: AI-generated campaigns based on performance data
- **Integrated Marketing Automation**: Closed-loop optimization across all channels
