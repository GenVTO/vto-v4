# Try-On Analytics (Database Layer)

## Goal

This document defines the analytics scope added at the database level to understand:

- How each Shopify tenant is using try-on.
- How the overall platform is performing globally.

The scope in this phase is **database-only** (views + indexes). No API/UI wiring is required yet.

## Source of Truth & Schema Context

The analytics layer is computed from existing operational tables. This section provides context for AI agents to understand the underlying data structure.

### Source Tables

- **`public.tryon_jobs`**: Core job table.
  - `id` (uuid): Primary key.
  - `tenant_id` (uuid): Foreign key to `tenants`.
  - `status` (text): Current state of the job.
  - `model` (text): AI model used (e.g., 'kling-v1').
  - `created_at` (timestamptz): Creation timestamp.
  - `updated_at` (timestamptz): Last update timestamp.
  - `failure_reason_normalized` (text): Categorized error code.
  - `credits_charged` (int): Credits consumed by this job.
- **`public.credit_ledgers`**: Credit transaction history.
  - `tenant_id` (uuid): Owner of the credits.
  - `event_type` (text): Type of transaction (e.g., 'charge', 'refund').
- **`public.tenants`**: Tenant registry.
  - `id` (uuid): Primary key.
  - `shop_domain` (text): Shopify domain (e.g., 'example.myshopify.com').

### Key Enums & Constants

**Job Statuses (`status`):**

- **Active (In-Flight):** `queued`, `processing`
- **Terminal (Final):** `completed`, `failed`, `provider_expired`

**Metric Logic:**

- **Success Rate:** `completed / (completed + failed + provider_expired)`
- **Lifecycle:** `updated_at - created_at` (only for terminal states).
- **Date Bucketing:** Uses `timezone('utc', created_at)::date`.

## Security Model

All analytics views are created with:

- `WITH (security_invoker = true)`

This ensures query permissions and RLS are evaluated as the querying role (not the view owner).

**Implications:**

- Tenant-scoped clients naturally see only their own tenant rows through RLS.
- Global analytics are meaningful for service/admin roles that have cross-tenant visibility.

## Migration

Added in: `libs/supabase-db/supabase/migrations/20260222152000_add_tryon_analytics_views.sql`

## New Indexes

To keep analytics queries responsive:

- `tryon_jobs_tenant_status_created_idx`
- `tryon_jobs_tenant_model_created_idx`
- `tryon_jobs_status_created_idx`
- `tryon_jobs_failure_reason_idx`
- `credit_ledgers_tenant_event_created_idx`

## Analytics Views Definitions

### 1. Base Enriched View (`public.tryon_jobs_enriched_v`)

The foundation for all metrics. Pre-calculates flags and derived fields to simplify downstream queries.

**Derived Fields:**

- `created_day_utc`: UTC date for daily aggregation.
- `lifecycle_seconds`: Duration for terminal jobs (`greatest(extract(epoch from (updated_at - created_at)), 0)`).
- `is_completed`: `status = 'completed'`
- `is_failed`: `status IN ('failed', 'provider_expired')`
- `is_provider_expired`: `status = 'provider_expired'`
- `is_in_flight`: `status IN ('queued', 'processing')`
- `is_credits_charged`: `credits_charged > 0`

### 2. Tenant-Facing Views (Shopify Shop Owners)

Views designed for tenant dashboards. Automatically filtered by RLS.

**`public.tenant_tryon_overview_v`**
_Current KPI snapshot per tenant._

- **Volume:** `total_jobs`, `jobs_last_24h`, `jobs_last_7d`
- **Outcomes:** `completed_jobs`, `failed_jobs`, `provider_expired_jobs`, `in_flight_jobs`
- **Performance:** `terminal_success_rate_pct`, `avg_lifecycle_seconds_completed`, `p95_lifecycle_seconds_completed`
- **Credits:** `available_credits`, `reserved_or_spent_credits`

**`public.tenant_tryon_daily_v`**
_Daily trend line per tenant._

- Aggregated by `created_day_utc`.
- Metrics: `total_jobs`, `completed_jobs`, `terminal_success_rate_pct`, `avg_lifecycle_seconds_completed`.

**`public.tenant_tryon_model_performance_v`**
_Per-tenant model breakdown._

- Grouped by `model`.
- Metrics: Usage counts, success rates, and latency per model type.

### 3. Global Views (Platform Owner / Admin)

Views for platform health monitoring. Requires admin privileges to see cross-tenant data.

**`public.global_tryon_overview_v`**
_Global KPI snapshot._

- Includes `tenants_with_jobs` and `active_tenants_last_30d` for reach metrics.

**`public.global_tryon_daily_v`**
_Global daily trend._

- Tracks platform scale and stability over time.

**`public.global_tryon_model_performance_v`**
_Platform-wide model quality comparison._

**`public.global_tryon_failure_reason_v`**
_Failure analysis._

- Aggregates by `failure_reason_normalized` to identify top error causes.

## Example Queries for AI Context

Use these patterns when generating SQL for analytics.

**Tenant Snapshot:**

```sql
select * from public.tenant_tryon_overview_v
where tenant_id = 'YOUR_TENANT_UUID';
```

**Tenant Daily Trend (Last 30 Days):**

```sql
select * from public.tenant_tryon_daily_v
where tenant_id = 'YOUR_TENANT_UUID'
  and created_day_utc >= (timezone('utc', now())::date - 30)
order by created_day_utc;
```

**Global Overview:**

```sql
select * from public.global_tryon_overview_v;
```

**Top Failure Reasons:**

```sql
select * from public.global_tryon_failure_reason_v
order by total_failures desc
limit 10;
```

## Next Implementation Steps

After this DB layer, we can wire specific API endpoints/UI dashboards to these views without changing business logic tables.
