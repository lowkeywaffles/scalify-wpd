-- 0008: complimentary Brimful licences (owner, testers, giveaways). No money, so no amounts.
-- They show in the admin as "Complimentary" and never count towards revenue. Safe to re-run.
alter table public.store_orders drop constraint if exists store_orders_method_check;
alter table public.store_orders add constraint store_orders_method_check check (method in ('telebirr','boa','whop','comp'));
alter table public.store_orders drop constraint if exists store_orders_amount_shape;
alter table public.store_orders add constraint store_orders_amount_shape check (
  (method = 'whop' and amount_usd > 0 and amount_etb is null)
  or (method = 'comp' and amount_usd is null and amount_etb is null)
  or (method in ('telebirr','boa') and amount_etb > 0 and amount_usd is null and payer_name is not null and reference is not null)
);
