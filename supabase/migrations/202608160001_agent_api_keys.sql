-- User-managed API keys for the IconSearch Agent API.
-- Only server-side service-role code can read or change these records.

create table if not exists public.agent_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  key_prefix text not null check (key_prefix like 'ics_live_%' and char_length(key_prefix) between 18 and 32),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  scopes text[] not null default array['icons:read']::text[],
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (cardinality(scopes) > 0 and scopes <@ array['icons:read']::text[]),
  check (expires_at > created_at)
);

create index if not exists agent_api_keys_user_created_idx
  on public.agent_api_keys(user_id, created_at desc);

create index if not exists agent_api_keys_active_idx
  on public.agent_api_keys(user_id, expires_at)
  where revoked_at is null;

alter table public.agent_api_keys enable row level security;
revoke all on public.agent_api_keys from public, anon, authenticated;
grant all privileges on public.agent_api_keys to service_role;

create or replace function public.create_agent_api_key(
  p_user_id uuid,
  p_name text,
  p_key_prefix text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table (
  api_key_id uuid,
  api_key_name text,
  api_key_prefix text,
  api_key_created_at timestamptz,
  api_key_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement record;
  v_key public.agent_api_keys%rowtype;
  v_active_count integer;
  v_daily_count integer;
begin
  if p_user_id is null then raise exception 'missing_user_id'; end if;
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 60 then
    raise exception 'invalid_key_name';
  end if;
  if p_key_prefix not like 'ics_live_%' or char_length(p_key_prefix) not between 18 and 32 then
    raise exception 'invalid_key_prefix';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_token_hash'; end if;
  if p_expires_at <= now() + interval '1 hour' or p_expires_at > now() + interval '366 days' then
    raise exception 'invalid_key_expiry';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':agent-api-keys', 0));

  select count(*)::integer into v_daily_count
  from public.agent_api_keys
  where user_id = p_user_id
    and created_at >= now() - interval '24 hours';

  if v_daily_count >= 20 then raise exception 'api_key_creation_rate_limit'; end if;

  select count(*)::integer into v_active_count
  from public.agent_api_keys
  where user_id = p_user_id
    and revoked_at is null
    and expires_at > now();

  if v_active_count >= 5 then raise exception 'active_api_key_limit'; end if;

  select * into v_entitlement
  from public.claim_product_entitlement(p_user_id, 'mcp');

  if v_entitlement.entitlement_status <> 'active' or
     (v_entitlement.entitlement_expires_at is not null and v_entitlement.entitlement_expires_at <= now()) then
    raise exception 'inactive_mcp_entitlement';
  end if;

  insert into public.agent_api_keys (
    user_id, entitlement_id, name, key_prefix, token_hash, expires_at
  ) values (
    p_user_id,
    v_entitlement.entitlement_id,
    trim(p_name),
    p_key_prefix,
    p_token_hash,
    p_expires_at
  ) returning * into v_key;

  insert into public.entitlement_events (
    user_id, product, entitlement_id, event_type, metadata
  ) values (
    p_user_id,
    'mcp',
    v_entitlement.entitlement_id,
    'agent_api_key_created',
    jsonb_build_object('api_key_id', v_key.id, 'name', v_key.name, 'expires_at', v_key.expires_at)
  );

  return query select v_key.id, v_key.name, v_key.key_prefix, v_key.created_at, v_key.expires_at;
end;
$$;

revoke all on function public.create_agent_api_key(uuid, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.create_agent_api_key(uuid, text, text, text, timestamptz)
  to service_role;
