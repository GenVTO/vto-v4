-- Analytics indexes to keep dashboard queries fast
create index if not exists tryon_jobs_tenant_status_created_idx
  on public.tryon_jobs (tenant_id, status, created_at desc);

create index if not exists tryon_jobs_tenant_model_created_idx
  on public.tryon_jobs (tenant_id, model, created_at desc);

create index if not exists tryon_jobs_status_created_idx
  on public.tryon_jobs (status, created_at desc);

create index if not exists tryon_jobs_failure_reason_idx
  on public.tryon_jobs (failure_reason_normalized, created_at desc)
  where failure_reason_normalized is not null;

create index if not exists credit_ledgers_tenant_event_created_idx
  on public.credit_ledgers (tenant_id, event_type, created_at desc);

-- Enriched base view for try-on analytics
create or replace view public.tryon_jobs_enriched_v
with (security_invoker = true) as
select
  j.id,
  j.tenant_id,
  j.shop_domain,
  j.product_id,
  j.visitor_id,
  j.model,
  j.status,
  j.provider_job_id,
  j.credits_charged,
  j.failure_reason_normalized,
  j.failure_reason_message,
  j.created_at,
  j.updated_at,
  (timezone('utc', j.created_at))::date as created_day_utc,
  case
    when j.status in ('completed', 'failed', 'provider_expired') then
      greatest(extract(epoch from (j.updated_at - j.created_at)), 0)::numeric
    else null
  end as lifecycle_seconds,
  (j.status = 'completed') as is_completed,
  (j.status in ('failed', 'provider_expired')) as is_failed,
  (j.status = 'provider_expired') as is_provider_expired,
  (j.status in ('queued', 'processing')) as is_in_flight,
  (j.credits_charged > 0) as is_credits_charged
from public.tryon_jobs j;

-- Tenant-level current KPI snapshot
create or replace view public.tenant_tryon_overview_v
with (security_invoker = true) as
with base as (
  select
    t.id as tenant_id,
    t.shop_domain
  from public.tenants t
),
agg as (
  select
    e.tenant_id,
    count(*)::int as total_jobs,
    count(*) filter (where e.is_completed)::int as completed_jobs,
    count(*) filter (where e.is_failed)::int as failed_jobs,
    count(*) filter (where e.is_provider_expired)::int as provider_expired_jobs,
    count(*) filter (where e.is_in_flight)::int as in_flight_jobs,
    count(*) filter (where e.created_at >= timezone('utc', now()) - interval '24 hours')::int as jobs_last_24h,
    count(*) filter (where e.created_at >= timezone('utc', now()) - interval '7 days')::int as jobs_last_7d,
    avg(e.lifecycle_seconds) filter (where e.is_completed) as avg_lifecycle_seconds_completed,
    percentile_cont(0.95) within group (order by e.lifecycle_seconds)
      filter (where e.is_completed) as p95_lifecycle_seconds_completed
  from public.tryon_jobs_enriched_v e
  group by e.tenant_id
)
select
  b.tenant_id,
  b.shop_domain,
  coalesce(a.total_jobs, 0) as total_jobs,
  coalesce(a.completed_jobs, 0) as completed_jobs,
  coalesce(a.failed_jobs, 0) as failed_jobs,
  coalesce(a.provider_expired_jobs, 0) as provider_expired_jobs,
  coalesce(a.in_flight_jobs, 0) as in_flight_jobs,
  coalesce(a.jobs_last_24h, 0) as jobs_last_24h,
  coalesce(a.jobs_last_7d, 0) as jobs_last_7d,
  case
    when coalesce(a.completed_jobs, 0) + coalesce(a.failed_jobs, 0) = 0 then 0::numeric
    else round((a.completed_jobs::numeric * 100) / (a.completed_jobs + a.failed_jobs), 2)
  end as terminal_success_rate_pct,
  round(coalesce(a.avg_lifecycle_seconds_completed, 0)::numeric, 2) as avg_lifecycle_seconds_completed,
  round(coalesce(a.p95_lifecycle_seconds_completed, 0)::numeric, 2) as p95_lifecycle_seconds_completed,
  coalesce(c.available_credits, 0) as available_credits,
  coalesce(c.in_flight_reserved_count, 0) as in_flight_reserved_count,
  coalesce(c.completed_consumed_count, 0) as completed_consumed_count,
  coalesce(c.failed_charged_count, 0) as failed_charged_count,
  coalesce(c.refunded_credits, 0) as refunded_credits,
  coalesce(c.reserved_or_spent_credits, 0) as reserved_or_spent_credits
from base b
left join agg a on a.tenant_id = b.tenant_id
left join public.tenant_credit_snapshot_v c on c.tenant_id = b.tenant_id;

-- Tenant-level daily usage for charts and trend lines
create or replace view public.tenant_tryon_daily_v
with (security_invoker = true) as
select
  e.tenant_id,
  e.shop_domain,
  e.created_day_utc,
  count(*)::int as total_jobs,
  count(*) filter (where e.is_completed)::int as completed_jobs,
  count(*) filter (where e.is_failed)::int as failed_jobs,
  count(*) filter (where e.is_provider_expired)::int as provider_expired_jobs,
  count(*) filter (where e.is_in_flight)::int as in_flight_jobs,
  count(*) filter (where e.is_credits_charged)::int as charged_jobs,
  case
    when count(*) filter (where e.is_completed or e.is_failed) = 0 then 0::numeric
    else round(
      (count(*) filter (where e.is_completed)::numeric * 100) /
      nullif(count(*) filter (where e.is_completed or e.is_failed), 0),
      2
    )
  end as terminal_success_rate_pct,
  round(avg(e.lifecycle_seconds) filter (where e.is_completed)::numeric, 2) as avg_lifecycle_seconds_completed
