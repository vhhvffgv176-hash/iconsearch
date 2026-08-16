-- Agent API usage accounting for the IconSearch MCP server.
-- Apply after 202607260001_add_penpot_and_all_products.sql.

create table if not exists public.agent_usage_limits (
  tier text not null check (tier in ('free', 'founder')),
  action text not null check (action in ('search', 'retrieve')),
  daily_limit integer not null check (daily_limit > 0),
  updated_at timestamptz not null default now(),
  primary key (tier, action)
);

insert into public.agent_usage_limits (tier, action, daily_limit)
values
  ('free', 'search', 500),
  ('free', 'retrieve', 1000),
  ('founder', 'search', 5000),
  ('founder', 'retrieve', 10000)
on conflict (tier, action) do update
set daily_limit = excluded.daily_limit,
    updated_at = now();

alter table public.agent_usage_limits enable row level security;
revoke all on public.agent_usage_limits from anon, authenticated;
grant all privileges on public.agent_usage_limits to service_role;

create or replace function public.record_agent_usage(
  p_user_id uuid,
  p_action text,
  p_quantity integer default 1
)
returns table (
  allowed boolean,
  quantity integer,
  daily_limit integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_limit integer;
  v_current integer;
  v_next integer;
begin
  if p_user_id is null then
    raise exception 'missing_user_id';
  end if;
  if p_action not in ('search', 'retrieve') then
    raise exception 'invalid_agent_action';
  end if;
  if p_quantity < 1 or p_quantity > 50 then
    raise exception 'invalid_agent_quantity';
  end if;

  select e.tier
  into v_tier
  from public.entitlements e
  where e.user_id = p_user_id
    and e.product = 'mcp'
    and e.status = 'active'
    and (e.expires_at is null or e.expires_at > now())
  limit 1;

  if v_tier is null then
    raise exception 'inactive_mcp_entitlement';
  end if;

  select l.daily_limit
  into v_limit
  from public.agent_usage_limits l
  where l.tier = v_tier and l.action = p_action;

  if v_limit is null then
    raise exception 'missing_agent_usage_limit';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':mcp:' || p_action || ':' || current_date::text, 0)
  );

  select coalesce(u.quantity, 0)
  into v_current
  from public.usage_daily u
  where u.user_id = p_user_id
    and u.product = 'mcp'
    and u.usage_date = current_date
    and u.action = p_action;

  v_current := coalesce(v_current, 0);
  if v_current + p_quantity > v_limit then
    return query select false, v_current, v_limit;
    return;
  end if;

  insert into public.usage_daily (user_id, product, usage_date, action, quantity, updated_at)
  values (p_user_id, 'mcp', current_date, p_action, p_quantity, now())
  on conflict (user_id, product, usage_date, action) do update
  set quantity = public.usage_daily.quantity + excluded.quantity,
      updated_at = now()
  returning public.usage_daily.quantity into v_next;

  return query select true, v_next, v_limit;
end;
$$;

revoke all on function public.record_agent_usage(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.record_agent_usage(uuid, text, integer) to service_role;
