create or replace function public.reserve_credit_for_job(
  p_tenant_id uuid,
  p_job_id uuid,
  p_source text default 'tryon'
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_balance integer;
begin
  select coalesce(sum(cl.amount_credits), 0)::int
  into current_balance
  from public.credit_ledgers cl
  where cl.tenant_id = p_tenant_id;

  if current_balance <= 0 then
    raise exception 'NO_CREDITS';
  end if;

  insert into public.credit_ledgers (tenant_id, event_type, amount_credits, metadata)
  values (
    p_tenant_id,
    'debit_tryon',
    -1,
    jsonb_build_object(
      'job_id', p_job_id::text,
      'source', coalesce(nullif(trim(p_source), ''), 'tryon')
    )
  );
end;
$$;
