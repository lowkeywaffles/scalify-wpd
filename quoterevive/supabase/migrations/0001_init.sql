-- QuoteRevive initial schema. Every business-owned table is protected by RLS.
-- One business per user in the MVP (owner_id unique). Data minimisation notes in DATA_INVENTORY.md.

create extension if not exists pgcrypto;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 120),
  industry text check (char_length(industry) <= 60),
  currency char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  typical_quote_value numeric(14,2) not null default 0 check (typical_quote_value >= 0),
  preferred_channel text not null default 'whatsapp' check (preferred_channel in ('whatsapp','email','phone','other')),
  first_follow_up_days int not null default 3 check (first_follow_up_days between 1 and 60),
  follow_up_interval_days int not null default 5 check (follow_up_interval_days between 1 and 60),
  max_follow_ups int not null default 3 check (max_follow_ups between 1 and 10),
  display_name text check (char_length(display_name) <= 80),
  avatar_data_url text check (char_length(avatar_data_url) <= 70000),
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_email text check (char_length(customer_email) <= 200),
  customer_phone text check (char_length(customer_phone) <= 40),
  title text not null check (char_length(title) between 1 and 160),
  description text check (char_length(description) <= 2000),
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  sent_at date,
  expires_at date,
  status text not null default 'sent' check (status in ('draft','sent','awaiting_response','follow_up_due','negotiating','accepted','rejected','expired')),
  next_follow_up_at date,
  notes text check (char_length(notes) <= 4000),
  archived boolean not null default false,
  opted_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or sent_at is null or expires_at >= sent_at)
);
create index quotes_business_idx on public.quotes(business_id, archived, next_follow_up_at);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  kind text not null check (kind in ('follow_up','customer_response','status_change','note')),
  channel text check (channel in ('whatsapp','email','phone','other')),
  summary text check (char_length(summary) <= 500),
  from_status text,
  to_status text,
  contributed_to_sale boolean,
  occurred_at timestamptz not null default now()
);
create index activities_quote_idx on public.activities(quote_id, occurred_at);
create index activities_business_idx on public.activities(business_id, occurred_at desc);

-- In-app reminders. (business_id, quote_id, due_on) unique => the cron job is idempotent.
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  due_on date not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, quote_id, due_on)
);

-- Paid access. Written ONLY by the server (service role) after verification with Whop, or manually by the operator.
create table public.entitlements (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  source text not null check (source in ('whop','manual')),
  whop_membership_id text unique,
  status text not null check (status in ('active','revoked')),
  plan text not null default 'founding',
  updated_at timestamptz not null default now()
);

-- Webhook de-duplication (stores ids only, never payloads).
create table public.webhook_events (
  id text primary key,
  received_at timestamptz not null default now()
);

-- Helper: the caller's business id.
create or replace function public.my_business_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.businesses where owner_id = auth.uid()
$$;

alter table public.businesses enable row level security;
alter table public.quotes enable row level security;
alter table public.activities enable row level security;
alter table public.reminders enable row level security;
alter table public.entitlements enable row level security;
alter table public.webhook_events enable row level security; -- no policies: service role only

create policy "own business read" on public.businesses for select using (owner_id = auth.uid());
create policy "own business insert" on public.businesses for insert with check (owner_id = auth.uid());
create policy "own business update" on public.businesses for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own quotes" on public.quotes for all
  using (business_id = public.my_business_id()) with check (business_id = public.my_business_id());
create policy "own activities" on public.activities for all
  using (business_id = public.my_business_id()) with check (business_id = public.my_business_id()
    and exists (select 1 from public.quotes q where q.id = quote_id and q.business_id = public.my_business_id()));
create policy "own reminders read" on public.reminders for select using (business_id = public.my_business_id());
create policy "own reminders update" on public.reminders for update using (business_id = public.my_business_id());
create policy "own entitlement read" on public.entitlements for select using (business_id = public.my_business_id());

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger quotes_touch before update on public.quotes for each row execute function public.touch_updated_at();

-- Auto-create an empty business row on signup.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.businesses (owner_id) values (new.id) on conflict do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Free usage allowance before purchase; founding plan allowance after. Enforced in the database.
create or replace function public.enforce_quote_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; paid boolean;
begin
  select count(*) into n from public.quotes where business_id = new.business_id;
  select exists(select 1 from public.entitlements e where e.business_id = new.business_id and e.status = 'active') into paid;
  if (not paid and n >= 10) then raise exception 'FREE_LIMIT: Free workspaces can hold 10 quotes. Unlock Founding Access to add more.'; end if;
  if (paid and n >= 2000) then raise exception 'PLAN_LIMIT: Founding Access includes up to 2,000 quotes.'; end if;
  return new;
end $$;
create trigger quotes_limit before insert on public.quotes for each row execute function public.enforce_quote_limit();
