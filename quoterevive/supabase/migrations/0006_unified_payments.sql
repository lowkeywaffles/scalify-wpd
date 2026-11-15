-- 0006: one payments admin on the Scalify site for every product.
--   * store_orders: card payments through Whop, the buyer's 18+/parent confirmation, alert bookkeeping
--   * manual_payments: alert bookkeeping, refunds
--   * brimful_backups: end-to-end encrypted Brimful backups (we only ever see ciphertext)
--   * ops_settings: small operator settings (e.g. which Telegram chat gets payment alerts)
--   * admin_review_manual_payment(): approve/reject/refund a QuoteRevive birr payment in ONE transaction
-- Everything here is server-only (service role): RLS on, no policies, functions not executable by anon/authenticated.
-- Safe to re-run.

-- ---------- store_orders ----------
alter table public.store_orders drop constraint if exists store_orders_method_check;
alter table public.store_orders add constraint store_orders_method_check check (method in ('telebirr','boa','whop'));
alter table public.store_orders alter column amount_etb drop not null;
alter table public.store_orders alter column payer_name drop not null;
alter table public.store_orders alter column reference drop not null;
alter table public.store_orders add column if not exists amount_usd numeric(10,2);
alter table public.store_orders add column if not exists whop_checkout_id text;
alter table public.store_orders add column if not exists age_confirmed boolean not null default false;
alter table public.store_orders add column if not exists notified_at timestamptz;
alter table public.store_orders add column if not exists checked_at timestamptz;
alter table public.store_orders drop constraint if exists store_orders_amount_shape;
alter table public.store_orders add constraint store_orders_amount_shape check (
  (method = 'whop' and amount_usd > 0 and amount_etb is null)
  or (method <> 'whop' and amount_etb > 0 and amount_usd is null and payer_name is not null and reference is not null)
);
create unique index if not exists store_orders_checkout_idx on public.store_orders(whop_checkout_id) where whop_checkout_id is not null;

-- ---------- manual_payments (QuoteRevive birr payments) ----------
alter table public.manual_payments add column if not exists notified_at timestamptz;
alter table public.manual_payments drop constraint if exists manual_payments_status_check;
alter table public.manual_payments add constraint manual_payments_status_check check (status in ('pending','approved','rejected','refunded'));

-- ---------- encrypted backups ----------
-- id = SHA-256 of the buyer's recovery code (hex). data = AES-GCM ciphertext made in the browser. We cannot decrypt it.
create table if not exists public.brimful_backups (
  id text primary key check (id ~ '^[0-9a-f]{64}$'),
  data text not null check (char_length(data) between 16 and 700000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.brimful_backups enable row level security;
revoke all on public.brimful_backups from anon, authenticated;

-- ---------- operator settings ----------
create table if not exists public.ops_settings (
  key text primary key check (char_length(key) <= 60),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.ops_settings enable row level security;
revoke all on public.ops_settings from anon, authenticated;

-- ---------- review a QuoteRevive birr payment atomically ----------
create or replace function public.admin_review_manual_payment(p_id uuid, p_action text, p_note text, p_by text)
returns jsonb language plpgsql set search_path = public as $$
declare r record;
begin
  if p_action = 'approve' then
    update manual_payments set status = 'approved', review_note = null, reviewed_at = now(), reviewed_by = p_by
      where id = p_id and status = 'pending' returning business_id, promo_code into r;
    if not found then return jsonb_build_object('ok', false, 'error', 'Already reviewed, or not found.'); end if;
    insert into entitlements (business_id, source, status, plan, updated_at) values (r.business_id, 'manual', 'active', 'founding', now())
      on conflict (business_id) do update set status = 'active', source = case when entitlements.source = 'whop' and entitlements.status = 'active' then entitlements.source else 'manual' end, updated_at = now();
    return jsonb_build_object('ok', true, 'promo_code', r.promo_code);
  elsif p_action = 'reject' then
    if p_note is null or char_length(trim(p_note)) < 3 or char_length(p_note) > 300 then
      return jsonb_build_object('ok', false, 'error', 'Give a short reason the customer will see (3-300 characters).');
    end if;
    update manual_payments set status = 'rejected', review_note = trim(p_note), reviewed_at = now(), reviewed_by = p_by
      where id = p_id and status = 'pending' returning business_id into r;
    if not found then return jsonb_build_object('ok', false, 'error', 'Already reviewed, or not found.'); end if;
    return jsonb_build_object('ok', true);
  elsif p_action = 'refund' then
    update manual_payments set status = 'refunded', reviewed_at = now(), reviewed_by = p_by
      where id = p_id and status = 'approved' returning business_id into r;
    if not found then return jsonb_build_object('ok', false, 'error', 'Only approved payments can be refunded.'); end if;
    -- Only remove access that came from this manual payment (never a separate card purchase).
    update entitlements set status = 'revoked', updated_at = now() where business_id = r.business_id and source = 'manual';
    return jsonb_build_object('ok', true);
  end if;
  return jsonb_build_object('ok', false, 'error', 'Unknown action.');
end $$;
revoke all on function public.admin_review_manual_payment(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.admin_review_manual_payment(uuid, text, text, text) to service_role;
