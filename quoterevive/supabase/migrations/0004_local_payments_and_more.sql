-- 0004: local payments (Telebirr / Bank of Abyssinia), Amharic messages, payment instructions on
-- customer quote links, and optional line items on quotes. Safe to run more than once.

-- 1) Local (ETB) payments, verified by hand by the operator before access is granted.
create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  method text not null check (method in ('telebirr','boa')),
  amount_etb numeric(12,2) not null check (amount_etb > 0),
  promo_code text check (promo_code is null or promo_code = 'FIRST6'),
  payer_name text not null check (char_length(payer_name) between 2 and 120),
  reference text not null check (char_length(reference) between 4 and 60),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text check (char_length(review_note) <= 300),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text check (char_length(reviewed_by) <= 254),
  unique (method, reference)
);
create index if not exists manual_payments_status_idx on public.manual_payments(status, created_at);
create index if not exists manual_payments_business_idx on public.manual_payments(business_id, created_at desc);
alter table public.manual_payments enable row level security;
drop policy if exists "own manual payments read" on public.manual_payments;
create policy "own manual payments read" on public.manual_payments for select using (business_id = public.my_business_id());
-- No insert/update policies: requests are created and reviewed only by the server (service role).

-- 2) Amharic as a message language.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
    where conrelid = 'public.businesses'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%message_language%'
  loop execute format('alter table public.businesses drop constraint %I', c.conname); end loop;
end $$;
alter table public.businesses add constraint businesses_message_language_check check (message_language in ('en','am','ar','fr','es'));

-- 3) How the business's own customers can pay a deposit (shown on the customer quote link).
alter table public.businesses
  add column if not exists payment_instructions text check (char_length(payment_instructions) <= 600);

-- 4) Optional line items on a quote: [{ "d": description, "q": quantity, "p": unit price }].
alter table public.quotes
  add column if not exists items jsonb not null default '[]'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'quotes_items_shape') then
    alter table public.quotes add constraint quotes_items_shape
      check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50);
  end if;
end $$;
