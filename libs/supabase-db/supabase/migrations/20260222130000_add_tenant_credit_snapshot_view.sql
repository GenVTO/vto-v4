create or replace view public.tenant_credit_snapshot_v
with (security_invoker = true) as
with ledger as (
  select
    tenant_id,
    coalesce(sum(amount_credits), 0)::int as available_credits,
    coalesce(sum(case when event_type = 'refund' then amount_credits else 0 end), 0)::int as refunded_credits,
    coalesce(sum(case when event_type = 'debit_tryon' then abs(amount_credits) else 0 end), 0)::int as reserved_or_spent_credits
  from public.credit_ledgers
  group by tenant_id
),
jobs as (
  select
    tenant_id,
    count(*) filter (where status in ('queued', 'processing') and credits_charged > 0)::int as in_flight_reserved_count,
    count(*) filter (where status = 'completed' and credits_charged > 0)::int as completed_consumed_count,
    count(*) filter (where status in ('failed', 'provider_expired') and credits_charged > 0)::int as failed_charged_count
  from public.tryon_jobs
  group by tenant_id
)
select
  t.id as tenant_id,
  t.shop_domain,
  coalesce(l.available_credits, 0) as available_credits,
  coalesce(l.refunded_credits, 0) as refunded_credits,
  coalesce(l.reserved_or_spent_credits, 0) as reserved_or_spent_credits,
  coalesce(j.in_flight_reserved_count, 0) as in_flight_reserved_count,
  coalesce(j.completed_consumed_count, 0) as completed_consumed_count,
  coalesce(j.failed_charged_count, 0) as failed_charged_count
from public.tenants t
left join ledger l on l.tenant_id = t.id
left join jobs j on j.tenant_id = t.id;
