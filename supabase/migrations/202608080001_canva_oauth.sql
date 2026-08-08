create table if not exists public.oauth_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null references public.products(id) on delete cascade,
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  redirect_uri text not null,
  scope text[] not null default '{}'::text[],
  code_challenge text not null,
  code_challenge_method text not null default 'S256' check (code_challenge_method = 'S256'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_authorization_codes_user_idx
  on public.oauth_authorization_codes(user_id, created_at desc);

create table if not exists public.oauth_refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  client_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null references public.products(id) on delete cascade,
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  scope text[] not null default '{}'::text[],
  expires_at timestamptz not null,
  revoked_at timestamptz,
  rotated_at timestamptz,
  parent_token_id uuid references public.oauth_refresh_tokens(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists oauth_refresh_tokens_user_client_idx
  on public.oauth_refresh_tokens(user_id, client_id, created_at desc);

create table if not exists public.oauth_access_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  refresh_token_id uuid references public.oauth_refresh_tokens(id) on delete cascade,
  client_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null references public.products(id) on delete cascade,
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  scope text[] not null default '{}'::text[],
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_access_tokens_user_client_idx
  on public.oauth_access_tokens(user_id, client_id, created_at desc);

create index if not exists oauth_access_tokens_refresh_idx
  on public.oauth_access_tokens(refresh_token_id);

alter table public.oauth_authorization_codes enable row level security;
alter table public.oauth_refresh_tokens enable row level security;
alter table public.oauth_access_tokens enable row level security;

revoke all on public.oauth_authorization_codes from anon, authenticated;
revoke all on public.oauth_refresh_tokens from anon, authenticated;
revoke all on public.oauth_access_tokens from anon, authenticated;

grant all privileges on public.oauth_authorization_codes to service_role;
grant all privileges on public.oauth_refresh_tokens to service_role;
grant all privileges on public.oauth_access_tokens to service_role;
