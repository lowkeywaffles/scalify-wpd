-- 0005: orders for Scalify products that have no user accounts (first one: Brimful).
-- The order id is the buyer's licence key. Server (service role) only: RLS on, no policies. Safe to re-run.
create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  product text not null check (product in ('brimful')),
  method text not null check (method in ('telebirr','boa')),
  amount_etb numeric(12,2) not null check (amount_etb > 0),
  payer_name text not null check (char_length(payer_name) between 2 and 120),
  reference text not null check (char_length(reference) between 4 and 60),
  status text not null default 'pending' check (status in ('pending','approved','rejected','refunded')),
  review_note text check (char_length(review_note) <= 300),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text check (char_length(reviewed_by) <= 254),
  unique (product, method, reference)
);
create index if not exists store_orders_status_idx on public.store_orders(status, created_at);
alter table public.store_orders enable row level security;
revoke all on public.store_orders from anon, authenticated;
