-- Local seed data for development/testing.

insert into public.tenants (id, shop_domain, app_installed)
values
  ('11111111-1111-1111-1111-111111111111', 'demo-shop.myshopify.com', true)
on conflict (shop_domain) do update
set app_installed = excluded.app_installed;

insert into public.api_keys (id, tenant_id, key_hash, is_active)
values
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'dev_vto_api_key',
    true
  )
on conflict (key_hash) do update
set tenant_id = excluded.tenant_id,
    is_active = excluded.is_active;

insert into public.credit_ledgers (tenant_id, event_type, amount_credits, metadata)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'topup',
    100,
    jsonb_build_object('source', 'seed')
  );
