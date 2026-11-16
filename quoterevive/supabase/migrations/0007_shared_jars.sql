-- 0007: Brimful "Save Together" — shared savings jars for up to 6 people.
-- End-to-end encrypted: jar names, targets, member names, amounts and notes are encrypted in the browser with a
-- key that lives only in the invite link (after the #, which browsers never send to servers). The server stores
-- ciphertext plus the minimum it needs to enforce rules: who is a member, who added which deposit, and counts.
-- Server-only (service role): RLS on, no policies. Safe to re-run.

create table if not exists public.shared_jars (
  id uuid primary key default gen_random_uuid(),
  product text not null default 'brimful' check (product = 'brimful'),
  meta text not null check (char_length(meta) between 16 and 4000),          -- ciphertext: name, target, currency, preset, deadline
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()                               -- any activity; inactive 400 days -> deleted
);

create table if not exists public.shared_members (
  id uuid primary key default gen_random_uuid(),
  jar_id uuid not null references public.shared_jars(id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),             -- sha256 of the member's device secret
  profile text not null check (char_length(profile) between 16 and 1000),     -- ciphertext: display name, colour
  is_owner boolean not null default false,
  joined_at timestamptz not null default now(),
  removed_at timestamptz
);
create index if not exists shared_members_jar_idx on public.shared_members(jar_id);

create table if not exists public.shared_entries (
  id uuid primary key default gen_random_uuid(),
  jar_id uuid not null references public.shared_jars(id) on delete cascade,
  member_id uuid not null references public.shared_members(id) on delete cascade,
  data text not null check (char_length(data) between 16 and 2000),          -- ciphertext: amount, note
  created_at timestamptz not null default now(),
  changed_at timestamptz not null default now(),                              -- polling cursor (insert or delete)
  deleted_at timestamptz
);
create index if not exists shared_entries_poll_idx on public.shared_entries(jar_id, changed_at);
create index if not exists shared_entries_member_idx on public.shared_entries(member_id);

alter table public.shared_jars enable row level security;
alter table public.shared_members enable row level security;
alter table public.shared_entries enable row level security;
revoke all on public.shared_jars, public.shared_members, public.shared_entries from anon, authenticated;
