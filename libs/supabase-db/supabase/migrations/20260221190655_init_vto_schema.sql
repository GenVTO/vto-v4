-- Extensions
create extension if not exists pgcrypto;

-- Domain enums
create type public.credit_event_type as enum ('topup', 'debit_tryon', 'refund', 'adjustment');
create type public.tryon_model as enum ('normal', 'advanced');
create type public.tryon_job_status as enum ('queued', 'processing', 'completed', 'failed', 'provider_expired');

-- Shared helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid;
$$;

-- Core tables
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  shop_domain text not null unique,
  app_installed boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tenants_shop_domain_format_ck check (position('.' in shop_domain) > 1)
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key_hash text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz,
  constraint api_keys_key_hash_non_empty_ck check (length(trim(key_hash)) > 0)
);

create table public.credit_ledgers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type public.credit_event_type not null,
  amount_credits integer not null,
  amount_usd numeric(12,4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.user_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  visitor_id text not null,
  customer_id text,
  image_hash text not null,
  storage_url text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_images_hash_non_empty_ck check (length(trim(image_hash)) > 0),
  constraint user_images_storage_url_non_empty_ck check (length(trim(storage_url)) > 0)
);

create table public.tryon_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  idempotency_key text,
  shop_domain text not null,
  product_id text not null,
  shopify_product_handle text,
  visitor_id text not null,
  customer_id text,
  model public.tryon_model not null default 'advanced',
  status public.tryon_job_status not null default 'queued',
  provider_job_id text,
  user_image_hash text not null,
  result_url text,
  credits_charged integer not null default 0,
  failure_reason_normalized text,
  failure_reason_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tryon_jobs_credits_non_negative_ck check (credits_charged >= 0),
  constraint tryon_jobs_user_image_hash_non_empty_ck check (length(trim(user_image_hash)) > 0),
  constraint tryon_jobs_shop_domain_format_ck check (position('.' in shop_domain) > 1)
);

-- Indexes
create index api_keys_tenant_active_idx on public.api_keys (tenant_id, is_active) where is_active = true;
create index credit_ledgers_tenant_created_idx on public.credit_ledgers (tenant_id, created_at desc);
create unique index user_images_tenant_hash_uidx on public.user_images (tenant_id, image_hash);
create index tryon_jobs_tenant_created_idx on public.tryon_jobs (tenant_id, created_at desc);
create index tryon_jobs_shop_visitor_created_idx on public.tryon_jobs (shop_domain, visitor_id, created_at desc);
create index tryon_jobs_provider_job_id_idx on public.tryon_jobs (provider_job_id) where provider_job_id is not null;
create index tryon_jobs_cache_lookup_idx on public.tryon_jobs (shop_domain, product_id, user_image_hash, created_at desc)
  where status = 'completed' and result_url is not null;
create unique index tryon_jobs_tenant_idempotency_uidx on public.tryon_jobs (tenant_id, idempotency_key)
  where idempotency_key is not null;

-- Update timestamps
create trigger set_tenants_updated_at
before update on public.tenants
for each row execute procedure public.set_updated_at();

create trigger set_api_keys_updated_at
before update on public.api_keys
for each row execute procedure public.set_updated_at();

create trigger set_tryon_jobs_updated_at
before update on public.tryon_jobs
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.tenants enable row level security;
alter table public.api_keys enable row level security;
alter table public.credit_ledgers enable row level security;
alter table public.user_images enable row level security;
alter table public.tryon_jobs enable row level security;

-- tenants policies
create policy tenants_select_own on public.tenants
for select
using (id = public.current_tenant_id());

create policy tenants_update_own on public.tenants
for update
using (id = public.current_tenant_id())
with check (id = public.current_tenant_id());

-- api_keys policies
create policy api_keys_select_own on public.api_keys
for select
using (tenant_id = public.current_tenant_id());

create policy api_keys_insert_own on public.api_keys
for insert
with check (tenant_id = public.current_tenant_id());

create policy api_keys_update_own on public.api_keys
for update
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

-- credit_ledgers policies
create policy credit_ledgers_select_own on public.credit_ledgers
for select
using (tenant_id = public.current_tenant_id());

create policy credit_ledgers_insert_own on public.credit_ledgers
for insert
with check (tenant_id = public.current_tenant_id());

-- user_images policies
create policy user_images_select_own on public.user_images
for select
using (tenant_id = public.current_tenant_id());

create policy user_images_insert_own on public.user_images
for insert
with check (tenant_id = public.current_tenant_id());

create policy user_images_update_own on public.user_images
for update
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

-- tryon_jobs policies
create policy tryon_jobs_select_own on public.tryon_jobs
for select
using (tenant_id = public.current_tenant_id());

create policy tryon_jobs_insert_own on public.tryon_jobs
for insert
with check (tenant_id = public.current_tenant_id());

create policy tryon_jobs_update_own on public.tryon_jobs
for update
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());
