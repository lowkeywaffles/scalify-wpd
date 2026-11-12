-- Scalify Studio: private content scheduler for the Scalify founders.
-- Lives in the same Supabase project as QuoteRevive but in separate studio_* tables.
-- QuoteRevive customers can never read these rows: every policy requires an allowlisted, confirmed email.
-- Safe to run more than once.

create table if not exists public.studio_members (
  email text primary key check (email = lower(email) and char_length(email) between 3 and 254),
  role text not null default 'member' check (role in ('owner','member')),
  added_by text,
  created_at timestamptz not null default now()
);
alter table public.studio_members enable row level security;

-- True when the signed-in user is a confirmed, allowlisted Studio member.
create or replace function public.studio_is_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.studio_members m
    join auth.users u on lower(u.email) = m.email
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
create or replace function public.studio_is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.studio_members m
    join auth.users u on lower(u.email) = m.email
    where u.id = auth.uid() and u.email_confirmed_at is not null and m.role = 'owner'
  );
$$;
revoke all on function public.studio_is_member() from public, anon;
revoke all on function public.studio_is_owner() from public, anon;
grant execute on function public.studio_is_member() to authenticated;
grant execute on function public.studio_is_owner() to authenticated;

drop policy if exists studio_members_read on public.studio_members;
create policy studio_members_read on public.studio_members for select to authenticated using (public.studio_is_member());
drop policy if exists studio_members_owner_write on public.studio_members;
create policy studio_members_owner_write on public.studio_members for all to authenticated
  using (public.studio_is_owner()) with check (public.studio_is_owner());

-- Connected social accounts. Public profile info only; tokens live in studio_secrets.
create table if not exists public.studio_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram')),
  external_id text not null,
  username text not null check (char_length(username) <= 100),
  token_expires_at timestamptz,
  token_refreshed_at timestamptz,
  connected_by text,
  created_at timestamptz not null default now(),
  unique (platform, external_id)
);
alter table public.studio_accounts enable row level security;
drop policy if exists studio_accounts_rw on public.studio_accounts;
create policy studio_accounts_rw on public.studio_accounts for select to authenticated using (public.studio_is_member());

-- Encrypted access tokens (AES-256-GCM, key only in the server env). No policies: service role only.
create table if not exists public.studio_secrets (
  account_id uuid primary key references public.studio_accounts(id) on delete cascade,
  token_ciphertext text not null,
  updated_at timestamptz not null default now()
);
alter table public.studio_secrets enable row level security;
revoke all on public.studio_secrets from anon, authenticated;

-- Uploaded media (files are in the private storage bucket studio-media).
create table if not exists public.studio_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null unique check (char_length(path) <= 200),
  kind text not null check (kind in ('image','video')),
  mime text not null check (mime in ('image/jpeg','image/png','video/mp4','video/quicktime')),
  size_bytes bigint not null check (size_bytes > 0),
  label text check (char_length(label) <= 120),
  created_by text,
  created_at timestamptz not null default now()
);
alter table public.studio_assets enable row level security;
drop policy if exists studio_assets_rw on public.studio_assets;
create policy studio_assets_rw on public.studio_assets for all to authenticated
  using (public.studio_is_member()) with check (public.studio_is_member());

create table if not exists public.studio_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram','tiktok')),
  format text not null check (format in ('image','carousel','reel','video','photos')),
  account_id uuid references public.studio_accounts(id) on delete set null,
  caption text not null default '' check (char_length(caption) <= 2200),
  hashtags text[] not null default '{}' check (cardinality(hashtags) <= 30),
  asset_ids uuid[] not null default '{}' check (cardinality(asset_ids) between 1 and 10),
  scheduled_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft','scheduled','publishing','published','failed','ready','posted_manually','cancelled')),
  ig_state jsonb not null default '{}',
  external_media_id text,
  permalink text,
  error text check (char_length(error) <= 1000),
  attempts int not null default 0,
  locked_until timestamptz,
  started_at timestamptz,
  published_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_posts_due on public.studio_posts (status, scheduled_at);
alter table public.studio_posts enable row level security;
drop policy if exists studio_posts_rw on public.studio_posts;
create policy studio_posts_rw on public.studio_posts for all to authenticated
  using (public.studio_is_member()) with check (public.studio_is_member());

-- Private bucket. No storage policies are added, so only the server (service role) and
-- short-lived signed URLs can read or write files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-media', 'studio-media', false, 52428800, array['image/jpeg','image/png','video/mp4','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Login helper for the server (service role only): does an auth user exist for this email, and is it confirmed?
create or replace function public.studio_auth_user(p_email text)
returns table (id uuid, confirmed boolean) language sql stable security definer set search_path = '' as $$
  select u.id, u.email_confirmed_at is not null from auth.users u where lower(u.email) = lower(p_email) limit 1;
$$;
revoke all on function public.studio_auth_user(text) from public, anon, authenticated;
grant execute on function public.studio_auth_user(text) to service_role;
