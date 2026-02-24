create table if not exists tenants (
  id text primary key,
  shop_domain text not null unique,
  app_installed integer not null default 1,
  created_at text not null,
  updated_at text not null
);

create table if not exists api_keys (
  id text primary key,
  tenant_id text not null,
  key_hash text not null unique,
  is_active integer not null default 1,
  created_at text not null,
  updated_at text not null,
  last_used_at text,
  foreign key (tenant_id) references tenants(id) on delete cascade
);

create table if not exists credit_ledgers (
  id text primary key,
  tenant_id text not null,
  event_type text not null,
  amount_credits integer not null,
  amount_usd text,
  metadata text not null default '{}',
  created_at text not null,
  foreign key (tenant_id) references tenants(id) on delete cascade
);

create table if not exists tryon_jobs (
  id text primary key,
  tenant_id text not null,
  idempotency_key text,
  shop_domain text not null,
  product_id text not null,
  shopify_product_handle text,
  visitor_id text not null,
  customer_id text,
  model text not null default 'advanced',
  status text not null default 'queued',
  provider_job_id text,
  user_image_hash text not null,
  result_url text,
  credits_charged integer not null default 0,
  failure_reason_normalized text,
  failure_reason_message text,
  created_at text not null,
  updated_at text not null,
  foreign key (tenant_id) references tenants(id) on delete cascade
);

create table if not exists tryon_job_events (
  id text primary key,
  tenant_id text not null,
  job_id text not null,
  event_type text not null,
  metadata text not null default '{}',
  occurred_at text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  foreign key (tenant_id) references tenants(id) on delete cascade,
  foreign key (job_id) references tryon_jobs(id) on delete cascade
);

create unique index if not exists tryon_jobs_tenant_idempotency_uidx
  on tryon_jobs (tenant_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists tryon_jobs_shop_visitor_created_idx
  on tryon_jobs (shop_domain, visitor_id, created_at desc);

create index if not exists tryon_jobs_cache_lookup_idx
  on tryon_jobs (shop_domain, product_id, user_image_hash, created_at desc);

create index if not exists credit_ledgers_tenant_created_idx
  on credit_ledgers (tenant_id, created_at desc);

create index if not exists tryon_job_events_job_occurred_idx
  on tryon_job_events (job_id, occurred_at asc);

create index if not exists tryon_job_events_tenant_type_occurred_idx
  on tryon_job_events (tenant_id, event_type, occurred_at desc);

create view if not exists tenant_credit_snapshot_v as
with ledger as (
  select
    tenant_id,
    coalesce(sum(amount_credits), 0) as available_credits,
    coalesce(sum(case when event_type = 'refund' then amount_credits else 0 end), 0) as refunded_credits,
    coalesce(sum(case when event_type = 'debit_tryon' then abs(amount_credits) else 0 end), 0) as reserved_or_spent_credits
  from credit_ledgers
  group by tenant_id
),
jobs as (
  select
    tenant_id,
    count(*) filter (where status in ('queued', 'processing') and credits_charged > 0) as in_flight_reserved_count,
    count(*) filter (where status = 'completed' and credits_charged > 0) as completed_consumed_count,
    count(*) filter (where status in ('failed', 'provider_expired') and credits_charged > 0) as failed_charged_count
  from tryon_jobs
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
from tenants t
left join ledger l on l.tenant_id = t.id
left join jobs j on j.tenant_id = t.id;

create view if not exists tryon_job_timing_v as
with events as (
  select
    job_id,
    min(case when event_type = 'api_request_received' then occurred_at end) as api_request_received_at,
    min(case when event_type = 'input_images_uploaded' then occurred_at end) as input_images_uploaded_at,
    min(case when event_type = 'provider_submit_started' then occurred_at end) as provider_submit_started_at,
    min(case when event_type = 'provider_submit_succeeded' then occurred_at end) as provider_submit_succeeded_at,
    min(case when event_type = 'provider_poll_started' then occurred_at end) as provider_poll_started_at,
    min(case when event_type = 'provider_poll_completed' then occurred_at end) as provider_poll_completed_at,
    min(case when event_type = 'provider_result_persist_started' then occurred_at end) as provider_result_persist_started_at,
    min(case when event_type = 'provider_result_persisted' then occurred_at end) as provider_result_persisted_at,
    min(case when event_type = 'result_delivered_to_client' then occurred_at end) as result_delivered_to_client_at
  from tryon_job_events
  group by job_id
)
select
  j.id as job_id,
  j.tenant_id,
  j.shop_domain,
  j.model,
  j.status,
  e.api_request_received_at,
  e.input_images_uploaded_at,
  e.provider_submit_started_at,
  e.provider_submit_succeeded_at,
  e.provider_poll_started_at,
  e.provider_poll_completed_at,
  e.provider_result_persist_started_at,
  e.provider_result_persisted_at,
  e.result_delivered_to_client_at,
  cast((julianday(e.input_images_uploaded_at) - julianday(e.api_request_received_at)) * 86400000 as integer) as upload_ms,
  cast((julianday(e.provider_submit_succeeded_at) - julianday(e.provider_submit_started_at)) * 86400000 as integer) as provider_submit_ms,
  cast((julianday(e.provider_poll_completed_at) - julianday(e.provider_poll_started_at)) * 86400000 as integer) as provider_poll_ms,
  cast((julianday(e.provider_result_persisted_at) - julianday(e.provider_result_persist_started_at)) * 86400000 as integer) as storage_persist_ms,
  cast((julianday(e.provider_result_persisted_at) - julianday(e.api_request_received_at)) * 86400000 as integer) as api_to_storage_ms,
  cast((julianday(e.result_delivered_to_client_at) - julianday(e.api_request_received_at)) * 86400000 as integer) as end_to_end_to_client_ms
from tryon_jobs j
left join events e on e.job_id = j.id;
