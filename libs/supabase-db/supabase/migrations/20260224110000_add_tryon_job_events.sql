create table if not exists public.tryon_job_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  job_id uuid not null references public.tryon_jobs(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists tryon_job_events_job_occurred_idx
  on public.tryon_job_events (job_id, occurred_at asc);

create index if not exists tryon_job_events_tenant_type_occurred_idx
  on public.tryon_job_events (tenant_id, event_type, occurred_at desc);

alter table public.tryon_job_events enable row level security;

create policy tryon_job_events_select_own on public.tryon_job_events
for select
using (tenant_id = public.current_tenant_id());

create policy tryon_job_events_insert_own on public.tryon_job_events
for insert
with check (tenant_id = public.current_tenant_id());

create or replace view public.tryon_job_timing_v as
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
  from public.tryon_job_events
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
  (extract(epoch from (e.input_images_uploaded_at - e.api_request_received_at)) * 1000)::bigint as upload_ms,
  (extract(epoch from (e.provider_submit_succeeded_at - e.provider_submit_started_at)) * 1000)::bigint as provider_submit_ms,
  (extract(epoch from (e.provider_poll_completed_at - e.provider_poll_started_at)) * 1000)::bigint as provider_poll_ms,
  (extract(epoch from (e.provider_result_persisted_at - e.provider_result_persist_started_at)) * 1000)::bigint as storage_persist_ms,
  (extract(epoch from (e.provider_result_persisted_at - e.api_request_received_at)) * 1000)::bigint as api_to_storage_ms,
  (extract(epoch from (e.result_delivered_to_client_at - e.api_request_received_at)) * 1000)::bigint as end_to_end_to_client_ms
from public.tryon_jobs j
left join events e on e.job_id = j.id;

grant select on public.tryon_job_timing_v to anon, authenticated;