from public.tryon_jobs_enriched_v e
group by e.tenant_id, e.shop_domain, e.created_day_utc;

-- Tenant-level model breakdown
create or replace view public.tenant_tryon_model_performance_v
with (security_invoker = true) as
select
  e.tenant_id,
  e.shop_domain,
  e.model,
  count(*)::int as total_jobs,
  count(*) filter (where e.is_completed)::int as completed_jobs,
  count(*) filter (where e.is_failed)::int as failed_jobs,
  case
    when count(*) filter (where e.is_completed or e.is_failed) = 0 then 0::numeric
    else round(
      (count(*) filter (where e.is_completed)::numeric * 100) /
      nullif(count(*) filter (where e.is_completed or e.is_failed), 0),
      2
    )
  end as terminal_success_rate_pct,
  round(avg(e.lifecycle_seconds) filter (where e.is_completed)::numeric, 2) as avg_lifecycle_seconds_completed
from public.tryon_jobs_enriched_v e
group by e.tenant_id, e.shop_domain, e.model;

-- Global KPI snapshot (admin/service role scope)
create or replace view public.global_tryon_overview_v
with (security_invoker = true) as
select
  count(*)::int as total_jobs,
  count(*) filter (where e.is_completed)::int as completed_jobs,
  count(*) filter (where e.is_failed)::int as failed_jobs,
  count(*) filter (where e.is_provider_expired)::int as provider_expired_jobs,
  count(*) filter (where e.is_in_flight)::int as in_flight_jobs,
  count(*) filter (where e.created_at >= timezone('utc', now()) - interval '24 hours')::int as jobs_last_24h,
  count(*) filter (where e.created_at >= timezone('utc', now()) - interval '7 days')::int as jobs_last_7d,
  count(distinct e.tenant_id)::int as tenants_with_jobs,
  count(distinct e.tenant_id) filter (where e.created_at >= timezone('utc', now()) - interval '30 days')::int as active_tenants_last_30d,
  case
    when count(*) filter (where e.is_completed or e.is_failed) = 0 then 0::numeric
    else round(
      (count(*) filter (where e.is_completed)::numeric * 100) /
      nullif(count(*) filter (where e.is_completed or e.is_failed), 0),
      2
    )
  end as terminal_success_rate_pct,
  round(avg(e.lifecycle_seconds) filter (where e.is_completed)::numeric, 2) as avg_lifecycle_seconds_completed,
  round(
    percentile_cont(0.95) within group (order by e.lifecycle_seconds)
      filter (where e.is_completed)::numeric,
    2
  ) as p95_lifecycle_seconds_completed
from public.tryon_jobs_enriched_v e;

-- Global daily trend
create or replace view public.global_tryon_daily_v
with (security_invoker = true) as
select
  e.created_day_utc,
  count(*)::int as total_jobs,
  count(*) filter (where e.is_completed)::int as completed_jobs,
  count(*) filter (where e.is_failed)::int as failed_jobs,
  count(*) filter (where e.is_provider_expired)::int as provider_expired_jobs,
  count(*) filter (where e.is_in_flight)::int as in_flight_jobs,
  count(distinct e.tenant_id)::int as active_tenants,
  case
    when count(*) filter (where e.is_completed or e.is_failed) = 0 then 0::numeric
    else round(
      (count(*) filter (where e.is_completed)::numeric * 100) /
      nullif(count(*) filter (where e.is_completed or e.is_failed), 0),
      2
    )
  end as terminal_success_rate_pct
from public.tryon_jobs_enriched_v e
group by e.created_day_utc
order by e.created_day_utc desc;

-- Global model-level health
create or replace view public.global_tryon_model_performance_v
with (security_invoker = true) as
select
  e.model,
  count(*)::int as total_jobs,
  count(*) filter (where e.is_completed)::int as completed_jobs,
  count(*) filter (where e.is_failed)::int as failed_jobs,
  case
    when count(*) filter (where e.is_completed or e.is_failed) = 0 then 0::numeric
    else round(
      (count(*) filter (where e.is_completed)::numeric * 100) /
      nullif(count(*) filter (where e.is_completed or e.is_failed), 0),
      2
    )
  end as terminal_success_rate_pct,
  round(avg(e.lifecycle_seconds) filter (where e.is_completed)::numeric, 2) as avg_lifecycle_seconds_completed
from public.tryon_jobs_enriched_v e
group by e.model;

-- Global failure reason distribution
create or replace view public.global_tryon_failure_reason_v
with (security_invoker = true) as
select
  coalesce(e.failure_reason_normalized, 'UNKNOWN') as failure_reason,
  count(*)::int as failures_total,
  count(*) filter (where e.created_at >= timezone('utc', now()) - interval '24 hours')::int as failures_last_24h,
  count(*) filter (where e.created_at >= timezone('utc', now()) - interval '7 days')::int as failures_last_7d
from public.tryon_jobs_enriched_v e
where e.is_failed
group by coalesce(e.failure_reason_normalized, 'UNKNOWN')
order by failures_total desc;
